# ClearDiet · 《习惯的力量》抽取说明

## 书目
- source_id: `power_of_habit`
- title: 习惯的力量（精编图文版）
- authors: 查尔斯·都希格（EPUB creator 写作「杜希格」；以微信读书为准）
- ISBN: 9787508638010 · weread bookId 621673
- weread: https://weread.qq.com/web/reader/43a32f30597c6943ad87298
- source_file（拟）: `零散_习惯的力量_7Ue2cj0Ax.md`
- themes: health
- schema_align: seed snapshot data 2.7 / schema 0.7
- **未改 seed / sources / admin_books**；入库须另开 TASK + 人工合并闸门

## 主题门槛
只收饮食/营养/食物环境与健康疾病，以及明确连到健康结局的生活方式：运动、睡眠、吸烟、饮酒、赌博成瘾、压力、口腔疾病、医院医源性伤害、肥胖/体重、意志力训练带来的吸烟饮酒饮食改变等。
跳过：封面目录版权、纯商业/组织管理主体、市场营销与顾客怀孕画像主体、竞技教练手段主体、社会运动史、不带健康结局的泛化习惯建议、防晒霜推广。

## 章节覆盖与 skip

### 范围内（theme map）
- spine 05 前言 — 11 条摘录
- spine 08 第一章 习惯回路（正文） — 7 条摘录
- spine 10 第二章 渴求的大脑（正文） — 17 条摘录
- spine 12 第三章 习惯改变的黄金法则（正文） — 14 条摘录
- spine 15 第四章 核心习惯（正文） — 7 条摘录
- spine 17 第五章 星巴克和成功的习惯（正文） — 13 条摘录
- spine 19 第六章 危机就是转机（正文） — 10 条摘录
- spine 21 第七章 连锁销售（正文） — 初抽 2 条，验收判定为孕妇营销画像、非饮食健康，已全部移出边
- spine 26 第九章 自由意志的神经学（正文） — 7 条摘录
- spine 27 附录 读者实践指南 — 8 条摘录

### 跳过
- spine 00 封面 — 封面 titlepage
- spine 01 书名页 — 书名页
- spine 02 版权/CIP — 版权/CIP
- spine 03 目录 — 目录
- spine 04 献辞 — 献辞
- spine 06 第一部分 个体的习惯 — 第一部分题页
- spine 07 第一章 习惯回路（标题） — 第一章纯标题
- spine 09 第二章 渴求的大脑（标题） — 第二章纯标题
- spine 11 第三章 习惯改变的黄金法则（标题） — 第三章纯标题
- spine 13 第二部分 成功的组织机构习惯 — 第二部分题页
- spine 14 第四章 核心习惯（标题） — 第四章纯标题
- spine 16 第五章 星巴克和成功的习惯（标题） — 第五章纯标题
- spine 18 第六章 危机就是转机（标题） — 第六章纯标题
- spine 20 第七章 连锁销售（标题） — 第七章纯标题
- spine 22 第三部分 社会的习惯 — 第三部分题页
- spine 23 第八章 蒙哥马利公交车抵制（标题） — 第八章纯标题（社会运动，非健康主题）
- spine 24 第八章 蒙哥马利公交车抵制（正文） — 第八章正文蒙哥马利公交车抵制/社会运动史，非健康主题
- spine 25 第九章 自由意志的神经学（标题） — 第九章纯标题
- spine 28 译后记 — 译后记
- spine 29 注释/参考文献或宣传 — 宣传/书评页
- spine 30 中信Kindle热书榜 — 中信Kindle热书榜

### 策展后未入边的摘录（有意跳过）
- `poh_c05_p11`：前言书目总览（组织/社会运动段落），健康信号弱（未写入摘录.md）
- `poh_c10_p18`：防晒霜普及率对照，非本书饮食/生活方式主线（未写入摘录.md）

