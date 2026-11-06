# ClearDiet · 无限可能的身体 · 抽取说明

## 基本信息

- source_id：`body_unlimited`（admin_books 已有，status=index_only；sources.json **尚无**；现网 citing 边 **0**）
- 书名：无限可能的身体（微信读书作者标注「[英]卢永利」、译者 邬璐雪；EPUB dc:creator 为「卢永利」无国籍标。book_meta 以微信读书为主并备注 EPUB 字段）
- 出版社：贵州人民出版社；ISBN 9787221179357
- 微信读书 publishTime：2024-02-04；EPUB date：2023-10-31
- 主题：health（健康/疾病；饮食/营养/食物环境/能量 ↔ 健康与疾病；并含明确连到健康结局的授时因子：光/睡眠、运动/久坐、冷热、社交/压力）
- 语料：附件 EPUB → `source.epub` 解包 → `plaintext/` + `FULLTEXT.md`
- 对齐基线：nutri-sphere seed `data 2.6` / schema `0.7`（200 节点 / 1069 边；本书现网边=0）
- kb 计划文件名：`身心与疾病_无限可能的身体.md`
- 微信读书外链（仅元数据，未用划线）：https://weread.qq.com/web/reader/17032c40813ab939bg011b20
- bookId：`3300115471`；deepLink：https://weread.qq.com/book-detail?type=1&v=17032c40813ab939bg011b20

## 产出计数

- 候选边（唯一端点对）：**201**
- 证据贡献（evidences 总数）：**772**
- 摘录条数（原文摘录.md）：**307**
- 其中 append（live seed 已有同端点）：**104**；新端点对：**97**
- 节点：新建 **5**，复用 **84**
- 每边证据数分布：{1: 98, 2: 36, 3: 15, 4: 15, 5: 2, 6: 3, 7: 4, 8: 3, 9: 4, 10: 5, 11: 2, 12: 1, 13: 1, 14: 1, 17: 1, 18: 2, 19: 1, 20: 2, 24: 1, 25: 1, 36: 2, 37: 1}
- live seed 中携带 `body_unlimited` 证据的边：**0**

## relation 风格

- 公共观察句式（`与…相关` / `参与…` / `关联观察`）；不含书名框架语、疗效/治愈/剂量措辞。摘录保留原文措辞。
- append 边：relation 写入 live 既有 relation；入库时沿用 live，只追加 evidences。
- 自检：relation 字段对 `书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述` 零匹配；无 `limitations` 键；无 `治愈|疗效|治疗方案|替代医生`。

## 新建节点

- `industrial_seed_oils`（food_category，risk）工业种子油 / 油籽油：以大豆、玉米、菜籽、棉籽、葵花籽等为原料、经高温与溶剂加工的食用油；叙述中ω-6多不饱和脂肪酸含量高，与过氧化产物及多种慢病风险相关。
- `autophagy`（mechanism，protective）细胞自噬：溶酶体回收受损蛋白与病原体等细胞垃圾的自我清洁过程；叙述中在禁食期增强，持续进食时被抑制，与感染、炎症及多种慢病相关。
- `cold_exposure`（mechanism，protective）冷暴露 / 寒冷刺激：有意或环境性的低温暴露（冷水、寒冷户外等）；叙述中作为授时因子与产热、代谢、免疫及心理恢复相关。
- `heat_exposure`（mechanism，protective）热暴露 / 热刺激：有意或环境性的高温暴露（桑拿、炎热户外等）；叙述中作为授时因子与心血管、代谢及热适应相关。
- `social_isolation`（mechanism，risk）社交隔离 / 孤独：缺乏有意义的人际联结与部落式群体支持的状态；叙述中与抑郁、孤独感及整体健康损害相关。

## 复用节点

