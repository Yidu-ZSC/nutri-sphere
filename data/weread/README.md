# 微信读书划线入库路径（已废弃 · TASK-NS-066）

`data/weread/` 下六书 JSON 与 `mapping_report.json` 已删除。

Brent 拍板（B2+D）：薄书摘拓扑清除后改走 EPUB 全文重建；微信划线 → evidences 映射不再作为 seed 硬依赖。

- 图谱边：仅保留 `gut_brain` EPUB 边与纯文献边（见 `data/seed_triples_v0.3_aligned.json` data 1.6）。
- Admin：`admin_books` schema **1.2** 去掉 `note_count`；五本薄书为 `index_only`（待 EPUB）；`gut_brain` 仍为 `ingested`。
- 脚本：`scripts/sync-weread-six.mjs`、`map-weread-to-evidences*.mjs`、`weread-book-map.mjs` 可保留供日后参考，但 **validate / CI 不再要求** weread 语料或 mapping_report。
- 知识库正文：`data/kb/肠道菌群_菌群大脑.md` 保留。

勿再把划线 JSON 提交进本目录作为产品数据门槛。
