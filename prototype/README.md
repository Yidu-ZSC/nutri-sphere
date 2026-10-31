# NutriSphere Minimal 3D Prototype

A single-file browser prototype that visualizes the seed graph using [3d-force-graph](https://github.com/vasturiano/3d-force-graph).

## How to run

1. Clone the repo.
2. Serve the repository root with any static server (required for fetch to work):
   ```bash
   # Python
   python -m http.server 8000
   # or npx
   npx serve .
   ```
3. Open http://localhost:8000/prototype/

## Features

- 3D force-directed layout of nodes and evidence-weighted edges
- Color by group / direction (green = protective, red = risk)
- Click node or link to see label, evidence type, excerpt, source file, and limitations
- Gentle auto-rotation
- Persistent disclaimer

## Notes

- Loads `../data/seed_triples_v0.3_aligned.json`
- Educational prototype only — not a medical tool
- Ready for the development team to productize (React, progressive loading, search, mobile gestures, CI validation against `data/graph_schema.json`, etc.)
