# ClearDiet 机制数据字典

## 1. 目的

为 ClearDiet 建立机制节点的参考字典。面向普通用户的教育工具，描述公开资料中常被讨论的生物过程，不构成诊断、治疗或个性化建议。

机制是概念节点，说明「这是什么」。来源与局限性属于边，不属于机制节点本身。

## 2. 字段说明

| 字段 | 说明 |
|------|------|
| id | snake_case，唯一 |
| label | 中文显示名 |
| aliases | 常用别名 |
| group | protective / risk / neutral / mixed |
| description | 简短概念说明，一两句，只解释「这是什么」 |
| related_diet | 常见相关膳食节点（示例） |
| related_outcome | 常见相关结局节点（示例） |
| status | 已有 / 建议新增 |

## 3. 已有机制（14 个）

### 3.1 活性氧 / 氧化应激
- id: reactive_oxygen
- group: risk
- description: 细胞代谢中产生的活性氧超出清除能力时形成的氧化压力。
- related_diet: 谷胱甘肽、维生素C/E、多酚、类胡萝卜素
- related_outcome: DNA损伤、慢性炎症
- status: 已有

### 3.2 慢性炎症
- id: chronic_inflammation
- group: risk
- description: 持续存在的低度炎症状态。
- related_diet: 全食物植物性膳食、短链脂肪酸、超加工食品
- related_outcome: 心血管/代谢、消化系统癌症、脂肪肝、心理健康、炎症性肠病
- status: 已有

### 3.3 糖化反应
- id: glycation
- group: risk
- description: 糖与蛋白质等分子结合并形成糖化产物的过程。
- related_diet: 添加糖、精制主食
- related_outcome: 胰岛素抵抗、糖化血红蛋白
- status: 已有

### 3.4 肠道菌群多样性
- id: gut_microbiome
- group: protective
- description: 肠道微生物种类与数量的丰富程度。
- related_diet: 膳食纤维、豆类、发酵食物
- related_outcome: 免疫系统平衡、心理健康
- status: 已有

### 3.5 肠道屏障损伤 / 肠漏
- id: gut_barrier_leak
- group: risk
- description: 肠上皮屏障受损、通透性增加的状态。
- related_diet: 超加工食品
- related_outcome: 免疫过度激活、LPS
- status: 已有

### 3.6 脂多糖 (LPS) 入血
- id: lps
- group: risk
- description: 革兰阴性菌外膜成分脂多糖进入血液的过程。
- related_diet: —
- related_outcome: 慢性炎症、免疫过度激活
- status: 已有

### 3.7 血管生成防御
- id: angiogenesis_defense
- group: protective
- description: 调控异常新生血管形成的防御过程。
- related_diet: 多酚、类胡萝卜素、花青素、茶多酚
- related_outcome: 乳腺与前列腺风险
- status: 已有

### 3.8 有益表观遗传修饰
- id: epigenetic_positive
- group: protective
- description: 饮食相关物质对 DNA 与基因表达产生的有益方向影响。
- related_diet: ω-3、全食物植物性膳食、多酚、萝卜硫素
- related_outcome: —
- status: 已有

### 3.9 免疫系统平衡
- id: immune_balance
- group: protective
- description: 免疫反应保持在可调节范围内的状态。
- related_diet: 发酵食物、有机硫化物、β-葡聚糖
- related_outcome: —
- status: 已有

### 3.10 胰岛素抵抗
- id: insulin_resistance
- group: risk
- description: 胰岛素促进葡萄糖利用的效率下降。
- related_diet: 超加工食品、添加糖
- related_outcome: 心血管/代谢、脂肪肝
- status: 已有

### 3.11 DNA损伤
- id: dna_damage
- group: risk
- description: 氧化等因素造成的 DNA 结构损伤。
- related_diet: 血红素铁
- related_outcome: 消化系统癌症风险
- status: 已有

