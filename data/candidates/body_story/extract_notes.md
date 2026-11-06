# ClearDiet · 人体的故事 · 抽取说明

## 基本信息

- source_id：`body_story`（admin_books 已有，status=index_only；sources.json **尚无**；现网 citing 边 **0**）
- 书名：人体的故事：进化、健康与疾病（丹尼尔·利伯曼；译者 蔡晓峰；浙江人民出版社；ISBN 9787213080159；2017-06）
- 主题：health（仅健康/疾病；饮食/能量/食物环境/营养 ↔ 健康与失配性疾病）
- 语料：附件 EPUB → `source.epub` 解包 → `plaintext/` + `FULLTEXT.md`
- 对齐基线：nutri-sphere seed `data 2.5` / schema `0.7`（192 节点 / 927 边；本书现网边=0）
- kb 计划文件名：`营养基础_人体的故事.md`
- 微信读书外链（仅元数据，未用划线）：https://weread.qq.com/web/reader/15632be07169801d156a3c3
- bookId：`23691293`；deepLink：https://weread.qq.com/book-detail?type=1&v=15632be07169801d156a3c3

## 产出计数

- 候选边（唯一端点对）：**231**
- 证据贡献（evidences 总数）：**509**
- 摘录条数（原文摘录.md）：**164**
- 其中 append（live seed 已有同端点）：**89**；新端点对：**142**
- 节点：新建 **8**，复用 **66**
- 每边证据数分布：{1: 128, 2: 51, 3: 18, 4: 11, 5: 9, 6: 1, 7: 2, 8: 1, 9: 2, 10: 2, 11: 4, 12: 1, 14: 1}
- live seed 中携带 `body_story` 证据的边：**0**

## relation 风格

- 公共观察句式（`与…相关` / `参与…` / `关联观察`）；不含书名框架语、疗效/治愈/剂量措辞。摘录保留原文措辞。
- append 边：relation 写入 live 既有 relation；入库时沿用 live，只追加 evidences。
- 自检：relation 字段对 `书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述` 零匹配；无 `limitations` 键；无 `治愈|疗效|治疗方案|替代医生`。

## 新建节点

- `agricultural_diet`（diet_pattern，mixed）农业主食饮食 / 农耕饮食：以少数高产谷物、块根等淀粉主食为主、多样性较低的农耕膳食模式；叙述中与营养缺乏、龋齿、饥荒风险及身材变化相关。
- `energy_surplus`（mechanism，risk）能量过剩 / 能量正平衡：长期摄入能量持续高于消耗的正能量平衡状态；叙述中与内脏脂肪、肥胖及相关代谢疾病相关。
- `hunter_gatherer_diet`（diet_pattern，protective）狩猎采集饮食：多样化的野生植物、块茎、坚果、种子与瘦肉等采集狩猎膳食；叙述中纤维较高、简单糖较低，相关代谢病较少见。
- `metabolic_syndrome`（disease，risk）代谢综合征：高血压、高甘油三酯、高血糖、低HDL及腹型肥胖等聚集的代谢紊乱；叙述中与内脏脂肪及多种慢病风险相关。
- `mismatch_disease`（disease，risk）失配性疾病：因旧石器时代遗传与身体对现代饮食、活动与环境刺激适应不足或不良而产生或加剧的疾病类别；叙述中涵盖代谢、骨骼、口腔及部分感染相关问题。
- `physical_inactivity`（mechanism，risk）体力活动不足 / 久坐少动：日常体力活动显著低于进化期负荷的久坐或低活动状态；叙述中与肥胖、代谢病、骨质疏松及心血管风险相关。
- `stature_growth`（biomarker，mixed）身高生长 / 身材发育：儿童青少年期线性生长与成年身高实现程度；叙述中受营养、感染与劳动能量分配影响，用作人群健康综合指标。
- `visceral_adiposity`（disease，risk）内脏脂肪堆积：腹部器官周围内脏脂肪过多；叙述中与代谢综合征、胰岛素抵抗、脂肪肝及心血管风险密切相关。

## 复用节点