`added_sugar`、`aerobic_exercise`、`agricultural_diet`、`alcohol`、`animal_foods`、`antibiotics`、`appetite_regulation`、`artificial_sweeteners`、`atherosclerosis`、`atopic_dermatitis`、`autoimmune`、`berries_fruits`、`blood_cholesterol`、`calcium`、`cancer_overall`、`cardiometabolic`、`chronic_disease`、`chronic_inflammation`、`circadian_alignment`、`cognitive_decline`、`constipation`、`coronary_heart_disease`、`dairy`、`dietary_cholesterol`、`dietary_fat`、`dietary_fiber`、`dietary_nitrates`、`digestive_cancer_risk`、`energy_surplus`、`energy_vitality`、`environmental_pollutants`、`fatty_liver`、`fermented_foods`、`fructose`、`glycemic_stability`、`good_sleep`、`gout_uric_acid`、`gut_barrier_integrity`、`gut_microbiome`、`healthy_weight`、`heme_iron`、`heterocyclic_amines`、`hunter_gatherer_diet`、`hypertension`、`ibd_related`、`immune_balance`、`immune_resilience`、`infectious_disease`、`insulin_resistance`、`intermittent_fasting`、`ketogenic_diet`、`liver_chronic`、`low_carb_diet`、`lung_disease`、`mental_health`、`metabolic_health`、`metabolic_syndrome`、`mismatch_disease`、`mitochondrial_energy`、`nitric_oxide`、`nutrient_supplements`、`nuts_seeds`、`obesity_risk`、`olive_oil`、`omega3`、`omega6`、`omnivorous_balanced_diet`、`oral_disease`、`osteoporosis`、`physical_inactivity`、`plant_based_diet`、`probiotics`、`processed_meat`、`psychological_stress`、`red_meat`、`refined_carbs`、`saturated_fat`、`scfa`、`seafood`、`sugar_sweetened_beverages`、`type2_diabetes`、`ultra_processed`、`vegetables_greens`、`vitamin_d`

## 与 live seed 同端点（append）

