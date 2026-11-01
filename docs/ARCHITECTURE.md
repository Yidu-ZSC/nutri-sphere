# 明膳知源 Architecture (Initial)

## Design Principles

- Web-first, zero-install for end users (modern browsers + mobile)
- Evidence-transparent by design (every visual element can show source + evidence type)
- Modular so data, visualization, and personalization layers can evolve independently
- Professional product quality from the start (not a throwaway prototype)

## High-Level Layers

```
[Open Data + Knowledge Base Notes]
            ↓
   [Data Curation & Triple Extraction]
            ↓
     [Graph Store / Versioned Data]
            ↓
   [API / Static Graph JSON]
            ↓
[3D Visualization Frontend (Three.js / force-graph)]
            ↓
        [User Experience Layer]
```

## Technology Direction (Product-Grade)

- **Frontend**: React + React Three Fiber or pure Three.js + 3d-force-graph / three-forcegraph. Progressive loading, mobile gestures, accessibility.
- **Graph / Data**: Start with versioned JSON/CSV in the repo. Later Neo4j or similar if query complexity demands it. Python (NetworkX, scikit-learn) for offline processing, dimensionality reduction (PCA/UMAP), and pipeline scripts.
- **Backend** (when needed): Lightweight (FastAPI or similar) for personalized simulations and larger data queries. Can remain static-first for MVP.
- **Deployment**: GitHub Pages or Vercel/Netlify for the viewer; CI for data validation.

## Visualization Modes (Prioritized)

1. **3D Knowledge Graph** (force-directed or hierarchical) — primary exploration mode. Nodes: foods, nutrients, mechanisms, diseases. Edges: evidence-weighted.
2. **Risk Surfaces / Pathways** — parametric surfaces (e.g., plant-based ratio × processing level × inflammation risk).
3. **Dimensionality-reduced point clouds** — for high-dimensional nutrient patterns.
4. **Personalized educational twin** (later) — clearly labeled simulation based on user diet questionnaire.

## User Experience Essentials

- Entry points: “I want to understand inflammation / ulcerative colitis / liver health / plant-based diets…” → focused subgraph.
- Narrative mode: guided storylines with library excerpts.
- Layered disclosure: simple view vs expert view.
- Persistent disclaimers and evidence tooltips.
- Export / share of current view or personal scenario.

## Next Engineering Steps

1. Define canonical graph schema (nodes, edges, evidence metadata).
2. Seed initial triples from knowledge base + first open-data extracts.
3. Build minimal interactive 3D graph viewer with click-to-source.
4. Add search, filtering by disease/mechanism, and basic “what-if” path highlighting.
5. Establish CI checks for data schema validity.

See `ROADMAP.md` for sequencing.
