# TASK-NS-014 交付说明

schema **0.3** / data **0.6**。权威种子路径未改：`data/seed_triples_v0.3_aligned.json`。未改 `ViewLayer`，未接过滤 UI，未合并。

## 回填策略

**每条边都显式写 `audience`。** 缺省与 `"general"` 语义相同；本种子选择显式写入，避免一半省略、一半写入。非机制节点**省略** `mechanism_depth`（省略 ≡ `summary`）。`type=mechanism` 的节点都写 `mechanism_depth`，默认 `"mechanism"`。没有用 `strength` 或 `citation` 自动升档，没有缩短任何 `limitations`，没有加入 patient 枚举。

## 规模（相对 data 0.5）

| 项 | 数量 |
|----|------|
| 节点 / 边 | 70 / 126（不变） |
| 带 `audience` 的边 | 126（全部） |
| `audience=general` | 123 |
| `audience=deep_reader` | 3 |
| `type=mechanism` 且带 `mechanism_depth` | 14（全部机制节点） |
| `mechanism_depth=mechanism` | 12 |
| `mechanism_depth=technical` | 2 |
| 非机制节点省略 `mechanism_depth` | 56 |

## 抽检表

审阅人 Carmack。日期 2026-10-31（Asia/Shanghai）。理由都是阅读对象或叙事用词，不是疗效、不是证据等级。

| id | field | reason | reviewer | date (Asia/Shanghai) |
|----|-------|--------|----------|----------------------|
| lit_fiber_gi_gill_2021 | audience=deep_reader | 专家综述，摘录在讲发酵、菌群和肠道功能，阅读单元是机制综述。`strength` 为 moderate，不是因为有 DOI 或强度高才升档。`limitations` 仍写明不能把综述当成临床效果，也不能外推为个体处方。 | Carmack | 2026-10-31 |
| lit_microbiome_colon_okeefe_2016 | audience=deep_reader | 摘录走多条代谢物通路，`direction` 为 mixed。标签表示通路阅读密度，不是保护方向的疗效档。`limitations` 仍写明不能外推为筛查结论或个体处方。其余六条带 citation 的边保持 general。 | Carmack | 2026-10-31 |
| lit_prebiotic_microbiome_sanders_2019 | audience=deep_reader | `strength` 为 low、`direction` 为 mixed，与「高强度自动升档」相反。摘录指向益生元与菌群的生物学综述。`limitations` 仍拒绝据此选产品和外推为个体处方，原文未缩短。 | Carmack | 2026-10-31 |
| lps | mechanism_depth=technical | 节点名和描述已经使用脂多糖、革兰阴性菌外膜、内毒素等术语。`technical` 只记录叙事用词密度，不提高或降低主张，边上的 `limitations` 未改。 | Carmack | 2026-10-31 |
| igf1_signaling | mechanism_depth=technical | 节点以 IGF-1 / 胰岛素样生长因子这种信号缩写命名，描述已写明这是信号讨论，不是化验单解读。`technical` 记录术语密度，不是临床分层。 | Carmack | 2026-10-31 |
| chronic_inflammation | mechanism_depth=mechanism | 抽检后保持机制默认。描述是低度炎症枢纽的机制说明，没有实验术语密度，不升 `technical`。 | Carmack | 2026-10-31 |
| gut_barrier_leak | mechanism_depth=mechanism | 抽检后保持机制默认。描述是屏障通透性的机制说明，不升 `technical`。 | Carmack | 2026-10-31 |
| lit_fiber_cvd_reynolds_2019 | audience=general | 结局关联综述。不因 `strength=high` 或存在 `citation` 升 `deep_reader`。 | Carmack | 2026-10-31 |
| lit_predimed_estruch_2018 | audience=general | 试验报告仍作为一般阅读单元。不因 `interventional` 或存在 `citation` 升档。`limitations` 未改。 | Carmack | 2026-10-31 |

## 校验

非法 `audience` / `mechanism_depth` 由 AJV 枚举硬失败。非机制节点标 `technical` 只警告，不失败。缺字段仍通过（`audience` 缺省 ≡ general，`mechanism_depth` 缺省 ≡ summary）。未要求字段与 `ViewLayer` 一致。

## 未做

- 未改 `ViewLayer`（仍为 `layperson` \| `expert`），未改默认 2D，未上 R3F 作为默认，未按 audience/depth 做 UI 过滤（留给 NS-012）。
- 未改种子文件名。
- 未合并。
