import { useMemo } from 'react';
import { LOBBY_CONTRAST_NOTE, LOBBY_RECOMMENDED_HEADING } from '../lib/exploreShell';
import { LOBBY_RECOMMENDED } from '../lib/lobbyEntry';
import { PALETTE } from '../lib/palette';
import { themeAccent } from '../lib/themeAccent';
import { themeById, type ExploreTheme } from '../lib/themes';
import type { GraphNode } from '../types/graph';

interface RailRecommendationsProps {
  nodes: readonly GraphNode[];
  onEnterTheme: (theme: ExploreTheme) => void;
  onOpenLens: (nodeId: string) => void;
}

function accentForNode(node: GraphNode): keyof typeof PALETTE {
  return node.group === 'protective' || node.group === 'risk' || node.group === 'mixed' || node.group === 'neutral'
    ? node.group
    : 'neutral';
}

export function RailRecommendations({ nodes, onEnterTheme, onOpenLens }: RailRecommendationsProps) {
  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const primary = LOBBY_RECOMMENDED[0];
  const primaryTheme = primary.kind === 'theme' ? themeById(primary.id) : null;

  return (
    <section className="shell-rail-section" aria-labelledby="rail-recommended-heading">
      <h2 id="rail-recommended-heading" className="shell-rail-heading">
        {LOBBY_RECOMMENDED_HEADING}
      </h2>
      <div className="rail-recommendations" data-testid="lobby-recommended-grid">
        {primaryTheme && (
          <button
            type="button"
            className="rail-recommendation rail-recommendation--theme"
            data-testid={`theme-card-${primaryTheme.id}`}
            data-direction={themeAccent(primaryTheme)}
            style={{ ['--card-accent' as string]: PALETTE[themeAccent(primaryTheme)] }}
            onClick={() => onEnterTheme(primaryTheme)}
          >
            <span className="dir-top" aria-hidden="true" />
            <span className="rail-recommendation-kicker">主题</span>
            <strong>{primaryTheme.title}</strong>
            <span>{primaryTheme.blurb}</span>
          </button>
        )}
        {LOBBY_RECOMMENDED.slice(1).map((entry) => {
          const node = nodeMap.get(entry.anchorNodeId);
          if (!node) return null;
          const accent = accentForNode(node);
          return (
            <button
              key={entry.id}
              type="button"
              className="rail-recommendation"
              data-testid={`lens-card-${entry.id}`}
              data-direction={accent}
              style={{ ['--card-accent' as string]: PALETTE[accent] }}
              onClick={() => onOpenLens(entry.anchorNodeId)}
            >
              <span className="dir-top" aria-hidden="true" />
              <span className="rail-recommendation-kicker">对照</span>
              <strong>{entry.label}</strong>
              <span>{LOBBY_CONTRAST_NOTE}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
