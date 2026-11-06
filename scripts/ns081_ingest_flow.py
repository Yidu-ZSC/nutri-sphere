#!/usr/bin/env python3
"""TASK-NS-081: ingest flow（《心流》）EPUB candidates.

Follows NS-072 / NS-080 ingest convention:
  • Same (source, target) vs seed → append evidences; keep live host relation.
  • Same (source, target) within batch → one edge + append; never parallel.
  • Top-level excerpt/source_*/note_id mirror evidences[0] (NS-056+).
  • No limitations; do not edit DISCLAIMER_*.
  • Book evidences must not carry citation (validate-data).
  • sources.json entry is NEW for this book (like NS-075 / NS-077 / NS-078 / NS-079 / NS-080).
  • reuse_nodes in candidate JSON are id strings (not objects).
  • Title in sources = 心流 (not book_meta full title); authors = 米哈里·契克森米哈赖.
  • Translator 张定绮 goes in summary only (no translator schema field).
  • Do NOT confuse with 《从内耗到心流》(杨鸣) or 《心流：内在秩序的觉醒》(孙素云).
"""
from __future__ import annotations

import json
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAND_DIR = Path("/workspace/epub-cleardiet/flow")
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
ADMIN = ROOT / "data/admin_books.json"
SOURCES = ROOT / "data/sources.json"
KB_INDEX = ROOT / "data/kb/00-索引.md"
KB_TARGET = ROOT / "data/kb/零散_心流_2796-2924.md"
KB_SOURCE = CAND_DIR / "ClearDiet-心流-原文摘录.md"
BOOK_META = CAND_DIR / "book_meta.json"
REPORT = ROOT / "scripts/ns081_report.json"
CAND_OUT = ROOT / "data/candidates/flow"
CANON_FILE = "零散_心流_2796-2924.md"
SOURCE_ID = "flow"
SOURCE_TITLE = "心流"
AUTHORS = "米哈里·契克森米哈赖"
FROM_VERSION = "2.8"
TO_VERSION = "2.9"
SCHEMA_VERSION = "0.7"
COVER_URL = (
    "https://wfqqreader-1252317822.image.myqcloud.com/cover/826/921826/t6_921826.jpg"
)
WEREAD_URL = "https://weread.qq.com/web/reader/65e328b05e10e265eb76e03"
PUBLISHER = "中信出版集团"
ISBN = "9787508675534"

DEFAULT_EVIDENCE_TYPE = "book_notes_observational_synthesis"

EXPECTED_NEW = {
    "flow_state",
    "attention",
}

