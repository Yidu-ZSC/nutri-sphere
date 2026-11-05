#!/usr/bin/env python3
"""TASK-NS-067: ingest eat_to_heal EPUB candidates into aligned seed."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/eat_to_heal")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/植物性饮食与慢病_吃出自愈力.md"
KB_SOURCE = CAND_DIR / "ClearDiet-吃出自愈力-原文摘录.md"
CANON_FILE = "植物性饮食与慢病_吃出自愈力.md"
SOURCE_ID = "eat_to_heal"
SOURCE_TITLE = "吃出自愈力"

RISK_AGENTS = {
    "antibiotics",
    "ultra_processed",
    "artificial_sweeteners",
    "added_sugar",
    "processed_meat",
    "reactive_oxygen",
    "dna_damage",
    "animal_dairy",  # placeholder if ever present
    "animal_foods",
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def infer_direction(link: dict, groups: dict[str, str]) -> str:
    s, t = link["source"], link["target"]
    rel = link.get("relation", "")
    if s in RISK_AGENTS:
        return "risk"
    if s == "chronic_inflammation" and t == "gut_microbiome":
        return "risk"
    if s == "gut_microbiome" and t in {"gut_barrier_leak", "ibd_related"} and any(
        k in rel for k in ("破坏", "扰乱", "损害", "硫化氢", "炎症性肠病")
    ):
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
    nodes_cand = load(CAND_DIR / "ClearDiet-吃出自愈力-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-吃出自愈力-候选边.json")
    book_meta = load(CAND_DIR / "book_meta.json")

    assert seed["meta"]["schema_version"] == "0.7"
    assert seed["meta"]["data_version"] == "1.6"
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    new_nodes = []
    for n in nodes_cand["new_nodes"]:
        if n["id"] in existing_ids:
            continue
        node = {
            "id": n["id"],
            "type": n["type"],
            "label": n["label"],
            "group": n["group"],
            "description": n["description"],
            "aliases": n.get("aliases") or [],
            "domain": n.get("domain") or "health",
        }
        if n["type"] == "mechanism":
            node["mechanism_depth"] = "mechanism"
        new_nodes.append(node)
        existing_ids.add(n["id"])
    seed["nodes"].extend(new_nodes)

    groups = {n["id"]: n.get("group", "") for n in seed["nodes"]}

    merge_note_ids = {
        m["note_id"] for m in links_cand["meta"]["merge_with_existing_endpoint_pairs"]
    }
    # Prefer specific hosts when multiple same-endpoint edges exist.
    preferred_host_id = {
        ("dietary_fiber", "gut_microbiome"): "lit_prebiotic_sanders_2019",
    }

    by_endpoints: dict[tuple[str, str], list[dict]] = {}
    for link in seed["links"]:
        by_endpoints.setdefault((link["source"], link["target"]), []).append(link)

    append_count = 0
    new_count = 0
    append_hosts: list[tuple[str, str, str, str]] = []
    direction_counts: Counter[str] = Counter()

    # Only append when the endpoint pair already existed on the baseline seed
    # (the 14 merge_with_existing pairs). Other candidates each become a new
    # top-level edge even if they share endpoints with another new edge —
    # matching NS-067 expected ~160 (= 63 + 111 - 14) and lit parallel precedent.
    baseline_endpoints = set(by_endpoints.keys())

    for cand in links_cand["candidate_links"]:
        key = (cand["source"], cand["target"])
        hosts = by_endpoints.get(key, [])
        # Append only onto baseline hosts (not onto edges created in this pass).
        baseline_hosts = [
            h
            for h in hosts
            if (h.get("source_id") != SOURCE_ID)
            or (h.get("id") or h.get("note_id") or "").startswith(("gut_brain_", "lit_", "ns009_"))
        ]
        # Simpler: a host is baseline if it was present before this loop started.
        # Track via id set captured below.
        should_append = key in baseline_endpoints and (
            cand["note_id"] in merge_note_ids or True
        )
        if should_append:
            prefer = preferred_host_id.get(key)
            # Prefer baseline host (not newly inserted eat_to_heal edges).
            host = None
            if prefer:
                host = next((h for h in hosts if h.get("id") == prefer), None)
            if host is None:
                host = next(
                    (
                        h
                        for h in hosts
                        if h.get("source_id") != SOURCE_ID
                        or not str(h.get("id") or h.get("note_id") or "").startswith("eat_to_heal_")
                    ),
                    None,
                )
            if host is None:
                # No baseline host somehow — fall through to create.
                pass
            else:
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

    seed["meta"]["data_version"] = "1.7"
    # Keep schema 0.7; refresh note briefly.
    note = seed["meta"].get("note", "")
    marker = "data 1.7 / schema 0.7 adds eat_to_heal EPUB full ingest (NS-067)."
    if "NS-067" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    # Write kb body
    header = (
        "# 植物性饮食与慢病 · 吃出自愈力（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-067 按 EPUB 整理同步入库；"
        "摘录保留作者原文语气，不构成诊断、治疗或个性化建议。\n\n"
        "---\n\n"
    )
    body = KB_SOURCE.read_text(encoding="utf-8")
    KB_TARGET.write_text(header + body, encoding="utf-8")

    # admin_books: eat_to_heal → ingested + source_id
    admin = load(ADMIN)
    for book in admin["books"]:
        if book["id"] == SOURCE_ID:
            book["status"] = "ingested"
            book["source_id"] = SOURCE_ID
            book["kb_file"] = CANON_FILE
            break
    else:
        raise SystemExit("eat_to_heal missing from admin_books")

    # sources.json: refresh summary; keep file; optional weread url from book_meta
    sources = load(SOURCES)
    for row in sources["sources"]:
        if row["id"] == SOURCE_ID:
            row["file"] = CANON_FILE
            row["title"] = SOURCE_TITLE
            row["summary"] = (
                "大众饮食与健康科普读物，围绕人体若干防御相关叙述与常见食物例子展开公开讨论。"
                "书中整理饮食与身体防护主题的科普表述，供读者对照理解相关概念。"
                "本图谱引用其中与饮食—机制—结局对照的公开表述作为教育向摘录来源。"
                "NS-067 起本书图谱边按 EPUB 健康主题候选全量入库。"
            )
            if book_meta.get("deepLink"):
                row["url"] = book_meta["deepLink"]
            elif book_meta.get("readerLink"):
                row["url"] = book_meta["readerLink"]
            break
    else:
        raise SystemExit("eat_to_heal missing from sources.json")

    # Light touch on kb index count line if present
    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = "[吃出自愈力](植物性饮食与慢病_吃出自愈力.md) · high · 42 条"
        new = f"[吃出自愈力](植物性饮食与慢病_吃出自愈力.md) · high · {new_count + append_count} 条（NS-067 EPUB）"
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")

    dump(SEED, seed)
    dump(ADMIN, admin)
    dump(SOURCES, sources)

    gut = sum(1 for l in seed["links"] if l.get("source_id") == "gut_brain")
    lit = sum(1 for l in seed["links"] if not l.get("source_id"))
    eth_top = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    print(
        json.dumps(
            {
                "before": {"nodes": before_nodes, "links": before_links},
                "after": {"nodes": len(seed["nodes"]), "links": len(seed["links"])},
                "new_nodes": len(new_nodes),
                "append_evidences": append_count,
                "new_edges": new_count,
                "gut_brain_top": gut,
                "lit_top": lit,
                "eat_to_heal_top": eth_top,
                "direction_new": dict(direction_counts),
                "append_hosts": append_hosts,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
