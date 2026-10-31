# Data Directory

## seed_triples_v0.1.json
Initial seed batch (subset).

## seed_triples_v0.2_full_kb.json
Expanded extraction covering all major high-relevance files in the knowledge-base Project.

### Sources covered
- `植物性饮食与慢病_惊人的蔬菜汤.md`
- `植物性饮食与慢病_吃出自愈力.md`
- `植物性饮食与慢病_救命饮食中国健康调查报告.md` (export_may_be_truncated)
- `植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md`
- `肠道菌群_菌群大脑.md`
- `肠道菌群_晓肚知肠.md`

### Content
- Expanded nodes (diet patterns, specific foods, mechanisms like LPS/gut barrier/angiogenesis/epigenetics, diseases)
- ~18 core links covering plant-based → fiber/SCFA/glutathione → anti-inflammation, animal foods → risk, gut leak → LPS → inflammation, microbiome-immune-brain axis, etc.
- Each link includes source_file, note_id (where available), excerpt, limitations.

### Schema
- nodes: id, type, label, group
- links: source, target, relation, direction, evidence_type, strength, source_file, note_id, excerpt, limitations

### Important
- Seed data for bootstrapping the 3D graph.
- Primarily book-note mechanistic/synthesis evidence.
- Not clinical trial results.
- Subsequent versions will add open data (GBD, FAO, Nutri-Score/NOVA) and finer evidence grading.
- Visualizations must include the project disclaimer.

See `../docs/DATA_STRATEGY.md`.
