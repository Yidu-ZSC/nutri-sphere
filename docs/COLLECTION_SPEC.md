# ClearDiet 信息采集规范

## 1. 目的

为 ClearDiet 建立持续、可追溯的信息采集机制。面向普通用户的教育工具，不产生新的临床结论，不提供诊断、治疗或个性化建议。

所有新增信息必须：
- 可追溯到公开来源
- 带证据类型与局限性
- 符合现有图谱 schema
- 经审核后进入主数据文件

## 2. 范围

### 2.1 收什么
- 膳食模式、食物、营养素与机制之间的关联描述
- 机制与健康/疾病主题之间的关联描述
- 支持上述关联的公开来源（书摘或文献）

### 2.2 不收什么
- 剂量、用法、补充剂建议
- 个人风险分数或预测
- 诊断标准、治疗路径、疗效声明
- 未经公开来源支持的推断

## 3. 节点采集

### 3.1 机制节点
| 字段 | 要求 | 示例 |
|------|------|------|
| id | snake_case，唯一 | chronic_inflammation |
| type | mechanism | mechanism |
| label | 中文显示名 | 慢性炎症 |
| group | protective / risk / neutral / mixed | risk |
| description | 1–2 句，不写疗效 | 持续存在的低度炎症状态，是书摘里连接饮食与多种结局的枢纽。 |
| aliases | 常用别名 | [慢性炎症, 低度炎症] |
| mechanism_depth | summary / mechanism / technical | mechanism |

### 3.2 结局节点
| 字段 | 要求 | 示例 |
|------|------|------|
| id | snake_case，唯一 | cardiometabolic |
| type | disease | disease |
| label | 教育向表述 | 心血管 / 代谢疾病风险 |
| group | 通常为 risk | risk |
| description | 1–2 句 | 心血管与代谢相关风险的教育向节点。 |
| aliases | 常用别名 | [心血管, 代谢疾病, 心脏病] |

## 4. 边（关联）采集

每条边必须包含：

| 字段 | 要求 |
|------|------|
| source / target | 已存在的节点 id |
| relation | 人类可读关系，如「常被描述为与……相关」 |
| direction | protective / risk / neutral / mixed |
| evidence_type | 见下表 |
| strength | low / moderate / high / quantitative |
| source_file | 书摘文件名或 "literature" |
| excerpt | ≤300 字，保留原文语气 |
| limitations | 必须填写，说明研究设计或资料局限 |
| audience | general（默认）或 deep_reader |
| citation | 文献边必填（含 doi 或 pmid） |

### 证据类型
| 类型 | 说明 | 是否需要 citation |
|------|------|-------------------|
| book_notes_mechanistic | 书摘中的机制描述 | 否 |
| book_notes_observational_synthesis | 书摘中对观察资料的归纳 | 否 |
| observational | 队列 / 病例对照 | 是 |
| mechanistic | 实验或实验室机制 | 是 |
| interventional | 干预研究或对照试验 | 是 |
| ecological | 地区或人群层面相关 | 是 |
| expert_synthesis | 综述或共识性归纳 | 是 |

### 方向与强度
- protective：公开资料中常被描述为与较低风险或有益方向相关
- risk：公开资料中常被描述为与较高风险相关
- neutral：方向不明确
- mixed：证据混合或情境依赖

- low：单一来源或初步描述
- moderate：多处书摘一致或有限研究
- high：多来源汇聚或较强机制支持
- quantitative：有定量描述（当前较少使用）

## 5. 采集流程

### 5.1 书摘层
1. 从知识库 Markdown 中定位相关笔记。
2. 提取节点与边，填写上表字段。
3. 放入待审文件（如 `data/pending/YYYY-MM-DD.json`）。
4. 人工审核：检查摘录准确性、局限性是否充分、是否越界。
5. 通过后合并至主数据文件，更新 `data_version`。

### 5.2 文献层
1. 针对高关注主题检索已发表综述或机制研究。
2. 提取关联描述，填写 citation（doi 或 pmid）。
3. limitations 中明确注明「非书摘，研究设计为……」。
4. 放入待审文件，经审核后合并。

### 5.3 优先级
建议按大厅入口热度或用户常见问题排序，优先补充：
- 心血管 / 代谢
- 炎症性肠病
- 脂肪肝
- 消化系统风险
- 自身免疫相关

每个主题先补充 5–10 条带文献引用的边，其余继续用书摘。

## 6. 与界面呈现的对应

| 采集字段 | 界面位置 | 用户看到 |
|----------|----------|----------|
| direction | 边颜色 | 绿（保护）/ 红（风险） |
| strength | 边粗细 | 粗细差异 |
| excerpt | 右抽屉 | 短引 |
| limitations | 右抽屉 | 局限说明 |
| evidence_type | 抽屉徽章 | 「书摘·机制」「观察研究」等 |
| citation | 抽屉来源 | 文献标题与 DOI 链接 |
| description | 抽屉顶部 | 节点一两句说明 |

用户不需要看到完整论文，只需要：这条关联来自哪里、是什么类型、有什么局限。

## 7. 文案与边界

- 使用「公开资料中常被描述为……」
- 不使用「可以治疗」「建议你吃」「你的风险是」
- 每条边的 limitations 必须保留，不得因 audience 或 mechanism_depth 而缩短
- 免责声明始终可见，不因数据增加而弱化

## 8. 版本与校验

- 每次合并更新 `meta.data_version`
- 通过现有 CI 校验（节点存在、必填字段、citation 格式、excerpt 长度等）
- 待审文件不进入主分支，直至审核通过
- 保留旧版数据文件可追溯

## 9. 起步建议

1. 选定 3 个高关注结局主题。
2. 每个主题补充 5 条文献边 + 现有书摘边。
3. 建立 `data/pending/` 目录与简单审核记录。
4. 审核通过后合并，观察界面呈现是否清晰。

以上规范供后续数据工作对齐使用。
