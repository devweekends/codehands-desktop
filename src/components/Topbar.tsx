import type { AuthResult } from "@codehands/contracts";

interface TopbarProps {
  connected: boolean;
  auth: AuthResult | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Topbar({
  connected,
  auth,
  onOpenAuth,
  onLogout,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="logo-title">
          Code Hands <span className="logo-badge">Desktop</span>
        </h1>
        <div
          className={`status-pill ${
            connected ? "status-connected" : "status-disconnected"
          }`}
        >
          <span className="dot" />
          <span>{connected ? "Daemon Connected" : "Daemon Disconnected"}</span>
        </div>
      </div>

      <div className="topbar-right">
        {auth ? (
          <div className="auth-profile">
            <div className="auth-info">
              <span className="user-id">{auth.userId}</span>
              <span className="device-id">{auth.device.name}</span>
            </div>
            <button className="btn-secondary btn-sm" onClick={onLogout}>
              Log Out
            </button>
          </div>
        ) : (
          <button className="btn-primary btn-sm" onClick={onOpenAuth}>
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
}

