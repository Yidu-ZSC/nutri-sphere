# ClearDiet · 晓肚知肠 · 抽取说明

## 基本信息

- source_id：`know_your_gut`（sources.json **已存在**；admin_books 仍为 index_only；现网 citing 边 **0**，NS-066 清薄书摘后待 EPUB 重建）
- 书名：晓肚知肠：肠菌的小心思（段云峰；清华大学出版社；ISBN 9787302511601；EPUB date≈2018-10-09）
- 作者字段：EPUB creator 含 `SoBooKs.cc` 水印；作者按 **段云峰** 书写
- 主题：health（仅健康/疾病；饮食/菌群↔健康结局）
- 语料：附件 EPUB → `source.epub` 解包 → `plaintext/chNN.txt` + `FULLTEXT.md`
- 对齐基线：nutri-sphere seed `data 2.3` / schema `0.7`（173 节点 / 591 边；本书现网边=0）
- 微信读书外链（仅元数据，未用划线）：https://weread.qq.com/web/reader/502329c07198d5fa5028e95
- bookId：`26793466`；deepLink：https://weread.qq.com/book-detail?type=1&v=502329c07198d5fa5028e95

## 产出计数

- 候选边（唯一端点对）：**219**
- 证据贡献（evidences 总数 = 摘录条数）：**367**
- 其中 append（live seed 已有同端点）：**32**；新端点对：**187**
- 节点：新建 **12**，复用 **72**
- 每边证据数分布：{1: 147, 2: 40, 3: 14, 4: 11, 5: 2, 6: 1, 7: 1, 8: 1, 11: 1, 12: 1}
- 摘录长度（字）：min 52 / median 219 / max 999
- 同一段落若同时支撑多个不同端点对，会在各自边下分别记为一条证据；同一对内不重复。
- 非相邻段落组成的一个论证单元以 ` …… ` 连接；每个片段均逐字取自 FULLTEXT（自检按片段校验）。
- live seed 中携带 `know_your_gut` 证据的边：**0**

## relation 风格

- 公共观察句式（`与…相关` / `参与…` / `关联观察`）；不含书名框架语、疗效/治愈/剂量措辞。摘录保留原文措辞。
- append 边：候选 relation 仅供参考；入库时沿用 live relation，只追加 evidences。

## 新建节点

- `alcohol`（food_category，risk）酒精 / 过量饮酒：乙醇饮料摄入；叙述中与肠黏膜损伤、肠漏、血脑屏障通透及神经退行风险相关。
- `antibiotic_resistance`（mechanism，risk）抗生素耐药 / 超级细菌：细菌通过突变与水平转移对抗生素产生耐药；滥用加速耐药基因蔓延并削弱感染控制能力。
- `appendix`（mechanism，protective）阑尾 / 肠道菌群备份库：盲肠延伸的淋巴器官；叙述中作为有益菌储备与肠道菌群重建相关结构。
- `appetite_regulation`（mechanism，mixed）食欲调控（激素与迷走通路）：胃饥饿素、瘦素、肠肽及迷走神经等共同调节短期与长期食欲及进食行为的网络。
- `circulating_microbes`（mechanism，risk）血液循环中的微生物信号：血液及组织中可检出的细菌、真菌或病毒成分及其产物；与亚健康、炎症及神经退行叙述相关。
- `fecal_microbiota_transplant`（mechanism，mixed）粪菌移植相关菌群重建：将供体肠道菌群移植至受体以重建微生态的干预叙述；用于耐药感染及若干行为/神经模型讨论。
- `halitosis`（disease，risk）口臭 / 口腔异味：以挥发性硫化物等为主的口气异常；多与口腔或消化道微生物代谢相关。
- `helicobacter_pylori`（mechanism，risk）幽门螺杆菌定植：可在胃酸环境定植的螺旋杆菌；与胃炎、溃疡及胃癌风险等相关，亦有与胃外结局的讨论。
- `irritable_bowel`（disease，risk）肠易激综合征 (IBS)：以腹痛与排便习惯改变为特征的功能性肠道问题；常伴焦虑抑郁等情绪相关叙述。
- `mycotoxins`（compound，risk）霉菌毒素（食品污染）：霉菌在农产品中产生的有毒次级代谢产物；可引起肝肾神经损伤、免疫抑制乃至致癌相关风险。
- `oral_disease`（disease，risk）龋病 / 牙周病等口腔疾病：龋齿、牙龈炎、牙周炎及黏膜感染等与口腔菌群失调密切相关的口腔疾病。
- `oral_microbiome`（mechanism，mixed）口腔菌群：口腔黏膜、牙齿与舌面等部位的共生微生物群落；紊乱与龋病、牙周病及若干全身健康结局相关。