| source → target | 证据数 | live relation |
|---|---|---|
| `circadian_alignment` → `metabolic_health` | 20 | 昼夜节律与血糖反应的科学实验证实相关 |
| `ultra_processed` → `chronic_disease` | 19 | 工业加工食品与精制主食普及与慢病流行相关 |
| `aerobic_exercise` → `metabolic_health` | 18 | 较长每日久坐时间与较高死亡风险相关 |
| `hunter_gatherer_diet` → `metabolic_health` | 12 | 接近狩猎采集的肉坚果蔬果种子饮食模式与代谢健康讨论相关 |
| `sugar_sweetened_beverages` → `obesity_risk` | 11 | 含游离糖液体食物与肥胖及代谢风险的证据相对确凿相关 |
| `ultra_processed` → `obesity_risk` | 11 | 超加工食品与多种健康结局的叙述性综述 |
| `added_sugar` → `obesity_risk` | 10 | 含酒精饮料等额外能量与腹部脂肪堆积相关 |
| `animal_foods` → `metabolic_health` | 10 | 适量鱼禽蛋肉与代谢健康相关 |
| `omnivorous_balanced_diet` → `metabolic_health` | 10 | 七大营养素平衡的膳食结构与代谢健康相关 |
| `vitamin_d` → `immune_resilience` | 10 | 维生素D状态与免疫相关 |
| `physical_inactivity` → `metabolic_health` | 9 | 病理性低活动生长环境与肌肉萎缩动脉变硬等健康下降相关 |
| `psychological_stress` → `mental_health` | 9 | 精神压力与情绪低落相关的关联观察 |
| `physical_inactivity` → `chronic_disease` | 8 | 体力活动不足与多种慢性可预防疾病负担相关 |
| `energy_surplus` → `obesity_risk` | 7 | 能量摄入与消耗失衡与肥胖风险相关 |
| `intermittent_fasting` → `metabolic_health` | 7 | 热量限制学说与代谢及衰老相关讨论 |
| `refined_carbs` → `obesity_risk` | 7 | 精制碳水化合物摄入与肥胖风险相关 |
| `added_sugar` → `coronary_heart_disease` | 6 | 食用蔗糖作为冠心病风险因素曾被削弱的科学史讨论相关 |
| `physical_inactivity` → `obesity_risk` | 6 | 体力活动不足与较高肥胖风险相关 |
| `plant_based_diet` → `metabolic_health` | 5 | 证据层级优先人类数据；动物与细胞研究用于机制理解且不可直接外推 |
| `added_sugar` → `glycemic_stability` | 4 | 糖过度摄入与身体血糖调节跟不上饮食冲击相关 |
| `aerobic_exercise` → `osteoporosis` | 4 | 规律身体活动与较低骨质疏松风险相关 |
| `appetite_regulation` → `obesity_risk` | 4 | 食欲激素与迷走调控失衡与肥胖相关 |
| `berries_fruits` → `metabolic_health` | 4 | 水果摄入量限制与糖尿病血糖控制比较相关 |
| `obesity_risk` → `chronic_disease` | 4 | 超重肥胖流行与慢性非感染性疾病负担上升相关 |
| `obesity_risk` → `type2_diabetes` | 4 | 肥胖与2型糖尿病风险相关 |
| `physical_inactivity` → `osteoporosis` | 4 | 体力活动不足与骨质疏松风险相关 |
| `psychological_stress` → `chronic_disease` | 4 | 失去觉察后错误应对与慢性病相关 |
| `saturated_fat` → `coronary_heart_disease` | 4 | 高饱和脂肪饮食与心脏病风险的共识讨论相关 |
| `alcohol` → `chronic_disease` | 3 | 过量饮酒与可预防健康损害相关 |
| `berries_fruits` → `glycemic_stability` | 3 | 与含糖饮料同食浆果时血糖波动较缓和相关 |
| `dietary_fiber` → `constipation` | 3 | 膳食纤维不足与便秘相关 |
| `intermittent_fasting` → `obesity_risk` | 3 | 轻断食作为与戒糖相关的饮食模式讨论相关 |
| `obesity_risk` → `hypertension` | 3 | 易致肥胖的饮食与中青年高血压风险相关 |
| `omega3` → `cardiometabolic` | 3 | ω-3等多不饱和脂肪酸与心血管代谢相关 |
| `refined_carbs` → `coronary_heart_disease` | 3 | 高糖低纤维饮食与心脏病风险相关 |
| `added_sugar` → `atherosclerosis` | 2 | 快速葡萄糖果糖负荷损害肝脏并升高甘油三酯与动脉硬化风险相关 |
| `added_sugar` → `cancer_overall` | 2 | 血糖稳定好处与肿瘤细胞高耗能低效代谢路径相关讨论 |
| `added_sugar` → `chronic_disease` | 2 | 过量糖酒与慢病风险相关 |
| `added_sugar` → `insulin_resistance` | 2 | 游离糖淀粉反复挑战与胰岛素抵抗相关 |
| `added_sugar` → `type2_diabetes` | 2 | 精制糖销售量上升与糖尿病流行在观察上相关 |
| `berries_fruits` → `dietary_fiber` | 2 | 水果可溶与不可溶纤维与肠道健康相关 |
| `blood_cholesterol` → `atherosclerosis` | 2 | 低密度脂蛋白被氧化后与动脉粥样硬化斑块形成相关 |
| `dairy` → `osteoporosis` | 2 | 乳制品与高钙摄入与髋骨骨折率的跨国关联观察 |
| `dietary_cholesterol` → `blood_cholesterol` | 2 | 膳食胆固醇摄入与血胆固醇水平相关 |
| `dietary_fat` → `obesity_risk` | 2 | 脂类能量比例失衡与肥胖等相关 |
| `dietary_fiber` → `scfa` | 2 | 益生元纤维经菌群发酵产生短链脂肪酸，参与抗炎、代谢与免疫相关过程 |
| `gut_microbiome` → `metabolic_health` | 2 | 肠道菌群多样性与代谢健康相关的关联观察 |
| `insulin_resistance` → `obesity_risk` | 2 | 持续高血糖下脂肪细胞储存增加与肥胖相关 |
| `ketogenic_diet` → `metabolic_health` | 2 | 几乎戒断碳水化合物的生酮饮食法多数医生营养师不建议的审慎讨论相关 |
| `low_carb_diet` → `obesity_risk` | 2 | 低碳水高蛋白饮食与肥胖相关的关联观察 |
| `metabolic_syndrome` → `type2_diabetes` | 2 | 代谢综合征与2型糖尿病风险显著升高相关 |
| `nuts_seeds` → `metabolic_health` | 2 | 经常食用坚果与较长寿命相关 |
| `olive_oil` → `cardiometabolic` | 2 | 橄榄油等单不饱和脂肪酸来源与心血管相关 |
| `saturated_fat` → `blood_cholesterol` | 2 | 饱和脂肪摄入与血胆固醇水平相关 |
| `scfa` → `gut_barrier_integrity` | 2 | 短链脂肪酸 (SCFA)与肠道屏障完整相关的关联观察 |
| `added_sugar` → `gut_microbiome` | 1 | 高糖低纤维膳食为有害菌提供燃料并削弱多样性 |
| `added_sugar` → `hypertension` | 1 | 现代饮食模式与血压升高等代谢紊乱趋势相关 |
| `aerobic_exercise` → `cardiometabolic` | 1 | 久坐与内皮功能及动脉舒张相关 |
| `alcohol` → `cognitive_decline` | 1 | 长期饮酒与海马萎缩及认知下降相关 |
| `alcohol` → `liver_chronic` | 1 | 酒精相关肠道菌群改变与肝损伤相关 |
| `animal_foods` → `coronary_heart_disease` | 1 | 动物性产品与加工食品来源的血脂相关因素与冠心病风险相关 |
| `antibiotics` → `gut_microbiome` | 1 | 抗生素迅速改变菌群多样性并偏向促肥胖菌群 |
| `antibiotics` → `obesity_risk` | 1 | 抗生素暴露与体重增加、胃饥饿素升高等相关 |
| `artificial_sweeteners` → `obesity_risk` | 1 | 代糖帮助减少糖热量但仍需合理使用相关 |
| `blood_cholesterol` → `coronary_heart_disease` | 1 | 较高血胆固醇水平与冠心病风险相关 |
| `calcium` → `osteoporosis` | 1 | 膳食钙与骨矿化相关 |
| `dairy` → `obesity_risk` | 1 | 高糖酸牛乳更像甜品而非每日必需营养品相关 |
| `dietary_fat` → `coronary_heart_disease` | 1 | 膳食脂肪摄入与冠心病风险的人群关联观察 |
| `dietary_fiber` → `glycemic_stability` | 1 | 可溶性膳食纤维延缓糖类吸收，与抑制血糖骤升及防止胰岛素分泌过剩相关 |
| `dietary_fiber` → `gut_microbiome` | 1 | 膳食纤维与胃肠道健康的综述归纳 |
| `dietary_nitrates` → `cancer_overall` | 1 | 亚硝胺等亚硝基化合物暴露与实验性致癌相关 |
| `environmental_pollutants` → `cognitive_decline` | 1 | 空气污染暴露与老年痴呆风险相关 |
| `fermented_foods` → `gut_microbiome` | 1 | 作为带有微生物活动的食物例子 |
| `fructose` → `fatty_liver` | 1 | 高果糖负担与肝损伤、代谢紊乱相关 |
| `fructose` → `gout_uric_acid` | 1 | 果糖不适用于尿酸偏高、肝损及脂质代谢异常人群相关 |
| `fructose` → `obesity_risk` | 1 | 加工果糖所致菌群变化与肥胖风险相关 |
| `hunter_gatherer_diet` → `oral_disease` | 1 | 狩猎采集者中龋齿等较少见的观察相关 |
| `hunter_gatherer_diet` → `type2_diabetes` | 1 | 狩猎采集者中2型糖尿病较为罕见的观察相关 |
| `insulin_resistance` → `type2_diabetes` | 1 | 细胞对胰岛素反应下降与2型糖尿病进展相关 |
| `intermittent_fasting` → `type2_diabetes` | 1 | 轻断食后血糖与糖化血红蛋白降低相关观察 |
| `nitric_oxide` → `hypertension` | 1 | 一氧化氮向血管平滑肌发送扩张信号，与血管舒张及血压稳定相关 |
| `obesity_risk` → `cancer_overall` | 1 | 肥胖与生殖系统癌症等风险相关 |
| `omega6` → `chronic_inflammation` | 1 | 过高 ω-6/ω-3 比例与促炎及脑心风险相关 |
| `omnivorous_balanced_diet` → `obesity_risk` | 1 | 最好的减肥状态是每天可持续的饮食而非极端相关 |
| `plant_based_diet` → `digestive_cancer_risk` | 1 | 较高植物性蛋白占比与较低膀胱癌风险相关 |
| `probiotics` → `gut_microbiome` | 1 | 益生菌摄入与肠道微生态调节相关 |
| `processed_meat` → `cancer_overall` | 1 | 含亚硝酸盐的加工肉制品与癌症风险关注相关 |
| `psychological_stress` → `immune_resilience` | 1 | 未被满足需求引发的负面情绪真实伤害身体相关 |
| `red_meat` → `digestive_cancer_risk` | 1 | 红肉摄入与结直肠癌风险相关 |
| `refined_carbs` → `atherosclerosis` | 1 | 少吃快消化碳水多吃蔬果全谷与对抗糖化氧化相关 |
| `refined_carbs` → `cancer_overall` | 1 | 大量快消化碳水升高血糖成为癌细胞偏好的高能能量场相关 |
| `refined_carbs` → `insulin_resistance` | 1 | 快消化碳水迫使胰腺持续分泌胰岛素相关 |
| `refined_carbs` → `type2_diabetes` | 1 | 精制主食及粥类偏好与血糖及糖尿病相关 |
| `saturated_fat` → `atherosclerosis` | 1 | 反式脂肪、饱和脂肪与膳食胆固醇摄入与较高LDL及动脉粥样硬化负荷相关 |
| `scfa` → `chronic_inflammation` | 1 | 丙酸、丁酸、醋酸盐参与代谢、结肠能量、抗炎与食欲信号 |
| `sugar_sweetened_beverages` → `fructose` | 1 | 果葡糖浆成为绝大多数甜饮料首选甜味剂相关 |
| `sugar_sweetened_beverages` → `glycemic_stability` | 1 | 午后一口气喝下高游离糖饮料与血糖冲击相关 |
| `type2_diabetes` → `chronic_disease` | 1 | 糖尿病等慢病与中年后长期健康负担相关 |
| `ultra_processed` → `added_sugar` | 1 | 高度加工食品与提纯蔗糖、果葡糖浆等游离糖富集相关 |
| `ultra_processed` → `appetite_regulation` | 1 | 加工食品打破对食物天然控制力与停不下来相关 |
| `ultra_processed` → `cardiometabolic` | 1 | 超加工食品摄入与心血管疾病风险的队列观察 |
| `ultra_processed` → `coronary_heart_disease` | 1 | 现代生活方式与心脏病等非传染性疾病流行相关 |
| `ultra_processed` → `energy_surplus` | 1 | 高度加工富含热量的食物与现代能量环境相关 |
| `vegetables_greens` → `metabolic_health` | 1 | 较高绿叶菜摄入与较低慢性病及死亡风险相关 |

