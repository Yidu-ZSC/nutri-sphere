# TASK-NS-008 · Phase 2 数据扩容研究

| 字段 | 内容 |
|------|------|
| TASK-ID | TASK-NS-008 |
| 标题 | Phase 2 数据扩容研究（研究优先，不改代码） |
| Owner | Altman · 产品（主笔）；Carmack · 工程（只读支援） |
| 状态 | 待验（Trump） |
| 交付路径 | `/workspace/nutri-sphere-tasks/TASK-NS-008-数据扩容研究.md`（原样落入仓库 `docs/TASK-NS-008-数据扩容研究.md`） |
| 仓库基线 | https://github.com/Yidu-ZSC/nutri-sphere · `main` = `e0b80ef3`（NS-007 2D 默认已合入） |
| 线上 | https://yidu-zsc.github.io/nutri-sphere/ |
| 种子事实 | `data/seed_triples_v0.3_aligned.json`：**24 nodes / 20 links**；`schema_version` **0.1** / `data_version` **0.3** |
| 工程要点 | `/workspace/nutri-sphere-tasks/TASK-NS-008-工程只读要点.md`（Carmack，2026-10-31） |
| 已拍板对齐 | 不上 R3F（NS-005）；默认 2D 分层通路（NS-006/007）；证据不标 GRADE（NS-003 A）；Phase 2 **数据双轨**（NS-003 拍板 #3 **C**：书摘扩容 + DOI 金标准样例边） |
| 本单约束 | **只读研究**：不改应用代码、不删数据、不对外发布、不爬虫、不付费；不推翻 2D 默认 / 不上 R3F |
| Brent 增补 | §10 竞品与类似项目调研（中英；学术+商业+数据集）；Carmack 不参与增补 |

---

## 0. 一句话结论

**Phase 2 扩容应走「书摘达可读规模 + 少量 DOI 金标准样例边」双轨：先在现 schema 0.1 内把饮食侧桥接与孤儿节点补齐（目标约 60–90 节点 / 80–140 边，`data_version` → 0.4），再小步加可选 `citation` 字段并挂 5–15 条可外链文献边；开放数据集（GBD/FAO/NOVA 等）整库接入标【需 Brent 批准】、本阶段不做。**  
当前 24/20 的主缺口不是「缺炫技字段」，而是：**食物/膳食列过稀、2 个孤儿节点、证据几乎全是书摘、可选溯源字段（aliases/description/DOI）未产品化**——这些直接削弱 2D 四列通路的阅读完整性。  
竞品（§10）显示 FoodAtlas/MeNu 等学术 KG 体量巨大但缺教育向分层通路；Examine 等证据站强于表卡弱于机制列——**加固**「不做规模军备、坚持 2D 通路 + 双轨证据」的差异化，并略微提高 DOI 样例边优先级。

---

## 1. 本项目需要哪些类型的数据（字段级）

对齐权威文件：`docs/GRAPH_SCHEMA.md`（人读）、`data/graph_schema.json`（AJV）、运行时唯一种子 `data/seed_triples_v0.3_aligned.json`。  
2D 分层通路列序（`src/lib/layout.ts` · `COLUMN_CAPTIONS`）：

| 列 | 节点 type | 用户心智 |
|----|-----------|----------|
| 0 膳食/食物 | `diet_pattern` · `food_category` · `food` | 入口：「吃什么」 |
| 1 营养素/代谢物 | `nutrient` · `compound` · `metabolite` | 中间物 |
| 2 机制 | `mechanism` | 生物学过程 |
| 3 疾病/结局 | `disease` · `biomarker` | 健康相关结局（教育向） |

### 1.1 节点类型（schema enum，九类）

| type | 含义 | 种子 n | 对 2D 分层阅读的作用 |
|------|------|--------|----------------------|
| `diet_pattern` | 整体膳食模式 | 1 | **列 0 锚点**；用户从「模式」扫到机制/结局；过少则左侧空、心智从机制倒推 |
| `food_category` | 食物大类 | 2 | 列 0 粗粒度入口；适合过滤与主题入口（如动物性/超加工） |
| `food` | 具体食物 | 3 | 列 0 细粒度；桥接到营养素/机制；过少则「饮食」感弱于「机制岛」 |
| `nutrient` | 营养素/生物活性 | 2 | **列 1**；膳食→机制的可解释中间层 |
| `compound` | 特定化合物 | 1 | 列 1；机制叙事细节（如谷胱甘肽） |
| `metabolite` | 宿主/菌群代谢物 | 1 | 列 1；菌群通路可读性关键（如 SCFA） |
| `mechanism` | 生物机制 | **9** | **列 2 枢纽**；度数常最高；过多而食物少 → 中心毛团感（即使 2D） |
| `disease` | 健康结局/疾病风险（关联向） | 5 | **列 3**；过滤控件数据源；须有入边才可探索 |
| `biomarker` | 可测标记（未来） | **0** | schema 已有，**无需 schema bump 即可加入**；落列 3；适合教育「关联到可测指标」但禁诊疗解读 |

### 1.2 节点属性字段

