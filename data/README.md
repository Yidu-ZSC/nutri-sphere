# Data Directory

## seed_triples_v0.1.json

First batch of seed triples extracted from **high-relevance** files in the knowledge-base Project.

### Sources used
- `植物性饮食与慢病_惊人的蔬菜汤.md`
- `植物性饮食与慢病_吃出自愈力.md`
- `植物性饮食与慢病_救命饮食中国健康调查报告.md` (note: export_may_be_truncated)
- `植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md`
- References to `肠道菌群_菌群大脑.md` themes

### Schema notes
- `nodes`: id, type, label, group (protective / risk)
- `links`: source, target, relation, direction, evidence_type, strength, source_file, note_id, excerpt, limitations

### Important
- These are **seed** triples for bootstrapping the graph.
- Evidence is primarily from book notes (mechanistic or synthesis).
- Not clinical trial data.
- Future versions will incorporate open datasets (GBD, FAO, Nutri-Score/NOVA, etc.) and refined evidence grading.
- All visualization must carry the project disclaimer: educational/research only, not medical advice.

See `../docs/DATA_STRATEGY.md` for the overall data policy.
