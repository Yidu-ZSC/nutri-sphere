import { HOME_HEALTH_THEMES, HOME_MECHANISM_THEMES, type ExploreTheme } from '../lib/themes';

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
      <span className="muted">{theme.blurb}</span>
    </button>
  );
}

export function ThemeLobby({ onEnter }: ThemeLobbyProps) {
  return (
    <main className="lobby" data-testid="theme-lobby">
      <header className="lobby-intro">
        <p className="kicker">教育与研究</p>
        <h1>想先了解哪个健康主题？</h1>
        <p>
          先选一个常见健康主题，再看饮食与它在资料里常被一起讨论的关联。内容供学习与核对来源，不是医疗建议。
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
      <details className="mechanism-fold" data-testid="mechanism-fold">
        <summary>深读 · 机制（次要入口，默认收起）</summary>
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
