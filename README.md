# NutriSphere

**Professional 3D Interactive Platform for Diet ↔ Health / Disease Relationships**

NutriSphere is an open-source, product-grade visualization and knowledge system that helps ordinary people, researchers, and educators explore how dietary patterns, food processing, nutrients, biological mechanisms (inflammation, microbiome, oxidative stress, etc.), and health outcomes interconnect in an intuitive three-dimensional space.

> **Disclaimer**: This is a research and educational tool. It does not provide medical diagnosis, treatment recommendations, or personalized clinical advice. Always consult qualified healthcare professionals.

## Current Status (Usable Baseline)

- Graph schema: `docs/GRAPH_SCHEMA.md` + `data/graph_schema.json`
- Aligned seed data: `data/seed_triples_v0.3_aligned.json` (from knowledge-base high-relevance notes)
- Minimal 3D prototype: `prototype/index.html` (3d-force-graph, click for evidence)

See `prototype/README.md` for how to run the prototype locally.

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
- `/prototype` — Minimal usable 3D viewer
- `/src` — Future product code

## Getting Started

1. Run the prototype (see `prototype/README.md`).
2. Review `docs/ROADMAP.md` and `docs/ARCHITECTURE.md`.

## Contributing

This project aims for professional, product-level quality from the start. The baseline is ready for the development team to productize.

## License

MIT (to be confirmed)