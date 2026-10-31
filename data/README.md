# Data Directory

Runtime and CI load one file: `seed_triples_v0.3_aligned.json`. The filename stays on the v0.3 path so `src/lib/loadGraph.ts`, Vite, and `scripts/validate-data.mjs` do not move. The graph inside that file is **data_version 0.6** / **schema_version 0.3**.

## seed_triples_v0.3_aligned.json (data 0.6)

70 nodes / 126 links. The data 0.5 graph is unchanged: same nodes, same links, same excerpts, same `limitations`. Data 0.6 only adds schema 0.3 labels.

### 0.6 increment

Backfill strategy: **write `audience` on every link**. Omission would mean the same thing (`general`), but the seed states the value so a reader can see the choice. Non-mechanism nodes **omit** `mechanism_depth` (that omission means `summary`).

- Schema 0.3: optional `links[].audience` (`general` | `deep_reader`) and optional `nodes[].mechanism_depth` (`summary` | `mechanism` | `technical`). Neither field is required. An omitted `audience` means `general`. An omitted `mechanism_depth` means `summary`.
- Counts: 126 links carry `audience` (123 `general`, 3 `deep_reader`). All 14 `type=mechanism` nodes carry `mechanism_depth` (12 `mechanism`, 2 `technical`). The other 56 nodes omit `mechanism_depth`.
- `deep_reader` is a manual sample of mechanism-review literature edges: `lit_fiber_gi_gill_2021`, `lit_microbiome_colon_okeefe_2016`, `lit_prebiotic_microbiome_sanders_2019`. The other six literature edges stay `general`. `strength` and the presence of `citation` were not mapped onto `audience`.
- `technical` is a manual sample of terminology-dense mechanism nodes: `lps`, `igf1_signaling`. `chronic_inflammation` and `gut_barrier_leak` stay `mechanism`.
- Not in this increment: a patient audience value, GRADE, a third ViewLayer, UI filtering, shortened `limitations`, or a renamed seed file.

## seed_triples_v0.3_aligned.json (data 0.5)

70 nodes / 126 links. The data 0.4 book-note graph stays in place: the original 20 excerpts and the later book-note excerpts are unchanged. Data 0.5 adds optional `citation` and **9** literature edges (`lit_*`). One new node, `mediterranean_diet`, anchors the corrected PREDIMED report. Literature edges use `source_file: "literature"`, a non-`book_notes_*` `evidence_type`, and a verified DOI. They are not an open-data dump.

### 0.5 increment

- Schema 0.2: optional `links[].citation` (`title`, `authors`, `year`, `doi`, `pmid`, `url`). `doi` or `pmid` is required when the object is present. Unknown citation keys are rejected. `evidence_type` is still not an AJV enum.
- Literature edges: 3 `observational`, 5 `expert_synthesis`, 1 `interventional`. Each `limitations` string states that the edge is not a book note and names the study-design limit.
- DOIs were checked against Crossref and doi.org on 2026-10-31 (Asia/Shanghai) before they were written. The retracted PREDIMED DOI `10.1056/NEJMoa1200303` is not used; the edge uses the republication `10.1056/NEJMoa1800389`.
- Not in this increment: crawlers, paid full text, GRADE labels, or a bulk open-data load.

## seed_triples_v0.3_aligned.json (data 0.4)

Curated book-note expansion. 69 nodes / 117 links. The original 20 excerpts are unchanged. New edges use `book_notes_mechanistic` or `book_notes_observational_synthesis` only. `ultra_processed` and `autoimmune` each have at least one cross-column edge. Two educational biomarker nodes (`crp`, `hba1c`) carry no reference range or clinical reading.

Candidate inventory for the new edges: `v0.4_candidate_edges.tsv` (`basis` is `v0.2_surplus`, `v0.3_same_passage`, or `curated_paraphrase`).

### Sources (same six files as v0.2 / v0.3)

- `植物性饮食与慢病_惊人的蔬菜汤.md`
- `植物性饮食与慢病_吃出自愈力.md`
- `植物性饮食与慢病_救命饮食中国健康调查报告.md` (export may be truncated)
- `植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md`
- `肠道菌群_菌群大脑.md`
- `肠道菌群_晓肚知肠.md`

### 0.4 increment

- Column 0 foods and categories thickened, then bridged through nutrients, compounds, and metabolites into mechanisms and outcomes.
- Descriptions and aliases on every column-0 node, and on mechanisms whose degree is at least 3.
- Disclaimer text is unchanged: `Educational / research use only. Not medical advice.`
- Not in this increment: citation/DOI fields, schema 0.2, interventional edges, open-data bulk loads.

## seed_triples_v0.1.json

Initial seed batch (subset). Historical only. Not gated by `npm run validate:data`.

## seed_triples_v0.2_full_kb.json

Expanded extraction covering the six high-relevance files above. Historical only. Some clauses trimmed during the v0.3 alignment were reused as new 0.4 edges; the v0.2 file itself is unchanged.

### Schema

See `graph_schema.json` and `../docs/GRAPH_SCHEMA.md` (schema 0.3).

### Important

- The graph is still mostly book-note mechanistic and observational synthesis. Data 0.5 adds a few literature edges, including one republished trial report. Data 0.6 labels audience and mechanism depth on that same graph. None of this is an individual medical instruction. `audience` and `mechanism_depth` are not clinical strata and are not GRADE.
- Visualizations must include the project disclaimer. A `deep_reader` edge does not drop or shorten `limitations`.
- Open data (GBD, FAO, Nutri-Score/NOVA) is not part of data 0.6.

See `../docs/DATA_STRATEGY.md`.
