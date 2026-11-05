# 明膳知源（ClearDiet）

帮助普通人看清饮食与健康、饮食与疾病之间的关系。

An educational knowledge graph that helps ordinary people understand how diet is discussed in relation to health and disease.

线上预览：[cleardiet.org](https://cleardiet.org)

---

## 这是什么

明膳知源是一个面向普通人的教育工具。它把公开书籍与资料中关于饮食、机制、健康或疾病的描述，整理成可交互的知识图谱。

你可以：
- 从日常问题入口（如「想了解脂肪肝相关饮食讨论」），看到相关食物、机制与健康主题的关联路径
- 点开节点或边，查看原文摘录、来源与局限性
- 了解公开资料里常被提到的饮食选择与健康主题之间的讨论方式

它不是医疗器械，不提供诊断、治疗方案或个性化建议。

## 能带来什么

大多数人按习惯和口味选择饮食，因为饮食与健康之间的关系难以清晰看见。明膳知源把这些关系整理成可点击、可追溯的图谱，让普通人能方便地了解：

- 公开资料里怎么描述某种饮食与某个健康主题的关联
- 这些描述来自哪些书或文献
- 这些描述有哪些局限

它帮助你建立对饮食的重视，并提供一个可以自己查看的入口。

---

## What is ClearDiet

ClearDiet is an educational tool for ordinary people. It organizes descriptions from public books and materials about diet, mechanisms, and health or disease into an interactive knowledge graph.

You can:
- Start from everyday questions (for example, “want to understand diet discussions related to fatty liver”) and see related foods, mechanisms, and health topics
- Click nodes or edges to view original excerpts, sources, and limitations
- Understand how public materials discuss the relationship between dietary choices and health topics

It is not a medical device. It does not provide diagnosis, treatment plans, or personalized advice.

## What it offers

Most people choose food by habit and taste because the links between diet and health are hard to see clearly. ClearDiet turns these links into a clickable, traceable graph so ordinary people can conveniently understand:

- How public materials describe the association between a dietary choice and a health topic
- Which books or literature those descriptions come from
- What limitations those descriptions have

It helps you pay attention to diet and provides an entry point you can explore yourself.

---

## 免责声明

ClearDiet 是帮助了解日常饮食与健康主题之间关系的教育工具，不提供诊断、治疗方案或个性化医疗建议。系统中信息来自正版图书与公开资料中的机制/观察描述，不能替代执业医师或注册营养专业人员的意见。健康决策请咨询具备资质的专业人员。

## Disclaimer

ClearDiet is an educational tool that helps understand the relationship between everyday diet and health topics. It does not provide diagnosis, treatment plans, or personalized medical advice. Information in the system comes from mechanism/observation descriptions in authorized books and public materials, and cannot replace the opinion of a licensed physician or registered nutrition professional. Please consult qualified professionals for health decisions.

---

## 核心数据

仓库中包含核心数据：

- 主图谱：`data/seed_triples_v0.3_aligned.json`
- 图谱 schema：`docs/GRAPH_SCHEMA.md` 与 `data/graph_schema.json`
- 知识库索引：`data/kb/00-索引.md`

更多说明见 `docs/PROJECT_VISION.md`。

## Core data

The repository contains the core data:

- Main graph: `data/seed_triples_v0.3_aligned.json`
- Graph schema: `docs/GRAPH_SCHEMA.md` and `data/graph_schema.json`
- Knowledge base index: `data/kb/00-索引.md`

See `docs/PROJECT_VISION.md` for more.

---

## 开发

需要 Node.js 20+。

```bash
npm ci
npm run dev
npm run validate:data
npm run build
```

详细见仓库内文档。

## License

MIT
