# 更名任务：NutriSphere → 明膳知源（ClearDiet）

> 已采纳：中文主名明膳知源；英文名 ClearDiet；仓库名保留 nutri-sphere。

## 决定

- 中文主名：**明膳知源**
- 英文名：**ClearDiet**
- 域名：cleardiet.org
- 仓库名保留 **nutri-sphere**（暂不重命名）

保留教育/研究工具边界与免责声明原文不变。

## 意象说明

- **明膳**：看明白膳食之道（对应「怎么做」）。
- **知源**：知道来源与根由（对应「为什么」）。
- **ClearDiet**：清晰的饮食，呼应「看清关系」，与域名一致。

## 界面呈现建议

- 主品牌：**明膳知源**
- 英文品牌：**ClearDiet**（可与中文并列或作副标题）
- 副标题（可选）：看清膳食，知道来源
- 移动端或窄位置可用简称「明膳」
- 保留过渡说明：「原 NutriSphere」

## 更名范围

### 1. 文档与品牌
- `README.md`：标题、简介、Vision 等全部更新为明膳知源 / ClearDiet。
- `docs/PROJECT_VISION.md` 及其他 docs 中的 NutriSphere、DietSphere 引用。
- 界面品牌（顶栏、大厅、免责声明栏、关于页）。
- 保留过渡说明：「原 NutriSphere」（可放在关于或 README 底部）。

### 2. 代码与界面
- 顶栏品牌文案、页面 title、meta 描述。
- 任何硬编码的「NutriSphere」「DietSphere」字符串替换为 ClearDiet 或明膳知源。
- 分享链接、复制提示等用户可见文案。
- 不改变功能逻辑、数据字段、免责声明正文。

### 3. 仓库与部署
- 仓库名保留 `nutri-sphere`。
- package.json 名称、构建产物中的标题更新为 ClearDiet。
- 若后续部署到 cleardiet.org，仅更新部署配置，不改仓库名。

### 4. 不改的内容
- 数据文件内的证据摘录与字段。
- 免责声明原文。
- 现有任务卡编号与历史提交说明。

## 验收

- 界面与 README 均显示「明膳知源」与 ClearDiet。
- 搜索仓库内用户可见的 NutriSphere、DietSphere 已替换或注明过渡。
- 功能不回退，免责声明仍可见。
- 文案守卫通过。

## 优先级

1. 先更新界面品牌与 README。
2. 再全局替换文档中的引用。
3. 仓库名保持 nutri-sphere 不变。

以上供开发对齐使用。
