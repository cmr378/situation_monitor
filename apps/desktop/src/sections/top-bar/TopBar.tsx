type TopBarProps = {
  fallbackCount: number;
  generatedAt: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  refreshLabel: string;
  sourceLabel: string;
};

export function TopBar({ fallbackCount, generatedAt, isDarkMode, onToggleTheme, refreshLabel, sourceLabel }: TopBarProps) {
  return (
    <header className="panel top-bar">
      <div>
        <h1>Situation Monitor</h1>
        <p>Service-backed command dashboard with mock fallbacks</p>
      </div>

      <div className="top-bar__meta">
        <button type="button" onClick={onToggleTheme}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <span className="status-pill">Source: {sourceLabel}</span>
        <span className={`status-pill ${fallbackCount > 0 ? 'status-pill--warning' : ''}`}>Fallbacks: {fallbackCount}</span>
        <span className="status-pill">{refreshLabel}</span>
        <span className="status-pill">Generated: {generatedAt}</span>
      </div>
    </header>
  );
}