| 字段 | 必填? | 约束 / 取值 | 种子填充 | 对 2D 阅读的作用 |
|------|-------|-------------|---------|------------------|
| `id` | **必填** | 唯一 snake_case | 24/24 | 边引用、去重、URL/分享稳定键 |
| `type` | **必填** | 上表九类 enum | 24/24 | **决定所在列**、形状/图例、过滤维度 |
| `label` | **必填** | 展示名（中文优先） | 24/24 | 画布标签；过长会在列内重叠（扩容须控长度） |
| `group` | **必填** | `protective` \| `risk` \| `neutral` \| `mixed` | 24/24（P12/R12；节点无 neutral/mixed） | 节点着色；与边 `direction` 共同建立「方向」心智 |
| `description` | 选填 | 短说明 | **仅 2/24** | 侧栏首屏白话；缺则专家视图空洞 |
| `aliases` | 选填 | string[] | **0/24** | 搜索召回（中英别名）；对「膳食纤维/益生元」类多名实体关键 |
| `sources` | 选填 | 文件或引用列表 | **0/24** | 节点级溯源；与边级证据互补 |
| `metadata` | 选填 | 对象 | 未用 | 扩展槽；勿塞疗效结论 |

> AJV：`additionalProperties: true`（节点/边均可加扩展键，但不代表 UI 已消费）。

### 1.3 边 · 关系类型与方向

边 **没有** 封闭的 `relation` enum：`relation` 为**自由 string**（人读短语）。认知编码主要靠：

| 字段 | 必填? | 取值 | 种子 | 对 2D 阅读的作用 |
|------|-------|------|------|------------------|
| `source` / `target` | **必填** | 必须 ∈ nodes.id | 20/20 合法 | 画跨列弧；断链/孤儿破坏通路扫读 |
| `relation` | **必填** | 自由中文短语 | 20 各异 | 侧栏标题；**不宜过长**（tooltip） |
| `direction` | **必填** | `protective` \| `risk` \| `neutral` \| `mixed` | P12 / R6 / mixed2 / neutral0 | **边颜色**；普通视图「保护/风险」主信号 |
| `evidence_type` | **必填** | **AJV 仅 `string`，未 enum 锁死**；文档建议值见下 | 见 §1.4 | 证据徽章；防把书摘误读为 RCT |
| `strength` | 选填 | `low` \| `moderate` \| `high` \| `quantitative` | 20/20 有（mod15/high5） | **线宽**；缺则视觉权重塌平 |
| `weight` | 选填 | 0.0–1.0 | **未用** | 未来定量边；现可派生自 strength，非 P0 |

**推荐通路形状（产品约定，非 schema 强制）**：优先跨列边  
`列0 → 列1 → 列2 → 列3`，允许少量同列/跳跃边，但扩容时应避免「机制↔机制」独大而食物无出边。

### 1.4 证据与来源字段

文档列出的 `evidence_type` 取值（**CI 目前不校验是否在列表内**）：

| evidence_type | 含义 | 种子 n |
|---------------|------|--------|
| `book_notes_mechanistic` | 书摘·机制描述 | **18** |
| `book_notes_observational_synthesis` | 书摘·观察性综述 | **2** |
| `observational` | 队列/病例对照等（开放/文献） | 0 |
| `mechanistic` | 实验/实验室机制（非书摘） | 0 |
| `interventional` | RCT/干预 | 0 |
| `ecological` | 人群/国家层相关 | 0 |
| `expert_synthesis` | 综述/指南综合 | 0 |

| 字段 | 必填? | 种子 | CI | 对阅读的作用 |
|------|-------|------|-----|--------------|
| `source_file` | 选填（产品应视为实质必填） | **20/20** | 不强制 | 侧栏「来源文件」；书摘轨溯源 |
| `note_id` | 选填 | 20/20（其中 `related`/`multiple` 共 9） | 不强制 | 回链知识库笔记；占位值削弱精确溯源 |
| `excerpt` | 选填 | 20/20 | **长度 ≤300** 硬失败 | 侧栏摘录；**不得改写原文** |
| `limitations` | 选填（CI **非空硬失败**） | 20/20 | **缺失/空白失败** | 置顶局限；合规关键 |
| `dose_response` | 选填 | **未用** | — | 专家视图剂量叙事（教育向） |
| `population` | 选填 | **未用** | — | 标明生态 vs 个体，防过度外推 |
| `id`（边） | 选填 | 未用 | — | 稳定引用/去重键（扩容后建议补） |
| `citation`（**提案**） | 选填对象 | **尚无** | — | DOI/PMID 金标准轨；**增字段需 schema 小版本**（见拍板） |

**已拍板表述**：UI 用现有 `evidence_type` + `strength` 徽章，**不**对书摘标 GRADE High/Moderate 等官方等级。

### 1.5 meta（文件级）

当前种子：

```text
schema_version: "0.1"
data_version: "0.3"
extracted_from / extraction_date / note / disclaimer
```

- **只增节点/边、字段仍符合现 enum** → 通常只 bump **`data_version`**（如 0.3 → 0.4）。  
- **改/增 enum、必填、结构** → bump **`schema_version`**，同步 `GRAPH_SCHEMA.md` + `graph_schema.json` + TS 类型/可视化映射 + 迁移说明。  
- AJV **不强制** meta 内各子键 required；产品仍应始终带齐 `disclaimer`。

### 1.6 CI / 加载路径（工程边界，扩容必须遵守）

硬失败（`scripts/validate-data.mjs`）：

1. AJV 相对 `data/graph_schema.json` 失败  
2. `nodes[].id` 重复  
3. `links[].source|target` 不在 nodes  
4. `limitations` 缺失或空白  
5. `excerpt` 长度 > 300  

