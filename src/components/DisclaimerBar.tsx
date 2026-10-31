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
          <section>
            <h3>收录范围</h3>
            <p>
              本图谱只展示当前种子文件里已经对齐的节点与关联
              {nodeCount != null && linkCount != null ? `（${nodeCount} 个节点，${linkCount} 条关联）` : ''}
              ：膳食模式、食物与食物类别、营养素、化合物、代谢物、生物机制，以及健康结局或疾病风险主题。材料主要来自知识库书摘的摘录，另有少量可外链核验的文献记录，不覆盖全部文献，也不包含个人病历。
            </p>
          </section>
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
            <h3>非诊疗声明</h3>
            <p>{DISCLAIMER_TEXT}</p>
            <p className="muted">{DISCLAIMER_EN}</p>
            {meta?.disclaimer && (
              <p className="muted">
                meta.disclaimer：{meta.disclaimer}
              </p>
            )}
          </section>
          <section>
            <h3>维护</h3>
            <p className="muted">
              新增内容应保持摘录原貌。合并前由 CI 校验 schema，并核对每条关联的 source / target
              都能对上节点。字段定义见仓库文档 <code>docs/GRAPH_SCHEMA.md</code>。
            </p>
          </section>
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
