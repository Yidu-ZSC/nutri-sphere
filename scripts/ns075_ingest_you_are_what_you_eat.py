#!/usr/bin/env python3
"""TASK-NS-075: ingest you_are_what_you_eat（《你是你吃出来的》）EPUB candidates.

Follows NS-072 ingest convention (scripts/ingest_collapse_same_endpoints.py):
  • Same (source, target) vs seed → append evidences; keep live host relation.
  • Same (source, target) within batch → one edge + append; never parallel.
  • Top-level excerpt/source_*/note_id mirror evidences[0] (NS-056+).
  • No limitations; do not edit DISCLAIMER_*.
  • Book evidences must not carry citation (validate-data).
  • sources.json entry is NEW for this book (unlike NS-074 china_study).
"""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/you_are_what_you_eat")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/营养基础_你是你吃出来的.md"
KB_SOURCE = CAND_DIR / "ClearDiet-你是你吃出来的-原文摘录.md"
BOOK_META = CAND_DIR / "book_meta.json"
REPORT = ROOT / "scripts/ns075_report.json"
CANON_FILE = "营养基础_你是你吃出来的.md"
SOURCE_ID = "you_are_what_you_eat"
SOURCE_TITLE = "你是你吃出来的"
FROM_VERSION = "2.2"
TO_VERSION = "2.3"
SCHEMA_VERSION = "0.7"

DEFAULT_EVIDENCE_TYPE = "book_notes_observational_synthesis"