**不校验**：节点/边数量下限；`evidence_type` 是否 ∈ 文档列表；`strength` 是否存在；`description`/`aliases` 是否填写；旧 seed v0.1/v0.2。

运行时**唯一**加载：`data/seed_triples_v0.3_aligned.json`（`loadGraph.ts` + Vite `nutriSeedPlugin`）。换文件名必须同步改三处路径常量。历史 `v0.1` / `v0.2` **不进** `validate:data`。

---

## 2. 对照 24/20 的缺口（P0 / P1 / P2）

### 2.1 现状快照（事实）

| 维度 | 事实 |
|------|------|
| 规模 | 24 节点 / 20 边 |
| type 分布 | mechanism9 · disease5 · food3 · food_category2 · nutrient2 · diet_pattern1 · compound1 · metabolite1 · **biomarker0** |
| 节点 group | protective12 · risk12 · neutral0 · mixed0 |
| 边 direction | P12 · R6 · mixed2 · neutral0 |
| 证据 | 书摘机制 18 + 书摘观察综述 2；**无** observational / interventional / expert_synthesis 等 |
| strength | moderate15 · high5 · low0 · quantitative0 |
| 孤儿（度=0） | **`ultra_processed`**、**`autoimmune`** |
| 枢纽 | `chronic_inflammation` 度 7；机制列过密、膳食列稀疏 |
| 书摘来源文件（6） | 惊人的蔬菜汤 · 吃出自愈力 · 救命饮食中国健康调查报告 · 救命逆转… · 菌群大脑 · 晓肚知肠 |
| 字段空洞 | description 2/24；aliases/sources 全空；dose_response/population/weight/边 id 几乎未用；无 DOI/citation |

### 2.2 缺口表

| ID | 缺口 | 为何重要（相对 2D 通路） | 优先级 |
|----|------|-------------------------|--------|
| G1 | 列 0 过稀（diet1+category2+food3）vs 机制 9 | 用户心智「饮食→…」左侧空；主题过滤后易只剩中心机制 | **P0** |
| G2 | 孤儿 `ultra_processed`、`autoimmune` | 出现在图例/过滤但无通路；损害「可探索」信任 | **P0** |
| G3 | 饮食→结局桥接不足（如 animal_foods 仅 1 边；多疾病单入边） | 列 0→3 扫读断裂；what-if/路径高亮无原料 | **P0** |
| G4 | 证据几乎全是 `book_notes_*` | 专业感不足；无法演示「书摘 vs 文献」阶梯（双轨 B 腿） | **P0**（样例边） |
| G5 | `note_id` 占位（`related`/`multiple`×9） | 精确回链弱；维护者难审计 | **P1** |
| G6 | `description`/`aliases` 空 | 侧栏与搜索体验差 | **P1** |
| G7 | 无 `biomarker` | schema 已预留；缺少「结局可测」教育层（非诊疗） | **P1**（少量试点） |
| G8 | 未用 `population` / `dose_response` | 专家视图难标生态局限与剂量语境 | **P1**（随新边填写） |
| G9 | 无 `citation`/{doi,pmid} | 金标准轨无法外链；NS-003 已规划 | **P1**（schema 小改，**需拍板**） |
| G10 | 无边稳定 `id`；relation 自由文本难聚合 | 去重与统计弱 | **P2** |
| G11 | 开放数据整库（GBD/FAO/NOVA…）未接入 | ROADMAP Phase 2 项；人群层关联可丰富列 0/3，但许可与叙事风险高 | **P2**（**需 Brent 批准**后另开规格） |
| G12 | `evidence_type` AJV 未 enum | 可写入任意字符串混入脏数据 | **P2**（锁死算 schema 变更，**需拍板**） |
| G13 | 目标「知识平台」观感（NS-003：约 80–150 / 120–250） | 24/20 偏演示；但须**先**可读再灌量（NS-006 已先换 2D） | **P0→分阶段** |

### 2.3 不做的缺口（本阶段明确排除）

- 疗效/诊疗/个性化医疗建议字段或文案  
- 正式 GRADE 官方等级标签  
- R3F / 换渲染器（与数据扩容解耦）  
- 大规模爬虫、批量付费采购（仅可作选项，见 §6）  
- 改写书摘 `excerpt` 原文  

---

## 3. 可执行扩容路径（三阶段）

对齐已拍板 **双轨 C**：A=书摘扩容达可读规模；B=少量 DOI 金标准样例边。开放数据整库为可选后续。

### 阶段 A · 书摘轨补洞与达可读规模（建议第一批准入）

| 项 | 内容 |
|----|------|
| **目标规模** | **约 60–90 节点 / 80–140 边**（相对现 24/20；未到 NS-003 上限，先验证 2D 可读） |
| **`meta`** | `data_version`: **"0.4"**；保持 `schema_version`: **"0.1"** |
| **数据来源** | **自建 curated**：只读引用知识库 / 微信读书导出书摘（与现 `source_file` 同族及 NS-003 所述高相关书）；**不改写** excerpt；新边必填 limitations |
| **优先补什么** | ① 孤儿边：`ultra_processed`、`autoimmune` 至少各 1 条合法跨列边；② 列 0 食物/类别/模式与列 1–2 桥；③ 为度数=1 的疾病补膳食侧入边；④ 为高频节点补 `description` + 1–3 个 `aliases` |
| **质量标准** | 过现 CI；每边 `limitations` 非空、`excerpt`≤300 且可回源；`direction`/`evidence_type`/`strength` 齐全；禁止疗效句；去重键建议 `source+target+relation+source_file+note_id` |
| **schema** | **兼容，不 bump schema**；可用已有 enum（含加入 `biomarker` 节点） |
| **合规** | 书摘版权：仅短摘录+出处；知识库只读；教育免责声明保留 |
| **工作量（估）** | **2–4 人日**（含校验与 copy-guard）；Grok 内 Carmack 可执行 |
| **可视化** | 不改默认 2D；扩后依赖既有过滤/标签策略；若列内 >~12 节点再开密度单 |

