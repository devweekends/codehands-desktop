import type { Session } from "@codehands/contracts";

interface SessionListProps {
  sessions: Session[];
  onOpen: (sessionId: string) => void;
  onNew: () => void;
}

export function SessionList({ sessions, onOpen, onNew }: SessionListProps) {
  const getStatusClass = (status: string) => {
    switch (status) {
      case "running":
        return "badge-running";
      case "awaiting_approval":
        return "badge-warning";
      case "approved":
        return "badge-success";
      case "rejected":
      case "failed":
        return "badge-danger";
      case "stopped":
        return "badge-muted";
      default:
        return "badge-info";
    }
  };

  return (
    <div className="session-list-container">
      <div className="section-header">
        <div>
          <h2>Work Sessions</h2>
          <p className="muted-text">
            All coding tasks managed by the local daemon on this machine.
          </p>
        </div>
        <button className="btn-primary" onClick={onNew}>
          + New Task
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="card empty-state">
          <h3>No tasks yet</h3>
          <p className="muted-text">
            Start your first coding task to watch Claude Code or Codex implement it.
          </p>
          <button className="btn-primary" onClick={onNew}>
            Create Task
          </button>
        </div>
      ) : (
        <div className="session-grid">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="card session-card"
              onClick={() => onOpen(s.id)}
            >
              <div className="session-card-top">
                <span className={`status-badge ${getStatusClass(s.status)}`}>
                  {s.status.replace("_", " ")}
                </span>
                <span className="timestamp">
                  {new Date(s.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <h3 className="session-title">
                {(s as any).title || `Session ${s.id.slice(0, 8)}`}
              </h3>

              <div className="session-meta">
                <span className="meta-repo"> {(s as any).repo || s.projectId}</span>
                <span className="meta-agent"> {s.agent} ({s.model})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