# Agents whose outbound edges default to risk unless clearly protective wording.
RISK_AGENTS = {
    "animal_foods",
    "atherosclerosis",
    "blood_cholesterol",
    "casein",
    "constipation",
    "dairy",
    "dietary_cholesterol",
    "dietary_fat",
    "estrogen_level",
    "gastritis",
    "hypertension",
    "igf1_signaling",
    "insulin_resistance",
    "low_carb_diet",
    "obesity_risk",
    "peripheral_neuropathy",
    "processed_meat",
    "protein_deficiency",
    "reactive_oxygen",
    "red_meat",
    "refined_carbs",
    "saturated_fat",
    "thyroid_disease",
    "ultra_processed",
    "added_sugar",
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
    rel = link.get("relation", "") or ""
    sg, tg = groups.get(s), groups.get(t)
    if sg == "protective" and tg in {"risk", "mixed", "neutral"}:
        return "protective"
    if s in RISK_AGENTS or sg == "risk":
        if any(h in rel for h in ("较低", "较少", "改善", "有助于", "帮助", "防护", "增强")) and not any(
            h in rel for h in ("风险", "癌", "损伤", "升高", "增加", "促进", "缺乏", "不足")
        ):
            return "protective"
        return "risk"
    if sg == "risk" and tg == "protective":
        return "risk"
    if sg == "mixed":
        if any(h in rel for h in ("风险", "癌", "损伤", "升高", "增加", "缺乏", "不足")):
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
        seen: set[str] = set()
        deduped: list[dict] = []
        for ev in out:
            nid = ev["note_id"]
            if nid in seen:
                continue
            seen.add(nid)
            deduped.append(ev)
        return deduped
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
    nodes_cand = load(CAND_DIR / "ClearDiet-你是你吃出来的-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-你是你吃出来的-候选边.json")
    book_meta = load(BOOK_META) if BOOK_META.exists() else {}

    assert seed["meta"]["schema_version"] == SCHEMA_VERSION
    assert seed["meta"]["data_version"] == FROM_VERSION
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    conflicts = [n["id"] for n in nodes_cand["new_nodes"] if n["id"] in existing_ids]
    if conflicts:
        raise SystemExit(f"node id conflicts with seed (do not dual-create): {conflicts}")

    expected_new = {
        "calcium",
        "cell_repair",
        "constipation",
        "gastritis",
        "iodine",
        "magnesium",
        "mediterranean_diet",
        "omnivorous_balanced_diet",
        "peripheral_neuropathy",
        "protein_deficiency",
        "thyroid_disease",
        "vitamin_a",
        "vitamin_b_complex",
        "zinc",
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
                batch_internal_appends += 1
            continue

        direction = infer_direction(cand, groups)
        direction_counts[direction] += 1
        edge = new_edge_from_candidate(cand, direction)
        seed["links"].append(edge)
        by_endpoints.setdefault(key, []).append(edge)
        new_count += 1

    deg: Counter[str] = Counter()
    for link in seed["links"]:
        deg[link["source"]] += 1
        deg[link["target"]] += 1
    for node in seed["nodes"]:
        if node.get("type") == "mechanism" and deg[node["id"]] >= 3 and not (node.get("aliases") or []):
            node["aliases"] = [node["label"], node["label"].replace("/", " ")]

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
                if ev.get("source_id") == SOURCE_ID and "citation" in ev:
                    raise SystemExit(f"you_are_what_you_eat evidence still has citation on {link.get('id')}")

    seed["meta"]["data_version"] = TO_VERSION
    marker = (
        "data 2.3 · NS-075：you_are_what_you_eat（《你是你吃出来的》）EPUB 全量录入"
        f"（{len(new_nodes)} 新节点 + {append_candidates + new_count} 边贡献；"
        f"同端点 {append_candidates} append，其余新建）；schema 仍 0.7。"
    )
    note = seed["meta"].get("note", "")
    if "NS-075" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    header = (
        "# 营养基础 · 你是你吃出来的（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-075 按 EPUB 整理同步入库；"
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
            if book_meta.get("publisher"):
                book["publisher"] = book_meta["publisher"]
            if book_meta.get("isbn"):
                book["isbn"] = book_meta["isbn"]
            if book_meta.get("cover"):
                book["cover_url"] = book_meta["cover"]
            break
    else:
        raise SystemExit("you_are_what_you_eat missing from admin_books")

    sources = load(SOURCES)
    weread_url = (
        links_cand.get("meta", {}).get("weread_link")
        or book_meta.get("readerLink")
        or "https://weread.qq.com/web/reader/7bb32c305e0c557bbdeab81"
    )
    source_row = {
        "id": SOURCE_ID,
        "title": SOURCE_TITLE,
        "authors": book_meta.get("author") or "夏萌",
        "year": 2018,
        "type": "book",
        "summary": (
            "前安贞医院营养科主任夏萌基于临床营养实践的大众科普读物，"
            "围绕慢病与亚健康人群的膳食结构、蛋白质与微量营养素等主题展开公开讨论。"
            "本书简介仅说明教育向内容范围，不构成诊断、治疗或个性化建议。"
            "NS-075 起本书图谱边按 EPUB 健康主题候选全量入库。"
        ),
        "file": CANON_FILE,
        "url": weread_url,
    }
    for i, row in enumerate(sources["sources"]):
        if row["id"] == SOURCE_ID:
            sources["sources"][i] = source_row
            break
    else:
        # Insert before know_your_gut (index-only placeholder) if present; else append.
        insert_at = next(
            (i for i, row in enumerate(sources["sources"]) if row["id"] == "know_your_gut"),
            len(sources["sources"]),
        )
        sources["sources"].insert(insert_at, source_row)

    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = (
            "[你是你吃出来的：吃对少生病，病了这样吃]"
            "(营养基础_你是你吃出来的.md) · high · 20 条 · ⚠️ export_may_be_truncated"
        )
        new = (
            "[你是你吃出来的：吃对少生病，病了这样吃]"
            f"(营养基础_你是你吃出来的.md) · high · "
            f"{append_candidates + new_count} 条（NS-075 EPUB）"
        )
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")
        elif "NS-075 EPUB" not in text:
            raise SystemExit("kb index you_are_what_you_eat line not found for update")

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

    top_yawye = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    report = {
        "task": "TASK-NS-075",
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
        "you_are_what_you_eat_top_level": top_yawye,
        "you_are_what_you_eat_citing": citing(SOURCE_ID),
        "direction_new": dict(direction_counts),
        "type_counts_after": dict(Counter(n["type"] for n in seed["nodes"])),
        "sources_registered": True,
        "append_hosts": append_hosts,
    }
    dump(REPORT, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