### 阶段 B · DOI 金标准样例边（双轨 B 腿）

| 项 | 内容 |
|----|------|
| **目标规模** | **+5–15 条边**（可复用阶段 A 节点；新增节点 ≤10）；样例覆盖至少：`observational` 与 `expert_synthesis`（或 `interventional`）各若干 |
| **`meta`** | `data_version` → **0.5**（若与 A 同 PR 可一次到 0.5）；若引入 `citation` → **`schema_version` → 0.2** + 迁移说明 |
| **数据来源** | **公开文献元数据**：人工从 PubMed / 开放获取综述选取（**手选，非爬虫**）；DOI/PMID 填入 `citation`；`excerpt` 用**公开摘要句或自写中立释义**并在 limitations 标明「非书摘原文」 |
| **质量标准** | 每条金标准边：可点击 DOI 或 PMID；`evidence_type` ≠ `book_notes_*`；limitations 写清研究设计局限；UI 徽章强制区分书摘 vs 文献 |
| **schema** | **提案**（【需 Brent 拍板】）：links 增可选 `citation: { title?, authors?, year?, doi?, pmid?, url? }`；AJV 可选对象；TS/侧栏消费 |
| **合规** | 尊重出版社版权：不整篇粘贴；优先开放摘要；不暗示指南推荐即「该吃什么」 |
| **工作量（估）** | schema+UI 展示 **1–2 人日**；选文与录入 **1–2 人日** |
| **与 A 顺序** | 可 **A 先合入 0.4**，再 B；或同迭代但分 commit |

### 阶段 C · 开放数据 / 分类层补充（可选，另规格）

| 项 | 内容 |
|----|------|
| **目标规模** | 视源而定；建议先 **试点映射表**（如 NOVA 类别 ↔ 现有 `food_category`），而非一次灌入千级节点 |
| **候选源（名称真实；许可「待确认 / 需批准」）** | IHME **GBD**（ghdx.healthdata.org）· **FAO** FAOSTAT · **Open Food Facts**（社区许可，常 ODbL——整库再分发需确认）· Nutri-Score/NOVA **公开表**（来源与再分发条款待确认）· Hetionet 等（许可待确认；且领域是生信 KG，映射成本高） |
| **来源策略** | 公开数据集 extract → `/data/open/` + 处理说明；**合成补充**仅用于布局占位时必须标 `evidence_type` 不适用并 **禁止进生产边** |
| **质量标准** | 人群/供应层关联 ≠ 个体因果；边必须 `population`/`limitations` 标明 ecological；**禁止**输出个体风险分数 |
| **schema** | 可能增节点属性或边 `evidence_type: ecological` 的产品规则；大改标拍板 |
| **工作量** | 规格 + 试点 **≥1 周**；建议升级 Cursor 做管线 |
| **门槛** | **整库接入、付费源、爬虫：一律【需 Brent 批准】**；本 NS-008 **不启动** |

### 三阶段总览

```text
A 书摘补洞 → data 0.4（schema 0.1）→ 可读规模 + 无孤儿
        ↓
B 金标准样例 → data 0.5 + 可选 schema 0.2（citation）→ 证据阶梯可见
        ↓
C 开放数据试点 → 另开任务 + Brent 批许可 → 人群/分类层
```

---

## 4. 若 Brent 批准：第一阶段具体做什么

**建议批准范围 = 阶段 A（书摘轨），并原则批准阶段 B 的「样例边 + 可选 citation」设计（实现可紧随 A）。阶段 C 仅知情，不授权执行。**

### 4.1 第一阶段（A）任务包 — 由 Carmack 执行

1. **盘点可抽取书摘**：对照现 6 个 `source_file` 及知识库高相关清单；列出候选三元组（食物/模式 → 机制/营养素 → 结局），每条标注拟用 `note_id` 与是否截断风险。  
2. **补孤儿**：为 `ultra_processed`、`autoimmune` 各至少 1 条边（跨列优先），字段齐备过 CI。  
3. **扩列 0–1**：新增若干 `food` / `food_category` / `nutrient`（或复用），并建立到机制/结局的边；控制 `label` 长度。  
4. **字段补强**：对度≥3 或主题入口节点补 `description`；搜索友好节点补 `aliases`。  
5. **可选试点**：1–3 个 `biomarker` 节点（列 3）+ 教育向关联边（禁诊疗解读文案）。  
6. **版本与校验**：更新同一权威文件或按工程约定 bump 文件策略；`meta.data_version` → `0.4`；`npm run validate:data` + `npm test` + copy-guard；**不改**渲染默认 2D / 不上 R3F。  
7. **文档**：`data/README.md` 简述 0.4 增量与来源文件列表；changelog 一行。

