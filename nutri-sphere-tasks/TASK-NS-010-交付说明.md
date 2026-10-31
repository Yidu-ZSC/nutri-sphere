# TASK-NS-010 交付说明

阶段 B：可选 `citation` 进入 **schema_version 0.2**，权威种子 **data_version 0.5**。路径仍是 `data/seed_triples_v0.3_aligned.json`。未合并。

## 规模

- 69 节点 / 117 边 → **70 节点 / 126 边**（+1 节点 `mediterranean_diet`，+9 条 `lit_*` 文献边）
- 文献边：`observational` 3，`expert_synthesis` 5，`interventional` 1
- 阶段 A 的 117 条书摘边及其 excerpt 未改写
- 未使用已撤回 DOI `10.1056/NEJMoa1200303`；地中海边使用更正再发表 `10.1056/NEJMoa1800389`

## DOI 核验

核验日期 **2026-10-31**（Asia/Shanghai）。每条 DOI 均用 Crossref 与 `https://doi.org/{doi}` 核对题名，题名一致后才写入。CI 不实时解析 DOI。

| link.id | doi | Crossref 题名一致? | 解析日期 (Asia/Shanghai) | evidence_type | source→target |
|---------|-----|--------------------|--------------------------|---------------|---------------|
| lit_fiber_cvd_reynolds_2019 | 10.1016/S0140-6736(18)31809-9 | 是 | 2026-10-31 | expert_synthesis | dietary_fiber→cardiometabolic |
| lit_plant_quality_mortality_baden_2019 | 10.1161/CIRCULATIONAHA.119.041014 | 是 | 2026-10-31 | observational | plant_based_diet→cardiometabolic |
| lit_upf_cvd_srour_2019 | 10.1136/bmj.l1451 | 是 | 2026-10-31 | observational | ultra_processed→cardiometabolic |
| lit_red_meat_mortality_zheng_2019 | 10.1136/bmj.l2110 | 是 | 2026-10-31 | observational | red_meat→cardiometabolic |
| lit_fiber_gi_gill_2021 | 10.1038/s41575-020-00375-4 | 是 | 2026-10-31 | expert_synthesis | dietary_fiber→gut_microbiome |
| lit_microbiome_colon_okeefe_2016 | 10.1038/nrgastro.2016.165 | 是 | 2026-10-31 | expert_synthesis | gut_microbiome→digestive_cancer_risk |
| lit_predimed_estruch_2018 | 10.1056/NEJMoa1800389 | 是 | 2026-10-31 | interventional | mediterranean_diet→cardiometabolic |
| lit_upf_outcomes_elizabeth_2020 | 10.3390/nu12071955 | 是 | 2026-10-31 | expert_synthesis | ultra_processed→obesity_risk |
| lit_prebiotic_microbiome_sanders_2019 | 10.1038/s41575-019-0173-3 | 是 | 2026-10-31 | expert_synthesis | dietary_fiber→gut_microbiome |

Gill 2021：Crossref `published-print` 为 2021-02，在线发表为 2020-11-18。`citation.year` 取印刷年 2021。其余年份与 Crossref `issued` 年一致。PMID 来自 Europe PMC 或 NCBI esearch，与同一 DOI 对应。

## 校验

`npm run validate:data`、`npm test`（50 通过）、`npm run build` 均已通过。带 `citation` 的边须通过 AJV，且 `evidence_type` 不得以 `book_notes_` 开头。citation 边数量断言为 5–15。

## 界面

默认仍为 2D 层次。书摘边徽章保留「书摘」；文献边徽章不含「书摘」，并有「文献」chip。侧栏展示题名、作者、年份，DOI / PMID 可点击。文献阶梯文案已去掉「（后续）」。无 GRADE。免责声明原文未改。

## 截图

- 桌面默认 2D：`/opt/cursor/artifacts/desktop_2d_default.webp`
- 书摘边侧栏：`/opt/cursor/artifacts/drawer_book_notes_glutathione.webp`
- 文献边侧栏：`/opt/cursor/artifacts/drawer_literature_predimed.webp`

## 已知局限

- 文献摘录是中立释义，不是期刊摘要全文。
- 红肉边为 `mixed`：队列报告的是摄入增加与较高死亡风险相关，但替代模型和更广文献并不整齐。
- Sanders 边只把益生元/纤维一侧接到菌群，不覆盖益生菌产品。
- 未接入开放数据整库，未锁 `evidence_type` 的 AJV enum。
