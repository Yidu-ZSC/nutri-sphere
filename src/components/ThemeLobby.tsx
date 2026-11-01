import { DIET_PATTERN_CARDS, type DietPatternCard } from '../lib/dietPatterns';
import { HOME_HEALTH_THEMES, HOME_MECHANISM_THEMES, themeById, type ExploreTheme } from '../lib/themes';

interface ThemeLobbyProps {
  onEnter: (theme: ExploreTheme) => void;
}

function ThemeCard({ theme, onEnter }: { theme: ExploreTheme; onEnter: (theme: ExploreTheme) => void }) {
  return (
    <button
      type="button"
      className="theme-card"
      data-testid={`theme-card-${theme.id}`}
      data-kind={theme.kind}
      onClick={() => onEnter(theme)}
    >
      <span className="kicker">{theme.kind === 'health_topic' ? '健康主题' : '机制向'}</span>
      <strong>{theme.title}</strong>
      <span className="theme-prompt">{theme.prompt}</span>
      <span className="theme-blurb">{theme.blurb}</span>
    </button>
  );
}

function PatternCard({ card, onEnter }: { card: DietPatternCard; onEnter: (theme: ExploreTheme) => void }) {
  const related = card.related_themes
    .map((id) => themeById(id))
    .filter((theme): theme is ExploreTheme => theme !== null);

  return (
    <article className="pattern-card" data-testid={`pattern-card-${card.id}`}>
      <h3>{card.title}</h3>
      <p className="pattern-summary">{card.summary}</p>
      <dl className="pattern-fields">
        <div>
          <dt>资料中常提到的多吃要点</dt>
          <dd>{card.emphasize}</dd>
        </div>
        <div>
          <dt>资料中常提到的少吃要点</dt>
          <dd>{card.limit}</dd>
        </div>
        <div>
          <dt>证据与来源（简述）</dt>
          <dd>{card.evidence_note}</dd>
        </div>
        <div>
          <dt>局限性</dt>
          <dd data-testid={`pattern-limitations-${card.id}`}>{card.limitations}</dd>
        </div>
      </dl>
      {related.length > 0 && (
        <div className="pattern-related">
          {related.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className="pattern-jump"
              data-testid={`pattern-jump-${card.id}-${theme.id}`}
              onClick={() => onEnter(theme)}
            >
              查看相关主题：{theme.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

export function ThemeLobby({ onEnter }: ThemeLobbyProps) {
  return (
    <main className="lobby" data-testid="theme-lobby">
      <header className="lobby-intro">
        <p className="kicker">教育与研究</p>
        <h1>想先了解哪个问题？</h1>
        <p>
          先选一个你想了解的问题，再看公开资料里饮食与它常被怎么一起讨论。供学习与核对来源，不是医疗建议。
        </p>
      </header>
      <section className="lobby-primary" aria-labelledby="health-theme-heading">
        <h2 id="health-theme-heading">常见健康主题</h2>
        <ul className="theme-grid" data-testid="health-theme-grid">
          {HOME_HEALTH_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </section>
      <section className="lobby-patterns" aria-labelledby="diet-pattern-heading" data-testid="diet-patterns">
        <h2 id="diet-pattern-heading">健康饮食方式</h2>
        <p className="pattern-note">公开资料里常被描述的饮食模式，供学习核对，不是个人方案。</p>
        <ul className="pattern-grid">
          {DIET_PATTERN_CARDS.map((card) => (
            <li key={card.id}>
              <PatternCard card={card} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </section>
      <details className="mechanism-fold" data-testid="mechanism-fold">
        <summary>进阶机制主题（可选）</summary>
        <p className="mechanism-note">
          机制主题放在次要位置，供愿意深读的人选用。展开后不会替换上面的健康主题。
        </p>
        <ul className="mechanism-list">
          {HOME_MECHANISM_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}