### 4.2 工作量与通道

| 项 | 估计 |
|----|------|
| 阶段 A 合计 | **约 2–4 人日** |
| 执行人 | **Carmack** |
| 通道 | Grok 内可完成 JSON 扩容 + CI；若需大批量本地对照 PDF/微信读书导出，**Mac 源只读**由 Brent 提供摘录路径，代理不改 Mac 文件 |
| 验收 | Trump 对照 §5 清单；Brent 抽查 3 条边溯源与免责 |

### 4.3 阶段 B（批准后第二批，可预告）

- 合入可选 `citation`（schema 0.2）或先用 `metadata.citation` **过渡**（若 Brent 希望暂不 bump schema——见拍板 #2）。  
- 手选 5–15 条公开文献边；侧栏展示外链。  

---

## 5. 若批准，Carmack 第一批任务（可勾选）

- [ ] **T1** 只读锁定权威种子路径与 CI 脚本；确认不改 `v0.1`/`v0.2` 历史稿。  
- [ ] **T2** 输出候选边清单表（建议 TSV/MD）：source → target → relation → evidence_type → source_file → note_id → excerpt 草稿 → limitations；**不改写**已有 20 条 excerpt。  
- [ ] **T3** 修复孤儿：`ultra_processed`、`autoimmune` 入图有边。  
- [ ] **T4** 新增节点/边至约 **60–90 / 80–140** 量级（可分 PR：先补洞小 PR，再扩容 PR）。  
- [ ] **T5** 补 `description`/`aliases`（至少覆盖列 0 全部 + 度≥3 机制）。  
- [ ] **T6** `meta.data_version` → `0.4`；保持 `schema_version` `0.1`；跑通 `validate:data` / `test` / `build`。  
- [ ] **T7** PR 说明含：增量统计、来源文件、已知局限、免责未改；截图 2D 四列确认无回归（不上 R3F、不改默认视图逻辑除非标签密度必要且另说明）。  
- [ ] **T8**（若 Brent 已批 citation）另开子任务：schema 0.2 + 5–15 金标准边；否则停在 T7。

**禁止（执行时）**：爬虫；付费 API 批量拉数；编造 DOI；把书摘标成 interventional/GRADE；疗效文案；删现有节点「图省事」。

---

## 6. 需 Brent 拍板事项（单独汇总）

| # | 事项 | 选项（建议默认加粗） | 若选其他 |
|---|------|----------------------|----------|
| 1 | **阶段 A 规模目标** | **A. 60–90 节点 / 80–140 边（推荐）** · B. 直接冲 80–150 / 120–250 · C. 仅补孤儿+描述（<40 节点） | B 需更强标签密度方案；C 不足以支撑「知识平台」观感 |
| 2 | **`citation` 字段** | **A. schema → 0.2 正式可选 `citation`（推荐）** · B. 暂存 `metadata.citation` 不 bump schema · C. 本期不做 DOI 边 | A 需小改 AJV+侧栏；C 则双轨 B 腿延期 |
| 3 | **金标准样例数量** | **A. 5–15 条（推荐）** · B. ≥30 · C. 0（仅书摘） | B 工作量↑；C 违背已拍板双轨精神 |
| 4 | **开放数据整库（GBD/FAO/NOVA/OFF 等）** | **A. 本期不做，仅保留路线（推荐）** · B. 批准单一试点源（须写明源与许可） · C. 启动多源管线 | B/C **许可条款待确认**；可能需法务/版权审视 |
| 5 | **付费数据源 / 商业 API** | **A. 不采购（推荐）** · B. 批准预算与源名单 | 任何付费须明示 |
| 6 | **大规模爬虫** | **A. 禁止（推荐）** · B. 限定站点与频率的爬取规格 | B 另开合规审查 |
| 7 | **锁定 `evidence_type` 为 AJV enum** | **A. 本期不锁，靠评审（推荐）** · B. 与 schema 0.2 一并锁死 | B 算 schema 变更 |
| 8 | **biomarker 是否进入 0.4** | **A. 允许 1–3 个教育向试点（推荐）** · B. 暂缓 | — |

**已拍板、本单不重开**：不上 R3F；默认 2D 分层；证据表述不用官方 GRADE 标签；教育/研究定位与常驻免责。

---

## 7. 风险与合规

| 风险 | 缓解 |
|------|------|
| 扩容后 2D 列内重叠再现 | 控制阶段 A 上限；过滤默认；标签策略另单；**不**因此上 R3F |
| 书摘被误读为临床结论 | 徽章强制「书摘」；limitations 置顶；copy-guard；金标准边对比教育 |
| 摘录超 300 / 空白 limitations | CI 已挡；录入清单预检 |
| `note_id` 占位继续蔓延 | 阶段 A 新边禁止 `related`/`multiple`；旧 9 条列入 P1 清理 |
| 开放数据许可不清 | 阶段 C 默认不做；每源「待确认」 |
| 换种子文件名导致运行时 404 | 保持文件名或同步改 loadGraph / vite SEED_FILE / CI ALIGNED_SEED |

---

## 8. 参考与事实来源