# Agents whose outbound edges default to risk unless clearly protective wording.
RISK_AGENTS = {
    "acne",
    "added_sugar",
    "aflatoxin",
    "alcohol",
    "antibiotic_resistance",
    "antibiotics",
    "atherosclerosis",
    "autism_spectrum",
    "blood_cholesterol",
    "casein",
    "circulating_microbes",
    "constipation",
    "craving",
    "dairy",
    "diabetic_retinopathy",
    "dietary_cholesterol",
    "dietary_fat",
    "energy_surplus",
    "estrogen_level",
    "fructose",
    "gambling_addiction",
    "gastritis",
    "gout_uric_acid",
    "gut_barrier_leak",
    "halitosis",
    "helicobacter_pylori",
    "hypertension",
    "ibd_related",
    "igf1_signaling",
    "immune_activation",
    "industrial_seed_oils",
    "insulin_resistance",
    "irritable_bowel",
    "low_carb_diet",
    "lps",
    "metabolic_syndrome",
    "mismatch_disease",
    "mycotoxins",
    "neuroinflammation",
    "obesity_risk",
    "oral_disease",
    "parkinson_disease",
    "peripheral_neuropathy",
    "physical_inactivity",
    "processed_meat",
    "protein_deficiency",
    "psychological_stress",
    "reactive_oxygen",
    "red_meat",
    "refined_carbs",
    "saturated_fat",
    "skin_aging",
    "smoking",
    "social_isolation",
    "sugar_sweetened_beverages",
    "thyroid_disease",
    "type2_diabetes",
    "ultra_processed",
    "visceral_adiposity",
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


def reuse_node_ids(nodes_cand: dict) -> list[str]:
    """reuse_nodes may be id strings (flow) or objects with id (older books)."""
    out: list[str] = []
    for item in nodes_cand.get("reuse_nodes") or []:
        if isinstance(item, str):
            out.append(item)
        elif isinstance(item, dict) and item.get("id"):
            out.append(str(item["id"]))
        else:
            raise SystemExit(f"unexpected reuse_nodes item: {item!r:.120}")
    return out


def copy_candidates() -> None:
    """Optional: hang candidate artifacts under data/candidates/flow/."""
    CAND_OUT.mkdir(parents=True, exist_ok=True)
    mapping = {
        "ClearDiet-心流-候选边.json": "candidate_links.json",
        "ClearDiet-心流-候选节点.json": "candidate_nodes.json",
        "ClearDiet-心流-原文摘录.md": "excerpts.md",
        "ClearDiet-心流-抽取说明.md": "extract_notes.md",
        "book_meta.json": "meta.json",
    }
    for src_name, dst_name in mapping.items():
        src = CAND_DIR / src_name
        if src.exists():
            shutil.copy2(src, CAND_OUT / dst_name)


def main() -> None:
    seed = load(SEED)
    nodes_cand = load(CAND_DIR / "ClearDiet-心流-候选节点.json")
    links_cand = load(CAND_DIR / "ClearDiet-心流-候选边.json")
    book_meta = load(BOOK_META) if BOOK_META.exists() else {}

    assert seed["meta"]["schema_version"] == SCHEMA_VERSION
    assert seed["meta"]["data_version"] == FROM_VERSION
    before_nodes = len(seed["nodes"])
    before_links = len(seed["links"])

    existing_ids = {n["id"] for n in seed["nodes"]}
    conflicts = [n["id"] for n in nodes_cand["new_nodes"] if n["id"] in existing_ids]
    if conflicts:
        raise SystemExit(f"node id conflicts with seed (do not dual-create): {conflicts}")

    got_new = {n["id"] for n in nodes_cand["new_nodes"]}
    if got_new != EXPECTED_NEW:
        raise SystemExit(f"new_nodes mismatch: missing={EXPECTED_NEW-got_new} extra={got_new-EXPECTED_NEW}")

    reuse_ids = reuse_node_ids(nodes_cand)
    missing_reuse = [rid for rid in reuse_ids if rid not in existing_ids]
    if missing_reuse:
        raise SystemExit(f"reuse_nodes missing from seed: {missing_reuse}")

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
    live_relation_before: dict[tuple[str, str], str] = {
        (h["source"], h["target"]): h.get("relation")
        for hosts in by_endpoints.values()
        for h in hosts
    }

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
                    "live_relation_before": live_relation_before.get(key),
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
                    raise SystemExit(f"flow evidence still has citation on {link.get('id')}")

    seed["meta"]["data_version"] = TO_VERSION
    marker = (
        "data 2.9 · NS-081：flow（《心流》）EPUB 全量录入"
        f"（{len(new_nodes)} 新节点 + {append_candidates + new_count} 边贡献；"
        f"同端点 {append_candidates} append，其余新建）；schema 仍 0.7。"
    )
    note = seed["meta"].get("note", "")
    if "NS-081" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + marker).strip()

    header = (
        "# 零散 · 心流（教育向书摘）\n\n"
        "> **教育用途 / Educational use only。非医疗建议。**  \n"
        "> ClearDiet / NutriSphere 知识图谱溯源文稿。TASK-NS-081 按 EPUB 整理同步入库；"
        "摘录保留作者原文语气，不构成诊断、治疗或个性化建议。"
        "译者张定绮；ISBN 9787508675534。勿与《从内耗到心流》《心流：内在秩序的觉醒》混淆。\n\n"
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
            book["publisher"] = book_meta.get("publisher") or PUBLISHER
            book["isbn"] = book_meta.get("isbn") or ISBN
            book["cover_url"] = (book_meta.get("weread") or {}).get("cover") or COVER_URL
            book["authors"] = AUTHORS
            break
    else:
        raise SystemExit("flow missing from admin_books")

    sources = load(SOURCES)
    weread_url = (
        links_cand.get("meta", {}).get("weread_link")
        or (book_meta.get("weread") or {}).get("readerLink")
        or WEREAD_URL
    )
    source_row = {
        "id": SOURCE_ID,
        "title": SOURCE_TITLE,
        "authors": AUTHORS,
        "year": 2017,
        "type": "book",
        "summary": (
            "米哈里·契克森米哈赖（译者张定绮）从注意力、心流 / 最优体验、挑战与技巧匹配等角度，"
            "讨论心理健康、心理应激、情绪稳定、能量活力、社交隔离与饮酒应对等健康相关主题。"
            "本书简介仅说明教育向内容范围，不构成诊断、治疗或个性化建议。"
            "NS-081 起本书图谱边按 EPUB 健康主题候选全量入库（ISBN 9787508675534）。"
        ),
        "file": CANON_FILE,
        "url": weread_url,
    }
    if AUTHORS != "米哈里·契克森米哈赖":
        raise SystemExit(f"authors must be 米哈里·契克森米哈赖, got {AUTHORS!r}")
    for i, row in enumerate(sources["sources"]):
        if row["id"] == SOURCE_ID:
            sources["sources"][i] = source_row
            break
    else:
        insert_at = next(
            (i + 1 for i, row in enumerate(sources["sources"]) if row["id"] == "power_of_habit"),
            len(sources["sources"]),
        )
        sources["sources"].insert(insert_at, source_row)

    if KB_INDEX.exists():
        text = KB_INDEX.read_text(encoding="utf-8")
        old = "[心流：最优体验心理学](零散_心流_2796-2924.md) · edge · 1 条"
        new = (
            "[心流：最优体验心理学](零散_心流_2796-2924.md) · edge · "
            f"{append_candidates + new_count} 条（NS-081 EPUB）"
        )
        if old in text:
            KB_INDEX.write_text(text.replace(old, new), encoding="utf-8")
        elif "NS-081 EPUB" not in text:
            raise SystemExit("kb index flow line not found for update")

    copy_candidates()

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

    top_flow = sum(1 for l in seed["links"] if l.get("source_id") == SOURCE_ID)
    report = {
        "task": "TASK-NS-081",
        "from_data_version": FROM_VERSION,
        "to_data_version": TO_VERSION,
        "schema_version": SCHEMA_VERSION,
        "before": {"nodes": before_nodes, "links": before_links},
        "after": {"nodes": len(seed["nodes"]), "links": len(seed["links"])},
        "new_nodes": [n["id"] for n in new_nodes],
        "new_node_count": len(new_nodes),
        "reuse_node_count": len(reuse_ids),
        "append_candidates": append_candidates,
        "append_evidence_rows": append_evidence_rows,
        "new_edges": new_count,
        "batch_internal_appends_flagged_new": batch_internal_appends,
        "parallel_pairs_after": 0,
        "flow_top_level": top_flow,
        "flow_citing": citing(SOURCE_ID),
        "direction_new": dict(direction_counts),
        "type_counts_after": dict(Counter(n["type"] for n in seed["nodes"])),
        "sources_registered": True,
        "authors": AUTHORS,
        "append_hosts_sample": append_hosts[:5],
        "append_hosts_count": len(append_hosts),
        "append_hosts_all": append_hosts,
    }
    dump(REPORT, report)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
