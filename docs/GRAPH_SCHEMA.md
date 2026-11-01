# 明膳知源 Graph Schema (v0.3)

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
  "mechanism_depth": "summary | mechanism | technical (optional; omitted means summary)",
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
  "excerpt": "string (short quote or summary, ≤300 characters)",
  "limitations": "string",
  "dose_response": "string (optional)",
  "population": "string (optional, e.g. ecological, individual)",
  "audience": "general | deep_reader (optional; omitted means general)",
  "citation": {
    "title": "string (optional; expected on literature edges)",
    "authors": "string (optional, short form such as Reynolds et al.)",
    "year": "integer (optional, 1900–2100)",
    "doi": "string (bare DOI, no https://doi.org/ prefix)",
    "pmid": "string (digits only)",
    "url": "string (optional; prefer https://doi.org/{doi})"
  },
  "metadata": {}
}
```

`citation` is optional on the link. When the object is present it must include `doi` or `pmid` (prefer `doi`). The citation object rejects unknown keys. Book-note edges should omit it. Do not prefix `doi` with `https://doi.org/`.

### Citation (schema 0.2)

| key | required when `citation` is present? | notes |
|-----|--------------------------------------|-------|
| `doi` | one of `doi` or `pmid` | bare DOI, registrar casing |
| `pmid` | one of `doi` or `pmid` | digits only; still useful when a DOI exists |
| `title` | expected on gold-standard edges | original-language title |
| `authors` | recommended | short string |
| `year` | recommended | publication year |
| `url` | no | if set, prefer `https://doi.org/{doi}` |

### Evidence Types (initial set)

| evidence_type                      | meaning                                      |
|------------------------------------|----------------------------------------------|
| book_notes_mechanistic             | Mechanistic description from book notes      |
| book_notes_observational_synthesis | Synthesis of observational data in books     |
| observational                      | Cohort / case-control                        |
| mechanistic                        | Experimental / lab mechanism                 |
| interventional                     | RCT or intervention trial                    |
| ecological                         | Country / population-level correlation       |
| expert_synthesis                   | Review or guideline synthesis                |

These values are suggestions. Schema 0.2 does **not** lock `evidence_type` as an AJV enum.

Literature edges use a non-`book_notes_*` type together with `citation`. `source_file` may be `"literature"` or a short journal name. Their `limitations` must say the edge is not a book-note excerpt and must state the study-design limit. Book-note edges keep `book_notes_*`, omit `citation`, and keep their existing excerpts.

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

## Audience and mechanism depth (schema 0.3)

`audience` and `mechanism_depth` say who an edge is written for and how far a mechanism narrative goes. They are not a third `ViewLayer`, not an official GRADE label, and not part of the evidence track. Do not derive either field from `strength` or from the presence of `citation`. Do not read either field as a clinical stratum or as efficacy.

| Concept | Layer | Values | What it is | What it is not |
|---------|-------|--------|------------|----------------|
| ViewLayer | UI presentation switch | `layperson` \| `expert` | How much detail the user asked to see | Not a content tag. Not evidence. Unchanged in 0.3. |
| `audience` | Data, on `links[]` | `general` \| `deep_reader` | Content fit of that edge. Omitted means `general`. | Not ViewLayer. A reader in expert mode may still open a `general` edge. |
| `mechanism_depth` | Data, on `nodes[]` (meaningful when `type` is `mechanism`) | `summary` \| `mechanism` \| `technical` | Narrative depth. Omitted means `summary`. | Not a DOI, not `strength`, not GRADE. |
| `evidence_type` | Data, on `links[]` | open string (`book_notes_*`, observational, …) | Where the claim comes from | Not an audience. |
| `citation` | Data, on `links[]` (schema 0.2) | doi / pmid / … | Literature check | Not a depth tier. |
| `strength` | Data, on `links[]` | `low` / `moderate` / `high` / `quantitative` | How the association is narrated | Not GRADE. Not `audience`. |
| GRADE | Not in this schema | — | — | Do not add GRADE labels. |

Stored depth values are the words above, not `0`, `1`, or `2`, so they are not confused with `strength` or `weight`. The intuition is: `summary` is a short account, `mechanism` is a mechanism explanation, `technical` is terminology and experimental detail.

Scope for 0.3:

- `audience` belongs on links. `mechanism_depth` belongs on nodes. The two may both be present in one graph: a `deep_reader` edge may point at a node whose `mechanism_depth` is `technical`.
- Node-level `audience` and link-level `mechanism_depth` are not part of this schema. Do not park either field inside free-form `metadata` instead of the properties above.
- Neither property is in `required`. A missing field must not break a client. Interpret a missing `audience` as `general` and a missing `mechanism_depth` as `summary`.
- The only allowed `audience` strings are `general` and `deep_reader`. A patient label, `patient_curious`, `clinical`, and `consumer` are rejected. Do not add them for compatibility.
- `type=mechanism` nodes in the aligned seed are written as `mechanism` unless a manual pass marks a denser narrative `technical`. Other node types omit `mechanism_depth`.
- Any combination of these fields keeps the edge `limitations` text and the product educational disclaimer. Do not shorten `limitations` because an edge is `deep_reader` or a node is `technical`.
- Validation does not require `audience` to match the current `ViewLayer`.
- A non-mechanism node may carry `mechanism_depth: "technical"`. That is a warning in `validate:data`, not a hard error. A value outside the enum is a hard error.

`ViewLayer` stays `layperson` | `expert`. These fields do not add a third presentation state.

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
- `direction` is an allowed enum (`protective`, `risk`, `neutral`, `mixed`). `evidence_type` stays an open string in AJV.
- If `citation` is present, it must match the object above (including `doi` or `pmid`) and `evidence_type` must not start with `book_notes_`.
- Excerpt length must be ≤ 300 characters.
- If `audience` is present it must be `general` or `deep_reader`. Any other string fails validation. Omission is valid.
- If `mechanism_depth` is present it must be `summary`, `mechanism`, or `technical`. Any other string fails validation. Omission is valid.
- `validate:data` warns, and still exits 0, when a node with `type` other than `mechanism` has `mechanism_depth` `technical`. It does not warn merely because the field is omitted.

## Mapping to Visualization

| Field          | Visual use                          |
|----------------|-------------------------------------|
| group          | Node color (green=protective, red=risk) |
| direction      | Edge color                          |
| strength/weight| Edge thickness                      |
| type           | Node shape or icon                  |
| excerpt + source_file + limitations | Tooltip / side panel |
| audience, mechanism_depth | Not mapped to color, thickness, or a view toggle |

## Versioning

- Schema changes require a minor version bump and migration note.
- Data files should declare the schema version they conform to in `meta`.
- **0.1**: nodes, links, and the evidence fields used by the book-note track.
- **0.2**: optional `links[].citation`. Book-note edges stay valid without it. `evidence_type` is still not an AJV enum. The aligned seed that first uses this schema is `data_version` 0.5, still stored at `data/seed_triples_v0.3_aligned.json`.
- **0.3**: optional `links[].audience` (`general` | `deep_reader`) and optional `nodes[].mechanism_depth` (`summary` | `mechanism` | `technical`). Missing `audience` means `general`. Missing `mechanism_depth` means `summary`. These fields are not `ViewLayer`, not GRADE, and not evidence. The aligned seed that first uses this schema is `data_version` 0.6, still stored at `data/seed_triples_v0.3_aligned.json`. Older clients that ignore unknown keys can still read the 0.2 fields.

See also: `DATA_STRATEGY.md`, `ARCHITECTURE.md`.