`added_sugar`、`aerobic_exercise`、`aflatoxin`、`alcohol`、`animal_foods`、`appetite_regulation`、`atherosclerosis`、`berries_fruits`、`blood_cholesterol`、`breast_prostate_risk`、`calcium`、`cancer_overall`、`cardiometabolic`、`chronic_disease`、`coffee`、`cognitive_decline`、`constipation`、`coronary_heart_disease`、`dairy`、`diabetic_retinopathy`、`dietary_fat`、`dietary_fiber`、`digestive_cancer_risk`、`energy_vitality`、`fatty_liver`、`fructose`、`genetic_predisposition`、`glycemic_stability`、`good_sleep`、`gout_uric_acid`、`gut_microbiome`、`hypertension`、`infectious_disease`、`insulin_resistance`、`iodine`、`iron_status`、`irritable_bowel`、`kidney_disease`、`liver_chronic`、`mediterranean_diet`、`metabolic_health`、`nuts_seeds`、`obesity_risk`、`olive_oil`、`omega3`、`omnivorous_balanced_diet`、`oral_disease`、`oral_microbiome`、`osteoporosis`、`plant_based_diet`、`processed_meat`、`protein_deficiency`、`psychological_stress`、`red_meat`、`refined_carbs`、`saturated_fat`、`stroke`、`sugar_sweetened_beverages`、`type1_diabetes`、`type2_diabetes`、`ultra_processed`、`vegetables_greens`、`vitamin_b_complex`、`vitamin_c`、`vitamin_d`、`whole_grains`

## 与 live seed 同端点（append）

