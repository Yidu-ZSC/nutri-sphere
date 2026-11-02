import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyTheme, readTheme } from './lib/themePreference';
import './styles.css';

applyTheme(readTheme());

const root = document.getElementById('root');
if (!root) throw new Error('缺少 #root');

// WebGL contexts from 3d-force-graph are not safe under React StrictMode double-mount.
createRoot(root).render(<App />);
