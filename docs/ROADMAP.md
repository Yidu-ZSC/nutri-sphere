# NutriSphere Roadmap

## Phase 0 — Foundation (Current)
- [x] Repository created and product vision locked
- [x] Data strategy (knowledge-base Project vs repo Docs/data) defined
- [x] High-level architecture documented
- [ ] Canonical graph schema finalized
- [ ] Contribution and evidence-metadata guidelines polished

## Phase 1 — Professional MVP (Product-usable, not just demo)
- Seed structured triples (foods, mechanisms, outcomes) with evidence metadata
- Interactive 3D force-directed graph (desktop + mobile)
- Click node/edge → source, evidence type, short excerpt, limitations
- Search and filter by disease, mechanism, or food category
- Clear public disclaimers and layered simple/expert views
- Basic data validation pipeline

## Phase 2 — Richer Exploration
- Risk surface / pathway visualizations
- Integration of open data (GBD, FAO, Nutri-Score/NOVA)
- Guided narrative storylines
- “What-if” path highlighting (e.g., replace meat with legumes)
- Export / share views

## Phase 3 — Personalization & Scale
- Questionnaire-driven educational simulations (strictly labeled)
- Larger graph support and progressive loading
- Dimensionality-reduction views
- Community data contribution workflow with review
- Performance, accessibility, and internationalization polish

## Success Criteria for “Product-Level”
- A non-expert can open the site, select a health topic of interest, explore related diet pathways, understand the direction and evidence strength of associations, and leave with clearer mental models — without being misled into thinking it is medical advice.
- All visualized claims are traceable.
- Code, data, and docs are maintainable by a small team or open contributors.
- The system can absorb new evidence without architectural rewrites.

## Coordination
Development issues, PRs, and data-gap tracking live in this repository. Research note curation continues in the knowledge-base Project and is referenced from triples.
