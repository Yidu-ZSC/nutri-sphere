#!/usr/bin/env python3
"""TASK-NS-072: collapse same-(source,target) parallel edges into 1 edge + evidences[].

Also documents the **ingest anti-regression convention** for every future EPUB /
candidate ingest (NS-067 / NS-069 / NS-071 style):

  INGEST CONVENTION (do not regress)
  ---------------------------------
  • Within a new candidate batch: if two candidates share the same (source, target),
    keep / create ONE edge and append the rest as evidences[]; never open a second
    parallel top-level edge for that pair.
  • Against the current seed: if (source, target) already exists, append the new
    excerpt into host.evidences[] (dedupe by note_id / excerpt); do not create a
    parallel edge.
  • Host selection when multiple hosts already exist (should be rare after NS-072):
      1. Prefer a literature edge (missing source_id, or id starting with lit_)
      2. Else the edge with the most evidences
      3. Else the smallest id / note_id lexicographically
  • Relation: keep the host's single public observational sentence; never concatenate
    multiple relations; never write book-framed wording (书中/本书/引述…叙述/…).
  • Top-level excerpt / source_* / note_id must mirror evidences[0] (NS-056+).
  • Never introduce a ``limitations`` field; never edit DISCLAIMER_*.

This script performs the one-shot full-graph collapse (data 2.0 → 2.1). Re-running
on an already-collapsed seed is a no-op for topology (parallel pairs = 0) but will
still bump / refresh the meta note if needed.

Usage:
  python3 scripts/ingest_collapse_same_endpoints.py
  python3 scripts/ingest_collapse_same_endpoints.py --dry-run
"""
from __future__ import annotations

import argparse
import copy
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data/seed_triples_v0.3_aligned.json"
REPORT = ROOT / "scripts/ns072_report.json"

BOOK_PAT = re.compile(r"书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述")
FROM_VERSION = "2.0"
TO_VERSION = "2.1"
SCHEMA_VERSION = "0.7"