| 来源 | 用途 |
|------|------|
| `data/seed_triples_v0.3_aligned.json` @ `e0b80ef3` | 24/20 与字段实测 |
| `data/graph_schema.json` · `docs/GRAPH_SCHEMA.md` | 必填/enum |
| `scripts/validate-data.mjs`（Carmack 要点） | CI 边界 |
| `src/lib/layout.ts` | 四列映射 |
| `docs/DATA_STRATEGY.md` · `DATA_ARCHITECTURE.md` · `ROADMAP.md` | 双轨与开放数据意图 |
| TASK-NS-001-PRD · NS-003 专业化方案 · NS-005/006/007 | 拍板与可视化约束 |
| TASK-NS-008-工程只读要点.md | 字段/CI/加载路径实测 |

---

## 9. 验收对照（本交付）

- [x] 「需要哪些类型的数据」具体到字段级，并写明对 **2D 分层通路** 的作用  
- [x] 对照 24/20 缺口 + P0/P1/P2  
- [x] 三阶段路径：规模、来源、质量、schema 兼容  
- [x] 若批准：第一阶段做什么、工作量、Carmack 执行  
- [x] 文末 Carmack 第一批任务清单  
- [x] 需 Brent 拍板项单独汇总  
- [x] 无代码改动；不推翻不上 R3F / 2D 默认；不编造条数与字段  
- [x] **竞品与类似项目调研**（§10；Brent 增补）已并入本文件  

---

## 10. 竞品与类似项目调研（Brent 增补）

| 字段 | 内容 |
|------|------|
| 调研时间 | **2026-10-31**（America/Los_Angeles） |
| 范围 | 中英：营养/健康知识图谱、营养通路可视化、膳食营养教育、食物–营养素–健康关系可视化 |
| 方法 | WebSearch + `curl -I -L` / WebFetch 核验；**404 剔除**；主站 bot 429/403 时改引 GitHub/help/论文 DOI 并标注 |
| 负责人 | Altman；**Carmack 不参与本增补** |
| 交付形式 | **并入本文件**（不另拆 `TASK-NS-008-竞品调研.md`） |

### 10.1 链接核验摘要

| HTTP | 说明 | 代表 URL |
|------|------|----------|
| **200** | 可直接引用 | FoodAtlas GitHub、FNKG、MeNuGUIDE、FoodOn、USDA FDC、CTD、Hetionet、SPOKE、Open Targets、KEGG、Cronometer、Open Food Facts、NutritionFacts、薄荷健康 Web、Examine help |
| **429** | bot 限流；人工可开；改引 help/GitHub | `foodatlas.ai`、`examine.com`、部分 bioRxiv |
| **403** | bot 拦截；公开存在性另证 | FooDB 主站、ODS、部分中文预印本站 |
| **404** | **剔除** | 错误 App Store 深链等 |
| **202** | DOI→figshare 可解析 | MeNuGUIDE Turtle DOI |

### 10.2 学术 / 开源知识图谱

#### A. FoodAtlas（最直接对标）

| 项 | 内容 |
|----|------|
| **名称** | FoodAtlas |
| **定位** | 食物–化学物–疾病统一知识图谱平台；文献 IE + 本体/公开库融合 |
| **核心功能** | 检索「食物含何物 / 化学物与疾病关联」；三元组与 attestation；公开 API / parquet bundle；持续周更 |
| **可视化** | Web App（主站 bot **429**）；社区 Neo4j 可视化项目 VArify（https://github.com/linuslyt/VArify · **200**）偏 **图数据库探索**，非教育向 2D 分层通路 |
| **规模与来源** | 融合 FoodOn、FooDB、ChEBI、FDC、CTD、MeSH、PubMed/PMC 等；bundle 说明含大量 food–chemical / chemical–bioactivity 关联（例：公开下载页描述 v4.12 级 bioactivity 关联量级；精确总数以 API/bundle 为准，本环境 API 需 key → **待确认全量**） |
| **相似** | 同属 food→化学/营养→健康关联；强调可引用证据 |
| **差异** | 化学物中心、文献自动抽取、研究/临床读者向；**非**「膳食模式→机制→结局」教育通路叙事；规模与 NutriSphere 差数量级 |
| **可借鉴** | 稳定实体 ID；triplet+attestation 拆分；版本化 bulk download；化学–疾病方向标签（reduces/worsens）可对照我们的 `direction` |
| **短板** | 公众教育心智成本高；机制层「慢性炎症」类通路叙事弱；主站对自动化抓取不友好 |
| **来源** | https://github.com/AI-Institute-Food-Systems/foodatlas · https://github.com/IBPA/FoodAtlas-KGv2（**200**）；主站 https://foodatlas.ai（**429**） |

#### B. MeNu GUIDE

| 项 | 内容 |
|----|------|
| **名称** | MeNu GUIDE（Metabolite Nutrition Graph…） |
| **定位** | 学术 KG：食物–代谢物–疾病，代谢层整合本体与库 |
| **核心功能** | RDF/Turtle + SPARQL；假设生成、化合物–食物溯源 |
| **可视化** | 论文/GraphDB 查询为主；**无**面向公众的 2D 教育 Web（本调研未见产品站） |
| **规模与来源** | **25,413,000** triples；约 990 foods · 404,823 compounds · 216 conditions 等（bioRxiv 摘要）；十本体 + 六数据库；FooDB content 等 |
| **相似** | 饮食–代谢–疾病链路；强调整合公开资源 |
| **差异** | 研究基础设施；无 NutriSphere 式分层教育 UI / 书摘证据轨 |
| **可借鉴** | 代谢物作桥；公开 Turtle；诚实写数据偏见（论文自述） |
| **短板** | 终端用户不可达；体量过大无法直接灌入 force-graph 教育壳 |
| **来源** | https://github.com/LipiTUM/MeNuGUIDE（**200**）；Turtle https://doi.org/10.6084/m9.figshare.27216054.v1（**202**）；论文 https://doi.org/10.1101/2024.10.12.618040 |

