# ClearDiet · 戒糖 · 抽取说明

## 基本信息

- source_id：`quit_sugar`（admin_books 已有，status=index_only；sources.json **尚无**；现网 citing 边 **0**）
- 书名：戒糖：改变一生的科学饮食法（初夏之菡；中信出版集团；ISBN 9787521714463；出版约 2020-10）
- 主题：health（仅健康/疾病；饮食/糖/碳水 ↔ 代谢与健康结局）
- 语料：附件 EPUB → `source.epub` 解包 → `plaintext/chNN.txt` + `FULLTEXT.md`
- 对齐基线：nutri-sphere seed `data 2.4` / schema `0.7`（185 节点 / 778 边；本书现网边=0）
- kb 计划文件名：`糖与代谢_戒糖.md`
- 微信读书外链（仅元数据，未用划线）：https://weread.qq.com/web/reader/9e7326707234165d9e78773
- bookId：`36968029`；deepLink：https://weread.qq.com/book-detail?type=1&v=9e7326707234165d9e78773

## 产出计数

- 候选边（唯一端点对）：**197**
- 证据贡献（evidences 总数）：**455**
- 摘录条数（原文摘录.md）：**230**
- 其中 append（live seed 已有同端点）：**48**；新端点对：**149**
- 节点：新建 **7**，复用 **66**
- 每边证据数分布：{1: 106, 2: 39, 3: 18, 4: 12, 5: 7, 6: 3, 7: 8, 10: 1, 11: 1, 13: 1, 26: 1}
- live seed 中携带 `quit_sugar` 证据的边：**0**

## relation 风格

- 公共观察句式（`与…相关` / `参与…` / `关联观察`）；不含书名框架语、疗效/治愈/剂量措辞。摘录保留原文措辞。
- append 边：relation 写入 live 既有 relation；入库时沿用 live，只追加 evidences。

## 新建节点

- `acne`（disease，risk）痤疮 / 痘痘：毛囊皮脂腺慢性炎症性皮肤问题；叙述中与高血糖、胰岛素及IGF-1相关皮脂分泌活跃相关。
- `diabetic_retinopathy`（disease，risk）糖尿病视网膜病变：高血糖相关的视网膜微血管损伤；叙述中作为糖尿病并发症之一与糖化损伤相关。
- `gout_uric_acid`（disease，risk）高尿酸血症 / 痛风：血尿酸升高及相关痛风发作；叙述中与过量果糖代谢及甜饮料相关。
- `intermittent_fasting`（diet_pattern，mixed）轻断食 / 间歇性限制进食：在特定时间窗限制热量或禁食的进食模式（如5+2、16:8等）；叙述中与代谢、体重及血糖相关。
- `ketogenic_diet`（diet_pattern，mixed）生酮饮食：极低碳水、以脂肪供能并诱导酮体生成的饮食模式；书中对其长期健康影响持审慎态度。
- `skin_aging`（disease，risk）皮肤衰老 / 皱纹色斑：真皮胶原与弹性蛋白损伤相关的皮肤老化表现；叙述中与糖化与氧化相关。
- `sugar_sweetened_beverages`（food_category，risk）含糖饮料 / 软饮料：添加游离糖的碳酸饮料、甜饮等液体食物；叙述中为空热量与龋齿、代谢负担的主要游离糖来源之一。

## 复用节点

`added_sugar`、`aerobic_exercise`、`animal_foods`、`antioxidant_defense`、`appetite_regulation`、`artificial_sweeteners`、`atherosclerosis`、`berries_fruits`、`blood_cholesterol`、`cancer_overall`、`cardiometabolic`、`cell_repair`、`chronic_disease`、`chronic_inflammation`、`circadian_alignment`、`cognitive_clarity`、`coronary_heart_disease`、`dairy`、`dietary_cholesterol`、`dietary_fat`、`dietary_fiber`、`dna_damage`、`epigenetic_regulation`、`fatty_liver`、`fructose`、`genetic_predisposition`、`glycation`、`glycemic_stability`、`gut_barrier_integrity`、`gut_barrier_leak`、`gut_brain_axis`、`gut_microbiome`、`hba1c`、`healthy_weight`、`hypertension`、`igf1_signaling`、`immune_activation`、`immune_balance`、`immune_resilience`、`insulin_resistance`、`irritable_bowel`、`legumes`、`low_carb_diet`、`mental_health`、`metabolic_health`、`mushrooms`、`obesity_risk`、`omnivorous_balanced_diet`、`oral_disease`、`oral_microbiome`、`phytochemicals`、`plant_based_diet`、`probiotics`、`psychological_stress`、`reactive_oxygen`、`refined_carbs`、`resistant_starch`、`scfa`、`stroke`、`telomere_integrity`、`type2_diabetes`、`ultra_processed`、`vegetables_greens`、`vitamin_c`、`vitamin_e`、`whole_grains`

