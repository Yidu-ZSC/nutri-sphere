import { DISCLAIMER_EN, DISCLAIMER_TEXT, disclaimerSegments } from '../lib/copy';
import type { GraphMeta } from '../types/graph';

interface DisclaimerBarProps {
  meta: GraphMeta | null;
  aboutOpen: boolean;
  onAboutOpen: () => void;
  onAboutClose: () => void;
}

export function DisclaimerBar({ meta, aboutOpen, onAboutOpen, onAboutClose }: DisclaimerBarProps) {
  const segments = disclaimerSegments(DISCLAIMER_TEXT);

  return (
    <footer className="disclaimer" role="note" aria-label="免责声明" data-testid="disclaimer">
      {aboutOpen && (
        <div className="about" role="dialog" aria-label="数据说明">
          <div className="about-head">
            <h2>数据说明</h2>
            <button type="button" onClick={onAboutClose}>
              关闭
            </button>
          </div>
          <p>本页展示关联方向、证据类型与局限，供学习与核对来源。它不产出个体化判断。</p>
          <dl className="fields">
            <div>
              <dt>schema_version</dt>
              <dd>{meta?.schema_version ?? '未知'}</dd>
            </div>
            <div>
              <dt>data_version</dt>
              <dd>{meta?.data_version ?? '未知'}</dd>
            </div>
            {meta?.disclaimer && (
              <div>
                <dt>meta.disclaimer</dt>
                <dd>{meta.disclaimer}</dd>
              </div>
            )}
            {meta?.extracted_from && (
              <div>
                <dt>extracted_from</dt>
                <dd>{meta.extracted_from}</dd>
              </div>
            )}
          </dl>
          <p className="muted">{DISCLAIMER_EN}</p>
          <p className="muted">
            字段定义见仓库文档 <code>docs/GRAPH_SCHEMA.md</code>
            。当前种子以书摘中的机制或观察描述为主，不是系统综述或临床指南。
          </p>
        </div>
      )}
      <p className="disclaimer-long" data-testid="disclaimer-text">
        {segments.map((segment, index) =>
          segment.strong ? <strong key={index}>{segment.value}</strong> : <span key={index}>{segment.value}</span>,
        )}
      </p>
      <button type="button" className="linkish" onClick={onAboutOpen}>
        数据说明
      </button>
    </footer>
  );
}