#### C. FNKG（Food Nutrition Knowledge Graph，中文开源）

| 项 | 内容 |
|----|------|
| **名称** | Food-Nutrition-Knowledge-Graph（FNKG） |
| **定位** | 中文食物营养 KG；教材+中国食物成分表+网站补充；目标含膳食建议 |
| **核心功能** | 7 类实体 / 15 类关系（食物–营养素–疾病–人群–症状–器官等）；Neo4j 存储与可视化（仓库描述） |
| **可视化** | 图谱（Neo4j）；非 NutriSphere 式产品化 Web |
| **规模与来源** | 仓库未给出与 NutriSphere 同口径的「节点/边」产品规模；源：《食品营养学》教材、中国食物成分表、健康类网站等（README 自述含爬取——**合规风险对照**） |
| **相似** | 中文；食物–营养–疾病；有利/有害关系类型接近 direction |
| **差异** | 明确走向「专业膳食建议 / 适宜人群」；含症状–器官；**与 NutriSphere「禁疗效/诊疗表述」定位冲突风险更高** |
| **可借鉴** | 中文实体类型表；Rich / Beneficial / Harmful 关系命名；人群维度（我们 Phase 3 问卷前可先做 `population` 字段） |
| **短板** | 产品化与证据分级弱；爬虫源；易滑向推荐话术 |
| **来源** | https://github.com/Haidi927/Food-Nutrition-Knowledge-Graph（**200**，MIT） |

#### D. 多模态营养知识图谱（中文预印本 / 论文）

| 项 | 内容 |
|----|------|
| **名称** | 多模态营养知识图谱构建（车美玲等，医科院信息所） |
| **定位** | 学术：文本+图像多模态营养 KG，支撑问答/推荐 |
| **核心功能** | 中文 NER/RE；图像–文本链接；Neo4j 可视化查询 |
| **可视化** | Neo4j；非公众教育通路产品 |
| **规模与来源** | 文摘：**3312** 文本实体 · **11259** 关系 · **1000** 图像；书/百科/网站等 |
| **相似** | 食物–营养–人群–疾病实体 |
| **差异** | 多模态与推荐下游；非证据透明教育图谱 |
| **可借鉴** | 中文关系抽取流水线思路（阶段 C 远期）；**不**建议本阶段爬虫复现 |
| **短板** | 主站 bot **403**；下游推荐定位与我们合规边界不同 |
| **来源** | 检索摘要与 DOI 页 https://www.biomedrxiv.org.cn/article/doi/10.12201/bmr.202505.00042（本环境 **403**；内容以公开文摘为准） |

#### E. 广义生物医学图谱（对照，非纯营养）

| 名称 | 链接核验 | 要点 | 对 NutriSphere |
|------|----------|------|----------------|
| **Hetionet** | https://het.io/ **200** | ~47k 节点 / ~2.25M 边；连通搜索 | 学「邻域/连通」交互，勿比拼规模 |
| **SPOKE** | https://spoke.ucsf.edu/ **200** | Neighborhood Explorer | 主题邻域 > 全图毛团 |
| **Open Targets** | https://platform.opentargets.org/ **200** | 关联评分+表卡 | 证据侧栏/表，而非 3D |
| **CTD** | https://ctdbase.org/ **200** | 化学物–基因–疾病策展 | 金标准轨可引用其公开关联（许可待确认） |
| **KEGG PATHWAY** | https://www.genome.jp/kegg/pathway.html **200** | 人工分层通路图 | **强化 2D 分层默认的正确性**；许可偏严，整图搬迁需批准 |

### 10.3 数据集 / 本体（扩容源候选，非完整产品）

| 名称 | 定位 | 可视化 | 规模/来源要点 | 可借鉴 | 短板 / 许可 | 核验 |
|------|------|--------|---------------|--------|-------------|------|
| **FoodOn** | 食物本体 | 本体浏览 | 标准化食物层级 | 列 0 实体 ID / 别名 | 非机制通路产品 | https://foodon.org/ **200** |
| **USDA FoodData Central** | 官方食物成分 | 表/检索 | 营养素定量 | 列 1 定量属性（未来 `metadata`） | 非疾病图谱 | https://fdc.nal.usda.gov/ **200** |
| **FooDB** | 食物成分与生物活性大型库 | Web 浏览（bot **403**） | 「综合性食物成分库」（站点自述）；被 FoodAtlas/MeNu 引用 | 化合物桥 | 主站 bot 拦；再分发许可**待确认** | 主站 403；社区 https://github.com/foodb **200** |
| **Open Food Facts** | 包装食品众包 | Web/App | 全球包装食品 + NOVA 等 | 超加工/`ultra_processed` 桥 | ODbL 再分发义务；非机制证据 | https://world.openfoodfacts.org/ **200** |
| **GBD / FAOSTAT** | 疾病负担 / 食物供应 | 图表仪表 | 人群层 | 阶段 C ecological 边 | **需 Brent 批**；非个体因果 | 见主文阶段 C |

### 10.4 商业 / 教育 Web·App（非 KG 或弱 KG）

