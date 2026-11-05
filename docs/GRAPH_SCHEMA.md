# 明膳知源 Graph Schema (v0.6)

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
  "domain": "health | environment | culture (required in seed; omitted-at-runtime ⇒ health)",
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
  "domain": "health | environment | culture (required in seed; omitted-at-runtime ⇒ health)",
  "evidence_type": "string (see Evidence Types)",
  "strength": "low | moderate | high | quantitative",
  "weight": "number (0.0–1.0, optional, derived from strength)",
  "source_file": "string (knowledge-base file or external citation)",
  "source_title": "string (user-visible book or literature title; required in aligned seed)",
  "source_id": "string (book id into data/sources.json; omit on literature edges)",
  "note_id": "string (weread_note_id or external id, optional)",
  "excerpt": "string (quote or summary; ≤1200 characters; mirrors evidences[0].excerpt)",
  "evidences": [
    {
      "excerpt": "string (≤1200)",
      "source_title": "string",
      "source_file": "string",
      "source_id": "string (books only)",
      "note_id": "string (optional)",
      "citation": { "...same as top-level citation..." }
    }
  ],
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

Literature edges use a non-`book_notes_*` type together with `citation`. `source_file` may be `"literature"` or a short journal name. Literature identity comes from `evidence_type` / `citation` / omitted `source_id`, not from a per-edge limitations field (removed in schema 0.7). Book-note edges keep `book_notes_*`, omit `citation`, and keep their existing excerpts.

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
- Any combination of these fields keeps the product educational disclaimer (`DISCLAIMER_TEXT`). Schema 0.7 does not store per-edge `limitations`.
- Validation does not require `audience` to match the current `ViewLayer`.
- A non-mechanism node may carry `mechanism_depth: "technical"`. That is a warning in `validate:data`, not a hard error. A value outside the enum is a hard error.

`ViewLayer` stays `layperson` | `expert`. These fields do not add a third presentation state.

## Domain (schema 0.6)

`domain` says which theme a node or link belongs to. It is a data-layer reservation for multi-theme expansion (`docs/MULTI_DOMAIN_EXPANSION.md` §4.1 / §5 phase 2 first bullet). It is **not** a `ViewLayer`, **not** GRADE, and **not** `audience`.

| Concept | Layer | Values | What it is | What it is not |
|---------|-------|--------|------------|----------------|
| `domain` | Data, on `nodes[]` and `links[]` | `health` \| `environment` \| `culture` | Theme membership. Seed writes are explicit. Omitted at runtime means `health`. | Not ViewLayer. Not GRADE. Not audience. Not evidence strength. |
| ViewLayer | UI presentation switch | `layperson` \| `expert` | How much detail the user asked to see | Unchanged; domain does not drive it. |
| `audience` | Data, on `links[]` | `general` \| `deep_reader` | Content fit of that edge | Not a theme. |
| GRADE | Not in this schema | — | — | Do not add GRADE labels. |

Scope for 0.6:

- `domain` is **required** in AJV for every node and every link in production seed.
- Write path: always explicit. Aligned seed `data_version` 1.3 writes `"domain": "health"` on all 87 nodes and 121 links.
- Read path: a loader may treat a missing `domain` as `"health"` for defensive compatibility; do not write omitted keys back into seed.
- This release ships **only** `health`. `environment` / `culture` values, cross-domain edges, new node types, and theme-switch UI are out of scope (later tasks).
- Future node types for environment/culture are sketched in `MULTI_DOMAIN_EXPANSION.md`; they are **not** enabled in this schema version.
- Visualization must not color, filter, or hide by `domain` in this release.

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
- Required fields: id/type/label/group/domain for nodes; source/target/relation/direction/evidence_type/domain for links.
- `domain` must be `health`, `environment`, or `culture`. Missing `domain` fails seed validation. Omitted-at-runtime may be read as `health`.
- `direction` is an allowed enum (`protective`, `risk`, `neutral`, `mixed`). `evidence_type` stays an open string in AJV.
- If `citation` is present, it must match the object above (including `doi` or `pmid`) and `evidence_type` must not start with `book_notes_`.
- Every link must have `evidences` (length ≥ 1). Top-level `excerpt` / `source_title` / `source_file` / `source_id` / `citation` must mirror `evidences[0]`. Do not write `limitations` on links or evidences (schema 0.7).
- Excerpt length (top-level and each evidence) must be ≤ 1200 characters.
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
| excerpt + source_title / source_file | Tooltip / side panel |
| audience, mechanism_depth | Not mapped to color, thickness, or a view toggle |
| domain | Not mapped to color, filter, or theme switch in 0.6 |

## Versioning

- Schema changes require a minor version bump and migration note.
- Data files should declare the schema version they conform to in `meta`.
- **0.1**: nodes, links, and the evidence fields used by the book-note track.
- **0.2**: optional `links[].citation`. Book-note edges stay valid without it. `evidence_type` is still not an AJV enum. The aligned seed that first uses this schema is `data_version` 0.5, still stored at `data/seed_triples_v0.3_aligned.json`.
- **0.3**: optional `links[].audience` (`general` | `deep_reader`) and optional `nodes[].mechanism_depth` (`summary` | `mechanism` | `technical`). Missing `audience` means `general`. Missing `mechanism_depth` means `summary`. These fields are not `ViewLayer`, not GRADE, and not evidence. The aligned seed that first uses this schema is `data_version` 0.6, still stored at `data/seed_triples_v0.3_aligned.json`. Older clients that ignore unknown keys can still read the 0.2 fields.

See also: `DATA_STRATEGY.md`, `ARCHITECTURE.md`.

- **0.4**: documents `links[].source_title` (display name) and optional `links[].source_id` (book → `data/sources.json`). Literature edges set `source_title` from `citation.title` and omit `source_id`. Aligned seed `data_version` 0.9. Stage-1 validate rejects missing titles, unknown book ids, literature `source_id`, and any `evidences` key.

- **0.5**: documents `links[].evidences[]` (multi-evidence). Top-level source fields remain as mirrors of `evidences[0]`. Excerpt limit 1200. Aligned seed `data_version` 1.0. Validate requires evidences, mirror equality, and per-evidence book/literature rules; stage-1 reject-evidences rule is removed.

- **0.6**: required `nodes[].domain` and `links[].domain` (`health` | `environment` | `culture`). Seed writes are explicit; omitted-at-runtime means `health`. Not ViewLayer, not GRADE, not audience. Aligned seed `data_version` 1.3 ships every node/link as `health` only—no environment/culture data and no theme-switch UI in this release.

- **0.7**: remove `links[].limitations` and `evidences[].limitations` (NS-065). Product `DISCLAIMER_TEXT` unchanged. Aligned seed `data_version` 1.5 keeps topology 102 nodes / 158 links.
