# Data Directory

Runtime and CI load one file: `seed_triples_v0.3_aligned.json`. The filename stays on the v0.3 path so `src/lib/loadGraph.ts`, Vite, and `scripts/validate-data.mjs` do not move. The graph inside that file is **data_version 0.5** / **schema_version 0.2**.

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

See `graph_schema.json` and `../docs/GRAPH_SCHEMA.md` (schema 0.2).

### Important

- The graph is still mostly book-note mechanistic and observational synthesis. Data 0.5 adds a few literature edges, including one republished trial report. None of them is an individual medical instruction.
- Visualizations must include the project disclaimer.
- Open data (GBD, FAO, Nutri-Score/NOVA) is not part of data 0.5.

See `../docs/DATA_STRATEGY.md`.