| 名称 | 定位 | 核心功能 | 可视化 | 数据 | 相似/差异 | 可借鉴 | 短板 | 核验 |
|------|------|----------|--------|------|-----------|--------|------|------|
| **Examine** | 补剂/干预证据库（商业） | 干预×结局；FAQ + RCT Database；自有等级算法 | **表/徽章**为主，非力导向图谱 | 自称 400+ interventions · 700+ outcomes · ~400 conditions（help **200**）；主站 **429** | 证据产品化强；**非**饮食–机制通路图 | 侧栏徽章+表卡；研究类型诚实 | 付费墙；等级叙事需防照搬疗效感 | help.examine.com **200** |
| **Cronometer** | 膳食追踪 | 日记、营养素达标 | 表/环图 | 食物成分库 | 量化饮食；无机制图谱 | 营养素命名与 aliases | 非研究通路；非证据边 | **200** |
| **MyFitnessPal** | 大众热量追踪 | 日记、社区 | 列表 | 用户+品牌库 | 入口心智「吃了什么」 | 移动录入 UX（非本阶段） | 广告/准确度参差；非 KG | **200** |
| **Nutritionix** | 营养数据 API/UX | 查询、白标 | 表 | 商用食物库 | 数据 API | 阶段 C 商用源选项 | **付费**→拍板 #5 | **200** |
| **NutritionFacts.org** | 植物性营养科普 | 视频/文摘教育 | 媒体，非交互图 | 文献转述科普 | 教育语气+植物性主题接近书摘轨 | 叙事专题入口 | 非结构化三元组；非交互通路 | **200** |
| **Diet Doctor** | 低碳等饮食教育（商业） | 食谱/指南 | 媒体+工具 | 编辑内容 | 教育站 | 主题导览 | 饮食流派偏向；易疗效感 | **200** |
| **薄荷健康** | 中文热量/体重管理 | 日记、社区 | App/Web 列表 | 中文食物库 | 中文用户心智 | 中文食物别名 | 非机制证据图 | https://www.boohee.com/ **200** |

### 10.5 对照总表（相对 NutriSphere）

| 维度 | NutriSphere（现状→目标） | 多数学术 KG | 多数商业营养 App | Examine 类证据站 |
|------|---------------------------|-------------|------------------|------------------|
| 主交互 | **2D 分层通路** + 侧栏证据 | SPARQL / Neo4j / 研究 API | 日记与表格 | 表卡 + FAQ |
| 证据 | 书摘为主 → 双轨 + DOI 样例 | 文献/库融合，体量大 | 弱或无边级证据 | RCT 库强 |
| 合规姿态 | **教育/研究；禁诊疗** | 常写研究/临床用途 | 健康管理暗示多 | 有等级但偏「是否有效」 |
| 规模 | 24/20 → 分阶段数十～百级 | 万～千万三元组 | 食物条目多、关系浅 | 干预/结局数百级 |
| 机制层 | **一等公民**（列 2） | 常被化学/基因替代 | 几乎无 | 弱 |

### 10.6 差异化定位建议（1–3）

1. **「可朗读的饮食–机制–结局通路」而非「最大食物化学图谱」**  
   对标 FoodAtlas/MeNu 的规模战必败且无必要；坚持四列 2D + 每边可点证据，做成**教育心智模型工具**。

2. **「书摘叙事轨 + DOI 金标准样例轨」双证据诚实展示**  
   Examine 有强 RCT 表但缺机制通路；学术 KG 有体量但缺中文书摘可读性。NutriSphere 用徽章强制区分书摘 vs 文献，**不**标 GRADE 官方等级——这是信任差异化。

3. **中文优先、合规边界清晰的研究教育壳**  
   相对 FNKG/多模态论文的「推荐/适宜人群」话术，明确**不做个性化医疗建议**；相对薄荷/MFP，提供机制层而不仅是热量。

### 10.7 是否影响数据扩容路径优先级

| 结论 | 说明 |
|------|------|
| **不推翻**阶段 A→B→C 顺序 | 竞品验证：先做**可读 curated 通路**再谈整库融合，与 FoodAtlas「先研究管线」不同，因我们产品是教育 Web |
| **略微上调**阶段 B（DOI 样例）相对权重 | Examine/CTD/FoodAtlas 均证明「无文献外链就不够专业」；建议 A 达 0.4 后**尽快**上 5–15 金标准边（拍板 #2/#3） |
| **阶段 C 仍默认不做整库** | MeNu/FoodAtlas 体量证明整库是另一产品；若批试点，优先 **FoodOn 标识对齐** 或 **OFF/NOVA→ultra_processed**，而非一次灌入 FooDB 全量 |
| **禁止项不变** | 不因竞品使用爬虫/付费 API 就跟进；FNKG 式爬取仅作反面参照 |
| **可视化拍板不变** | KEGG/Open Targets/Examine 均支持 **2D/表优先**；不上 R3F |

### 10.8 竞品调研验收勾选

- [x] 覆盖学术/开源 + 商业 + 数据集/本体  
- [x] 中英均有样本  
- [x] 每项含定位/功能/可视化/规模来源/相似差异/借鉴/短板  
- [x] 链接核验并标注 2026-10-31；404 已剔除  
- [x] 差异化 1–3 条；明确对扩容优先级的影响  
- [x] 无代码改动、无付费、无对外发布  

