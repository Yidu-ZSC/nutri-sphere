#!/usr/bin/env python3
"""TASK-NS-074: ingest china_study（《救命饮食：中国健康调查报告》）EPUB candidates.

Follows NS-072 ingest convention (scripts/ingest_collapse_same_endpoints.py):
  • Same (source, target) vs seed → append evidences; keep live host relation.
  • Same (source, target) within batch → one edge + append; never parallel.
  • Top-level excerpt/source_*/note_id mirror evidences[0] (NS-056+).
  • No limitations; do not edit DISCLAIMER_*.
  • Book evidences must not carry citation (validate-data).
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/china_study")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/植物性饮食与慢病_救命饮食中国健康调查报告.md"
KB_SOURCE = CAND_DIR / "ClearDiet-救命饮食-原文摘录.md"
REPORT = ROOT / "scripts/ns074_report.json"
CANON_FILE = "植物性饮食与慢病_救命饮食中国健康调查报告.md"
SOURCE_ID = "china_study"
SOURCE_TITLE = "救命饮食：中国健康调查报告"
FROM_VERSION = "2.1"
TO_VERSION = "2.2"
SCHEMA_VERSION = "0.7"

DEFAULT_EVIDENCE_TYPE = "book_notes_observational_synthesis"

# Agents whose outbound edges default to risk unless clearly protective wording.
RISK_AGENTS = {
    "aflatoxin",
    "animal_foods",
    "atherosclerosis",
    "blood_cholesterol",
    "casein",
    "dairy",
    "dietary_cholesterol",
    "dna_damage",
    "environmental_pollutants",
    "estrogen_level",
    "hbv_infection",
    "hormone_replacement_therapy",
    "hypertension",
    "igf1_signaling",
    "insulin_resistance",
    "low_carb_diet",
    "medical_care_exposure",
    "obesity_risk",
    "processed_meat",
    "reactive_oxygen",
    "red_meat",
    "refined_carbs",
    "saturated_fat",
    "ultra_processed",
    "added_sugar",
    "dietary_fat",  # mixed nutrient; harm narratives dominate in this book
    "nutrient_supplements",  # often framed as risk / displacement in this book
}

BENEFIT_HINTS = ("改善", "恢复", "补充", "营养", "有助于", "帮助", "增强", "防护", "降低", "较少", "较低", "相关")
# Prefer harm reading when risk agent + 降低/较低 is about a disease target (protective).
# infer_direction handles risk-agent + benefit wording → protective.


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
    rel = link.get("relation", "") or ""
    sg, tg = groups.get(s), groups.get(t)
    # Protective nutrient / pattern → disease/risk target.
    if sg == "protective" and tg in {"risk", "mixed", "neutral"}:
        return "protective"
    if s in RISK_AGENTS or sg == "risk":
        # e.g. plant_protein not in RISK; casein → cancer is risk
        if any(h in rel for h in ("较低", "较少", "改善", "有助于", "帮助", "防护", "增强")) and not any(
            h in rel for h in ("风险", "癌", "损伤", "升高", "增加", "促进")
        ):
            return "protective"
        return "risk"
    if sg == "risk" and tg == "protective":
        return "risk"
    if sg == "mixed":
        if any(h in rel for h in ("风险", "癌", "损伤", "升高", "增加")):
            return "risk"
        return "protective"
    return "protective"


def sanitize_evidence(raw: dict) -> dict:
    """Book evidence row: strip citation/excerpt_id; keep seed-compatible fields."""
    ev = {
        "excerpt": raw["excerpt"],
        "source_title": SOURCE_TITLE,
        "source_file": CANON_FILE,
        "source_id": SOURCE_ID,
        "note_id": raw.get("note_id") or raw.get("excerpt_id"),
    }
    if not ev["note_id"]:
        raise SystemExit(f"evidence missing note_id: {raw!r:.200}")
    if not isinstance(ev["excerpt"], str) or not ev["excerpt"].strip():
        raise SystemExit(f"empty excerpt for {ev['note_id']}")
    return ev


def evidences_from_candidate(cand: dict) -> list[dict]:
    rows = cand.get("evidences") or []
    if rows:
        out = [sanitize_evidence(e) for e in rows]
        # Stable unique by note_id (keep first).
        seen: set[str] = set()
        deduped: list[dict] = []
        for ev in out:
            nid = ev["note_id"]
            if nid in seen:
                continue
            seen.add(nid)
            deduped.append(ev)
        return deduped
    # Fallback: single top-level citation.
    return [
        sanitize_evidence(
            {
                "excerpt": cand["excerpt"],
                "note_id": cand["note_id"],
                "excerpt_id": cand.get("excerpt_id"),
            }
        )
    ]


def mirror_top_from_evidences0(edge: dict) -> None:
    evids = edge.get("evidences") or []
    if not evids:
        return
    e0 = evids[0]
    edge["excerpt"] = e0["excerpt"]
    edge["source_title"] = e0["source_title"]
    edge["source_file"] = e0["source_file"]
    edge["note_id"] = e0["note_id"]
    if e0.get("source_id"):
        edge["source_id"] = e0["source_id"]
    else:
        edge.pop("source_id", None)


def new_edge_from_candidate(cand: dict, direction: str) -> dict:
    evids = evidences_from_candidate(cand)
    edge = {
        "source": cand["source"],
        "target": cand["target"],
        "relation": cand["relation"],
        "direction": direction,
        "evidence_type": normalize_evidence_type(cand.get("evidence_type")),
        "strength": cand.get("strength") or "low",
        "source_file": CANON_FILE,
        "note_id": evids[0]["note_id"],
        "excerpt": evids[0]["excerpt"],
        "audience": cand.get("audience") or "general",
        "source_id": SOURCE_ID,
        "source_title": SOURCE_TITLE,
        "id": evids[0]["note_id"],
        "evidences": evids,
        "domain": "health",
    }
    mirror_top_from_evidences0(edge)
    return edge


def is_append_candidate(cand: dict) -> bool:
    return (
        cand.get("merge_action") == "append"
        or cand.get("existing_endpoint_pair") is True
        or cand.get("overlap") == "append"
    )


def host_sort_key(link: dict) -> tuple:
    sid = link.get("source_id")
    lid = str(link.get("id") or link.get("note_id") or "")
    is_lit = (not sid) or lid.startswith("lit_")
    return (0 if is_lit else 1, -len(link.get("evidences") or []), lid)


def pick_host(hosts: list[dict]) -> dict:
    return sorted(hosts, key=host_sort_key)[0]


def append_evidences(host: dict, new_evs: list[dict]) -> int:
    """Append deduped evidences; keep live relation and top-level mirror of evidences[0]."""
    host.setdefault("evidences", [])
    existing = {e.get("note_id") for e in host["evidences"] if isinstance(e, dict)}
    added = 0
    for ev in new_evs:
        if ev["note_id"] in existing:
            continue
        host["evidences"].append(ev)
        existing.add(ev["note_id"])
        added += 1
    return added


def main() -> None:
    seed = load(SEED)
    nodes_cand = load(CAND_DIR / "ClearDiet-救命饮食-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-救命饮食-候选边.json")

    assert seed["meta"]["schema_version"] == SCHEMA_VERSION
    assert seed["meta"]["data_version"] == FROM_VERSION
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    conflicts = [n["id"] for n in nodes_cand["new_nodes"] if n["id"] in existing_ids]
    if conflicts:
        raise SystemExit(f"node id conflicts with seed (do not dual-create): {conflicts}")

    expected_new = {
        "aflatoxin",
        "blood_cholesterol",
        "cancer_overall",
        "cataract",
        "chronic_disease",
        "cognitive_decline",
        "dietary_fat",
        "estrogen_level",
        "genetic_predisposition",
        "hbv_infection",
        "hormone_replacement_therapy",
        "iron_status",
        "kidney_stones",
        "liver_cancer",
        "low_carb_diet",
        "nutrient_supplements",
        "osteoporosis",
        "plant_protein",
        "type1_diabetes",
        "vitamin_d",
    }
    got_new = {n["id"] for n in nodes_cand["new_nodes"]}
    if got_new != expected_new:
        raise SystemExit(f"new_nodes mismatch: missing={expected_new-got_new} extra={got_new-expected_new}")

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
            node["mechanism_depth"] = n.get("mechanism_depth") or "mechanism"
        new_nodes.append(node)
        existing_ids.add(n["id"])
    seed["nodes"].extend(new_nodes)

    groups = {n["id"]: n.get("group", "") for n in seed["nodes"]}

    by_endpoints: dict[tuple[str, str], list[dict]] = {}
    for link in seed["links"]:
        by_endpoints.setdefault((link["source"], link["target"]), []).append(link)

    # Pre-check: no parallel pairs on baseline.
    parallel0 = {k: v for k, v in by_endpoints.items() if len(v) > 1}
    if parallel0:
        raise SystemExit(f"baseline already has parallel pairs: {len(parallel0)}")

    append_evidence_rows = 0
    append_candidates = 0
    new_count = 0
    append_hosts: list[dict] = []
    direction_counts: Counter[str] = Counter()
    batch_internal_appends = 0

    for cand in links_cand["candidate_links"]:
        key = (cand["source"], cand["target"])
        if cand["source"] not in existing_ids or cand["target"] not in existing_ids:
            raise SystemExit(f"unknown endpoint on {cand.get('note_id')}: {key}")
        hosts = by_endpoints.get(key, [])
        want_append = is_append_candidate(cand) or bool(hosts)
        new_evs = evidences_from_candidate(cand)

        if want_append and hosts:
            host = pick_host(hosts)
            live_rel = host.get("relation")
            added = append_evidences(host, new_evs)
            # Keep live relation (never overwrite with candidate relation).
            if live_rel is not None:
                host["relation"] = live_rel
            append_evidence_rows += added
            append_candidates += 1
            append_hosts.append(
                {
                    "candidate_note_id": cand.get("note_id"),
                    "endpoints": f"{cand['source']}->{cand['target']}",
                    "host_id": host.get("id") or host.get("note_id") or "",
                    "host_source_id": host.get("source_id") or "(lit)",
                    "host_relation": host.get("relation"),
                    "candidate_relation": cand.get("relation"),
                    "existing_relation": cand.get("existing_relation"),
                    "evidences_appended": added,
                }
            )
            if not is_append_candidate(cand) and hosts:
                # Was flagged new but endpoints already existed (batch or seed).
                batch_internal_appends += 1
            continue

        direction = infer_direction(cand, groups)
        direction_counts[direction] += 1
        edge = new_edge_from_candidate(cand, direction)
        seed["links"].append(edge)
        by_endpoints.setdefault(key, []).append(edge)
        new_count += 1

    # Alias backfill for mechanisms with deg≥3 and empty aliases (should be rare).
    deg: Counter[str] = Counter()
    for link in seed["links"]:
        deg[link["source"]] += 1
        deg[link["target"]] += 1
    for node in seed["nodes"]:
        if node.get("type") == "mechanism" and deg[node["id"]] >= 3 and not (node.get("aliases") or []):
            node["aliases"] = [node["label"], node["label"].replace("/", " ")]

    # Topology checks.
    pairs = Counter((l["source"], l["target"]) for l in seed["links"])
    multi = {k: n for k, n in pairs.items() if n > 1}
    if multi:
        raise SystemExit(f"parallel pairs after ingest: {len(multi)} e.g. {next(iter(multi))}")

    for link in seed["links"]:
        if "limitations" in link:
            raise SystemExit(f"limitations on {link.get('id')}")
        for ev in link.get("evidences") or []:
            if "limitations" in ev:
                raise SystemExit(f"limitations in evidence of {link.get('id')}")
            if link.get("source_file") != "literature" and ev.get("citation") is not None:
                # Book-owned rows must not carry citation; lit hosts may keep lit citations.
                if ev.get("source_id") == SOURCE_ID and "citation" in ev:
                    raise SystemExit(f"china_study evidence still has citation on {link.get('id')}")

    seed["meta"]["data_version"] = TO_VERSION
    marker = (
        "data 2.2 · NS-074：china_study（《救命饮食：中国健康调查报告》）EPUB 全量录入"
        f"（{len(new_nodes)} 新节点 + {append_candidates + new_count} 边贡献；"
        f"同端点 {append_candidates} append，其余新建）；schema 仍 0.7。"
    )
    note = seed["meta"].get("note", "")
    if "NS-074" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    header = (
        "# 植物性饮食与慢病 · 救命饮食：中国健康调查报告（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-074 按 EPUB 整理同步入库；"
        "摘录保留作者原文语气，不构成诊断、治疗或个性化建议。"
        "书名含「救命」属原书名，不作疗效承诺。\n\n"
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
        raise SystemExit("china_study missing from admin_books")

    sources = load(SOURCES)
    for row in sources["sources"]:
        if row["id"] == SOURCE_ID:
            row["file"] = CANON_FILE
            row["title"] = SOURCE_TITLE
            row["summary"] = (
                "基于中国农村膳食与健康调查的公开读物讨论。"
                "书中介绍膳食模式与慢病主题的调查叙述与作者解读，属于公开资料综述。"
                "本图谱引用其中膳食模式与慢病对照的叙述供教育向对照。"
                "NS-074 起本书图谱边按 EPUB 健康主题候选全量入库。"
            )
            if links_cand.get("meta", {}).get("weread_link"):
                row["url"] = links_cand["meta"]["weread_link"]
            break
    else:
        raise SystemExit("china_study missing from sources.json")

    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = (
            "[救命饮食：中国健康调查报告（第二版）]"
            "(植物性饮食与慢病_救命饮食中国健康调查报告.md) · high · 21 条 · ⚠️ export_may_be_truncated"
        )
        new = (
            "[救命饮食：中国健康调查报告（第二版）]"
            f"(植物性饮食与慢病_救命饮食中国健康调查报告.md) · high · "
            f"{append_candidates + new_count} 条（NS-074 EPUB）"
        )
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")
        elif "NS-074 EPUB" not in text:
            raise SystemExit("kb index china_study line not found for update")

    dump(SEED, seed)
    dump(ADMIN, admin)
    dump(SOURCES, sources)

    def citing(sid: str) -> int:
        n = 0
        for link in seed["links"]:
            if link.get("source_id") == sid:
                n += 1
                continue
            if any(e.get("source_id") == sid for e in link.get("evidences") or []):
                n += 1
        return n

    top_cs = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    report = {
        "task": "TASK-NS-074",
        "from_data_version": FROM_VERSION,
        "to_data_version": TO_VERSION,
        "schema_version": SCHEMA_VERSION,
        "before": {"nodes": before_nodes, "links": before_links},
        "after": {"nodes": len(seed["nodes"]), "links": len(seed["links"])},
        "new_nodes": [n["id"] for n in new_nodes],
        "new_node_count": len(new_nodes),
        "append_candidates": append_candidates,
        "append_evidence_rows": append_evidence_rows,
        "new_edges": new_count,
        "batch_internal_appends_flagged_new": batch_internal_appends,
        "parallel_pairs_after": 0,
        "china_study_top_level": top_cs,
        "china_study_citing": citing(SOURCE_ID),
        "direction_new": dict(direction_counts),
        "type_counts_after": dict(Counter(n["type"] for n in seed["nodes"])),
        "append_hosts": append_hosts,
    }
    dump(REPORT, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
