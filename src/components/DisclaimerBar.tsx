import { useEffect, useRef } from 'react';
import {
  DISCLAIMER_EN,
  DISCLAIMER_TEXT,
  EVIDENCE_LADDER,
  disclaimerSegments,
  evidenceDetail,
  evidenceStatus,
} from '../lib/copy';
import type { GraphMeta } from '../types/graph';

interface DisclaimerBarProps {
  meta: GraphMeta | null;
  aboutOpen: boolean;
  nodeCount: number | null;
  linkCount: number | null;
  evidenceCounts: Record<string, number>;
  onAboutOpen: () => void;
  onAboutClose: () => void;
}

export function DisclaimerBar({
  meta,
  aboutOpen,
  nodeCount,
  linkCount,
  evidenceCounts,
  onAboutOpen,
  onAboutClose,
}: DisclaimerBarProps) {
  const segments = disclaimerSegments(DISCLAIMER_TEXT);
  const closeRef = useRef<HTMLButtonElement>(null);
  const version = meta?.data_version ? `数据 v${meta.data_version}` : '数据版本待加载';
  const extracted = meta?.extraction_date ? ` · 提取 ${meta.extraction_date}` : '';

  useEffect(() => {
    if (aboutOpen) closeRef.current?.focus();
  }, [aboutOpen]);

  return (
    <footer className="disclaimer" role="note" aria-label="免责声明" data-testid="disclaimer">
      {aboutOpen && (
        <div className="about" role="dialog" aria-label="方法说明" data-testid="methods-dialog">
          <div className="about-head">
            <h2>方法说明</h2>
            <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onAboutClose}>
              关闭
            </button>
          </div>
          <div className="about-body">
            <p className="about-brand" data-testid="about-brand">明膳知源 · ClearDiet</p>
            <div className="about-lead">
              <p>明膳知源帮你看清膳食与健康主题。</p>
              <p>看公开资料里它们常被怎么一起讨论。</p>
              <p>供学习与核对来源，不是医疗建议。</p>
            </div>
            <section>
              <h3>你能得到什么</h3>
              <ul className="about-list">
                <li>从一个健康主题入手。看饮食与它常被怎么联系起来。</li>
                <li>看到关联方向（保护相关 / 风险相关）和证据强度。</li>
                <li>查看每条说明的来源与局限性。</li>
                <li>从「健康饮食方式」了解模式特征。内容按公开资料中的常见描述整理。</li>
              </ul>
            </section>
            <section>
              <h3>怎么用</h3>
              <ol className="about-steps">
                <li>在大厅选一个你想了解的主题。</li>
                <li>进入图后，点击线条或节点查看详细说明。</li>
                <li>用顶部切换「普通视图 / 专家视图」。普通视图更简洁。</li>
                <li>想看「怎么做」，可进入「健康饮食方式」。也可从侧栏跳转。</li>
              </ol>
            </section>
            <section>
              <h3>如何解读</h3>
              <ul className="about-read">
                <li>
                  <strong>颜色</strong>
                  <span>绿色：资料里常被描述为保护相关。</span>
                  <span>红色：资料里常被描述为风险相关。</span>
                  <span>颜色不是对你个人的判断。</span>
                </li>
                <li>
                  <strong>粗细</strong>
                  <span>线越粗，表示资料中这条说明汇聚程度越高。</span>
                </li>
                <li>
                  <strong>证据类型</strong>
                  <span>证据类型标明来源（书摘、观察研究等）。</span>
                  <span>这不是临床等级。</span>
                </li>
                <li>
                  <strong>局限性</strong>
                  <span>每条说明都会标明自己的限制，请一起看。</span>
                </li>
              </ul>
            </section>
            <section>
              <h3>收录范围</h3>
              <p>
                {nodeCount != null && linkCount != null
                  ? `当前图中约有 ${nodeCount} 个节点、${linkCount} 条关联。`
                  : '当前图展示种子里已对齐的节点与关联。'}
              </p>
              <p>材料主要来自公开书籍摘录，另有少量可核验的文献。</p>
              <p>不覆盖全部研究，也不包含你的个人病历。</p>
            </section>
            <section>
              <h3>重要提醒</h3>
              <p>这里展示的是公开资料中的关联说明。</p>
              <p>不是对你个人的医疗意见。</p>
              <p>健康决策请咨询具备资质的专业人员。</p>
              <p className="about-legal">{DISCLAIMER_TEXT}</p>
              <p className="muted">{DISCLAIMER_EN}</p>
              {meta?.disclaimer && (
                <p className="muted">
                  meta.disclaimer：{meta.disclaimer}
                </p>
              )}
            </section>
            <details className="about-dev" data-testid="about-dev">
              <summary>给开发者看</summary>
              <section>
                <h3>字段</h3>
                <dl className="fields">
                  <div>
                    <dt>类型 type</dt>
                    <dd>节点属于哪一类实体，并用不同形状表示。</dd>
                  </div>
                  <div>
                    <dt>分组 group</dt>
                    <dd>保护相关、风险相关、中性或混合。颜色表示资料里的关联倾向，不是对个人的判断。</dd>
                  </div>
                  <div>
                    <dt>关联方向 direction</dt>
                    <dd>这条边被标成保护相关、风险相关、方向不明确或证据混合。</dd>
                  </div>
                  <div>
                    <dt>强度 strength</dt>
                    <dd>书摘之间的相对汇聚程度，界面写成较弱、中等、较强，并映射为线的粗细。</dd>
                  </div>
                  <div>
                    <dt>证据类型 evidence_type</dt>
                    <dd>来源属于哪一种资料。当前种子主要是书摘，另有少量文献边。名称只说明来源，不是临床等级。</dd>
                  </div>
                  <div>
                    <dt>摘录 excerpt / 局限 limitations / 来源文件 source_file</dt>
                    <dd>摘录保持原文，不在界面改写。局限是该条自己标明的限制。来源文件名用于回溯。</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3>版本</h3>
                <dl className="fields">
                  <div>
                    <dt>schema_version</dt>
                    <dd>{meta?.schema_version ?? '未知'}</dd>
                  </div>
                  <div>
                    <dt>data_version</dt>
                    <dd>{meta?.data_version ?? '未知'}</dd>
                  </div>
                  <div>
                    <dt>extraction_date</dt>
                    <dd>{meta?.extraction_date ?? '未知'}</dd>
                  </div>
                  {meta?.extracted_from && (
                    <div>
                      <dt>extracted_from</dt>
                      <dd>{meta.extracted_from}</dd>
                    </div>
                  )}
                  {meta?.note && (
                    <div>
                      <dt>备注</dt>
                      <dd>{meta.note}</dd>
                    </div>
                  )}
                </dl>
              </section>
              <section>
                <h3>证据类型</h3>
                <ul className="ladder-list">
                  {EVIDENCE_LADDER.map((step) => (
                    <li key={step.id}>
                      <strong>{step.badge}</strong>
                      <span>{evidenceDetail(step.id)}</span>
                      <span className="muted">{evidenceStatus(step.id, evidenceCounts)}</span>
                    </li>
                  ))}
                </ul>
                <p className="muted">种子里还没有的类型会标成「尚未收录该级」。界面不会把书摘写成临床试验。</p>
              </section>
              <section>
                <h3>维护</h3>
                <p className="muted">
                  新增内容应保持摘录原貌。合并前由 CI 校验 schema，并核对每条关联的 source / target
                  都能对上节点。字段定义见仓库文档 <code>docs/GRAPH_SCHEMA.md</code>。
                </p>
              </section>
            </details>
          </div>
        </div>
      )}
      <div className="disclaimer-copy">
        <p className="disclaimer-long" data-testid="disclaimer-text">
          {segments.map((segment, index) =>
            segment.strong ? <strong key={index}>{segment.value}</strong> : <span key={index}>{segment.value}</span>,
          )}
        </p>
        <p className="version-line" data-testid="data-version">
          {version}
          {extracted}
        </p>
      </div>
      <button type="button" className="linkish" onClick={onAboutOpen}>
        方法说明
      </button>
    </footer>
  );
}
