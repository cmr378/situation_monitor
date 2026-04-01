type TopBarProps = {
  generatedAt: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

export function TopBar({ generatedAt, isDarkMode, onToggleTheme }: TopBarProps) {
  return (
    <header className="panel top-bar">
      <div>
        <h1>Situation Monitor</h1>
        <p>Configurable command dashboard mock</p>
      </div>

      <div className="top-bar__meta">
        <button type="button" onClick={onToggleTheme}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <span className="status-pill">Source: Mock</span>
        <span className="status-pill">Refresh: 30s</span>
        <span className="status-pill">Generated: {generatedAt}</span>
      </div>
    </header>
  );
}
