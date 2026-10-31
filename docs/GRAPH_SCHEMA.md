# NutriSphere Graph Schema (v0.1)

This document defines the canonical data model for the knowledge graph. All seed data, future open-data integrations, and the 3D visualization must conform to this schema.

## Design Goals

- Evidence-transparent: every claim can be traced to a source and evidence type.
- Extensible: new node/edge types can be added without breaking existing data.
- Visualization-friendly: fields map cleanly to color, size, thickness, tooltips, and filters.
- Machine-readable and human-auditable.

## Node Schema

```json
{
  "id": "string (unique, snake_case)",
  "type": "string (see Node Types)",
  "label": "string (display name, Chinese preferred)",
  "group": "protective | risk | neutral | mixed",
  "description": "string (optional, short)",
  "aliases": ["string"],
  "sources": ["string (file or citation)"],
  "metadata": {}
}
```

### Node Types (initial set)

| type              | description                          | examples                          |
|-------------------|--------------------------------------|-----------------------------------|
| diet_pattern      | Overall dietary pattern              | plant_based_diet, ultra_processed |
| food_category     | Broad food group                     | animal_foods, vegetables_greens   |
| food              | Specific food                        | soy, berries_fruits               |
| nutrient          | Nutrient or bioactive                | dietary_fiber, omega3             |
| compound          | Specific compound                    | glutathione                       |
| metabolite        | Microbial or host metabolite         | scfa                              |
| mechanism         | Biological mechanism                 | chronic_inflammation, gut_barrier_leak |
| disease           | Health outcome / disease risk        | cardiometabolic, liver_chronic    |
| biomarker         | Measurable marker (future)           | HbA1c, CRP                        |

## Edge (Link) Schema

```json
{
  "id": "string (optional, unique)",
  "source": "string (node id)",
  "target": "string (node id)",
  "relation": "string (human-readable relation)",
  "direction": "protective | risk | neutral | mixed",
  "evidence_type": "string (see Evidence Types)",
  "strength": "low | moderate | high | quantitative",
  "weight": "number (0.0–1.0, optional, derived from strength)",
  "source_file": "string (knowledge-base file or external citation)",
  "note_id": "string (weread_note_id or external id, optional)",
  "excerpt": "string (short quote or summary)",
  "limitations": "string",
  "dose_response": "string (optional)",
  "population": "string (optional, e.g. ecological, individual)",
  "metadata": {}
}
```

### Evidence Types (initial set)

| evidence_type                      | meaning                                      |
|------------------------------------|----------------------------------------------|
| book_notes_mechanistic             | Mechanistic description from book notes      |
| book_notes_observational_synthesis | Synthesis of observational data in books     |
| observational                      | Cohort / case-control (future open data)     |
| mechanistic                        | Experimental / lab mechanism                 |
| interventional                     | RCT or intervention trial                    |
| ecological                         | Country / population-level correlation       |
| expert_synthesis                   | Review or guideline synthesis                |

### Direction Values

- `protective`: associated with lower risk or beneficial effect
- `risk`: associated with higher risk or adverse effect
- `neutral`: no clear direction
- `mixed`: conflicting or context-dependent

### Strength Guidance

- `low`: single source, weak or preliminary
- `moderate`: consistent book notes or limited studies
- `high`: multiple convergent sources or strong mechanistic support
- `quantitative`: when numeric effect size is available (future)

## File Format

Current seed files use a single JSON object:

```json
{
  "meta": { ... },
  "nodes": [ ... ],
  "links": [ ... ]
}
```

Future versions may split into separate node and edge files or use a graph database (e.g. Neo4j) with the same logical schema.

## Validation Rules (to be enforced by CI later)

- Every `source` and `target` in links must exist in nodes.
- Required fields: id/type/label/group for nodes; source/target/relation/direction/evidence_type for links.
- `direction` and `evidence_type` must be from allowed enums.
- Excerpt length recommended < 300 characters for tooltips.

## Mapping to Visualization

| Field          | Visual use                          |
|----------------|-------------------------------------|
| group          | Node color (green=protective, red=risk) |
| direction      | Edge color                          |
| strength/weight| Edge thickness                      |
| type           | Node shape or icon                  |
| excerpt + source_file + limitations | Tooltip / side panel |

## Versioning

- Schema changes require a minor version bump and migration note.
- Data files should declare the schema version they conform to in `meta`.

See also: `DATA_STRATEGY.md`, `ARCHITECTURE.md`.