## 复用节点

`added_sugar`、`aflatoxin`、`animal_foods`、`antibiotics`、`artificial_sweeteners`、`atherosclerosis`、`atopic_dermatitis`、`autism_spectrum`、`autoimmune`、`autonomic_balance`、`blood_brain_barrier`、`blood_cholesterol`、`breastfeeding`、`butyrate`、`cancer_overall`、`cesarean_birth`、`chronic_disease`、`chronic_inflammation`、`coffee`、`cognitive_clarity`、`cognitive_decline`、`constipation`、`coronary_heart_disease`、`dairy`、`dietary_fiber`、`digestive_cancer_risk`、`dna_damage`、`environmental_pollutants`、`fatty_liver`、`fermented_foods`、`gastritis`、`good_sleep`、`gut_barrier_integrity`、`gut_barrier_leak`、`gut_brain_axis`、`gut_comfort`、`gut_microbiome`、`hypertension`、`ibd_related`、`immune_activation`、`immune_balance`、`immune_resilience`、`infectious_disease`、`insulin_resistance`、`kidney_disease`、`legumes`、`liver_chronic`、`low_carb_diet`、`lps`、`lung_disease`、`mental_health`、`metabolic_health`、`neuroinflammation`、`nitric_oxide`、`obesity_risk`、`omega3`、`osteoporosis`、`parkinson_disease`、`probiotics`、`psychological_stress`、`reactive_oxygen`、`refined_carbs`、`saturated_fat`、`scfa`、`stroke`、`type1_diabetes`、`type2_diabetes`、`ultra_processed`、`vitamin_b_complex`、`vitamin_c`、`vitamin_d`、`zinc`

## 与 live seed 同端点（append）

| source → target | 证据数 | live relation |
|---|---|---|
| `added_sugar` → `obesity_risk` | 1 | 含酒精饮料等额外能量与腹部脂肪堆积相关 |
| `animal_foods` → `gut_microbiome` | 1 | 减少动物蛋白摄入与有利于微生物组相关 |
| `antibiotics` → `gut_microbiome` | 5 | 抗生素迅速改变菌群多样性并偏向促肥胖菌群 |
| `breastfeeding` → `gut_microbiome` | 3 | 母乳喂养与较高菌群多样性及部分疾病风险较低相关 |
| `cesarean_birth` → `gut_microbiome` | 4 | 剖腹产婴儿初始菌群更接近皮肤菌群而非阴道乳酸杆菌主导 |
| `coffee` → `parkinson_disease` | 1 | 咖啡摄入与较低帕金森症风险相关观察 |
| `dietary_fiber` → `gut_comfort` | 1 | 膳食纤维与肠道舒适相关 |
| `dietary_fiber` → `gut_microbiome` | 4 | 膳食纤维与胃肠道健康的综述归纳 |
| `dietary_fiber` → `scfa` | 3 | 益生元纤维经菌群发酵产生短链脂肪酸，参与抗炎、代谢与免疫相关过程 |
| `environmental_pollutants` → `parkinson_disease` | 1 | 饮食污染物滞留与便秘及帕金森症风险相关观察 |
| `fermented_foods` → `gut_microbiome` | 3 | 作为带有微生物活动的食物例子 |
| `fermented_foods` → `probiotics` | 1 | 泡菜、酸奶、开菲尔等发酵食物是益生菌天然来源 |
| `gut_barrier_leak` → `blood_brain_barrier` | 1 | 肠道通透性增加可伴随血脑屏障通透性改变 |
| `gut_barrier_leak` → `immune_activation` | 2 | 屏障受损后外来蛋白与微生物组分更易触发免疫 |
| `gut_barrier_leak` → `lps` | 1 | 紧密连接受损时脂多糖可进入血液循环 |
| `gut_brain_axis` → `mental_health` | 4 | 肠—脑轴双向调控与情绪状态相关 |
| `gut_microbiome` → `autism_spectrum` | 8 | 肠功能障碍、梭菌/丙酸与线粒体路径与自闭症谱系讨论相关 |
| `gut_microbiome` → `digestive_cancer_risk` | 2 | 膳食、微生物代谢物与结肠癌的综述讨论 |
| `gut_microbiome` → `gut_barrier_integrity` | 2 | 平衡的肠道菌群参与维持肠壁完整性、限制肠漏 |
| `gut_microbiome` → `gut_barrier_leak` | 2 | 产硫化氢细菌可破坏肠壁密封并与炎症性肠病相关 |
| `gut_microbiome` → `gut_brain_axis` | 2 | 肠道菌群经迷走神经等通路与大脑双向交流 |
| `gut_microbiome` → `ibd_related` | 1 | 生态失调与代谢、IBD、癌症、神经精神等多类疾病相关 |
| `gut_microbiome` → `immune_balance` | 4 | 有益菌帮助免疫保持警戒而不进入持续防御 |
| `gut_microbiome` → `immune_resilience` | 3 | 菌群多样性是健康标志 |
| `gut_microbiome` → `obesity_risk` | 3 | 厚壁菌/拟杆菌比值与肥胖生物标志及菌群移植观察相关 |
| `lps` → `chronic_inflammation` | 2 | 入血 LPS 可触发强烈炎症反应 |
| `lps` → `neuroinflammation` | 2 | LPS 相关炎症信号参与神经炎症过程 |
| `probiotics` → `gut_barrier_integrity` | 3 | 益生菌有助于维持肠壁完整性 |
| `probiotics` → `immune_resilience` | 1 | 益生菌及早期菌群定植与呼吸道感染及过敏风险相关讨论 |
| `ultra_processed` → `gut_microbiome` | 2 | 西化低纤维高糖高脂饮食与菌群重塑相关 |
| `ultra_processed` → `obesity_risk` | 2 | 超加工食品与多种健康结局的叙述性综述 |
| `ultra_processed` → `type2_diabetes` | 1 | 儿童超重及相关饮食模式与糖尿病前期风险相关 |

