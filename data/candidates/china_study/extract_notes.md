# ClearDiet · 救命饮食：中国健康调查报告 · 抽取说明

## 基本信息

- source_id：`china_study`（sources.json 已存在）
- 书名：救命饮食：中国健康调查报告（T. 柯林·坎贝尔、托马斯·M. 坎贝尔Ⅱ；中信出版社 2023-01；ISBN 978-7-5217-4950-2）
- 主题：health（仅健康/疾病）
- 语料：`_incoming/book/` EPUB 重新解包 → `plaintext/chNN.txt` + `FULLTEXT.md`（未复用 /workspace/epub-cleardiet 根目录的旧 FULLTEXT/plaintext）
- 对齐基线：nutri-sphere `origin/main` 5648a91（seed snapshot origin/main data 2.1 / schema 0.7；139 节点 / 325 边）
- 微信读书外链：https://weread.qq.com/book-detail?type=1&v=4d5324e0813ab7911g015706（仅外链，未用划线）

## 产出计数

- 候选边（唯一端点对）：**141**
- 证据贡献（evidences 总数 = 摘录条数）：**308**
- 其中 append（live seed 已有同端点）：**18**；新端点对：**123**
- 节点：新建 **20**，复用 **42**
- 每边证据数分布：{'1': 81, '2': 29, '3': 11, '4': 6, '5': 4, '6': 1, '7': 3, '8': 2, '11': 2, '13': 1, '14': 1}
- 摘录长度（字）：min 13 / median 220 / max 855
- 同一段落若同时支撑多个不同端点对，会在各自边下分别记为一条证据；同一对内不重复。
- 非相邻段落组成的一个论证单元以 ` …… ` 连接；每个片段均逐字取自 FULLTEXT（自检按片段校验）。
- live seed 中携带 china_study 证据的边：**0**

## relation 风格

- 公共观察句式（`与…相关` / `参与…` / `关联观察`）；动物实验标注「（动物研究）」；不含书名框架语、疗效/治愈/剂量措辞。摘录保留原文措辞（可能含“预防/逆转”等字样）。
- append 边：候选 relation 仅供参考；入库时沿用 live relation，只追加 evidences。

## 新建节点

- `cancer_overall`（disease，risk）癌症（总体）：泛指各部位癌症的总体发生与死亡；用于不限定部位的癌症论述。
- `chronic_disease`（disease，risk）慢性病 / 富贵病：心脏病、癌症、糖尿病等与西式富裕饮食相关的慢性疾病集合。
- `liver_cancer`（disease，risk）肝癌：原发性肝癌；含实验性肝癌病灶（动物研究）。
- `cognitive_decline`（disease，risk）认知障碍 / 阿尔茨海默病：记忆力与认知功能衰退、血管性痴呆及阿尔茨海默病。
- `kidney_stones`（disease，risk）肾结石：肾脏内钙盐、草酸盐等结晶沉积形成的结石。
- `type1_diabetes`（disease，risk）1型糖尿病：自身免疫介导的胰岛β细胞破坏所致糖尿病，多见于儿童。
- `osteoporosis`（disease，risk）骨质疏松 / 髋骨骨折：骨量减少、骨折风险升高，以髋骨骨折为常见结局。
- `cataract`（disease，risk）白内障：晶状体混浊导致的视力下降。
- `aflatoxin`（compound，risk）黄曲霉毒素：霉变花生、玉米等中的真菌毒素，强致肝癌物。
- `nutrient_supplements`（compound，mixed）营养补充剂（离析营养素）：以片剂等形式单独补充的维生素、矿物质、番茄红素等离析营养素。
- `plant_protein`（nutrient，protective）植物蛋白：小麦、大豆等植物来源蛋白质。
- `dietary_fat`（nutrient，mixed）膳食脂肪（总脂肪）：饮食中总脂肪摄入量，常与动物性食物摄入共变。
- `vitamin_d`（nutrient，protective）维生素D / 活性维生素D：含日照合成的维生素D及其活性形式1,25D。
- `blood_cholesterol`（biomarker，risk）血胆固醇：血液总胆固醇（含LDL）水平。
- `estrogen_level`（biomarker，risk）血液雌激素水平：血液中雌激素等女性生殖激素水平。
- `iron_status`（biomarker，neutral）铁营养状况：血红蛋白、铁储备等铁营养相关指标。
- `genetic_predisposition`（mechanism，neutral）遗传易感性 / 基因表达：遗传基因与其受营养等环境因素调控的表达。
- `hbv_infection`（mechanism，risk）乙肝病毒慢性感染：慢性乙型肝炎病毒感染，肝癌风险因素。
- `hormone_replacement_therapy`（mechanism，risk）激素替代疗法：绝经期使用外源雌激素/孕激素的激素替代疗法。
- `low_carb_diet`（diet_pattern，risk）低碳水高蛋白饮食 / 阿特金斯饮食：以高动物蛋白、高脂、低碳水为特征的减重饮食。

