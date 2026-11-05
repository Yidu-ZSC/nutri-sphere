#!/usr/bin/env python3
"""TASK-NS-068: rewrite book-framed relations into public shared relationships."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "data" / "seed_triples_v0.3_aligned.json"

BOOK_PAT = re.compile(r"书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述")
SOFT_PAT = re.compile(r"人体研究叙述|研究叙述|试验叙述|队列叙述|观察叙述")

# Public observational relations keyed by link id.
REWRITES: dict[str, str] = {
    # --- gut_brain (53) ---
    "gut_brain_01_axis": "肠道菌群经迷走神经等通路与大脑双向交流",
    "gut_brain_01_axis_mental": "肠—脑轴双向调控与情绪状态相关",
    "gut_brain_02_micro_bdnf": "肠道菌群状态与 BDNF 等大脑化学物质水平相关",
    "gut_brain_02_bdnf_cog": "较高 BDNF 水平与较低痴呆风险相关",
    "gut_brain_02_barrier_bbb": "肠道通透性增加可伴随血脑屏障通透性改变",
    "gut_brain_06_gluten_bbb": "醇溶蛋白暴露与肠道及血脑屏障通透性增加相关",
    "gut_brain_02_lps_neuroinf": "LPS 相关炎症信号参与神经炎症过程",
    "gut_brain_02_neuroinf_cog": "脑内炎症因子水平与认知损伤程度相关",
    "gut_brain_02_sys_neuroinf": "全身炎症与脑内炎症过程常共同出现",
    "gut_brain_06_gluten_micro": "麸质接触后的不良反应可始自微生物组变化",
    "gut_brain_06_gluten_barrier": "醇溶蛋白暴露与肠道通透性增加相关",
    "gut_brain_06_gluten_inflam": "麸质敏感性与炎症细胞因子产生增加相关",
    "gut_brain_06_gluten_autoimm": "膳食麸质、菌群改变与自身免疫问题相关",
    "gut_brain_06_fructose_micro": "过量加工果糖可改变菌群并供给致病菌",
    "gut_brain_06_fructose_barrier": "高果糖负荷与细菌渗漏率升高相关",
    "gut_brain_03_fructose_lps": "果糖摄入与循环脂多糖水平升高相关",
    "gut_brain_06_fructose_ir": "大量非天然果糖与胰岛素抵抗、糖耐量受损相关",
    "gut_brain_06_fructose_liver": "高果糖负担与肝损伤、代谢紊乱相关",
    "gut_brain_04_fructose_obesity": "加工果糖所致菌群变化与肥胖风险相关",
    "gut_brain_06_sweetener_micro": "人工甜味剂可改变肠道细菌组成",
    "gut_brain_06_sweetener_glucose": "人工甜味剂对糖代谢的影响可经菌群中介",
    "gut_brain_07_abx_micro": "抗生素迅速改变菌群多样性并偏向促肥胖菌群",
    "gut_brain_07_abx_obesity": "抗生素暴露与体重增加、胃饥饿素升高等相关",
    "gut_brain_07_abx_breast": "抗生素使用天数与乳腺癌风险相关（观察关联，非因果）",
    "gut_brain_01_csection_micro": "剖腹产婴儿初始菌群更接近皮肤菌群而非阴道乳酸杆菌主导",
    "gut_brain_01_csection_obesity": "剖腹产与成年肥胖风险升高相关（观察）",
    "gut_brain_01_csection_asd": "剖腹产与自闭症谱系风险升高相关（观察）",
    "gut_brain_04_breast_micro": "母乳喂养与较高菌群多样性及部分疾病风险较低相关",
    "gut_brain_05_ppa_barrier": "丙酸削弱紧密连接、增加肠道通透性",
    "gut_brain_05_ppa_mito": "丙酸可导致线粒体功能受损并增加氧化应激",
    "gut_brain_05_ppa_asd": "丙酸与自闭症样行为及脑内炎症相关（动物观察）",
    "gut_brain_05_ppa_ros": "丙酸增加氧化应激并消耗抗氧化分子",
    "gut_brain_05_micro_asd": "肠功能障碍、梭菌/丙酸与线粒体路径与自闭症谱系讨论相关",
    "gut_brain_08_pro_barrier": "益生菌有助于维持肠壁完整性",
    "gut_brain_08_pro_immune": "益生菌参与调节免疫功能并控制炎症",
    "gut_brain_08_ferment_pro": "泡菜、酸奶、开菲尔等发酵食物是益生菌天然来源",
    "gut_brain_02_omega6_inflam": "过高 ω-6/ω-3 比例与促炎及脑心风险相关",
    "gut_brain_04_ppa_scfa": "丙酸是短链脂肪酸谱中偏不利的组分",
    "gut_brain_08_wine_poly": "红酒与茶叶、咖啡、巧克力同属多酚来源",
    "gut_brain_02_barrier_immune": "屏障受损后外来蛋白与微生物组分更易触发免疫",
    "gut_brain_04_micro_obesity": "厚壁菌/拟杆菌比值与肥胖生物标志及菌群移植观察相关",
    "gut_brain_01_micro_immune": "有益菌帮助免疫保持警戒而不进入持续防御",
    "gut_brain_02_lps_barrier": "紧密连接受损时脂多糖可进入血液循环",
    "gut_brain_02_lps_immune": "LPS 入血后可激活免疫并抬高炎症化学物质",
    "gut_brain_02_lps_inflam": "入血 LPS 可触发强烈炎症反应",
    "gut_brain_04_ultra_micro": "西化低纤维高糖高脂饮食与菌群重塑相关",
    "gut_brain_03_lps_mental": "促炎细胞因子与脂多糖可能与抑郁相关症状相关",
    "gut_brain_02_poly_micro": "人体利用多酚的能力很大程度上取决于肠道细菌",
    "gut_brain_02_ros_mito": "线粒体产生活性氧；功能受损时可损伤正常细胞",
    "gut_brain_08_sugar_micro": "高糖低纤维膳食为有害菌提供燃料并削弱多样性",
    "gut_brain_02_ir_cog": "血糖失调、糖尿病与阿尔茨海默病（所谓3型糖尿病）相关讨论",
    "gut_brain_02_micro_barrier": "平衡的肠道菌群参与维持肠壁完整性、限制肠漏",
    "gut_brain_02_micro_inflam": "菌群平衡与多样性可调节全身及脑内炎症阈值",
    # --- eat_to_heal (97) ---
    "eat_to_heal_00_defenses_active": "健康依赖体内多套防御系统的活跃平衡，可按共同特征统一理解",
    "eat_to_heal_00_five_list": "饮食可影响血管生成、再生、微生物组、DNA保护与免疫五大防御",
    "eat_to_heal_00_angio_teaser": "大豆、绿茶、咖啡、番茄、红酒等与血管生成防御相关",
    "eat_to_heal_00_regen_teaser": "黑巧克力、红茶等与动员成体干细胞相关",
    "eat_to_heal_00_dna_teaser": "饮食与DNA修复、表观遗传开关及端粒维护相关",
    "eat_to_heal_00_immune_teaser": "浆果、核桃、石榴等与免疫激活相关",
    "eat_to_heal_01_micro_tumors": "细胞分裂与环境暴露所致DNA错误与微小潜伏肿瘤相关",
    "eat_to_heal_01_starve_micro": "血管生成防御可通过限制血供使微小肿瘤保持较小体积",
    "eat_to_heal_01_angio_def": "正常血管生成供养器官，异常时可滋养微小肿瘤；健康系统可阻断肿瘤血供",
    "eat_to_heal_01_balance": "循环系统中血管生成的适量平衡（体内平衡）与代谢健康相关",
    "eat_to_heal_01_hypoxia": "缺氧驱动生长因子释放，炎症细胞参与早期愈合并增强血管生成反应",
    "eat_to_heal_01_endothelium": "内皮细胞响应生长因子迁移、成管并形成毛细血管环",
    "eat_to_heal_01_tumor_hijack": "部分癌巢可释放伤口愈合样生长因子突破抗血管生成控制并获血供扩增",
    "eat_to_heal_01_amd": "黄斑变性与糖尿病相关视力丧失中异常血管渗漏出血破坏视力",
    "eat_to_heal_01_alz": "阿尔茨海默病患者脑内异常血管可释放神经毒素",
    "eat_to_heal_01_obesity": "脂肪组织扩张依赖新生血管；错误饮食可增加循环中促血管生成生长因子",
    "eat_to_heal_01_neuropathy": "神经滋养血管受损及糖尿病相关血管生成减缓与周围神经病症状相关",
    "eat_to_heal_01_wounds": "慢性伤口愈合依赖启动血管生成；与糖尿病、动脉粥样硬化等相关",
    "eat_to_heal_01_collateral": "冠脉或颈动脉缓慢狭窄时可形成侧副血管旁路以维持器官灌注",
    "eat_to_heal_01_asia_med": "亚洲高大豆蔬菜茶饮食及地中海饮食与较低癌症风险、长寿观察相关",
    "eat_to_heal_02_stem_intro": "成体干细胞对器官维持至关重要",
    "eat_to_heal_02_fraction": "干细胞作为可再生防御力量，受饮食显著影响",
    "eat_to_heal_02_mobilization": "受损器官释放VEGF等信号动员骨髓干细胞进入循环",
    "eat_to_heal_02_link_angio": "再生与血管生成通过共同生长因子信号相互协同",
    "eat_to_heal_02_smoke": "吸烟耗竭骨髓干细胞并损害其自我复制与再生能力",
    "eat_to_heal_02_alcohol": "酒精损害干细胞再生能力并影响脑内祖细胞活性",
    "eat_to_heal_02_diabetes": "高血糖削弱干细胞繁殖、迁移与分泌存活因子的能力",
    "eat_to_heal_02_epc_nejm": "循环内皮祖细胞基线与未来心血管事件及死亡风险相关",
    "eat_to_heal_02_scf_malmo": "较高干细胞因子水平与较低心衰、中风与全因死亡风险相关",
    "eat_to_heal_02_epc_repair": "内皮祖细胞修复血管内壁与较低动脉粥样硬化相关风险相关",
    "eat_to_heal_02_brain": "脑内祖细胞与小胶质细胞路径与阿尔茨海默病相关讨论相关",
    "eat_to_heal_02_food_regen": "饮食可激活自身干细胞促进再生，同时部分食物可抑制肿瘤干细胞",
    "eat_to_heal_03_diversity": "菌群多样性是健康标志",
    "eat_to_heal_03_scfa": "益生元纤维经菌群发酵产生短链脂肪酸，参与抗炎、代谢与免疫相关过程",
    "eat_to_heal_03_scfa_roles": "丙酸、丁酸、醋酸盐参与代谢、结肠能量、抗炎与食欲信号",
    "eat_to_heal_03_h2s": "产硫化氢细菌可破坏肠壁密封并与炎症性肠病相关",
    "eat_to_heal_03_reuteri": "罗伊氏乳杆菌与伤口愈合加速及血管生成加快相关",
    "eat_to_heal_03_dysbiosis": "生态失调与代谢、IBD、癌症、神经精神等多类疾病相关",
    "eat_to_heal_04_damage": "复制错误与自由基、辐射、化学物等造成每日大量DNA损伤",
    "eat_to_heal_04_three": "DNA防御三路径：修复加速、表观遗传开关与端粒保护",
    "eat_to_heal_04_oj": "橙汁摄入与短期内DNA损伤指标下降相关（小规模人体观察）",
    "eat_to_heal_04_epi_disease": "表观遗传变化与神经精神、代谢与肿瘤等多类疾病相关",
    "eat_to_heal_05_cancer_immune": "免疫系统可清除癌细胞甚至已扩散病灶",
    "eat_to_heal_06_soy_genistein": "大豆异黄酮染料木黄酮与抑制肿瘤血管生成相关",
    "eat_to_heal_06_angioprevention": "干扰异常血管生成与癌症预防相关，饮食是重要关联因素",
    "eat_to_heal_06_balance_food": "膳食因子倾向于将血管生成拉回基线平衡而非彻底关闭",
    "eat_to_heal_06_plaque_vessels": "冠状动脉斑块内微血管可促进斑块增厚并使其更易破裂",
    "eat_to_heal_06_soy_isoflavones": "大豆异黄酮具抗血管生成活性；发酵豆制品中浓度更高",
    "eat_to_heal_06_soy_breast_surv": "较高大豆摄入与乳腺癌幸存者较低复发与死亡风险相关",
    "eat_to_heal_06_tomato_lycopene": "番茄红素抑制血管生成；烹饪与橄榄油可提高可吸收性",
    "eat_to_heal_06_tomato_prostate": "番茄/番茄酱摄入与前列腺癌风险及侵袭性相关",
    "eat_to_heal_06_broccoli": "西蓝花中芸薹宁、萝卜硫素等与抗血管生成及多种癌症风险相关",
    "eat_to_heal_06_berries": "浆果花青素与鞣花酸具抗血管生成活性，浆果摄入与肺癌风险相关",
    "eat_to_heal_06_seafood_cancer": "海鲜/鱼摄入与乳腺癌、结肠癌风险降低相关",
    "eat_to_heal_06_fish_amd": "富脂鱼类摄入与年龄相关性黄斑变性风险降低相关",
    "eat_to_heal_07_cocoa_epc": "高黄烷醇可可饮料与循环干细胞增加及血流介导扩张改善相关",
    "eat_to_heal_07_resveratrol_wine": "适量红葡萄酒与循环内皮祖细胞升高及其迁移成血管能力增强相关",
    "eat_to_heal_07_med_diet_stem": "含特级初榨橄榄油的地中海饮食与老年人干细胞/血流反应相关",
    "eat_to_heal_07_sugar_stem": "升高血糖的食物饮料与阻碍干细胞生成相关",
    "eat_to_heal_07_green_tea_csc": "绿茶EGCG与结肠癌干细胞数量减少及诱导凋亡相关（实验室观察）",
    "eat_to_heal_07_turmeric_regen": "姜黄素具抗炎抗氧化抗血管生成及促进再生特性",
    "eat_to_heal_08_akkermansia": "阿克曼氏菌虽占比不高却与免疫、代谢及黏膜健康密切相关",
    "eat_to_heal_08_akker_immuno": "阿克曼氏菌与癌症患者免疫疗法反应相关",
    "eat_to_heal_08_pomegranate_akker": "石榴汁鞣花单宁代谢产物可改善阿克曼氏菌生长环境",
    "eat_to_heal_08_less_meat": "减少动物蛋白摄入与有利于微生物组相关",
    "eat_to_heal_08_beans_barrier": "豆类与减少有害菌并支持黏液与屏障功能相关",
    "eat_to_heal_08_mushrooms": "白蘑菇与增加保护性肠道菌（含阿克曼氏菌相关类群）相关",
    "eat_to_heal_08_cranberry": "蔓越莓原花青素增厚黏液层以利于阿克曼氏菌",
    "eat_to_heal_08_wine_micro": "葡萄酒多酚抵达结肠滋养细菌并与炎症相关指标改善相关",
    "eat_to_heal_08_tea_micro": "绿/乌龙/红茶多酚抵达结肠并影响肠道细菌",
    "eat_to_heal_09_broccoli_smoke": "西兰花摄入与吸烟相关DNA损伤的防护相关",
    "eat_to_heal_09_omega3_repair": "海洋来源ω-3与DNA保护及修复改善相关",
    "eat_to_heal_09_soy_epi": "大豆异黄酮与肿瘤抑制基因再激活相关",
    "eat_to_heal_09_cruciferous_epi": "十字花科萝卜硫素可诱导有益表观遗传变化",
    "eat_to_heal_09_turmeric_epi": "姜黄素具表观遗传效应并影响血管相关蛋白表达",
    "eat_to_heal_09_coffee_telomere": "人群中喝咖啡与更长端粒相关（观察；实验室咖啡因结果另见）",
    "eat_to_heal_09_tea_telomere": "老年人喝茶与较长端粒相关",
    "eat_to_heal_09_nuts_telomere": "坚果摄入与死亡率及端粒长度相关",
    "eat_to_heal_09_med_telomere": "地中海饮食模式与女性端粒长度相关",
    "eat_to_heal_09_processed_meat_telo": "加工肉类摄入与较短端粒相关",
    "eat_to_heal_09_soda_telo": "含糖饮料摄入与端粒缩短、加速衰老相关",
    "eat_to_heal_10_immune_down": "免疫功能下降可为感染与癌症创造条件",
    "eat_to_heal_10_autoimmune": "自身免疫病中免疫系统错误攻击自身器官",
    "eat_to_heal_10_mushroom_immune": "白蘑菇β-葡聚糖与唾液IgA等免疫指标相关",
    "eat_to_heal_10_garlic": "陈年大蒜提取物与冷流感季节免疫细胞功能及症状天数相关",
    "eat_to_heal_10_broccoli_sprout": "西蓝花苗萝卜硫素含量显著高于成熟西蓝花，并与流感疫苗反应相关",
    "eat_to_heal_10_blueberry": "蓝莓与代谢综合征人群及运动后天然杀伤细胞等指标相关",
    "eat_to_heal_10_green_tea_auto": "EGCG可减少促炎T细胞、增加调节性T细胞，与多发性硬化动物模型相关",
    "eat_to_heal_10_green_tea_lupus": "绿茶干预与狼疮患者疾病活动相关",
    "eat_to_heal_10_plant_ms": "高蔬菜低蛋白饮食与多发性硬化复发率及抗炎菌群变化相关",
    "eat_to_heal_13_cheese": "适量奶酪摄入与心脏病风险相关；同时需注意饱和脂肪与盐",
    "eat_to_heal_13_dark_chocolate": "黑巧克力因可可固体较高而与多项健康益处相关",
    "eat_to_heal_13_chili": "每日辛辣食物与较低死亡风险相关（大规模观察）",
    "eat_to_heal_13_nuts_cancer": "树坚果摄入与癌症相关结局改善相关",
    "eat_to_heal_99_methods": "证据层级优先人类数据；动物与细胞研究用于机制理解且不可直接外推",
    "eat_to_heal_99_not_absolute": "食物影响因人而异；聚焦其对健康防御的有益关联而非绝对好坏",
    "eat_to_heal_b_stress": "长期压力可改变菌群、破坏血管生成与干细胞功能并降低免疫",
}

NOTE_APPEND = (
    " data 1.8 · NS-068：将 eat_to_heal/gut_brain 书框 relation 批量改写为公共观察关系；"
    "excerpt/evidences/source_*/拓扑不动；schema 仍 0.7。"
)


def link_key(link: dict) -> str:
    return link.get("id") or link.get("note_id") or f"{link['source']}->{link['target']}"


def main() -> None:
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    assert seed["meta"]["schema_version"] == "0.7"
    assert seed["meta"]["data_version"] == "1.7"
    assert len(seed["nodes"]) == 115
    assert len(seed["links"]) == 160

    before_after: list[tuple[str, str, str]] = []
    rewritten = 0
    missing: list[str] = []

    for link in seed["links"]:
        old = link.get("relation", "")
        key = link_key(link)
        if key in REWRITES:
            new = REWRITES[key]
            if new != old:
                before_after.append((key, old, new))
                link["relation"] = new
                rewritten += 1
            continue
        if BOOK_PAT.search(old) or SOFT_PAT.search(old):
            missing.append(f"{key}: {old}")

    if missing:
        raise SystemExit("Unmapped book-framed relations:\n" + "\n".join(missing))

    # Same-endpoint convergence for clear duplicates (keep edges; align wording when same claim).
    # soy→angiogenesis: keep distinct (general foods vs genistein)
    # cacao→regen: keep distinct (teaser vs cocoa EPC trial)
    # berries→immune: keep distinct
    # angio→micro_tumors: starve vs define — keep distinct
    # green_tea→autoimmune: keep distinct (EGCG mechanism vs lupus RCT)

    seed["meta"]["data_version"] = "1.8"
    note = seed["meta"].get("note", "")
    if "NS-068" not in note:
        seed["meta"]["note"] = note.rstrip() + NOTE_APPEND

    # Acceptance checks
    for link in seed["links"]:
        rel = link.get("relation", "")
        if BOOK_PAT.search(rel):
            raise SystemExit(f"Book pattern remains on {link_key(link)}: {rel}")
        if "limitations" in link:
            raise SystemExit(f"limitations on link {link_key(link)}")
        for ev in link.get("evidences") or []:
            if "limitations" in ev:
                raise SystemExit(f"limitations on evidence of {link_key(link)}")

    assert len(seed["nodes"]) == 115
    assert len(seed["links"]) == 160
    eat = [l for l in seed["links"] if l.get("source_id") == "eat_to_heal"]
    gut = [l for l in seed["links"] if l.get("source_id") == "gut_brain"]
    lit = [l for l in seed["links"] if not l.get("source_id")]
    assert len(eat) == 97, len(eat)
    assert len(gut) == 55, len(gut)
    assert len(lit) == 8, len(lit)

    SEED.write_text(json.dumps(seed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    report = ROOT / "scripts" / "ns068_report.json"
    report.write_text(
        json.dumps(
            {
                "rewritten": rewritten,
                "mapped": len(REWRITES),
                "samples": [
                    {"id": k, "before": b, "after": a}
                    for k, b, a in before_after[:12]
                ],
                "counts": {
                    "nodes": 115,
                    "links": 160,
                    "eat_to_heal": 97,
                    "gut_brain": 55,
                    "lit": 8,
                },
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"rewritten={rewritten} mapped={len(REWRITES)}")
    print(f"wrote {SEED}")
    for k, b, a in before_after[:8]:
        print(f"- {k}\n  OLD: {b}\n  NEW: {a}")


if __name__ == "__main__":
    main()
