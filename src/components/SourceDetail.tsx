import type { GraphData, GraphLink, SourceRecord } from '../types/graph';

interface SourceDetailProps {
  source: SourceRecord;
  graph: GraphData;
  onBack: () => void;
  onOpenLink: (index: number) => void;
}

function endpointLabel(graph: GraphData, id: string): string {
  return graph.nodes.find((node) => node.id === id)?.label ?? id;
}

function citingLinks(graph: GraphData, sourceId: string): { link: GraphLink; index: number }[] {
  return graph.links
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => link.source_id === sourceId);
}

export function SourceDetail({ source, graph, onBack, onOpenLink }: SourceDetailProps) {
  const links = citingLinks(graph, source.id);
  return (
    <main className="pattern-screen source-screen" data-testid="source-detail">
      <div className="pattern-screen-inner">
        <div className="pattern-toolbar">
          <button
            type="button"
            className="btn btn--ghost pattern-main-btn"
            data-testid="source-back"
            onClick={onBack}
          >
            返回
          </button>
        </div>
        <header className="pattern-hero pattern-section">
          <p className="kicker">来源简介</p>
          <h1 data-testid="source-title">{source.title}</h1>
          <p className="muted" data-testid="source-byline">
            {source.authors} · {source.year}
          </p>
          <p className="pattern-intro" data-testid="source-description">
            {source.description}
          </p>
        </header>
        <section className="pattern-section" aria-labelledby="source-citations-heading">
          <h2 id="source-citations-heading">本书被引用的边</h2>
          {links.length === 0 ? (
            <p className="muted" data-testid="source-empty">
              暂无引用边
            </p>
          ) : (
            <ul className="source-cite-list" data-testid="source-cite-list">
              {links.map(({ link, index }) => (
                <li key={index}>
                  <button
                    type="button"
                    className="related-btn source-cite-btn"
                    data-testid={`source-cite-${index}`}
                    onClick={() => onOpenLink(index)}
                  >
                    <span className="related-btn-main">
                      {endpointLabel(graph, link.source)} → {endpointLabel(graph, link.target)}
                    </span>
                    <span className="muted">{link.relation}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