## 复用节点

`aerobic_exercise`、`age_related_macular_degeneration`、`animal_foods`、`antioxidant_defense`、`atherosclerosis`、`autoimmune`、`breast_prostate_risk`、`carotenoids`、`casein`、`coronary_heart_disease`、`dairy`、`dietary_cholesterol`、`dietary_fiber`、`dietary_nitrates`、`digestive_cancer_risk`、`dna_damage`、`energy_vitality`、`environmental_pollutants`、`healthy_weight`、`hematologic_cancer`、`hypertension`、`iatrogenic_harm`、`igf1_signaling`、`insulin_resistance`、`medical_care_exposure`、`metabolic_health`、`obesity_risk`、`omega3`、`plant_based_diet`、`processed_meat`、`reactive_oxygen`、`red_meat`、`refined_carbs`、`saturated_fat`、`stroke`、`tomato`、`type2_diabetes`、`ultra_processed`、`vegetables_greens`、`vitamin_c`、`vitamin_e`、`whole_grains`

## 与 live seed 同端点（append）

| source → target | 证据数 | live relation |
|---|---|---|
| `ultra_processed` → `obesity_risk` | 1 | 超加工食品与多种健康结局的叙述性综述 |
| `animal_foods` → `breast_prostate_risk` | 7 | 较高胆碱摄入与致命性前列腺癌风险相关 |
| `plant_based_diet` → `type2_diabetes` | 8 | 不同饮食结构与糖尿病患病率差异相关 |
| `animal_foods` → `coronary_heart_disease` | 5 | 动物性产品与加工食品来源的血脂相关因素与冠心病风险相关 |
| `dairy` → `breast_prostate_risk` | 2 | 乳制品中天然激素与生长因子与激素敏感性肿瘤风险相关 |
| `plant_based_diet` → `coronary_heart_disease` | 11 | 以蔬食为主的饮食结构与心绞痛发作减少相关的观察 |
| `medical_care_exposure` → `iatrogenic_harm` | 2 | 药物不良反应与医疗失误相关死亡负担观察 |
| `dietary_fiber` → `digestive_cancer_risk` | 4 | 不可溶性膳食纤维促进排便并吸附有害物质，与大肠癌预防相关 |
| `plant_based_diet` → `obesity_risk` | 7 | 较高全植物饮食质量指数与较低腹部肥胖、高血压及血脂异常风险相关 |
| `plant_based_diet` → `breast_prostate_risk` | 3 | 节制饮酒、植物性食物为主与维持健康体重等与较低乳腺癌风险相关 |
| `dietary_cholesterol` → `atherosclerosis` | 1 | 较低LDL水平与动脉粥样硬化进程停滞相关的降脂试验观察 |
| `animal_foods` → `type2_diabetes` | 4 | 动物性食品中持久性污染物暴露与糖尿病发病率相关 |
| `animal_foods` → `digestive_cancer_risk` | 2 | 禽肉摄入与胰腺癌风险相关的观察研究归纳 |
| `plant_based_diet` → `digestive_cancer_risk` | 2 | 较高植物性蛋白占比与较低膀胱癌风险相关 |
| `aerobic_exercise` → `digestive_cancer_risk` | 1 | 积极有氧运动与较低癌症、高血压、糖尿病风险的观察相关 |
| `plant_based_diet` → `autoimmune` | 1 | 高蔬菜低蛋白饮食与多发性硬化复发率及抗炎菌群变化相关 |
| `plant_based_diet` → `hypertension` | 1 | 得舒等富含蔬果低钠饮食模式与血压管理相关 |
| `tomato` → `breast_prostate_risk` | 1 | 番茄/番茄酱摄入与前列腺癌风险及侵袭性相关 |

## 章节覆盖