| source → target | 证据数 | live relation |
|---|---|---|
| `ultra_processed` → `obesity_risk` | 12 | 超加工食品与多种健康结局的叙述性综述 |
| `ultra_processed` → `chronic_disease` | 3 | 工业加工食品与精制主食普及与慢病流行相关 |
| `obesity_risk` → `type2_diabetes` | 11 | 肥胖与2型糖尿病风险相关 |
| `aerobic_exercise` → `metabolic_health` | 3 | 较长每日久坐时间与较高死亡风险相关 |
| `berries_fruits` → `metabolic_health` | 1 | 水果摄入量限制与糖尿病血糖控制比较相关 |
| `vegetables_greens` → `metabolic_health` | 2 | 较高绿叶菜摄入与较低慢性病及死亡风险相关 |
| `plant_based_diet` → `chronic_disease` | 1 | 以全食物植物为主的膳食模式与较低慢性病（富贵病）发生相关 |
| `type2_diabetes` → `chronic_disease` | 4 | 糖尿病等慢病与中年后长期健康负担相关 |
| `added_sugar` → `obesity_risk` | 9 | 含酒精饮料等额外能量与腹部脂肪堆积相关 |
| `refined_carbs` → `obesity_risk` | 4 | 精制碳水化合物摄入与肥胖风险相关 |
| `obesity_risk` → `insulin_resistance` | 2 | 过量进食使细胞对抗过大能量流相关 |
| `ultra_processed` → `type2_diabetes` | 7 | 儿童超重及相关饮食模式与糖尿病前期风险相关 |
| `added_sugar` → `type2_diabetes` | 4 | 精制糖销售量上升与糖尿病流行在观察上相关 |
| `refined_carbs` → `type2_diabetes` | 5 | 精制主食及粥类偏好与血糖及糖尿病相关 |
| `dietary_fat` → `obesity_risk` | 1 | 脂类能量比例失衡与肥胖等相关 |
| `animal_foods` → `metabolic_health` | 2 | 适量鱼禽蛋肉与代谢健康相关 |
| `refined_carbs` → `oral_disease` | 5 | 快消化淀粉与蛀牙风险相关 |
| `genetic_predisposition` → `type2_diabetes` | 2 | 糖尿病发生与基因易感性及生活方式综合相关 |
| `added_sugar` → `appetite_regulation` | 3 | 添加糖与食欲调控相关的关联观察 |
| `dietary_fiber` → `type2_diabetes` | 2 | 高纤维膳食与较好血糖控制相关 |
| `added_sugar` → `coronary_heart_disease` | 1 | 食用蔗糖作为冠心病风险因素曾被削弱的科学史讨论相关 |
| `saturated_fat` → `atherosclerosis` | 3 | 反式脂肪、饱和脂肪与膳食胆固醇摄入与较高LDL及动脉粥样硬化负荷相关 |
| `added_sugar` → `oral_disease` | 5 | 高糖膳食与小学生及成年人蛀牙高患病率相关 |
| `berries_fruits` → `vitamin_c` | 1 | 多种水果与维生素C供给相关 |
| `oral_microbiome` → `oral_disease` | 2 | 口腔菌群失调与龋病牙周病等相关 |
| `ultra_processed` → `hypertension` | 2 | 高钠摄入及水果摄入不足与死亡伤残负担及血压相关风险相关 |
| `aerobic_exercise` → `hypertension` | 2 | 规律运动与认知、血压、代谢及癌症负担相关 |
| `appetite_regulation` → `obesity_risk` | 3 | 食欲激素与迷走调控失衡与肥胖相关 |
| `sugar_sweetened_beverages` → `obesity_risk` | 4 | 含游离糖液体食物与肥胖及代谢风险的证据相对确凿相关 |
| `ultra_processed` → `appetite_regulation` | 2 | 加工食品打破对食物天然控制力与停不下来相关 |
| `dietary_fiber` → `glycemic_stability` | 5 | 可溶性膳食纤维延缓糖类吸收，与抑制血糖骤升及防止胰岛素分泌过剩相关 |
| `aflatoxin` → `cancer_overall` | 1 | 黄曲霉毒素暴露与Ⅰ类致癌物相关风险叙述相关 |
| `oral_disease` → `infectious_disease` | 1 | 龋病与感染相关的关联观察 |
| `refined_carbs` → `glycemic_stability` | 3 | 精制谷物主食与零食中的糖和淀粉与血糖冲击相关 |
| `refined_carbs` → `insulin_resistance` | 5 | 快消化碳水迫使胰腺持续分泌胰岛素相关 |
| `aerobic_exercise` → `type2_diabetes` | 5 | 身体活动与较低2型糖尿病风险相关 |
| `ultra_processed` → `glycemic_stability` | 2 | 化学蓬松或发酵使面团多孔疏松更易消化相关 |
| `psychological_stress` → `obesity_risk` | 3 | 压力相关进食改变与肥胖风险相关 |
| `infectious_disease` → `chronic_disease` | 2 | 感染与外伤负担下降后慢病成为主要寿命限制因素的观察 |
| `cancer_overall` → `chronic_disease` | 2 | 上皮来源肿瘤占肿瘤总量大部分的组织分布观察 |
| `berries_fruits` → `chronic_disease` | 1 | 水果作为正餐成分与慢病风险相关 |
| `added_sugar` → `glycemic_stability` | 1 | 糖过度摄入与身体血糖调节跟不上饮食冲击相关 |
| `added_sugar` → `insulin_resistance` | 3 | 游离糖淀粉反复挑战与胰岛素抵抗相关 |
| `fructose` → `fatty_liver` | 6 | 高果糖负担与肝损伤、代谢紊乱相关 |
| `genetic_predisposition` → `obesity_risk` | 2 | 遗传易感性在营养环境作用下与肥胖风险相关 |
| `insulin_resistance` → `obesity_risk` | 1 | 持续高血糖下脂肪细胞储存增加与肥胖相关 |
| `ultra_processed` → `added_sugar` | 1 | 高度加工食品与提纯蔗糖、果葡糖浆等游离糖富集相关 |
| `berries_fruits` → `dietary_fiber` | 1 | 水果可溶与不可溶纤维与肠道健康相关 |
| `dietary_fiber` → `appetite_regulation` | 1 | 蛋白质和膳食纤维带来更多饱腹感相关 |
| `berries_fruits` → `glycemic_stability` | 1 | 与含糖饮料同食浆果时血糖波动较缓和相关 |
| `dietary_fiber` → `obesity_risk` | 1 | 膳食纤维带来的饱腹感与较少热量摄入相关 |
| `sugar_sweetened_beverages` → `fructose` | 2 | 果葡糖浆成为绝大多数甜饮料首选甜味剂相关 |
| `fructose` → `insulin_resistance` | 2 | 大量非天然果糖与胰岛素抵抗、糖耐量受损相关 |
| `fructose` → `obesity_risk` | 1 | 加工果糖所致菌群变化与肥胖风险相关 |
| `omega3` → `cardiometabolic` | 2 | ω-3等多不饱和脂肪酸与心血管代谢相关 |
| `olive_oil` → `cardiometabolic` | 1 | 橄榄油等单不饱和脂肪酸来源与心血管相关 |
| `refined_carbs` → `metabolic_health` | 1 | 快消化碳水化合物过量与饮食不平衡相关的健康影响 |
| `psychological_stress` → `appetite_regulation` | 1 | 精神压力与食欲调控相关的关联观察 |
| `aerobic_exercise` → `obesity_risk` | 2 | 规律身体活动与较低体重及肥胖风险相关 |
| `gut_microbiome` → `obesity_risk` | 1 | 厚壁菌/拟杆菌比值与肥胖生物标志及菌群移植观察相关 |
| `gut_microbiome` → `metabolic_health` | 1 | 肠道菌群多样性与代谢健康相关的关联观察 |
| `dietary_fiber` → `gut_microbiome` | 1 | 膳食纤维与胃肠道健康的综述归纳 |
| `omnivorous_balanced_diet` → `type2_diabetes` | 2 | 荤素搭配与运动相结合的生活方式与血糖管理相关 |
| `sugar_sweetened_beverages` → `type2_diabetes` | 1 | 含游离糖液体食物与2型糖尿病风险相关观察 |
| `dietary_fat` → `type2_diabetes` | 1 | 高脂膳食与2型糖尿病风险相关 |
| `blood_cholesterol` → `atherosclerosis` | 1 | 低密度脂蛋白被氧化后与动脉粥样硬化斑块形成相关 |
| `atherosclerosis` → `coronary_heart_disease` | 3 | 动脉粥样斑块形成与破裂参与冠心病发作 |
| `atherosclerosis` → `stroke` | 1 | 血栓增大与致命中风风险相关 |
| `aerobic_exercise` → `cardiometabolic` | 2 | 久坐与内皮功能及动脉舒张相关 |
| `dietary_fat` → `blood_cholesterol` | 1 | 膳食脂肪摄入与血胆固醇水平共变 |
| `dietary_fat` → `coronary_heart_disease` | 1 | 膳食脂肪摄入与冠心病风险的人群关联观察 |
| `saturated_fat` → `blood_cholesterol` | 1 | 饱和脂肪摄入与血胆固醇水平相关 |
| `nuts_seeds` → `cardiometabolic` | 1 | 巴西坚果摄入与短期LDL胆固醇降低相关 |
| `red_meat` → `cardiometabolic` | 1 | 红肉摄入变化与全因及心血管死亡风险的队列观察 |
| `blood_cholesterol` → `coronary_heart_disease` | 1 | 较高血胆固醇水平与冠心病风险相关 |
| `refined_carbs` → `atherosclerosis` | 1 | 少吃快消化碳水多吃蔬果全谷与对抗糖化氧化相关 |
| `fructose` → `blood_cholesterol` | 1 | 果糖相关脂肪转运与低密度脂蛋白路径相关 |
| `psychological_stress` → `hypertension` | 1 | 负面情绪使血压升高并降低免疫力相关 |
| `dietary_fiber` → `blood_cholesterol` | 1 | 膳食纤维摄入与较低血胆固醇水平相关 |
| `aerobic_exercise` → `osteoporosis` | 4 | 规律身体活动与较低骨质疏松风险相关 |
| `calcium` → `osteoporosis` | 5 | 膳食钙与骨矿化相关 |
| `vitamin_d` → `osteoporosis` | 2 | 维生素D缺乏与骨骼生长和维持异常相关 |
| `dairy` → `osteoporosis` | 1 | 乳制品与高钙摄入与髋骨骨折率的跨国关联观察 |
| `omnivorous_balanced_diet` → `metabolic_health` | 1 | 七大营养素平衡的膳食结构与代谢健康相关 |
| `processed_meat` → `cancer_overall` | 1 | 含亚硝酸盐的加工肉制品与癌症风险关注相关 |
| `alcohol` → `liver_chronic` | 1 | 酒精相关肠道菌群改变与肝损伤相关 |
| `obesity_risk` → `digestive_cancer_risk` | 1 | 胃酸反流及相关因素与食道癌风险相关 |
| `refined_carbs` → `appetite_regulation` | 1 | 饥饿时先吃速溶麦片等快消化碳水与半小时后再饿相关 |
| `nuts_seeds` → `metabolic_health` | 1 | 经常食用坚果与较长寿命相关 |

