# NutriSphere

**Professional 3D Interactive Platform for Diet ↔ Health / Disease Relationships**

NutriSphere is an open-source, product-grade visualization and knowledge system that helps ordinary people, researchers, and educators explore how dietary patterns, food processing, nutrients, biological mechanisms (inflammation, microbiome, oxidative stress, etc.), and health outcomes interconnect in an intuitive three-dimensional space.

> **Disclaimer**: This is a research and educational tool. It does not provide medical diagnosis, treatment recommendations, or personalized clinical advice. Always consult qualified healthcare professionals.

## Current Status

Phase 1 web app lives in `src/` (React + Vite + TypeScript). The default view is a 2D hierarchical pathway (`react-force-graph-2d`); 3D exploration (`react-force-graph-3d`) is optional. It loads the aligned seed graph, with search, disease/mechanism filters, layperson/expert layers, an evidence drawer, and a permanent disclaimer.

The original single-file viewer remains at `prototype/index.html` for comparison. See `prototype/README.md`.

- Graph schema: `docs/GRAPH_SCHEMA.md` + `data/graph_schema.json`
- Aligned seed data: `data/seed_triples_v0.3_aligned.json` (69 nodes / 117 links, `data_version` 0.4; filename kept for the Vite and CI path)

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

`npm run validate:data` checks only `data/seed_triples_v0.3_aligned.json` against `data/graph_schema.json`, then checks unique node ids, link `source`/`target` referential integrity, non-empty `limitations`, and `excerpt` length ≤ 300. It exits non-zero if a link target (or any of those rules) is broken. Older `data/seed_triples_*.json` files are kept and are not gated. `npm test` includes a case that points a link at a missing node and expects failure.

### Data path

The running app fetches `${import.meta.env.BASE_URL}data/seed_triples_v0.3_aligned.json`.

- Dev server reads `data/seed_triples_v0.3_aligned.json` from the repo root.
- `npm run build` copies that same file to `dist/data/seed_triples_v0.3_aligned.json`.
- Vite `base` is `./`, so the built site works at a domain root or as a GitHub Pages project site (`/nutri-sphere/`).

### Static deploy

`.github/workflows/pages.yml` publishes `dist/` to GitHub Pages on pushes to `main`. In the repository settings, set Pages → Build and deployment → Source to **GitHub Actions**. CI (`.github/workflows/ci.yml`) runs `validate-data` and `build-web` on pull requests and on pushes to `main`.

The interface is Simplified Chinese. It is an education and research explorer, not a medical device.

## Vision

Turn complex multi-dimensional scientific knowledge about diet and health into an interactive, explorable 3D experience that ordinary users can understand and use to make better-informed lifestyle choices, while remaining scientifically rigorous and transparent about evidence levels.

## Core Features (Planned / In Progress)

- 3D force-directed knowledge graph of foods / mechanisms / diseases
- Risk surface and pathway visualizations
- Evidence-weighted edges
- Layered views and search
- Continuous data integration from open sources

## Project Structure

- `/docs` — Planning, architecture, schema, roadmap
- `/data` — Structured triples and JSON Schema
- `/prototype` — Original single-file 3D viewer
- `/src` — Phase 1 web app (production entry)

## Getting Started

1. Install and run the Phase 1 app (`npm ci` then `npm run dev`). See **Phase 1 app** above.
2. Or run the prototype (see `prototype/README.md`).
3. Review `docs/ROADMAP.md` and `docs/ARCHITECTURE.md`.

## Contributing

This project aims for professional, product-level quality from the start. The Phase 1 app in `src/` is the production entry; keep `prototype/` as the original reference viewer.

## License

MIT (to be confirmed)