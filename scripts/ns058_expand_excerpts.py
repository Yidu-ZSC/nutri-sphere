#!/usr/bin/env python3
"""TASK-NS-058: expand priority-theme short excerpts from KB 原文 blocks."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed_triples_v0.3_aligned.json"
KB = Path("/workspace/kb-ns058")
EXCERPT_LIMIT = 1200
TARGET_MIN = 400
TARGET_MAX = 800

P = {
    "cardiometabolic",
    "chronic_inflammation",
    "gut_barrier_leak",
    "gut_microbiome",
    "fatty_liver",
    "ibd_related",
}

NOTE_SPLIT = re.compile(r"<!--\s*weread_note_id:\s*([^\s>]+)\s*-->")


def parse_kb_file(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    matches = list(NOTE_SPLIT.finditer(text))
    notes = []
    for i, m in enumerate(matches):
        block = text[m.end() : matches[i + 1].start() if i + 1 < len(matches) else len(text)]
        m2 = re.search(
            r"\*\*原文\*\*\s*\n(.*?)(?=\n\*\*想法\*\*|\n章节：|\n### |\Z)",
            block,
            re.S,
        )
        yuanwen = m2.group(1) if m2 else block
        quotes = []
        for line in yuanwen.splitlines():
            if line.startswith(">"):
                quotes.append(line[1:].lstrip())
            elif not line.strip():
                continue
            else:
                if quotes and (
                    line.startswith("**")
                    or line.startswith("章节")
                    or line.startswith("###")
                ):
                    break
                if not quotes:
                    continue
                break
        quote = "\n".join(quotes).strip()
        # Drop junk like [插图]
        if not quote or quote in {"[插图]", "NutritionFacts.org", "NutritionFacts"}:
            continue
        notes.append({"note_id": m.group(1), "quote": quote, "i": i, "file": path.name})
    return notes


def load_kb() -> dict[str, list[dict]]:
    out = {}
    for p in sorted(KB.glob("*.md")):
        if p.name.startswith("._"):
            continue
        out[p.name] = parse_kb_file(p)
    return out


def by_id_map(file_notes: list[dict]) -> dict[str, dict]:
    return {n["note_id"]: n for n in file_notes}


def join_quotes(quotes: list[str]) -> str:
    # Preserve paragraph breaks; collapse accidental blank-only joins
    parts = [q.strip() for q in quotes if q and q.strip()]
    return "\n".join(parts)


def truncate_at_sentence(text: str, limit: int = EXCERPT_LIMIT) -> str:
    if len(text) <= limit:
        return text
    window = text[:limit]
    best = -1
    for punct in ("。", "？", "！", "；", ".", "?", "!", ";"):
        pos = window.rfind(punct)
        if pos > best:
            best = pos
    if best >= int(limit * 0.5):
        return text[: best + 1]
    return window  # last resort: hard cut (should be rare)


def expand_ids(file_notes: list[dict], note_ids: list[str], target_min=TARGET_MIN, target_max=TARGET_MAX) -> tuple[str, list[str], str]:
    """Join given note_ids in file order; if short, grow with neighbors of the span."""
    idmap = by_id_map(file_notes)
    missing = [nid for nid in note_ids if nid not in idmap]
    if missing:
        raise KeyError(f"missing note_ids: {missing}")
    chosen = sorted([idmap[nid] for nid in note_ids], key=lambda n: n["i"])
    # Deduplicate identical quotes (duplicate thought/highlight pairs)
    quotes = []
    seen = set()
    used_ids = []
    for n in chosen:
        if n["quote"] in seen:
            continue
        seen.add(n["quote"])
        quotes.append(n["quote"])
        used_ids.append(n["note_id"])
    text = join_quotes(quotes)
    # Grow with neighbors if below target_min
    lo = min(n["i"] for n in chosen)
    hi = max(n["i"] for n in chosen)
    # index by original i for neighbor walk
    by_i = {n["i"]: n for n in file_notes}
    guard = 0
    while len(text) < target_min and guard < 40:
        guard += 1
        grew = False
        # prefer forward then backward
        for nxt in (hi + 1, lo - 1):
            if nxt in by_i:
                cand = by_i[nxt]
                if cand["quote"] not in seen:
                    # tentative add
                    if nxt == hi + 1:
                        new_quotes = quotes + [cand["quote"]]
                        new_ids = used_ids + [cand["note_id"]]
                        hi = nxt
                    else:
                        new_quotes = [cand["quote"]] + quotes
                        new_ids = [cand["note_id"]] + used_ids
                        lo = nxt
                    new_text = join_quotes(new_quotes)
                    if len(new_text) > target_max + 150 and len(text) >= 280:
                        # don't overshoot wildly if we already have something usable
                        continue
                    quotes, used_ids, text = new_quotes, new_ids, new_text
                    seen.add(cand["quote"])
                    grew = True
                    break
        if not grew:
            break
        if len(text) >= target_min:
            break
    # If still long beyond target_max but under limit, try trimming trailing notes
    while len(text) > target_max and len(quotes) > 1:
        # keep at least first note; drop last if still >= target_min after drop
        trial = join_quotes(quotes[:-1])
        if len(trial) >= target_min or len(trial) >= len(text) - 50:
            # only drop if we stay reasonable
            if len(trial) >= min(target_min, len(text) - 1) and len(trial) >= 300:
                quotes = quotes[:-1]
                used_ids = used_ids[:-1]
                text = trial
                continue
        break
    text = truncate_at_sentence(text, EXCERPT_LIMIT)
    kind = "ok"
    if len(text) < TARGET_MIN:
        kind = "short"
    elif len(text) > TARGET_MAX:
        kind = "long"
    return text, used_ids, kind


# Curated anchors: (source, target) -> list of weread note_ids in the link's source_file
# Locating notes verified against /workspace/kb-ns058 原文 blocks only.
ANCHORS: dict[tuple[str, str], list[str]] = {
    # 蔬菜汤
    ("plant_based_diet", "chronic_inflammation"): [
        "35903999_7UujuY6q0",
        "35903999_7UujZPd3G",
        "35903999_7UulQClmx",
    ],
    ("chronic_inflammation", "liver_chronic"): [
        "35903999_7UujZPd3G",
        "35903999_7UulQClmx",
        "35903999_7Uum2bdvM",
    ],
    ("chronic_inflammation", "digestive_cancer_risk"): [
        "35903999_7UujZPd3G",
        "35903999_7UulQClmx",
        "35903999_7Uum2bdvM",
    ],
    ("glycation", "chronic_inflammation"): [
        "35903999_7UujZPd3G",
        "35903999_7Uum2bdvM",
    ],
    ("reactive_oxygen", "chronic_inflammation"): [
        "35903999_7UujuY6q0",
        "35903999_7UujZPd3G",
        "35903999_7Uumd0Ba1",
    ],
    # 吃出自愈力
    ("scfa", "chronic_inflammation"): [
        "39484588_10_5172-5447",
        "39484588_10_9655-9804",
        "39484588_18_22294-22371",
    ],
    ("dietary_fiber", "gut_microbiome"): [
        "39484588_10_5172-5447",
        "39484588_10_9655-9804",
        "35903999_81vDbboq4",
    ],
    ("plant_based_diet", "gut_microbiome"): [
        "39484588_10_9655-9804",
        "35903999_81vDbboq4",
        "39484588_18_22294-22371",
    ],
    ("butyrate", "gut_barrier_leak"): [
        "39484588_10_5172-5447",
        "39484588_10_9655-9804",
        "39484588_18_22294-22371",
    ],
    ("soy", "cardiometabolic"): [
        "39484588_14_3969-4088",
        "39484588_10_5172-5447",
        "35903999_81vvKCKeg",
    ],
    # 中国健康调查报告
    ("animal_foods", "cardiometabolic"): [
        "35903999_7UsOeVSXs",
        "35903999_7UsVp5sbg",
        "35903999_7UsVN9gnq",
        "35903999_7Ut4eWrFy",
    ],
    ("plant_based_diet", "cardiometabolic"): [
        "35903999_7UsOeVSXs",
        "35903999_7UsVp5sbg",
        "35903999_7UsVN9gnq",
        "35903999_7Ut4eWrFy",
    ],
    ("refined_carbs", "cardiometabolic"): [
        "35903999_7UsOeVSXs",
        "35903999_7UsVp5sbg",
        "35903999_7UsVN9gnq",
        "35903999_7Ut4eWrFy",
    ],
    ("saturated_fat", "cardiometabolic"): [
        "35903999_7UsOeVSXs",
        "35903999_7UsQjCzCv",
        "35903999_7UsVp5sbg",
        "35903999_7UsVN9gnq",
    ],
    # 菌群大脑
    ("lps", "chronic_inflammation"): [
        "24913511_79_2268-2452",
        "24913511_80_607-674",
        "24913511_80_1004-1039",
        "24913511_80_1635-1692",
        "24913511_81_540-601",
    ],
    ("gut_barrier_leak", "lps"): [
        "24913511_79_2268-2452",
        "24913511_80_607-674",
        "24913511_80_1004-1039",
        "24913511_80_1635-1692",
    ],
    ("gut_microbiome", "immune_balance"): [
        "24913511_72_2512-2591",
        "24913511_74_584-826",
        "24913511_93_760-839",
        "24913511_116_1342-1425",
    ],
    ("ultra_processed", "gut_microbiome"): [
        "24913511_105_1078-1126",
        "24913511_105_1393-1417",
        "24913511_105_2906-3158",
        "24913511_105_3358-3402",
        "24913511_116_1342-1425",
    ],
    ("ultra_processed", "chronic_inflammation"): [
        "24913511_105_2906-3158",
        "24913511_105_3358-3402",
        "24913511_106_1798-1950",
        "24913511_116_1342-1425",
    ],
    ("gut_barrier_leak", "autoimmune"): [
        "24913511_79_2268-2452",
        "24913511_106_1798-1950",
        "24913511_106_3232-3274",
        "24913511_116_1342-1425",
    ],
    ("gut_barrier_leak", "immune_activation"): [
        "24913511_79_2268-2452",
        "24913511_80_607-674",
        "24913511_80_1635-1692",
        "24913511_106_1798-1950",
    ],
    ("gut_microbiome", "mitochondrial_stress"): [
        "24913511_82_427-590",
        "24913511_82_674-711",
        "24913511_82_956-1119",
        "24913511_82_3014-3052",
        "24913511_82_3093-3155",
    ],
    ("mitochondrial_stress", "chronic_inflammation"): [
        "24913511_82_427-590",
        "24913511_82_3014-3052",
        "24913511_82_3093-3155",
        "24913511_101_3292-3400",
        "24913511_116_1342-1425",
    ],
    ("chronic_inflammation", "mental_health"): [
        "24913511_86_354-365",
        "24913511_86_2021-2073",
        "24913511_86_1504-1553",
        "24913511_86_3038-3080",
        "24913511_106_551-619",
        "24913511_116_1342-1425",
    ],
    # 晓肚知肠
    ("gut_microbiome", "mental_health"): [
        "26793466_31_6055-6373",
        "26793466_32_442-640",
    ],
    ("legumes", "gut_microbiome"): [
        "26793466_39_641-675",
        "26793466_39_991-1138",
        "26793466_33_3195-3275",
        "26793466_40_1883-2028",
    ],
    ("refined_carbs", "gut_microbiome"): [
        "26793466_39_641-675",
        "26793466_39_991-1138",
        "26793466_37_3817-3936",
        "26793466_40_1883-2028",
    ],
    ("resistant_starch", "gut_microbiome"): [
        "26793466_39_641-675",
        "26793466_39_991-1138",
        "26793466_33_3195-3275",
        "26793466_40_1883-2028",
    ],
    ("chronic_inflammation", "ibd_related"): [
        "26793466_39_641-675",
        "26793466_51_5560-5629",
        "26793466_51_5690-5755",
        "26793466_45_10430-10546",
        "26793466_46_2267-2444",
    ],
    ("gut_barrier_leak", "ibd_related"): [
        "26793466_39_641-675",
        "26793466_51_5560-5629",
        "26793466_51_5690-5755",
        "26793466_45_10430-10546",
        "26793466_46_2267-2444",
    ],
    # 救命逆转
    ("insulin_resistance", "cardiometabolic"): [
        "3300017717_13_11852-12010",
        "3300017717_13_13762-13811",
        "3300017717_13_14649-14707",
        "3300017717_13_14986-15088",
        "3300017717_7_7915-8196",
    ],
    ("insulin_resistance", "fatty_liver"): [
        "3300017717_13_15822-16045",
        "3300017717_7_6769-7356",
    ],
    ("chronic_inflammation", "fatty_liver"): [
        "3300017717_13_15822-16045",
        "3300017717_7_6769-7356",
        "3300017717_7_6038-6129",
    ],
}

# Explicit skips: no honest supporting 原文 in the declared source_file
SKIPS: dict[tuple[str, str], str] = {
    ("fermented_foods", "gut_microbiome"): "晓肚知肠无发酵食物喂养菌群的连续原文；仅有益生菌玩笑段，跳过以免凑字/错段",
    ("tmao", "cardiometabolic"): "救命逆转无 TMAO/氧化三甲胺原文；禁止编造",
    ("gut_microbiome", "tryptophan_metabolites"): "菌群大脑无色氨酸代谢物原文；仅有血清素/炎症句，不足以支撑该边",
    ("chronic_inflammation", "crp"): "救命逆转无 C反应蛋白/CRP 原文；禁止编造",
}

# Delivery notes for synthetic note_id / short / thematic approximation
LOCATE_NOTES: dict[tuple[str, str], str] = {
    ("animal_foods", "cardiometabolic"): "原 note_id=related；按旧摘录子串命中 35903999_7UsVp5sbg，并扩同书相邻脂肪/蛋白/蔬食劝告段",
    ("plant_based_diet", "cardiometabolic"): "原 note_id=ns009_*；同 7UsVp5sbg 定位并扩同书相关段",
    ("refined_carbs", "cardiometabolic"): "原 note_id=ns009_*；同 7UsVp5sbg（含「高度精制的植物性食物」）并扩同书相关段",
    ("saturated_fat", "cardiometabolic"): "原 note_id=ns009_*；命中含「饱和脂肪」短记 + 7UsVp5sbg 等",
    ("soy", "cardiometabolic"): "按旧摘录子串命中大豆/冠心病句，并扩同书 SCFA/干细胞护心相关连续段",
    ("legumes", "gut_microbiome"): "合成 id；书中无「豆类」专名，取同书膳食纤维→菌群/SCFA/食欲调节连续段",
    ("refined_carbs", "gut_microbiome"): "合成 id；书中无精制主食专名，取同书纤维不足/高热量食物与菌群叙述",
    ("resistant_starch", "gut_microbiome"): "合成 id；书中无「抗性淀粉」专名，取同书纤维→SCFA/菌群连续段（抗性淀粉属可发酵底物同类）",
    ("butyrate", "gut_barrier_leak"): "合成 id；吃出自愈力无「丁酸」专名，取同书 SCFA 护肠 + 益生元 + GALT 连续段（丁酸为 SCFA 之一）",
    ("ultra_processed", "gut_microbiome"): "合成 id；取高果糖玉米糖浆加工形式→菌群/肝损伤 + 高糖低纤段",
    ("ultra_processed", "chronic_inflammation"): "合成 id；取加工果糖 + 肠漏/LPS + 高糖低纤炎症循环段",
    ("gut_barrier_leak", "autoimmune"): "合成 id；取肠漏/LPS + 麸质与 1 型糖尿病段",
    ("gut_barrier_leak", "immune_activation"): "合成 id；取肠漏检测 + LPS + 麸质敏感性段",
    ("plant_based_diet", "gut_microbiome"): "合成 id；取益生元 + 饮食重塑微生物组 + GALT 段",
    ("gut_microbiome", "mental_health"): "原 note_id=multiple；取压力/焦虑胃肠反应 + 菌-肠-脑轴连续段",
    ("insulin_resistance", "cardiometabolic"): "合成 id；取糖尿病/B细胞/心血管风险 + 生活方式四要素段",
    ("insulin_resistance", "fatty_liver"): "合成 id；书中无「脂肪肝」专名，取体脂储存毒物 + 饮食质量/腹部脂肪代谢段（短名例外风险见交付说明）",
    ("chronic_inflammation", "fatty_liver"): "合成 id；书中无「脂肪肝」专名，取体脂/代谢 + 饮食西化慢性病段",
    ("chronic_inflammation", "ibd_related"): "合成 id；节点标签为肠道炎症；取菌群失调→肠漏炎症 + 屏障破坏连续段",
    ("gut_barrier_leak", "ibd_related"): "合成 id；同上，屏障/肠漏→肠道炎症相关",
    ("mitochondrial_stress", "chronic_inflammation"): "合成 id；取线粒体章节伤害→炎症 + 菌群-线粒体 + 高糖低纤循环段",
    ("chronic_inflammation", "mental_health"): "合成 id；取「抑郁症是一种炎症性疾病」章 + 麸质/炎症/大脑 + 高糖低纤段",
    ("gut_microbiome", "immune_balance"): "原 note_id=related；子串命中后扩恶势力/菌群比例/高糖低纤段",
    ("lps", "chronic_inflammation"): "子串命中 LPS 段后扩肠漏与脂多糖章连续段",
    ("gut_barrier_leak", "lps"): "子串命中后扩肠漏与脂多糖章连续段",
    ("gut_microbiome", "mitochondrial_stress"): "子串命中后扩线粒体章节连续段",
}


def main() -> None:
    kb = load_kb()
    data = json.loads(SEED.read_text(encoding="utf-8"))
    assert data["meta"]["data_version"] == "1.0"
    assert len(data["links"]) == 121

    replaced = []
    skipped = []
    short_exceptions = []

    for idx, link in enumerate(data["links"]):
        key = (link["source"], link["target"])
        e0 = link["evidences"][0]
        excerpt = e0.get("excerpt") or ""
        sf = e0.get("source_file") or link.get("source_file") or ""
        if not ((link["source"] in P or link["target"] in P) and len(excerpt) < 200 and sf != "literature"):
            continue
        if key in SKIPS:
            skipped.append({"index": idx, "edge": f"{key[0]}->{key[1]}", "reason": SKIPS[key], "old_len": len(excerpt)})
            continue
        if key not in ANCHORS:
            skipped.append({"index": idx, "edge": f"{key[0]}->{key[1]}", "reason": "无锚定映射", "old_len": len(excerpt)})
            continue
        if sf not in kb:
            raise SystemExit(f"KB file missing for {key}: {sf}")
        old_len = len(excerpt)
        new_text, used_ids, kind = expand_ids(kb[sf], ANCHORS[key])
        if len(new_text) < 50:
            raise SystemExit(f"expansion too short for {key}")
        # Write evidences[0] + top-level mirrors
        e0["excerpt"] = new_text
        link["excerpt"] = new_text
        # Keep source_* mirrors (schema 0.7+: no limitations field)
        for fld in ("source_title", "source_file", "source_id", "note_id"):
            if fld in e0 and e0[fld] is not None:
                link[fld] = e0[fld]
        # Drop legacy limitations if present on older inputs
        e0.pop("limitations", None)
        link.pop("limitations", None)
        assert link["excerpt"] == link["evidences"][0]["excerpt"]
        rec = {
            "index": idx,
            "edge": f"{key[0]}->{key[1]}",
            "old_len": old_len,
            "new_len": len(new_text),
            "kind": kind,
            "source_file": sf,
            "note_id_seed": e0.get("note_id"),
            "note_ids_used": used_ids,
            "locate": LOCATE_NOTES.get(key, "weread note_id 直达或同书扩段"),
        }
        replaced.append(rec)
        if kind == "short":
            short_exceptions.append(rec)

    # bump data version
    note = data["meta"].get("note") or ""
    addon = " data 1.1 / NS-058：按 EXCERPT_EXPANSION 将优先主题短摘录替换为知识库原文（目标 400–800；evidences[0]+顶层镜像；schema 0.5 / sources 1.1 不动）。"
    if "NS-058" not in note:
        data["meta"]["note"] = note + addon
    data["meta"]["data_version"] = "1.1"

    SEED.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = {
        "replaced_count": len(replaced),
        "skipped_count": len(skipped),
        "short_exceptions": short_exceptions,
        "replaced": replaced,
        "skipped": skipped,
        "length_bins": {},
    }
    bins = {"<400": 0, "400-800": 0, "801-1200": 0, ">1200": 0}
    for r in replaced:
        n = r["new_len"]
        if n < 400:
            bins["<400"] += 1
        elif n <= 800:
            bins["400-800"] += 1
        elif n <= 1200:
            bins["801-1200"] += 1
        else:
            bins[">1200"] += 1
    report["length_bins"] = bins

    out = ROOT / "scripts" / "ns058_report.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"replaced": len(replaced), "skipped": len(skipped), "bins": bins, "shorts": len(short_exceptions)}, ensure_ascii=False))
    for s in skipped:
        print("SKIP", s["edge"], s["reason"])
    for r in replaced:
        flag = f" [{r['kind']}]" if r["kind"] != "ok" else ""
        print(f"OK {r['index']:3d} {r['old_len']:3d}->{r['new_len']:4d}{flag} {r['edge']}")


if __name__ == "__main__":
    main()
