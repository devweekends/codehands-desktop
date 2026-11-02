interface TopbarProps {
  connected: boolean;
}

export function Topbar({
  connected,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><strong>Workspace</strong><span>›</span><span>{connected ? "Local daemon" : "Connecting"}</span></div>
      <div className="topbar-right"><span className="local-only-pill"><i className={connected ? "dot" : "dot status-disconnected"} /> {connected ? "Runs on this device" : "Local daemon offline"}</span></div>
    </header>
  );
}

