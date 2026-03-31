type TopBarProps = {
  generatedAt: string;
};

export function TopBar({ generatedAt }: TopBarProps) {
  return (
    <header className="panel top-bar">
      <h1>Situation Monitor</h1>
      <p>M0 Desktop Shell (Tauri target, Vite iteration)</p>
      <small>Mock generated at: {generatedAt}</small>
    </header>
  );
}
