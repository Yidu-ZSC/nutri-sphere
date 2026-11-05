#!/usr/bin/env python3
"""TASK-NS-071: ingest how_not_to_die EPUB candidates into aligned seed."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/how_not_to_die")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md"
KB_SOURCE = CAND_DIR / "ClearDiet-救命-原文摘录.md"
CANON_FILE = "植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md"
SOURCE_ID = "how_not_to_die"
SOURCE_TITLE = "救命：逆转和预防致命疾病的科学饮食"

# Candidate leaked chapter numbers into evidence_type for 42 pref/other rows.
DEFAULT_EVIDENCE_TYPE = "book_notes_observational_synthesis"

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
    "dairy",
    "dietary_cholesterol",
    "heterocyclic_amines",
    "environmental_pollutants",
    "medical_care_exposure",
    "iatrogenic_harm",
}

BENEFIT_HINTS = ("改善", "恢复", "补充", "营养", "有助于", "帮助", "增强", "防护", "降低")
HARM_HINTS = ("损伤", "破坏", "风险", "癌", "硬化", "过量", "低下", "炎症", "死亡", "污染", "暴露", "伤害")

# Prefer thematic host when multiple same-endpoint edges exist.
PREFERRED_HOST_ID = {
    ("berries_fruits", "immune_balance"): "eat_to_heal_10_blueberry",
    ("dietary_nitrates", "nitric_oxide"): "avs_ch6_nitrate_no",
    ("soy", "breast_prostate_risk"): "eat_to_heal_06_soy_breast_surv",
    ("cruciferous", "dna_damage"): "eat_to_heal_09_broccoli_smoke",
    ("cruciferous", "immune_balance"): "eat_to_heal_10_broccoli_sprout",
    ("plant_based_diet", "telomere_integrity"): "eat_to_heal_09_med_telomere",
    ("plant_based_diet", "metabolic_health"): "eat_to_heal_99_methods",
    ("plant_based_diet", "cardiometabolic"): "lit_plant_mortality_baden_2019",
    ("red_meat", "cardiometabolic"): "lit_redmeat_mortality_zheng_2019",
    ("ultra_processed", "cardiometabolic"): "lit_upf_cvd_srour_2019",
    ("dietary_fiber", "digestive_cancer_risk"): "avs_ch6_fiber_colon",
    ("vegetables_greens", "hypertension"): "avs_ch6_jp_nitrite",
    ("dairy", "cardiometabolic"): "eat_to_heal_13_cheese",
}


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def normalize_evidence_type(raw) -> str:
    if isinstance(raw, str) and raw.strip():
        return raw.strip()
    return DEFAULT_EVIDENCE_TYPE


def infer_direction(link: dict, groups: dict[str, str]) -> str:
    s, t = link["source"], link["target"]
    rel = link.get("relation", "")
    if s in RISK_AGENTS:
        if any(h in rel for h in BENEFIT_HINTS) and not any(h in rel for h in HARM_HINTS):
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
        "evidence_type": normalize_evidence_type(link.get("evidence_type")),
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


def pick_host(hosts: list[dict], key: tuple[str, str], baseline_link_ids: set) -> dict:
    prefer = PREFERRED_HOST_ID.get(key)
    if prefer:
        host = next((h for h in hosts if h.get("id") == prefer), None)
        if host is not None:
            return host
    host = next(
        (h for h in hosts if (h.get("id") or h.get("note_id")) in baseline_link_ids),
        None,
    )
    return host or hosts[0]


def main() -> None:
    seed = load(SEED)
    nodes_cand = load(CAND_DIR / "ClearDiet-救命-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-救命-候选边.json")
    book_meta = load(CAND_DIR / "book_meta.json")

    assert seed["meta"]["schema_version"] == "0.7"
    assert seed["meta"]["data_version"] == "1.9"
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    conflicts = [n["id"] for n in nodes_cand["new_nodes"] if n["id"] in existing_ids]
    if conflicts:
        raise SystemExit(f"node id conflicts with seed (do not dual-create): {conflicts}")

    new_nodes = []
    for n in nodes_cand["new_nodes"]:
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

    # aliases backfill deferred until edges land

    groups = {n["id"]: n.get("group", "") for n in seed["nodes"]}

    merge_note_ids = {
        m.get("excerpt_id") or m.get("note_id")
        for m in links_cand.get("merge_with_existing_endpoint_pairs") or []
    }
    # also accept meta nested under links_cand['meta']
    meta_merge = (links_cand.get("meta") or {}).get("merge_with_existing_endpoint_pairs") or []
    for m in meta_merge:
        merge_note_ids.add(m.get("excerpt_id") or m.get("note_id"))

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
    evidence_type_fixes = 0

    for cand in links_cand["candidate_links"]:
        if not isinstance(cand.get("evidence_type"), str):
            evidence_type_fixes += 1
        key = (cand["source"], cand["target"])
        is_append = (
            cand.get("merge_action") == "append"
            or cand.get("existing_endpoint_pair") is True
            or cand.get("overlap") == "append"
            or cand["note_id"] in merge_note_ids
        )
        hosts = by_endpoints.get(key, [])

        if is_append and key in baseline_endpoints and hosts:
            host = pick_host(hosts, key, baseline_link_ids)
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

        if is_append and key not in baseline_endpoints:
            # flagged append but no seed host — fall through to create new edge
            pass

        direction = infer_direction(cand, groups)
        direction_counts[direction] += 1
        edge = new_edge_from_candidate(cand, direction)
        seed["links"].append(edge)
        by_endpoints.setdefault(key, []).append(edge)
        new_count += 1

    # Recompute degree and backfill mechanism aliases for deg≥3.
    from collections import Counter as _Counter
    _deg = _Counter()
    for _l in seed["links"]:
        _deg[_l["source"]] += 1
        _deg[_l["target"]] += 1
    _ALIAS_BACKFILL = {
        "glycemic_stability": ["血糖稳态", "血糖稳定", "血糖波动较小"],
        "epigenetic_regulation": ["表观遗传调控", "表观遗传", "基因表达表观调控"],
    }
    for _n in seed["nodes"]:
        if _n.get("type") == "mechanism" and _deg[_n["id"]] >= 3 and not (_n.get("aliases") or []):
            _n["aliases"] = _ALIAS_BACKFILL.get(
                _n["id"],
                [_n["label"], _n["label"].replace("/", " ")],
            )

    seed["meta"]["data_version"] = "2.0"
    note = seed["meta"].get("note", "")
    marker = (
        "data 2.0 · NS-071：how_not_to_die（《救命》）EPUB 全量录入（14 新节点 + 195 边贡献；"
        "同端点 28 append，其余新建）；schema 仍 0.7。"
    )
    if "NS-071" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    header = (
        "# 植物性饮食与慢病 · 救命：逆转和预防致命疾病的科学饮食（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-071 按 EPUB 整理同步入库；"
        "摘录保留作者原文语气，不构成诊断、治疗或个性化建议。"
        "书名含「逆转」属原书名，不作疗效承诺。\n\n"
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
        raise SystemExit("how_not_to_die missing from admin_books")

    sources = load(SOURCES)
    for row in sources["sources"]:
        if row["id"] == SOURCE_ID:
            row["file"] = CANON_FILE
            row["title"] = SOURCE_TITLE
            row["summary"] = (
                "按常见慢病主题汇总植物性饮食相关公开研究与作者解读的科普读物。"
                "书中按疾病主题梳理膳食模式讨论，便于对照图谱中的书摘边。"
                "书名含「逆转」属原书名，本书简介仅说明内容范围，不作疗效承诺。"
                "NS-071 起本书图谱边按 EPUB 健康主题候选全量入库。"
            )
            if book_meta.get("deepLink"):
                row["url"] = book_meta["deepLink"]
            elif book_meta.get("readerLink"):
                row["url"] = book_meta["readerLink"]
            break
    else:
        raise SystemExit("how_not_to_die missing from sources.json")

    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = (
            "[救命！逆转和预防致命疾病的科学饮食]"
            "(植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md) · high · 22 条"
        )
        new = (
            "[救命！逆转和预防致命疾病的科学饮食]"
            f"(植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md) · high · "
            f"{new_count + append_count} 条（NS-071 EPUB）"
        )
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")

    dump(SEED, seed)
    dump(ADMIN, admin)
    dump(SOURCES, sources)

    gut = sum(1 for l in seed["links"] if l.get("source_id") == "gut_brain")
    lit = sum(1 for l in seed["links"] if not l.get("source_id"))
    eth = sum(1 for l in seed["links"] if l.get("source_id") == "eat_to_heal")
    avs = sum(1 for l in seed["links"] if l.get("source_id") == "amazing_veggie_soup")
    hntd = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    mech = sum(1 for n in seed["nodes"] if n.get("type") == "mechanism")
    dis = sum(1 for n in seed["nodes"] if n.get("type") == "disease")
    unique_append_hosts = sorted({h[2] for h in append_hosts})
    print(
        json.dumps(
            {
                "before": {"nodes": before_nodes, "links": before_links},
                "after": {"nodes": len(seed["nodes"]), "links": len(seed["links"])},
                "new_nodes": [n["id"] for n in new_nodes],
                "new_node_count": len(new_nodes),
                "append_evidences": append_count,
                "new_edges": new_count,
                "unique_append_hosts": unique_append_hosts,
                "unique_append_host_count": len(unique_append_hosts),
                "gut_brain_top": gut,
                "lit_top": lit,
                "eat_to_heal_top": eth,
                "amazing_veggie_soup_top": avs,
                "how_not_to_die_top": hntd,
                "mechanisms": mech,
                "diseases": dis,
                "direction_new": dict(direction_counts),
                "evidence_type_fixes": evidence_type_fixes,
                "append_hosts": append_hosts,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