| spine | 章节 | 摘录数 |
|---|---|---|
| 0 | (无标题) | skip：标题页（无正文） |
| 1 | 封面 | skip：封面 |
| 2 | 版权页 | skip：版权页 |
| 3 | 赞誉 | skip：赞誉（推荐语汇编，非论证） |
| 4 | 献给凯伦·坎贝尔，她的深爱与关怀让这本书成为可能。 | skip：献词 |
| 5 | 推荐序 勇于挑战 | 1 |
| 6 | 序言（第1版） | skip：序言（第1版）：作者生平/成书经历，无饮食-疾病论断 |
| 7 | 前言（第1版） | 1 |
| 8 | 作者序（第2版中文版） | 4 |
| 9 | 引言 | 17 |
| 10 | 第1章 什么问题？如何解答？ | 8 |
| 11 | 第2章 蛋白质王朝 | 5 |
| 12 | 第3章 癌症不要来 | 26 |
| 13 | 第4章 到中国取经 | 50 |
| 14 | 第5章 破碎的心脏 | 26 |
| 15 | 第6章 吸金黑洞：肥胖症 | 11 |
| 16 | 第7章 老少通吃：糖尿病 | 18 |
| 17 | 第8章 常见的癌症：乳腺癌、前列腺癌、大肠癌（结肠癌和直肠癌） | 36 |
| 18 | 第9章 自身免疫病 | 23 |
| 19 | 第10章 植物性饮食可预防多种疾病 | 35 |
| 20 | 第11章 正确饮食：食品与健康的八大原则 | 14 |
| 21 | 第12章 如何吃才健康 | 7 |
| 22 | 第13章 科学的黑暗面 | skip：第13章 科学的黑暗面：学术/机构政治叙事，无直接饮食-健康论断 |
| 23 | 第14章 科学简化主义的死胡同 | 3 |
| 24 | 第15章 嗜钱如命的产业“科学” | 2 |
| 25 | 第16章 爱民或害民的政府 | 1 |
| 26 | 第17章 医疗帝国暗黑心 | 1 |
| 27 | 第18章 失去自由的学术界 | skip：第18章 失去自由的学术界：学术体制叙事 |
| 28 | 第19章 历史重演 | 7 |
| 29 | 后记（第2版） | skip：后记（第2版）：轶事与术语界定，无新增论断 |
| 30 | 附录A 大鼠实验中的蛋白质作用（问答） | 4 |
| 31 | 附录B 中国健康调查的实验设计 | skip：附录B 中国健康调查的实验设计：方法学描述 |
| 32 | 附录C 维生素D的作用网络 | 8 |
| 33 | 致谢（第2版） | skip：致谢 |
| 34 | 注释 | skip：注释（参考文献列表） |

## Skips（理由）

- spine 0：标题页（无正文）
- spine 1：封面
- spine 2：版权页
- spine 3：赞誉（推荐语汇编，非论证）
- spine 4：献词
- spine 6：序言（第1版）：作者生平/成书经历，无饮食-疾病论断
- spine 22：第13章 科学的黑暗面：学术/机构政治叙事，无直接饮食-健康论断
- spine 27：第18章 失去自由的学术界：学术体制叙事
- spine 29：后记（第2版）：轶事与术语界定，无新增论断
- spine 31：附录B 中国健康调查的实验设计：方法学描述
- spine 33：致谢
- spine 34：注释（参考文献列表）
- 段落级排除：ch20 第55段（维生素B12 补充剂与剂量建议，属个体化用法，按教育边界排除）；各章食谱/购物/行动清单类建议句不作为证据。

## 可靠性自检

- JSON 可解析：True
- 端点 ∈ reuse ∪ new：True
- 全部证据逐字存在于 FULLTEXT：308/308
- 抽查 5 条（substring）：cs_c13_p122_chronic_disease:✓, cs_c11_p61_liver_cancer:✓, cs_c15_p58_obesity_risk:✓, cs_c17_p132_breast_prostate_risk:✓, cs_c09_p20_type2_diabetes:✓
- (source,target) 唯一：True
- 书名框架 relation 命中（书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述）：0
- 疗效/剂量措辞命中（治疗|治愈|逆转|疗效|预防|剂量|毫克|每天|每日|建议|应当|应该）：0
- limitations 键：False
- excerpt_id 唯一：True
- 顶层 excerpt = evidences[0]：True
- meta 计数与文件一致：True
- nutri-sphere 工作区 git status：(clean)
- 章节覆盖：每个章节有摘录或 skip 理由：✓

## 入库说明

- 本批仅为候选；未改 seed、data_version、sources，未开 PR。
- 入库须另开 TASK，并经 Brent 合并闸门；入库时同端点 append evidences，不得生成平行边。
