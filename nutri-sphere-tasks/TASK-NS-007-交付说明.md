# TASK-NS-007 交付说明

默认主视图改为 **2D 层次通路**（`react-force-graph-2d`），3D 降为可选探索，并按选项 A 减噪。未扩种子，未合并到 `main`。

## 行为

- 打开应用默认是四列 2D 通路：膳食/食物 → 营养素/代谢物 → 机制 → 疾病/结局。边是直线，颜色表示方向，线宽表示强度。
- 顶栏切换 **「2D 层次 | 3D 探索」**。选择写入 `localStorage`（`nutrisphere.graphView`），并进入分享 URL 的 `view` 参数。刷新后记住；没有记录时仍是 2D。
- 点「2D 层次」或「3D 探索」都会回到层次分列。旧链接里的 `layout=force` 仍然有效。
- 3D 探索：层次 z 微扰为 0，视野角收到 32°，线宽约为 Phase 1.5 的四分之一量级，不透明度 0.4，空闲时只显示机制列标签，粒子只在筛选或选中边上出现。
- 侧栏、免责声明、主题、隐藏非匹配、搜索、普通/专家、证据徽章、图例、URL 分享保持原行为。无 WebGL 时 2D 仍可显示；只有切到 3D 才会提示无法创建 WebGL。

## 复现

```bash
npm ci
npm test
npm run validate:data
npm run build
npm run dev
```

1. 打开首页（清掉 `localStorage` 的 `nutrisphere.graphView` 或使用无 `view` 参数的地址）。应看到 2D 四列通路，顶栏「2D 层次」为按下状态。统计为 `24 节点 · 20 关联`。
2. 点「3D 探索」。画布换成正面的层次 3D，边更细，机制列以外的标签默认收起。刷新后仍停留在 3D。
3. 再点「2D 层次」回到平面通路。刷新后仍是 2D。
4. 搜索「慢性炎症」打开侧栏，确认证据徽章与免责声明仍在。

## 截图

桌面 1440×900：

- 默认 2D 层次（空闲）：`/opt/cursor/artifacts/TASK-NS-007-desktop-2d-hierarchy-idle.png`
- 切到 3D 探索之后：`/opt/cursor/artifacts/TASK-NS-007-desktop-3d-explore.png`

## 约束核对

- 种子仍是 `data/seed_triples_v0.3_aligned.json` 的 24 节点 / 20 边，原文未改。
- 未引入 R3F，未改免责声明与医疗文案，未发明 GRADE High。
- `npm test`、`npm run validate:data`、`npm run build` 在本环境通过。