META_MARKER = (
    "data 2.1 · NS-072：全图同端点平行边折叠为 1 边 + evidences[]；"
    "入库约定批内/对基线同端点必须 append，禁止平行双开；schema 仍 0.7。"
)


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def dump(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def is_lit(link: dict) -> bool:
    sid = link.get("source_id")
    lid = str(link.get("id") or "")
    return (not sid) or lid.startswith("lit_")


def link_id(link: dict) -> str:
    return str(link.get("id") or link.get("note_id") or "")


def host_sort_key(link: dict) -> tuple:
    """Stable host preference: lit → most evidences → smallest id."""
    return (0 if is_lit(link) else 1, -len(link.get("evidences") or []), link_id(link))


def evidence_from_edge_top(edge: dict) -> dict:
    """Materialize an evidence row from an edge's top-level citation fields."""
    ev: dict = {
        "excerpt": edge.get("excerpt"),
        "source_title": edge.get("source_title"),
        "source_file": edge.get("source_file"),
        "note_id": edge.get("note_id"),
    }
    if edge.get("source_id"):
        ev["source_id"] = edge["source_id"]
    if edge.get("citation"):
        ev["citation"] = copy.deepcopy(edge["citation"])
    return {k: v for k, v in ev.items() if v is not None}


def dedupe_key(ev: dict) -> tuple:
    return (ev.get("note_id"), ev.get("excerpt"))


def mirror_top_from_evidences0(host: dict) -> None:
    """Keep NS-056+ top-level ↔ evidences[0] mirror; lit edges omit source_id."""
    evids = host.get("evidences") or []
    if not evids:
        return
    e0 = evids[0]
    host["excerpt"] = e0["excerpt"]
    if e0.get("source_title"):
        host["source_title"] = e0["source_title"]
    if e0.get("source_file"):
        host["source_file"] = e0["source_file"]
    if e0.get("note_id") is not None:
        host["note_id"] = e0["note_id"]
    if host.get("source_file") == "literature" or is_lit(host):
        host.pop("source_id", None)
    elif e0.get("source_id"):
        host["source_id"] = e0["source_id"]
    # Preserve host-level citation if this is a lit edge and e0 carries one.
    if e0.get("citation") and (host.get("source_file") == "literature" or is_lit(host)):
        host["citation"] = copy.deepcopy(e0["citation"])


def pick_relation(host: dict, group: list[dict]) -> str:
    rel = (host.get("relation") or "").strip()
    if rel and not BOOK_PAT.search(rel):
        return rel
    for other in group:
        r = (other.get("relation") or "").strip()
        if r and not BOOK_PAT.search(r):
            return r
    return host.get("relation") or ""


def collapse_group(group: list[dict]) -> tuple[dict, dict]:
    """Return (host_edge, stats) after merging parallels into one host."""
    ordered = sorted(group, key=host_sort_key)
    host = copy.deepcopy(ordered[0])
    evids: list[dict] = [copy.deepcopy(e) for e in (host.get("evidences") or [])]
    seen = {dedupe_key(e) for e in evids if e.get("excerpt")}
    if not evids:
        top = evidence_from_edge_top(host)
        if top.get("excerpt"):
            evids = [top]
            seen = {dedupe_key(top)}

    swallowed_ids: list[str] = []
    for other in ordered[1:]:
        swallowed_ids.append(link_id(other))
        top = evidence_from_edge_top(other)
        if top.get("excerpt") and dedupe_key(top) not in seen:
            evids.append(top)
            seen.add(dedupe_key(top))
        for raw in other.get("evidences") or []:
            ev = copy.deepcopy(raw)
            if not ev.get("excerpt"):
                continue
            key = dedupe_key(ev)
            if key in seen:
                continue
            evids.append(ev)
            seen.add(key)

    host["evidences"] = evids
    host["relation"] = pick_relation(host, ordered)
    mirror_top_from_evidences0(host)
    stats = {
        "host_id": link_id(host),
        "endpoints": [host["source"], host["target"]],
        "before": len(group),
        "evidences_after": len(evids),
        "swallowed_ids": swallowed_ids,
        "host_source_id": host.get("source_id") or "(lit)",
    }
    return host, stats


def collapse_seed(seed: dict) -> tuple[dict, dict]:
    pairs: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for link in seed["links"]:
        pairs[(link["source"], link["target"])].append(link)

    parallel_pairs = sum(1 for g in pairs.values() if len(g) > 1)
    extra = sum(len(g) - 1 for g in pairs.values() if len(g) > 1)

    new_links: list[dict] = []
    collapse_rows: list[dict] = []
    # Preserve original encounter order of first-seen endpoint pairs.
    seen_keys: list[tuple[str, str]] = []
    seen_set: set[tuple[str, str]] = set()
    for link in seed["links"]:
        key = (link["source"], link["target"])
        if key in seen_set:
            continue
        seen_set.add(key)
        seen_keys.append(key)

    for key in seen_keys:
        group = pairs[key]
        if len(group) == 1:
            new_links.append(copy.deepcopy(group[0]))
            continue
        host, stats = collapse_group(group)
        new_links.append(host)
        collapse_rows.append(stats)

    seed = copy.deepcopy(seed)
    seed["links"] = new_links
    seed["meta"]["data_version"] = TO_VERSION
    note = seed["meta"].get("note") or ""
    if "NS-072" not in note:
        seed["meta"]["note"] = (note.rstrip() + " " + META_MARKER).strip()

    def citing(sid: str) -> int:
        n = 0
        for link in new_links:
            if link.get("source_id") == sid:
                n += 1
                continue
            if any(e.get("source_id") == sid for e in link.get("evidences") or []):
                n += 1
        return n

    top = Counter(link.get("source_id") or "(lit)" for link in new_links)
    report = {
        "task": "TASK-NS-072",
        "elon_task": "TASK-20261105-01",
        "from_data_version": FROM_VERSION,
        "to_data_version": TO_VERSION,
        "schema_version": SCHEMA_VERSION,
        "before": {
            "nodes": len(seed["nodes"]),
            "links": sum(len(g) for g in pairs.values()),
            "parallel_pairs": parallel_pairs,
            "extra_parallel": extra,
        },
        "after": {
            "nodes": len(seed["nodes"]),
            "links": len(new_links),
            "parallel_pairs": 0,
            "extra_parallel": 0,
        },
        "top_source_id": dict(top),
        "citing": {
            "gut_brain": citing("gut_brain"),
            "eat_to_heal": citing("eat_to_heal"),
            "amazing_veggie_soup": citing("amazing_veggie_soup"),
            "how_not_to_die": citing("how_not_to_die"),
        },
        "collapsed_groups": collapse_rows,
        "spot_plant_based_diet_chd": next(
            (
                {
                    "id": link.get("id"),
                    "source_id": link.get("source_id"),
                    "evidences": len(link.get("evidences") or []),
                    "relation": link.get("relation"),
                    "note_ids": [e.get("note_id") for e in link.get("evidences") or []],
                }
                for link in new_links
                if link["source"] == "plant_based_diet"
                and link["target"] == "coronary_heart_disease"
            ),
            None,
        ),
        "ingest_convention": (
            "批内同端点与对基线已有端点：第二条起 append evidences，禁止平行双开；"
            "host 优先 lit → evidences 最多 → id 字典序最小；relation 单句公共观察；"
            "顶层与 evidences[0] 镜像；无 limitations；不动 DISCLAIMER。"
        ),
    }
    return seed, report


def verify(seed: dict) -> None:
    pairs: dict[tuple[str, str], int] = Counter(
        (link["source"], link["target"]) for link in seed["links"]
    )
    multi = {k: n for k, n in pairs.items() if n > 1}
    if multi:
        raise SystemExit(f"parallel pairs remain: {len(multi)} e.g. {next(iter(multi))}")
    if seed["meta"]["data_version"] != TO_VERSION:
        raise SystemExit(f"data_version != {TO_VERSION}")
    if seed["meta"]["schema_version"] != SCHEMA_VERSION:
        raise SystemExit(f"schema_version != {SCHEMA_VERSION}")
    book_hits = [
        link_id(link)
        for link in seed["links"]
        if BOOK_PAT.search(link.get("relation") or "")
    ]
    if book_hits:
        raise SystemExit(f"book-framed relations: {book_hits[:5]}")
    for link in seed["links"]:
        if "limitations" in link:
            raise SystemExit(f"limitations on {link_id(link)}")
        for ev in link.get("evidences") or []:
            if "limitations" in ev:
                raise SystemExit(f"limitations in evidence of {link_id(link)}")
        evids = link.get("evidences") or []
        if not evids:
            raise SystemExit(f"empty evidences on {link_id(link)}")
        if link.get("excerpt") != evids[0].get("excerpt"):
            raise SystemExit(f"excerpt mirror broken on {link_id(link)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute collapse and write report only; do not rewrite seed",
    )
    args = parser.parse_args()

    seed = load(SEED)
    if seed["meta"]["schema_version"] != SCHEMA_VERSION:
        raise SystemExit(f"expected schema {SCHEMA_VERSION}, got {seed['meta']['schema_version']}")
    # Allow re-run from 2.0 or already-2.1 (idempotent topology).
    if seed["meta"]["data_version"] not in {FROM_VERSION, TO_VERSION}:
        raise SystemExit(
            f"expected data_version {FROM_VERSION} or {TO_VERSION}, "
            f"got {seed['meta']['data_version']}"
        )

    before_links = len(seed["links"])
    new_seed, report = collapse_seed(seed)
    verify(new_seed)

    dump(REPORT, report)
    if not args.dry_run:
        dump(SEED, new_seed)

    print(
        json.dumps(
            {
                "dry_run": args.dry_run,
                "before_links": before_links,
                "after_links": report["after"]["links"],
                "parallel_pairs_before": report["before"]["parallel_pairs"],
                "extra_parallel_before": report["before"]["extra_parallel"],
                "top_source_id": report["top_source_id"],
                "citing": report["citing"],
                "spot": report["spot_plant_based_diet_chd"],
                "report": str(REPORT),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