### 3.12 免疫过度激活
- id: immune_activation
- group: risk
- description: 免疫反应被持续调动的状态。
- related_diet: —
- related_outcome: 自身免疫相关
- status: 已有

### 3.13 线粒体应激
- id: mitochondrial_stress
- group: risk
- description: 线粒体功能受扰并牵动下游炎症的过程。
- related_diet: —
- related_outcome: 慢性炎症
- status: 已有

### 3.14 IGF-1信号
- id: igf1_signaling
- group: risk
- description: 与胰岛素样生长因子-1 相关的信号通路活动。
- related_diet: 动物性食物、乳制品
- related_outcome: 乳腺与前列腺风险
- status: 已有

## 4. 建议新增（健康 / 能量方向）

以下为公开资料中常被讨论的方向，待书摘或文献补充边后入库。机制节点本身不带来源字段。

### 4.1 线粒体能量代谢
- id: mitochondrial_energy
- group: protective
- description: 细胞通过线粒体产生能量的效率。
- related_diet: 全食物植物性膳食、某些维生素与矿物质
- related_outcome: 能量状态、代谢健康主题
- status: 建议新增

### 4.2 血糖稳态
- id: glycemic_stability
- group: protective
- description: 餐后血糖波动幅度较小的状态。
- related_diet: 膳食纤维、精制主食、进食顺序
- related_outcome: 代谢健康主题
- status: 建议新增

### 4.3 炎症消退
- id: inflammation_resolution
- group: protective
- description: 急性炎症后的主动消退过程。
- related_diet: ω-3、某些植物多酚
- related_outcome: 慢性炎症相关主题
- status: 建议新增

### 4.4 抗氧化防御
- id: antioxidant_defense
- group: protective
- description: 内源性抗氧化酶与外源抗氧化物质共同参与的防御过程。
- related_diet: 蔬菜、多酚、维生素C/E
- related_outcome: 氧化应激相关主题
- status: 建议新增

### 4.5 菌群代谢产物信号
- id: scfa_signaling
- group: protective
- description: 短链脂肪酸等菌群代谢产物对宿主的信号作用。
- related_diet: 膳食纤维、发酵食物
- related_outcome: 肠道屏障、炎症相关主题
- status: 建议新增

### 4.6 昼夜节律匹配
- id: circadian_alignment
- group: protective
- description: 进食时间与代谢节律匹配的状态。
- related_diet: 进食时间、晚间进食
- related_outcome: 代谢健康主题
- status: 建议新增

### 4.7 自主神经平衡
- id: autonomic_balance
- group: neutral
- description: 交感与副交感调节的相对状态。
- related_diet: 膳食模式、进食节奏
- related_outcome: —
- status: 建议新增

### 4.8 肌肉蛋白合成信号
- id: muscle_protein_synthesis
- group: protective
- description: 氨基酸供应与合成信号的过程。
- related_diet: 蛋白质来源、豆类
- related_outcome: —
- status: 建议新增

### 4.9 肠道屏障完整
- id: gut_barrier_integrity
- group: protective
- description: 上皮紧密连接与黏液层保持相对完整的状态。
- related_diet: 膳食纤维、发酵食物
- related_outcome: 肠道屏障相关主题
- status: 建议新增

### 4.10 表观遗传调控
- id: epigenetic_regulation
- group: mixed
- description: 饮食对基因表达的可逆影响。
- related_diet: 植物成分、热量状态
- related_outcome: —
- status: 建议新增

## 5. 使用说明

- 机制节点只解释概念，不带来源与局限性。
- 来源、摘录、局限性放在边上，遵循《信息采集规范》。
- 建议新增条目在补充相关边后入库。
- 本字典为参考，不替代图谱 schema。

## 6. 版本

- v0.2：description 只保留概念说明；移除机制节点的 source_type 与 limitations。
- 后续根据入库情况更新 status。

以上供机制节点扩展对齐使用。
