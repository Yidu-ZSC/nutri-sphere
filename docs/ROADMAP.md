# 明膳知源 Roadmap

## Phase 0 — Foundation
- [x] Repository created and product vision locked
- [x] Data strategy defined
- [x] Architecture and graph schema documented
- [x] Seed data and validation pipeline in place

## Phase 1 — Professional MVP
- [x] Interactive explorer (theme lobby + 2D hierarchy default, optional 3D)
- [x] Search, filters, layperson/expert layers, evidence drawer, permanent disclaimer
- [x] Data expanded to 70 nodes / 126 links (book notes + selected literature edges)
- [x] CI validation, tests, GitHub Pages workflow
- [x] Mobile-friendly layout

## Phase 1.5 — Usability & Density (Current focus)
- Default hide non-matching nodes on theme entry
- Ordinary layer filters by `audience=general` and lower `mechanism_depth`
- User path validation with 2–3 non-expert observers
- Small controlled open-data attributes (Nutri-Score / NOVA bands as node metadata only)

## Phase 2 — Richer Exploration
- Risk surface / pathway visualizations (educational)
- Guided narrative storylines
- “What-if” path highlighting (strictly labeled as model)
- Broader open data with full evidence metadata

## Phase 3 — Scale & Community
- Progressive loading for larger graphs
- Community contribution workflow with review
- Accessibility and internationalization polish

## Success Criteria
- Non-expert can select a topic, explore pathways, understand direction + evidence strength + limitations, and leave without mistaking the tool for medical advice.
- All claims remain traceable.
- System absorbs new evidence without architectural rewrites.

## Coordination
Issues, PRs, and data gaps live in this repository. Book-note curation stays in the knowledge-base Project.
