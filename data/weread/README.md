# 微信读书语料（`data/weread/`）

TASK-NS-060：六本已入库书的微信读书 **公共元数据快照** + **个人划线原文** + **热门划线快照**。

## 范围

仅下列 `source_id`（与 `scripts/weread-book-map.mjs` / 规格 A2 一致）：

| source_id | bookId |
|-----------|--------|
| eat_to_heal | 39484588 |
| how_not_to_die | 3300017717 |
| gut_brain | 24913511 |
| amazing_veggie_soup | 3300084701 |
| china_study | 3300047535 |
| know_your_gut | 26793466 |

- **不采**个人想法 / 书评 / review。
- **不存**全书正文（API 无合法全书接口）。
- 公开简介仍以 `sources.json` 的教育向 `summary` 为准；**禁止**用 weread `intro` 覆盖。

## 重同步（本机 / box）

需要已配置的 `weread` CLI，以及环境变量 `WEREAD_API_KEY`（或 `/home/box/.config/weread/credentials.env`，mode 600）。

```bash
# 切勿把 Key 写入仓库或提交
export WEREAD_API_KEY=…   # 或 source credentials.env
node scripts/sync-weread-six.mjs
```

脚本会：

1. 对六书依次调用 `weread info` / `highlights` / `call /book/bestbookmarks`
2. 写入本目录 `<source_id>.json`
3. 更新 `data/admin_books.json`（schema 1.1，六书 `weread_book_id` + 可选出版字段）
4. 仅在 `sources[].url` 为空时写入 weread `deepLink`（不改 summary / 不 bump sources schema）

## CI

`npm run validate:data` **只校验已提交的 JSON**，**不会**调用微信读书，也 **不需要** Key。

## 文件形状（schema 1.0）

每本：`schema_version` · `source_id` · `bookId` · `title_weread` · `synced_at` · `meta` · `bookmarks[]` · `bestbookmarks{totalCount,items}` · `stats`。

`stats.bookmark_count` 必须等于 `bookmarks.length`。


## 图谱映射（TASK-NS-061）

将个人划线（热门去重补充）挂到**已有同书边**的 `evidences[]`，不新建节点/边，不改本目录语料正文。

```bash
node scripts/map-weread-to-evidences.mjs          # 写 seed data_version 1.2 + mapping_report.json
node scripts/map-weread-to-evidences.mjs --dry-run
```

产出：`data/weread/mapping_report.json`（attached / skipped / needs_review；覆盖全部个人划线结局）。
硬门槛：新挂 ≥25 且 ≥4 本书有挂载。评分规则见脚本头注释与 report.scoring。
