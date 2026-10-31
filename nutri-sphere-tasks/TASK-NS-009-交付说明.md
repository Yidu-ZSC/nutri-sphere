# TASK-NS-009 交付说明

阶段 A：书摘轨扩到 **data_version 0.4**，`schema_version` 仍为 **0.1**。权威种子路径未改：`data/seed_triples_v0.3_aligned.json`。未做阶段 B（无 `citation`、无 DOI），未合并。

## 规模

- 24 节点 / 20 边 → **69 节点 / 117 边**（+45 / +97）
- 四列：膳食/食物 23 · 营养素/代谢物 21 · 机制 14 · 疾病/结局 11
- 新增边证据：`book_notes_mechanistic` / `book_notes_observational_synthesis`。没有 interventional。
- 候选清单：`data/v0.4_candidate_edges.tsv`

## 复现

```bash
npm ci
npm run validate:data
npm test
npm run build
npm run dev
```

打开首页。顶栏「2D 层次」为按下状态，四列标题仍在。统计为 `69 节点 · 117 关联`，数据 v0.4。免责声明原文未改。

## 截图

桌面默认 2D 层次：`/opt/cursor/artifacts/desktop_2d_hierarchy_data_0_4.webp`

## 约束核对

- 未改 `seed_triples_v0.1.json`、`seed_triples_v0.2_full_kb.json`、`graph_schema.json`、默认 2D 布局逻辑。
- 原 20 条 excerpt 未改写。新边 `note_id` 不用 `related` / `multiple`。
- `ultra_processed`、`autoimmune` 各有跨列边。
- 两个教育向生物标志（CRP、糖化血红蛋白）不带参考区间或判读。
- `npm run validate:data`、`npm test`、`npm run build` 已通过。