## 章节覆盖

| spine | 章节 | 摘录数 / skip |
|---|---|---|
| 1 | Cover | skip：封面 Cover |
| 2 | 版权信息 | skip：版权信息 |
| 3 | 目录 | skip：目录 |
| 4 | blank | skip：空白页 |
| 5 | 前言 | 4 |
| 6 | blank | skip：空白页 |
| 7 | 引言·适应意味着什么 | 5 |
| 8 | 引言·自然选择是如何起作用的 | skip：自然选择理论导论；无明确饮食↔健康终点主张（关键词命中多为一般进化表述） |
| 9 | 引言·棘手的进化适应概念 | skip：适应概念理论讨论；饮食健康主张已由邻章覆盖 |
| 10 | 引言·为什么人类进化史很重要 | 4 |
| 11 | 引言·为什么进化对现在和将来也很重要 | 1 |
| 12 | blank | skip：空白/部分标题页 |
| 13 | blank | skip：空白/部分标题页 |
| 14 | blank | skip：空白/部分标题页 |
| 15 | 01 直立猿 | skip：直立猿章节以运动解剖为主；饮食/能量健康主张未达可入库阈值（已由 ch03 狩猎采集覆盖） |
| 16 | blank | skip：空白页 |
| 17 | 02 南方古猿 | 1 |
| 18 | blank | skip：空白页 |
| 19 | 03 最早的狩猎采集者 | 5 |
| 20 | blank | skip：空白页 |
| 21 | 04 冰河时代的古人类 | 1 |
| 22 | blank | skip：空白页 |
| 23 | 05 有文化创造力的智人 | skip：文化创造力章节以语言文化合作为主；饮食健康主张未达可入库阈值（烹饪能量主张已由 spine19 覆盖） |
| 24 | blank | skip：空白页 |
| 25 | blank | skip：空白页 |
| 26 | blank | skip：空白页 |
| 27 | 06 进步、失配和不良进化 | 19 |
| 28 | blank | skip：空白页 |
| 29 | 07 失乐园 | 23 |
| 30 | blank | skip：空白页 |
| 31 | 08 身体的穿越 | 18 |
| 32 | blank | skip：空白页 |
| 33 | blank | skip：空白页 |
| 34 | blank | skip：空白页 |
| 35 | 09 能量太多的恶性循环 | 59 |
| 36 | blank | skip：空白页 |
| 37 | 10 用进废退 | 10 |
| 38 | blank | skip：空白页 |
| 39 | 11 新奇和舒适背后的隐患 | 3 |
| 40 | blank | skip：空白页 |
| 41 | 结语 | 9 |
| 42 | blank | skip：空白页 |
| 43 | 尾声·种咱们的园地要紧 | 2 |
| 44 | 译者后记 | skip：译者后记；未重述可独立入库的饮食↔健康主张 |
| 45 | 图片出处 | skip：图片出处 |
| 46 | 脚注 | skip：脚注/尾注列表 |
| 47 | TOC | skip：目录 TOC |

## 可靠性自检（须全部通过）

1. JSON 可解析：候选节点 / 候选边
2. 每个端点 ∈ reuse_nodes ∪ new_nodes
3. 每条 evidence / 顶层 excerpt 均为 FULLTEXT.md 子串（含 …… 则分段命中）；**全量**检查，非抽检
4. `(source,target)` 唯一；`len(candidate_links)==candidate_count`
5. `evidence_count == sum(len(evidences))`
6. append_count / new_endpoint_pairs 与 live seed 端点对一致；append 的 relation == live relation
7. relation 无书名框架语；无 limitations；无治疗承诺措辞
8. 未改动 seed / sources / admin / data_version（`git -C /workspace/nutri-sphere status --porcelain -- data` 干净）
9. 原文摘录.md 覆盖全部 evidence excerpt_id
10. 已用子串验证的 3 个 excerpt_id：`bs_c27_p53`、`bs_c29_p43`、`bs_c35_p48`

## 入库说明

- 本目录仅为 **候选**；**未**写入 `data/seed_*`、`sources.json`、`admin_books.json`、`data_version`。
- 入库须另开 TASK + 人工合并闸门；同端点只 append evidences，不得平行建边。
- ClearDiet 边是公共共享关系，不是本书叙述。