## 与 live seed 同端点（append）

| source → target | 证据数 | live relation |
|---|---|---|
| `ultra_processed` → `type2_diabetes` | 1 | 儿童超重及相关饮食模式与糖尿病前期风险相关 |
| `added_sugar` → `obesity_risk` | 7 | 含酒精饮料等额外能量与腹部脂肪堆积相关 |
| `obesity_risk` → `type2_diabetes` | 4 | 肥胖与2型糖尿病风险相关 |
| `ultra_processed` → `obesity_risk` | 4 | 超加工食品与多种健康结局的叙述性综述 |
| `ultra_processed` → `chronic_disease` | 2 | 工业加工食品与精制主食普及与慢病流行相关 |
| `added_sugar` → `chronic_disease` | 4 | 过量糖酒与慢病风险相关 |
| `berries_fruits` → `metabolic_health` | 1 | 水果摄入量限制与糖尿病血糖控制比较相关 |
| `vegetables_greens` → `dietary_fiber` | 2 | 蔬菜作为膳食纤维主要来源 |
| `berries_fruits` → `glycemic_stability` | 6 | 与含糖饮料同食浆果时血糖波动较缓和相关 |
| `plant_based_diet` → `antioxidant_defense` | 1 | 植物性食物提供的抗氧化物与机体抗氧化防御相关 |
| `reactive_oxygen` → `dna_damage` | 1 | 复制错误与自由基、辐射、化学物等造成每日大量DNA损伤 |
| `glycation` → `chronic_inflammation` | 2 | 高血糖下蛋白质糖化与活性氧相关，并与器官炎症及心脑肾风险相连 |
| `omnivorous_balanced_diet` → `type2_diabetes` | 4 | 荤素搭配与运动相结合的生活方式与血糖管理相关 |
| `gut_microbiome` → `obesity_risk` | 4 | 厚壁菌/拟杆菌比值与肥胖生物标志及菌群移植观察相关 |
| `oral_microbiome` → `oral_disease` | 2 | 口腔菌群失调与龋病牙周病等相关 |
| `dietary_fiber` → `gut_microbiome` | 6 | 膳食纤维与胃肠道健康的综述归纳 |
| `probiotics` → `gut_microbiome` | 1 | 益生菌摄入与肠道微生态调节相关 |
| `dietary_fiber` → `scfa` | 4 | 益生元纤维经菌群发酵产生短链脂肪酸，参与抗炎、代谢与免疫相关过程 |
| `refined_carbs` → `obesity_risk` | 5 | 精制碳水化合物摄入与肥胖风险相关 |
| `fructose` → `fatty_liver` | 5 | 高果糖负担与肝损伤、代谢紊乱相关 |
| `fructose` → `metabolic_health` | 1 | 经常饮用果汁与较高糖尿病风险相关 |
| `fructose` → `insulin_resistance` | 1 | 大量非天然果糖与胰岛素抵抗、糖耐量受损相关 |
| `fructose` → `obesity_risk` | 2 | 加工果糖所致菌群变化与肥胖风险相关 |
| `dietary_fiber` → `glycemic_stability` | 4 | 可溶性膳食纤维延缓糖类吸收，与抑制血糖骤升及防止胰岛素分泌过剩相关 |
| `gut_microbiome` → `gut_barrier_integrity` | 2 | 平衡的肠道菌群参与维持肠壁完整性、限制肠漏 |
| `mushrooms` → `immune_balance` | 1 | 白蘑菇β-葡聚糖与唾液IgA等免疫指标相关 |
| `dietary_fiber` → `immune_balance` | 1 | 可溶性膳食纤维体外直接激活NK/T/巨噬细胞等白细胞的实验相关 |
| `whole_grains` → `metabolic_health` | 1 | 全谷物摄入与糖尿病肥胖及中风风险相关 |
| `refined_carbs` → `type2_diabetes` | 3 | 精制主食及粥类偏好与血糖及糖尿病相关 |
| `added_sugar` → `appetite_regulation` | 3 | 添加糖与食欲调控相关的关联观察 |
| `animal_foods` → `metabolic_health` | 1 | 适量鱼禽蛋肉与代谢健康相关 |
| `vitamin_c` → `antioxidant_defense` | 1 | 蔬菜基质中维生素C与其他抗氧化物质共存时，加热后仍可大量保留于汤中 |
| `aerobic_exercise` → `metabolic_health` | 3 | 较长每日久坐时间与较高死亡风险相关 |
| `aerobic_exercise` → `obesity_risk` | 1 | 规律身体活动与较低体重及肥胖风险相关 |
| `ultra_processed` → `cardiometabolic` | 1 | 超加工食品摄入与心血管疾病风险的队列观察 |
| `ultra_processed` → `hypertension` | 1 | 高钠摄入及水果摄入不足与死亡伤残负担及血压相关风险相关 |
| `omnivorous_balanced_diet` → `metabolic_health` | 2 | 七大营养素平衡的膳食结构与代谢健康相关 |
| `gut_microbiome` → `gut_brain_axis` | 1 | 肠道菌群经迷走神经等通路与大脑双向交流 |
| `gut_microbiome` → `mental_health` | 1 | 肠道菌群经菌—肠—脑轴与情绪相关结局相关 |
| `gut_barrier_leak` → `immune_activation` | 2 | 屏障受损后外来蛋白与微生物组分更易触发免疫 |
| `gut_microbiome` → `scfa` | 1 | 肠道菌群多样性与短链脂肪酸 (SCFA)相关的关联观察 |
| `added_sugar` → `gut_microbiome` | 2 | 高糖低纤维膳食为有害菌提供燃料并削弱多样性 |
| `refined_carbs` → `gut_barrier_leak` | 1 | 精制植物性主食与肠道屏障损伤相关的关联观察 |
| `gut_barrier_leak` → `chronic_inflammation` | 1 | 肠道屏障损伤与慢性炎症相关的关联观察 |
| `gut_microbiome` → `metabolic_health` | 3 | 肠道菌群多样性与代谢健康相关的关联观察 |
| `reactive_oxygen` → `atherosclerosis` | 1 | 脂蛋白氧化与动脉粥样硬化启动相关 |
| `vegetables_greens` → `antioxidant_defense` | 1 | 蔬菜皮、种子、蒂等边角料富含抗氧化物质，可作汤底原料 |
| `ultra_processed` → `metabolic_health` | 1 | 超加工食品与代谢健康相关的关联观察 |