### 独立验收后移出边的摘录
错挂或主题不支撑端点对，已从 `候选边.json` 剔除（原文仍保留在摘录.md，便于复核）：
- 整边删除：`alcohol→obesity_risk`（章末综述未谈酒精与体重）、`smoking→psychological_stress`（戒酒复发/戒烟建议未支撑「吸烟缓解压力」）、`added_sugar→obesity_risk`（快餐苏打水句不支撑该 live relation）、`psychological_stress→appetite_regulation`（换点心习惯未提及压力）
- `medical_care_exposure→iatrogenic_harm`：移出饼干意志力/学习习惯/术后康复计划等非医疗失误段落；补挂 `poh_c17_p5`（医师在高强度任务后出现低级医疗错误）
- 牙膏营销段落（`poh_c10_p2`–`p4`/`p14`/`p15`）移出 `added_sugar→oral_disease`，仅保留高糖精制食品与龋齿的原文
- Target 孕妇营销（`poh_c21_p1`/`p2`）移出超加工相关边
- 其他：意志力/成绩/理财方案等未连到对应健康结局的段落
- 改挂：`poh_c12_p9` → `craving→smoking`；`poh_c12_p10` → `alcohol→psychological_stress`

## 计数（独立验收后）
| 项 | 值 |
|---|---|
| candidate_links（边） | 31 |
| evidence 贡献 | 116 |
| 原文摘录条数 | 96（入边 74；验收后未入边 22） |
| append 端点对 | 15 |
| 新建端点对 | 16 |
| 新节点 | 3 |
| 复用节点 | 18 |

**evidence_count vs edge_count**：116 条证据贡献归并到 31 条唯一 `(source,target)` 边（同端点多摘录进 `evidences[]`）。

## 新节点
- `smoking` · 吸烟 / 烟草暴露 (mechanism)
- `craving` · 渴求 / 奖赏预期 (mechanism)
- `gambling_addiction` · 赌博成瘾 / 强迫性赌博 (disease)

## 复用节点（18）
`added_sugar`, `aerobic_exercise`, `alcohol`, `appetite_regulation`, `cardiometabolic`, `chronic_disease`, `cognitive_clarity`, `energy_vitality`, `healthy_weight`, `iatrogenic_harm`, `medical_care_exposure`, `mental_health`, `obesity_risk`, `oral_disease`, `physical_inactivity`, `psychological_stress`, `refined_carbs`, `ultra_processed`

## append vs 新建
- append=15：与 `seed_snapshot.pair_relations` 交集；**relation 原文复制 live**，未改写
- create=16：撰写公共观察 relation（无「书中/本书/作者认为…」）

## relation 自检
- 扫描 `书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述`：见 `_selfcheck.json`
- 无疗效承诺/剂量建议；观察句式（与…相关 / 关联观察）
- 无 `limitations` 键

## 可靠性自检（摘要）
详见 `_selfcheck.json` / `_selfcheck.py`：
- JSON 可解析；端点 ∈ reuse ∪ new
- 每条 evidence 为 FULLTEXT 子串（全量）
- `(source,target)` 唯一
- 摘录.md 的 `## poh_c` 覆盖全部 evidence id
- append 数与 live 交集一致；0 改写 live relation
- 未改 seed

## 抽检 ≥3
- poh_c05_p7 → (smoking → obesity_risk)
- poh_c15_p6 → (appetite_regulation → obesity_risk)
- poh_c19_p3 → (medical_care_exposure → iatrogenic_harm)

## 入库提示
- admin 已有 `power_of_habit`（index_only）；sources 尚无 → 入库 TASK 需新建 source 并 `index_only → ingested`
- 同端点必须 append evidences，禁止平行边
- 勿直接改本目录之外的 seed

## 不确定项
- 书中「低血糖」仅附录饼干习惯假设一句，未单建 glucose 节点
- 意志力训练与健康行为的链条以运动/吸烟/饮酒/医源性伤害边表达，未新建 willpower 节点（避免泛化）
- spine 21 怀孕预测为营销，验收后未保留入边（初抽的两条亦非货架零食）
- 美铝工人安全/婴儿死亡率—营养教育长段偏组织史与公共政策，未抽入边（婴儿死亡率无现网节点；营养教育链条过间接）
- `gambling_addiction→cognitive_clarity`：用现网「认知清晰」承接「差点儿赢」的信息处理差异，是较近但非完美的端点
