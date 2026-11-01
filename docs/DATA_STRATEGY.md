# Data Strategy for 明膳知源

## Where Information Lives

| Type of Content | Location | Purpose | Update Cadence |
|-----------------|----------|---------|----------------|
| Book notes, literature excerpts, mechanism summaries from specific books | Knowledge-base Project (this research assistant’s Markdown files, `00-索引.md` etc.) | High-quality, citable research corpus for the assistant and for grounding claims | As new books/notes are added |
| Structured triples (food → mechanism → outcome), evidence weights, schemas, open-data extracts, processing scripts | This GitHub repo (`/data`, `/docs`, later `/src/data-pipelines`) | Machine-readable product data, versioned, reproducible | Continuous / per release |
| Architecture, roadmap, UX principles, contribution guidelines | This repo `/docs` | Product planning and team coordination | As decisions are made |
| Raw open datasets (GBD, FAO, Nutri-Score/NOVA tables, UK Biobank aggregates where license allows) | Repo `/data/open` or external linked storage + processing notebooks | Reproducible pipelines | When sources update |

**Rule of thumb**: 
- Qualitative, narrative, book-derived research notes → Knowledge-base Project. 
- Quantitative, structured, product-facing data and engineering artifacts → GitHub repository.

Do **not** dump large raw datasets or code into the knowledge-base Project. Do **not** treat the knowledge-base as the sole source of truth for the product (it is incomplete by design; the product must integrate broader open science).

## Continuous Supplementation Process

1. **Identify gaps** — Open a GitHub Issue tagged `data-gap` describing the needed relation, disease, nutrient, or mechanism and the preferred source type.
2. **Curate** — 
   - For book/literature excerpts: add to the knowledge-base Project following existing frontmatter conventions.
   - For structured data: add or update JSON/CSV in `/data`, with a source file and evidence metadata.
3. **Review** — Pull request with evidence level, limitations, and link back to original source.
4. **Ingest** — Processing scripts (to be built) turn curated triples + open data into the graph the 3D viewer consumes.
5. **Version** — Tag data releases so visualizations remain reproducible.

## Initial Priority Data Sources (Beyond Current Knowledge Base)

- IHME Global Burden of Disease (diet-related DALYs, mortality)
- FAO Food Balance Sheets / food supply data
- Nutri-Score and NOVA classification public tables
- Published nutrient–disease association summaries (e.g., UK Biobank nutrient pattern papers, systematic reviews)
- Mechanistic reviews on inflammation, microbiome, oxidative stress, advanced glycation end-products, gut barrier
- Existing open knowledge graphs or food ontologies where licenses allow

## Evidence Metadata (Required on Every Edge)

- `direction`: protective / risk / neutral / mixed
- `evidence_type`: observational / mechanistic / interventional / ecological / expert-synthesis
- `strength`: low / moderate / high (or quantitative if available)
- `source`: citation or knowledge-base file + note_id
- `limitations`: short note (e.g., “ecological, not individual causal”)

This metadata is what the 3D visualization uses for color, thickness, and tooltips.