## 章节覆盖

| spine | 章节 | 摘录数 |
|---|---|---|
| 0 | titlepage | skip：封面 titlepage（无正文） |
| 1 | 书名页 | skip：书名页（无论证正文） |
| 2 | 版权页 | skip：版权页（出版信息） |
| 3 | 作者简介 | skip：作者简介（人物介绍） |
| 4 | 肠菌明信片 | skip：肠菌明信片（短引语/装饰） |
| 5 | 推荐序 | 1 |
| 6 | 前言 | 7 |
| 7 | 目录 | skip：目录（无正文） |
| 8 | 一 “隐秘的世界”——微生物 | 33 |
| 9 | 二 人体是个“大江湖” | 132 |
| 10 | 三 肠脑，人的“第二大脑” | 45 |
| 11 | 四 肠脑和大脑，我该听谁的？ | 58 |
| 12 | 五 失衡的菌群，人体的灾难 | 89 |
| 13 | 参考文献 | skip：参考文献（文献列表，非主张正文） |
| 14 | 后记 | 2 |

章节内 skip / 弱主题记账：
- spine 8 小节1–3（初识微生物、分解者、真菌吸血鬼科普入门）：以显微镜轶事与分类科普为主，无直接饮食↔健康主张 → skip 或仅保留免疫/感染相关数条。
- spine 8 小节7–9 中纯细菌史/病毒结构科普段落：未逐段收录；保留抗生素耐药、益生菌、条件致病与免疫相关主张。
- spine 9「屁的学问」中温室气体/白蚁等纯环境旁支：未收录。
- spine 10 海鞘吃掉大脑等动物演化趣闻：未单独建边（肠脑重要性已由其他段落覆盖）。
- spine 10 果蝇交配偏好「真爱益生菌」营销式外推：skip。
- spine 11 食品工业营销策略长段：保留加工食品↔代谢/肥胖主张，跳过纯广告修辞。
- spine 12 AD 流行病学数字铺陈与药企新闻：弱主张未逐条收录；保留菌群/肠漏/污染/卫生假说核心论证。
- 菜谱/剂量处方：全书基本无菜谱；出现的「三联四联」为临床背景描述，relation 未写疗效剂量。

## 自检

- JSON 可解析；端点均 ∈ reuse ∪ new：是
- `(source,target)` 唯一：True（219 边）
- 摘录命中 FULLTEXT（抽样 8）：通过；零空摘录
- relation 无书框 / 无 limitations 键 / 无疗效剂量式 relation：通过
- seed / sources 未改：snapshot 与 live 哈希一致（`seed_snapshot_matches_live=True`）
- 计数一致：边 219 / 证据 367 / append 32 / 新节点 12 / 复用 72

## 入库说明

- **本目录仅为候选**；勿直接改 `data/seed_*` / `sources.json` / 产品文件。
- 入库须另开 TASK（建议 TASK-NS-076）：ingest 同端点 append evidences；sources 已有 `know_your_gut` 则更新 summary/admin 状态；新建 12 节点后拓扑约 173+12 / 591+（219−32）≈ **185 节点 / 778 边**（以实跑校验为准）。
- Brent 合并闸门后方可合入 main 并部署三站。