## 章节覆盖与跳过

- spine 00 《封面》：跳过 — 封面页，无正文健康论点
- spine 01 《目录》：跳过 — TOC，无正文
- spine 02 《献辞》：跳过 — 献辞页，近乎空白
- spine 03 《推荐》：跳过 — 推荐序/推荐人感言，无独立饮食↔健康可入库论点
- spine 04 《引言 我的故事》：摘录 1 条
- spine 05 《自然健康》：摘录 4 条
- spine 06 《历史的意义》：摘录 6 条
- spine 07 《健康、体能、性感》：摘录 3 条
- spine 08 《第一部分 标题页》：跳过 — 部分标题页
- spine 09 《第一部分导语（市场与健康）》：摘录 3 条
- spine 10 《传媒巨头与假神》：摘录 2 条
- spine 11 《食品巨头与慢性病危机》：摘录 48 条
- spine 12 《健康巨头与健康产品》：摘录 12 条
- spine 13 《第二部分 标题页》：跳过 — 部分标题页
- spine 14 《第二部分导语（授时因子）》：摘录 6 条
- spine 15 《光照与黑暗》：摘录 47 条
- spine 16 《饥饿与饱足》：摘录 61 条
- spine 17 《活动与休息》：摘录 17 条
- spine 18 《冷与热》：摘录 55 条
- spine 19 《群体与独处》：摘录 39 条
- spine 20 《后记 物种起源》：摘录 3 条
- spine 21 《参考文献》：跳过 — 参考文献清单，无独立叙述性健康论点
- spine 22 《插图说明》：跳过 — 图注列表，无健康论点

