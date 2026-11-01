# 明膳知源 Data Architecture

## Overview

The data architecture centers on a **knowledge graph** whose structure is defined by `GRAPH_SCHEMA.md`. This graph is the single source of truth that the 3D visualization, search, filtering, and future personalization features consume.

```
Knowledge-base Project (book notes)
        + Open data (GBD, FAO, Nutri-Score/NOVA, …)
                    ↓
         Curation / Triple extraction
                    ↓
     Versioned graph data (JSON / later DB)
         conforming to GRAPH_SCHEMA
                    ↓
          API or static graph JSON
                    ↓
     3D Visualization + Evidence tooltips
```

## Key Principles

1. **Evidence first**: Every edge carries evidence_type, strength, source, and limitations.
2. **Separation of concerns**:
   - Qualitative research notes stay in the knowledge-base Project.
   - Structured, machine-readable triples and open-data extracts live in this repository (`/data`).
3. **Schema-driven**: All data must validate against `GRAPH_SCHEMA.md`.
4. **Reproducible**: Data releases are versioned; pipelines (future) are scripted.
5. **Transparent limitations**: Ecological vs individual, correlation vs causation, book-note vs trial data are explicit.

## Current State

- Schema defined: `docs/GRAPH_SCHEMA.md`
- Seed data: `data/seed_triples_v0.1.json`, `data/seed_triples_v0.2_full_kb.json`
- Data policy: `docs/DATA_STRATEGY.md`

## Next Data Architecture Steps

1. Align existing seed files more strictly to the formal schema (add missing optional fields, consistent enums).
2. Add a simple JSON Schema or validation script.
3. Design the ingestion pipeline for open data (GBD diet-related outcomes, FAO food supply, Nutri-Score/NOVA mappings).
4. Decide storage evolution path: versioned JSON → graph database if query complexity grows.
5. Define how knowledge-base note_ids are stably referenced from edges.

## Relation to Technical Architecture

- Data architecture (this document + GRAPH_SCHEMA) defines **what** is stored and related.
- Technical architecture (`ARCHITECTURE.md`) defines **how** it is served, visualized, and updated.
- The schema is the contract between the two.

This separation keeps the product maintainable and scientifically honest as the knowledge base and open data continue to grow.
