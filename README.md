# 明膳知源

（原 NutriSphere）

看清膳食，知道来源。英文副名 ClearDiet。
计划站点：cleardiet.org（尚未切换）。

**An educational knowledge graph for ordinary people to explore diet ↔ health and diet ↔ disease relationships.**

明膳知源 helps the general public conveniently look up and understand how dietary patterns, foods, and biological mechanisms are discussed in relation to common health topics. Data comes from public books, published research, and other credible open sources. The project does not conduct original nutrition or disease research.

> **Disclaimer**: This is a research and educational tool. It does not provide medical diagnosis, treatment recommendations, or personalized clinical advice. Always consult qualified healthcare professionals.

See `docs/PROJECT_VISION.md` for the full product positioning.

## Current Status

Phase 1 web app lives in `src/` (React + Vite + TypeScript). The default first screen is a theme lobby of common health topics. Choosing a topic opens a 2D hierarchical pathway (`react-force-graph-2d`); 3D exploration (`react-force-graph-3d`) stays optional and is not the default. The app loads the aligned seed graph, with search, disease/mechanism filters, layperson/expert layers, an evidence drawer, and a permanent disclaimer.

The original single-file viewer remains at `prototype/index.html` for comparison. See `prototype/README.md`.

- Graph schema: `docs/GRAPH_SCHEMA.md` + `data/graph_schema.json`
- Aligned seed data: `data/seed_triples_v0.3_aligned.json` (70 nodes / 126 links, `data_version` 0.6, `schema_version` 0.3; filename kept for the Vite and CI path)

## Phase 1 app

Requires Node.js 20+.

```bash
npm ci
npm run dev          # http://localhost:5173
npm run validate:data
npm test
npm run build
npm run preview      # http://localhost:4173
```

`npm run validate:data` checks only `data/seed_triples_v0.3_aligned.json` against `data/graph_schema.json`, then checks unique node ids, link `source`/`target` referential integrity, non-empty `limitations`, and `excerpt` length ≤ 300. A link that carries `citation` must satisfy that object (a `doi` or `pmid`) and its `evidence_type` must not start with `book_notes_`. When present, `audience` must be `general` or `deep_reader`, and `mechanism_depth` must be `summary`, `mechanism`, or `technical`. A non-mechanism node with `mechanism_depth` `technical` prints a warning and does not fail the run. The script does not resolve DOIs over HTTP. It exits non-zero if a link target (or any of those rules) is broken. Older `data/seed_triples_*.json` files are kept and are not gated. `npm test` includes a case that points a link at a missing node and expects failure, and asserts that citation edges number between 5 and 15.

### Data path

The running app fetches `${import.meta.env.BASE_URL}data/seed_triples_v0.3_aligned.json`.

- Dev server reads `data/seed_triples_v0.3_aligned.json` from the repo root.
- `npm run build` copies that same file to `dist/data/seed_triples_v0.3_aligned.json`.
- Vite `base` is `./`, so the built site works at a domain root or as a GitHub Pages project site (`/nutri-sphere/`).

### Static deploy

`.github/workflows/pages.yml` publishes `dist/` to GitHub Pages on pushes to `main`. In the repository settings, set Pages → Build and deployment → Source to **GitHub Actions**. CI (`.github/workflows/ci.yml`) runs `validate-data` and `build-web` on pull requests and on pushes to `main`.

Planned hosting for cleardiet.org is [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) (not Cloudflare Pages). `wrangler.jsonc` publishes the Vite `dist/` build as an assets-only Worker named `cleardiet`. There is no Worker script. `assets.not_found_handling` is `single-page-application`, and Vite `base` stays `./`, which works at the domain root. `npm run deploy` builds and runs `wrangler deploy`.

`cleardiet.org` and `www.cleardiet.org` are not attached yet. The first deploy should be the `*.workers.dev` hostname (`workers_dev` is on). Bind those custom domains only after that deploy succeeds. This README does not claim the custom domain is live. Do not commit a Cloudflare API token. `.github/workflows/cloudflare.yml` deploys on pushes to `main` only when both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are set; otherwise that job exits successfully and the Pages workflow is unchanged. The account id in `wrangler.jsonc` is `565034bac4772fe5dfbe6d73d6cb5f3d`.

The interface is Simplified Chinese. It is an education and research explorer for ordinary users, not a medical device.

### Screen and share URL

The page has two states. `screen` is not the graph projection; `view` remains `2d` or `3d`.

| Param | Meaning |
| --- | --- |
| `screen` | `home` or `explore`. Missing `screen` means `home`, unless `disease`, `mechanism`, `node`, `link`, or a known `theme` is present — those open `explore`. An explicit `screen=home` stays on the lobby. |
| `theme` | Theme id matching `[a-z0-9_-]+`. It maps to a disease and/or mechanism filter when those params are absent. Unknown ids are ignored. The lobby does not write `theme` back into the URL. |
| `layer` | `layperson` or `expert` only. Any other value, including a third layer, is ignored. |
| `view` | `2d` or `3d`. Written on `explore`. Unchanged: this is not the home/explore switch. |
| `disease`, `mechanism`, `layout`, `hide`, `node`, `link` | `layout` defaults to hierarchy (`force` is explicit). `hide=1` hides nodes outside the theme filter. `hide=0` is the explicit off state. When explore has a `theme`, `disease`, or `mechanism` anchor and `hide` is omitted, hide defaults on. The home URL does not include `hide`. |

Choosing a card on the lobby opens `explore` at 2D, hierarchy layout, with unmatched nodes hidden (`hide=1`). Theme copy lives in frontend constants (`src/lib/themes.ts`), not in the graph schema. The layperson layer keeps general edges (omitted audience counts as general) and summary mechanism nodes (omitted depth counts as summary). The expert layer shows every edge and mechanism depth. The default graph view stays 2D.

## Vision

Help ordinary people conveniently explore and understand diet ↔ health and diet ↔ disease relationships through a clear, evidence-transparent knowledge graph. Data is drawn from public books and credible open sources; the project does not perform original clinical research.

## Core Features (Planned / In Progress)

- Theme lobby and hierarchical pathway views for non-experts
- Evidence-weighted edges with sources and limitations
- Layperson / expert layers
- Search and filters
- Continuous integration of public data sources

## Project Structure

- `/docs` — Planning, architecture, schema, roadmap, product vision
- `/data` — Structured triples and JSON Schema
- `/prototype` — Original single-file 3D viewer
- `/src` — Phase 1 web app (production entry)

## Getting Started

1. Install and run the Phase 1 app (`npm ci` then `npm run dev`). See **Phase 1 app** above.
2. Or run the prototype (see `prototype/README.md`).
3. Review `docs/PROJECT_VISION.md`, `docs/ROADMAP.md` and `docs/ARCHITECTURE.md`.

## Contributing

This project aims for professional, product-level quality from the start. The Phase 1 app in `src/` is the production entry; keep `prototype/` as the original reference viewer. All contributions should respect the ordinary-user positioning and educational boundary.

## License

MIT (to be confirmed)