# ClearDiet 健康/疾病数据字典

## 1. 目的

为 ClearDiet 最后一列建立参考字典。该列表达人的身心呈现出来的状态，包括健康方向与疾病方向。

面向普通用户的教育工具，描述公开资料中常被讨论的状态，不构成诊断、治疗或个性化建议。

## 2. 列名建议

建议将列名由「疾病/结局」改为「健康/疾病」。

理由：
- 现有节点全部为风险方向，列名容易让用户以为只有疾病。
- 「健康/疾病」更能覆盖身心状态的两端。
- 与机制列的「作用过程」形成对应：机制是过程，健康/疾病是呈现出来的状态。

## 3. 字段说明

| 字段 | 说明 |
|------|------|
| id | snake_case，唯一 |
| label | 中文显示名 |
| aliases | 常用别名 |
| group | protective / risk / neutral / mixed |
| description | 简短概念说明，一两句，只解释「这是什么状态」 |
| related_mechanism | 常见相关机制（示例） |
| related_diet | 常见相关膳食节点（示例） |
| status | 已有 / 建议新增 |

状态节点只解释概念。来源与局限性属于边。
描述中不使用「教育向节点」「风险节点」等元语言。

## 4. 已有状态（11 个）

### 4.1 慢性肝炎进展
- id: liver_chronic
- group: risk
- description: 慢性肝炎向肝功能衰竭或肝癌方向进展的过程。
- related_mechanism: 慢性炎症
- related_diet: —
- status: 已有

### 4.2 消化系统肿瘤
- id: digestive_cancer_risk
- group: risk
- description: 食管、胃、肠等消化系统部位的肿瘤。
- related_mechanism: 慢性炎症、DNA损伤
- related_diet: —
- status: 已有

### 4.3 心血管与代谢问题
- id: cardiometabolic
- group: risk
- description: 心血管系统与血糖、血脂等代谢相关的异常状态。
- related_mechanism: 慢性炎症、胰岛素抵抗
- related_diet: 动物性食物、超加工食品
- status: 已有

### 4.4 自身免疫问题
- id: autoimmune
- group: risk
- description: 免疫系统攻击自身组织的相关状态。
- related_mechanism: 免疫过度激活、肠道屏障损伤
- related_diet: —
- status: 已有

### 4.5 情绪低落
- id: mental_health
- group: risk
- description: 持续情绪低落、兴趣减退等心理状态。
- related_mechanism: 慢性炎症、肠道菌群
- related_diet: —
- status: 已有

### 4.6 乳腺与前列腺问题
- id: breast_prostate_risk
- group: risk
- description: 乳腺或前列腺部位的异常增生或肿瘤。
- related_mechanism: 血管生成防御、IGF-1信号
- related_diet: —
- status: 已有

### 4.7 肠道炎症
- id: ibd_related
- group: risk
- description: 肠道黏膜持续炎症的状态。
- related_mechanism: 慢性炎症、肠道屏障损伤
- related_diet: —
- status: 已有

### 4.8 脂肪肝
- id: fatty_liver
- group: risk
- description: 肝细胞内脂肪堆积的状态。
- related_mechanism: 胰岛素抵抗、慢性炎症
- related_diet: 超加工食品、添加糖
- status: 已有

### 4.9 肥胖
- id: obesity_risk
- group: risk
- description: 体脂过多、体重明显高于日常活动需求的状态。
- related_mechanism: 胰岛素抵抗、慢性炎症
- related_diet: 膳食纤维、超加工食品
- status: 已有

### 4.10 C反应蛋白升高
- id: crp
- group: neutral
- description: 血液中 C 反应蛋白水平升高。
- related_mechanism: 慢性炎症
- related_diet: —
- status: 已有

### 4.11 糖化血红蛋白升高
- id: hba1c
- group: neutral
- description: 血液中糖化血红蛋白水平升高。
- related_mechanism: 糖化反应
- related_diet: —
- status: 已有

## 5. 建议新增（健康方向）

以下为公开资料中常被讨论的身心良好状态，待补充相关边后入库。

### 5.1 代谢健康
- id: metabolic_health
- group: protective
- description: 血糖、血脂、血压等代谢指标处于相对稳定的状态。
- related_mechanism: 血糖稳态、胰岛素敏感性
- related_diet: 全食物植物性膳食、膳食纤维
- status: 建议新增

### 5.2 能量充沛
- id: energy_vitality
- group: protective
- description: 日常活动中感到精力充足、不易疲劳的状态。
- related_mechanism: 线粒体能量代谢
- related_diet: 膳食模式、某些营养素
- status: 建议新增

### 5.3 肠道舒适
- id: gut_comfort
- group: protective
- description: 排便规律、腹胀较少、消化感受平稳的状态。
- related_mechanism: 肠道菌群多样性、肠道屏障完整
- related_diet: 膳食纤维、发酵食物
- status: 建议新增

### 5.4 情绪稳定
- id: emotional_stability
- group: protective
- description: 情绪波动较小、日常心境相对平稳的状态。
- related_mechanism: 肠道菌群、炎症消退
- related_diet: —
- status: 建议新增

### 5.5 免疫稳健
- id: immune_resilience
- group: protective
- description: 免疫反应能启动也能适时消退的状态。
- related_mechanism: 免疫系统平衡、炎症消退
- related_diet: 发酵食物、植物性食物
- status: 建议新增

### 5.6 体重适宜
- id: healthy_weight
- group: protective
- description: 体重处于相对稳定、与日常活动匹配的状态。
- related_mechanism: 血糖稳态、胰岛素敏感性
- related_diet: 膳食模式、进食节奏
- status: 建议新增

### 5.7 睡眠良好
- id: good_sleep
- group: protective
- description: 入睡与维持睡眠相对顺畅、醒来感到恢复的状态。
- related_mechanism: 昼夜节律匹配
- related_diet: 晚间进食、咖啡因
- status: 建议新增

### 5.8 认知清晰
- id: cognitive_clarity
- group: protective
- description: 日常注意力与思维清晰度相对较好的状态。
- related_mechanism: 氧化应激、慢性炎症
- related_diet: —
- status: 建议新增

## 6. 使用说明

- 状态节点只解释概念，不带来源与局限性。
- 来源、摘录、局限性放在边上。
- 建议新增条目在补充相关边后入库。
- 列名调整与节点新增需同步更新界面文案与数据文件。
- 本字典为参考，不替代图谱 schema。

## 7. 版本

- v0.2：去掉「教育向」「风险」「相关」等元语言；节点名称与描述改为直接说明状态本身。
- v0.1：整理现有 11 个状态节点，提出 8 个健康方向建议新增；建议列名改为「健康/疾病」。

以上供最后一列扩展对齐使用。
