#!/usr/bin/env python3
"""TASK-NS-069: ingest amazing_veggie_soup EPUB candidates into aligned seed.

See scripts/ingest_collapse_same_endpoints.py (NS-072): same endpoints → append, no parallel edge.
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/amazing_veggie_soup")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/植物性饮食与慢病_惊人的蔬菜汤.md"
KB_SOURCE = CAND_DIR / "ClearDiet-惊人的蔬菜汤-原文摘录.md"
CANON_FILE = "植物性饮食与慢病_惊人的蔬菜汤.md"
SOURCE_ID = "amazing_veggie_soup"
SOURCE_TITLE = "惊人的蔬菜汤"

# Candidate used type=lifestyle (not in schema 0.7). Remap without bumping schema.
TYPE_REMAP = {
    "lifestyle": "mechanism",
}

RISK_AGENTS = {
    "antibiotics",
    "ultra_processed",
    "artificial_sweeteners",
    "added_sugar",
    "processed_meat",
    "reactive_oxygen",
    "dna_damage",
    "animal_foods",
    "lipid_radicals",
    "psychological_stress",
    "red_meat",
    "heme_iron",
    "glycation",
    "chronic_inflammation",
}

BENEFIT_HINTS = ("改善", "恢复", "补充", "营养", "有助于", "帮助", "增强")


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def infer_direction(link: dict, groups: dict[str, str]) -> str:
    s, t = link["source"], link["target"]
    rel = link.get("relation", "")
    if s in RISK_AGENTS:
        # Nutritional-support narratives (e.g. broth aiding recovery) stay protective.
        if any(h in rel for h in BENEFIT_HINTS) and not any(
            h in rel for h in ("损伤", "破坏", "风险", "癌", "硬化", "过量", "低下", "炎症")
        ):
            return "protective"
        return "risk"
    sg, tg = groups.get(s), groups.get(t)
    if sg == "risk" and tg == "risk":
        return "risk"
    if sg == "risk" and tg == "protective":
        return "risk"
    return "protective"


def evidence_from_candidate(link: dict) -> dict:
    return {
        "excerpt": link["excerpt"],
        "source_title": SOURCE_TITLE,
        "source_file": CANON_FILE,
        "source_id": SOURCE_ID,
        "note_id": link["note_id"],
    }


def new_edge_from_candidate(link: dict, direction: str) -> dict:
    ev = evidence_from_candidate(link)
    return {
        "source": link["source"],
        "target": link["target"],
        "relation": link["relation"],
        "direction": direction,
        "evidence_type": link["evidence_type"],
        "strength": link["strength"],
        "source_file": CANON_FILE,
        "note_id": link["note_id"],
        "excerpt": link["excerpt"],
        "audience": link.get("audience") or "general",
        "source_id": SOURCE_ID,
        "source_title": SOURCE_TITLE,
        "id": link["note_id"],
        "evidences": [ev],
        "domain": "health",
    }


def main() -> None:
    seed = load(SEED)
    nodes_cand = load(CAND_DIR / "ClearDiet-惊人的蔬菜汤-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-惊人的蔬菜汤-候选边.json")
    book_meta = load(CAND_DIR / "book_meta.json")

    assert seed["meta"]["schema_version"] == "0.7"
    assert seed["meta"]["data_version"] == "1.8"
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    new_nodes = []
    for n in nodes_cand["new_nodes"]:
        if n["id"] in existing_ids:
            continue
        ntype = TYPE_REMAP.get(n["type"], n["type"])
        node = {
            "id": n["id"],
            "type": ntype,
            "label": n["label"],
            "group": n["group"],
            "description": n["description"],
            "aliases": n.get("aliases") or [],
            "domain": n.get("domain") or "health",
        }
        if ntype == "mechanism":
            node["mechanism_depth"] = "mechanism"
        new_nodes.append(node)
        existing_ids.add(n["id"])
    seed["nodes"].extend(new_nodes)

    # Degree may cross the mech≥3 aliases gate after new edges land.
    for n in seed["nodes"]:
        if n["id"] == "antioxidant_defense" and not n.get("aliases"):
            n["aliases"] = ["抗氧化", "抗氧化系统", "抗氧化能力", "抗氧化物质防御"]

    groups = {n["id"]: n.get("group", "") for n in seed["nodes"]}

    merge_note_ids = {
        m["note_id"] for m in links_cand["meta"]["merge_with_existing_endpoint_pairs"]
    }
    # Prefer host matching candidate meta seed_relation when multiple same-endpoint edges exist.
    preferred_host_id = {
        ("mushrooms", "immune_balance"): "eat_to_heal_10_mushroom_immune",
        ("reactive_oxygen", "dna_damage"): "eat_to_heal_04_damage",
        ("dietary_fiber", "cardiometabolic"): "lit_fiber_cvd_reynolds_2019",
        ("dietary_fiber", "gut_microbiome"): "lit_fiber_gi_gill_2021",
    }

    by_endpoints: dict[tuple[str, str], list[dict]] = {}
    for link in seed["links"]:
        by_endpoints.setdefault((link["source"], link["target"]), []).append(link)

    baseline_endpoints = set(by_endpoints.keys())
    baseline_link_ids = {
        link.get("id") or link.get("note_id") for link in seed["links"]
    }

    append_count = 0
    new_count = 0
    append_hosts: list[tuple[str, str, str, str]] = []
    direction_counts: Counter[str] = Counter()

    for cand in links_cand["candidate_links"]:
        key = (cand["source"], cand["target"])
        is_append = cand.get("overlap") == "append" or cand["note_id"] in merge_note_ids
        hosts = by_endpoints.get(key, [])

        if is_append and key in baseline_endpoints and hosts:
            prefer = preferred_host_id.get(key)
            host = None
            if prefer:
                host = next((h for h in hosts if h.get("id") == prefer), None)
            if host is None:
                # Prefer a baseline host (present before this ingest).
                host = next(
                    (
                        h
                        for h in hosts
                        if (h.get("id") or h.get("note_id")) in baseline_link_ids
                    ),
                    hosts[0],
                )
            # Reuse existing public relation on the host — do not rewrite.
            ev = evidence_from_candidate(cand)
            existing_notes = {
                e.get("note_id") for e in host.get("evidences", []) if isinstance(e, dict)
            }
            if ev["note_id"] not in existing_notes:
                host.setdefault("evidences", []).append(ev)
                append_count += 1
                append_hosts.append(
                    (
                        cand["note_id"],
                        f"{cand['source']}->{cand['target']}",
                        host.get("id") or host.get("note_id") or "",
                        host.get("source_id") or "(lit)",
                    )
                )
            continue

        direction = infer_direction(cand, groups)
        direction_counts[direction] += 1
        edge = new_edge_from_candidate(cand, direction)
        seed["links"].append(edge)
        by_endpoints.setdefault(key, []).append(edge)
        new_count += 1

    seed["meta"]["data_version"] = "1.9"
    note = seed["meta"].get("note", "")
    marker = (
        "data 1.9 · NS-069：amazing_veggie_soup EPUB 全量录入（10 新节点 + 81 边贡献；"
        "同端点 4 append，其余新建）；schema 仍 0.7。"
    )
    if "NS-069" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    header = (
        "# 植物性饮食与慢病 · 惊人的蔬菜汤（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-069 按 EPUB 整理同步入库；"
        "摘录保留作者原文语气，不构成诊断、治疗或个性化建议。\n\n"
        "---\n\n"
    )
    body = KB_SOURCE.read_text(encoding="utf-8")
    KB_TARGET.write_text(header + body, encoding="utf-8")

    admin = load(ADMIN)
    for book in admin["books"]:
        if book["id"] == SOURCE_ID:
            book["status"] = "ingested"
            book["source_id"] = SOURCE_ID
            book["kb_file"] = CANON_FILE
            break
    else:
        raise SystemExit("amazing_veggie_soup missing from admin_books")

    sources = load(SOURCES)
    weread = book_meta.get("weread") or {}
    for row in sources["sources"]:
        if row["id"] == SOURCE_ID:
            row["file"] = CANON_FILE
            row["title"] = SOURCE_TITLE
            row["summary"] = (
                "围绕蔬菜汤制作与相关营养化学的科普读物。书中介绍食材搭配与抗氧化等营养化学叙述，"
                "属于烹饪与营养科普范畴。这些叙述被本图谱用作教育向摘录来源，便于对照膳食与机制主题。"
                "NS-069 起本书图谱边按 EPUB 健康主题候选全量入库。"
            )
            if weread.get("deepLink"):
                row["url"] = weread["deepLink"]
            elif weread.get("readerLink"):
                row["url"] = weread["readerLink"]
            elif book_meta.get("deepLink"):
                row["url"] = book_meta["deepLink"]
            elif book_meta.get("readerLink"):
                row["url"] = book_meta["readerLink"]
            break
    else:
        raise SystemExit("amazing_veggie_soup missing from sources.json")

    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = "[惊人的蔬菜汤](植物性饮食与慢病_惊人的蔬菜汤.md) · high · 19 条"
        new = (
            f"[惊人的蔬菜汤](植物性饮食与慢病_惊人的蔬菜汤.md) · high · "
            f"{new_count + append_count} 条（NS-069 EPUB）"
        )
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")

    dump(SEED, seed)
    dump(ADMIN, admin)
    dump(SOURCES, sources)

    gut = sum(1 for l in seed["links"] if l.get("source_id") == "gut_brain")
    lit = sum(1 for l in seed["links"] if not l.get("source_id"))
    eth = sum(1 for l in seed["links"] if l.get("source_id") == "eat_to_heal")
    avs = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    mech = sum(1 for n in seed["nodes"] if n.get("type") == "mechanism")
    dis = sum(1 for n in seed["nodes"] if n.get("type") == "disease")
    print(
        json.dumps(
            {
                "before": {"nodes": before_nodes, "links": before_links},
                "after": {"nodes": len(seed["nodes"]), "links": len(seed["links"])},
                "new_nodes": [n["id"] for n in new_nodes],
                "new_node_count": len(new_nodes),
                "append_evidences": append_count,
                "new_edges": new_count,
                "gut_brain_top": gut,
                "lit_top": lit,
                "eat_to_heal_top": eth,
                "amazing_veggie_soup_top": avs,
                "mechanisms": mech,
                "diseases": dis,
                "direction_new": dict(direction_counts),
                "append_hosts": append_hosts,
                "type_remaps": {
                    n["id"]: TYPE_REMAP[nodes_cand["new_nodes"][
                        next(i for i, x in enumerate(nodes_cand["new_nodes"]) if x["id"] == n["id"])
                    ]["type"]]
                    for n in new_nodes
                    if nodes_cand["new_nodes"][
                        next(i for i, x in enumerate(nodes_cand["new_nodes"]) if x["id"] == n["id"])
                    ]["type"]
                    in TYPE_REMAP
                },
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