## 章节覆盖

| spine | 章节 | 摘录数 / skip |
|---|---|---|
| 0 | Cover | skip：封面 titlepage |
| 1 | 扉页 | skip：扉页 |
| 2 | 目录 | skip：目录 |
| 3 | 序言 戒糖：并不是抗争，而是回归 | 6 |
| 4 | 第1章 戒糖为什么最近才流行起来？我们之前做错了什么？ | skip：第1章标题过渡（态度定义；主张已由邻章覆盖） |
| 5 | 戒糖戒掉的是什么？ | 5 |
| 6 | 人们终于觉醒：甜蜜是一种负担 | 5 |
| 7 | 戒糖是否矫枉过正了？ | 3 |
| 8 | 第2章 时下明星圈流行的“戒糖饮食”靠谱吗？ | skip：第2章标题页 |
| 9 | 明星戒糖戒律，只做对了一半 | 4 |
| 10 | 健康饮食，才有好皮肤 | 8 |
| 11 | 第3章 你为什么需要戒糖？ | skip：章节标题页（无正文论证） |
| 12 | 戒糖，从复杂的糖尿病说起 | 7 |
| 13 | 想年轻，用食物滋养血液 | 3 |
| 14 | 抗糖，对抗衰老的绝佳做法 | 5 |
| 15 | 高糖饮食：对一生有害的习惯 | 7 |
| 16 | 第4章 理性戒糖，你需要的知识 | skip：章节标题页（无正文论证） |
| 17 | 回到最初，我们对糖为何如此偏爱？ | 4 |
| 18 | “生酮饮食”真的健康吗？ | 2 |
| 19 | 揭秘糖类家族 | 3 |
| 20 | 所有糖都一样吗？ | 2 |
| 21 | 果糖，不像名字那么健康 | 6 |
| 22 | 糖藏在哪些食物里？ | 2 |
| 23 | 什么是淀粉，它跟糖有什么关系？ | 4 |
| 24 | 蔬菜也能做主食 | 1 |
| 25 | 多糖（非淀粉）是特殊的糖吗？ | 3 |
| 26 | 更健康的神秘糖 | skip：特殊稀有糖科普（塔格糖/海藻糖/木糖），无明确饮食↔健康终点主张 → skip |
| 27 | 第5章 戒糖第一步：读懂食品标签 | skip：章节标题页（无正文论证） |
| 28 | 食品配料表、营养成分表怎么读？ | 2 |
| 29 | 如何综合判断食品中的碳水化合物含量高低？ | 4 |
| 30 | 第6章 戒糖第二步：你需要明白血糖生成指数和血糖负荷的意义 | skip：章节标题页（无正文论证） |
| 31 | 血糖生成指数，不是唯一的健康指标 | 7 |
| 32 | 血糖负荷，指导饮食更可靠的指标 | 4 |
| 33 | 灵活而自由的低糖饮食法则 | 3 |
| 34 | 第7章 戒糖第三步：自己烹饪和选择低GI餐 | skip：章节标题页（无正文论证） |
| 35 | “主食革命”：我们应该理性面对的事实 | 5 |
| 36 | 合理的买菜顺序将助你戒糖 | skip：买菜顺序方法清单；弱健康终点 → skip |
| 37 | GI、GL之外，还有量化碳水列表 | skip：量化碳水列表与操作计算；弱主张 → skip（GL主张已由 spine 32 覆盖） |
| 38 | 注意这些会提高GI的烹饪法 | 5 |
| 39 | 进一步减少血糖波动：吃的顺序很重要 | 9 |
| 40 | 第8章 糖真正的错：高血糖带来了病痛 | skip：章节标题页（无正文论证） |
| 41 | 流窜在血液里的糖究竟如何作恶？ | 3 |
| 42 | 让你显老的痕迹都与糖化反应有关 | 7 |
| 43 | 如何监测身体糖化的情况？ | 5 |
| 44 | 糖化可以逆转吗？抗糖保健品有用吗？ | 5 |
| 45 | 糖与激素的关系：它还跟痘痘有关？ | 3 |
| 46 | 抗糖办法之运动与思考 | 7 |
| 47 | 第9章 所谓戒糖，你该怎么做？ | skip：章节标题页（无正文论证） |
| 48 | 戒糖入门：跟含糖饮料说拜拜 | 9 |
| 49 | 代糖，如何使用最合理？ | 3 |
| 50 | 糖尿病病人的饮食其实值得我们学习？！ | 7 |
| 51 | 针对不同热量需求的戒糖饮食食谱 | skip：戒糖饮食食谱（菜单配方，弱主张） |
| 52 | 低碳水化合物烘焙的秘密 | 5 |
| 53 | 这些甜蜜饮料喝了还不发胖 | skip：无糖甜饮自制配方菜单 → skip |
| 54 | 市面上的代餐饮品真的靠谱吗？ | 4 |
| 55 | 第10章 戒糖的另一种方式：轻断食 | 11 |
| 56 | 2型糖尿病病人可能更适合少食多餐 | 3 |
| 57 | 抗糖饮食本身有助于对抗饥饿感 | 1 |
| 58 | 第11章 “567饱腹法”：这样戒糖更符合身体需求 | skip：章节标题页（无正文论证） |
| 59 | 什么是“567饱腹法”？ | 4 |
| 60 | “567饱腹法”与膳食指南有什么不一样吗？ | 2 |
| 61 | 第12章 戒糖，还有这些鲜为人知的好处 | skip：章节标题页（无正文论证） |
| 62 | 怎么吃才能改善我们的第二大脑——肠道菌群 | 11 |
| 63 | 少吃糖还能抗氧化和抗癌？ | 7 |
| 64 | 管理体成分，而不是管理体重 | 4 |
| 65 | 第13章 正念饮食：让你吃得幸福的科学 | skip：第13章标题过渡 |
| 66 | 戒糖的终极动力来源 | 5 |
| 67 | 顺应节律去吃，与血糖控制息息相关 | 3 |
| 68 | 终章 戒糖给你自由 | skip：终章正念哲学收束；无新增机制主张 → skip |
| 69 | 版权页 | skip：版权页 |