### 跳过理由汇总

- spine 00 《封面》：封面页，无正文健康论点
- spine 01 《目录》：TOC，无正文
- spine 02 《献辞》：献辞页，近乎空白
- spine 03 《推荐》：推荐序/推荐人感言，无独立饮食↔健康可入库论点
- spine 08 《第一部分 标题页》：部分标题页
- spine 13 《第二部分 标题页》：部分标题页
- spine 21 《参考文献》：参考文献清单，无独立叙述性健康论点
- spine 22 《插图说明》：图注列表，无健康论点

### 混合章节说明

spine 10《传媒巨头与假神》以形体审美/传媒批判为主，仅保留与补剂焦虑、健康体形动机直接相关的语段；纯审美史与明星体形演变未收。spine 4《引言》仅保留含禁食运动健康对比的语段；纯个人履历未收。spine 12 跑鞋产业史中与损伤相关的人类学观察已部分纳入运动健康端点；纯品牌传记段落未穷尽。

## 可靠性自检

- JSON 可解析；每个端点 ∈ reuse ∪ new：**通过**
- 每条 evidence 的 excerpt 可在 FULLTEXT.md 子串命中；抽查：
- `bu_c4_p17`（spine 4，220字）FULLTEXT 子串命中：是
- `bu_c5_p5`（spine 5，125字）FULLTEXT 子串命中：是
- `bu_c5_p7`（spine 5，165字）FULLTEXT 子串命中：是
- candidate_links 的 (source,target) 唯一（201 = 不同端点对数）：**通过**
- relation 零匹配书名框架语：**通过**
- 无 limitations 键；relation 无治愈/疗效/治疗方案/替代医生：**通过**
- append 判定与 seed_snapshot（data 2.6）一致；append 边未改写 live relation：**通过**
- 抽取说明计数 = 文件实际计数：**通过**（边 201 / 证据 772 / 摘录 307）

## 入库注意

- **本目录未改动** `/workspace/nutri-sphere/` 下任何 seed / sources / admin_books / kb 文件。
- 入库须**另开 TASK** + 人闸门：合并同端点 evidences、写入 sources、更新 data_version，禁止平行边。
- 书中对传统“脂肪—心脏病”“盐—高血压”“红肉—癌症”“海鲜—痛风”“纤维—便秘”等理论持批判立场；候选边按原文主张映射端点，入库审核时请对照教育边界与现网 relation 语义。