章节内 skip / 弱主题记账：
- spine 0–2、69：封面/扉页/目录/版权 → skip
- 章节标题页（无正文）：spine 11/16/27/34/40/47/58/61 等 → skip
- spine 4/8/65：章标题过渡 → skip（主张由邻章覆盖）
- spine 51：戒糖饮食食谱菜单 → skip
- spine 26：稀有特殊糖科普，无明确健康终点 → skip
- spine 36：买菜顺序方法 → skip；spine 37：量化列表操作 → skip（GL 已由 spine 32 覆盖）
- spine 53：无糖甜饮配方 → skip
- spine 68：终章哲学收束 → skip
- spine 28–29、35、38、52、54、66：mixed；仅保留与血糖/添加糖/代谢/情绪应激相关主张
- 疗效承诺/剂量处方：未写入 relation

覆盖缺口（in/mixed 且摘录 0）：
- 无

## 自检

- JSON 可解析；端点均 ∈ reuse ∪ new：是
- `(source,target)` 唯一：True（197 边）
- 摘录命中 FULLTEXT：全部命中（含补抽）；抽样 8 通过
- relation 无书框 / 无 limitations 键 / 无疗效剂量式 relation：通过
- seed / sources 未改：只读 snapshot；未编辑 nutri-sphere
- 计数一致：边 197 / 证据 455 / append 48 / 新节点 7 / 复用 66 / 摘录 230

## 入库说明

- **本目录仅为候选**；勿直接改 `data/seed_*` / `sources.json` / 产品文件。
- 入库须另开 TASK：ingest 同端点 append evidences；sources 新增 `quit_sugar`；新建节点后拓扑以实跑校验为准。
- 合并闸门后方可合入 main 并部署三站。
