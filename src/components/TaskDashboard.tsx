import type { DesktopSession } from "./TaskDetail";

type SessionFilter = "all" | "running" | "review" | "completed";

interface TaskDashboardProps {
  sessions: DesktopSession[];
  filter: SessionFilter;
  onFilterChange: (filter: SessionFilter) => void;
  onOpen: (sessionId: string) => void;
  onNew: () => void;
}

const FILTERS: { id: SessionFilter; label: string }[] = [
  { id: "all", label: "All tasks" },
  { id: "running", label: "In progress" },
  { id: "review", label: "Needs review" },
  { id: "completed", label: "Completed" },
];

function isCompleted(status: string) {
  return status === "approved" || status === "rejected" || status === "failed";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function TaskDashboard({ sessions, filter, onFilterChange, onOpen, onNew }: TaskDashboardProps) {
  const reviewCount = sessions.filter((session) => session.status === "awaiting_approval").length;
  const activeCount = sessions.filter((session) => session.status === "running" || session.status === "queued").length;
  const totalCost = sessions.reduce((sum, session) => sum + (session.costUsd || 0), 0);
  const visibleSessions = sessions.filter((session) => {
    if (filter === "running") return session.status === "running" || session.status === "queued";
    if (filter === "review") return session.status === "awaiting_approval";
    if (filter === "completed") return isCompleted(session.status);
    return true;
  });

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR LOCAL WORKSPACE</div>
          <h1>Good work starts here.</h1>
          <p>Delegate a coding task, follow its progress, and review every change.</p>
        </div>
        <button className="btn-primary new-task-button" onClick={onNew}><span>＋</span> New task</button>
      </div>

      <div className="metrics-grid">
        <Metric label="Total tasks" value={sessions.length.toString()} detail="Across this device" icon="▦" tone="violet" />
        <Metric label="In progress" value={activeCount.toString()} detail="Queued or running" icon="◌" tone="blue" />
        <Metric label="Needs review" value={reviewCount.toString()} detail="Waiting for your decision" icon="◈" tone="amber" />
        <Metric label="Tracked cost" value={`$${totalCost.toFixed(2)}`} detail="Across local sessions" icon="$" tone="green" />
      </div>

      <div className="tasks-section">
        <div className="tasks-toolbar">
          <div>
            <h2>Tasks</h2>
            <p>Recent runs from your local daemon</p>
          </div>
          <button className="btn-secondary refresh-hint" title="Task state refreshes automatically">Live updates <span className="live-dot" /></button>
        </div>

        <div className="task-tabs" role="tablist" aria-label="Filter tasks">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              className={filter === item.id ? "task-tab selected" : "task-tab"}
              onClick={() => onFilterChange(item.id)}
              role="tab"
              aria-selected={filter === item.id}
            >
              {item.label}{item.id === "review" && reviewCount > 0 && <span className="tab-count">{reviewCount}</span>}
            </button>
          ))}
        </div>

        {visibleSessions.length === 0 ? (
          <div className="tasks-empty">
            <div className="empty-illustration"><span>✳</span><i>⌘</i></div>
            <h3>{sessions.length === 0 ? "Your workspace is ready" : `No ${filter === "review" ? "tasks to review" : filter === "completed" ? "completed tasks" : "active tasks"}`}</h3>
            <p>{sessions.length === 0 ? "Create your first task and let Code Hands take it from prompt to review." : "Try another filter or start a new coding task."}</p>
            <button className="btn-primary" onClick={onNew}>Create a task <span>→</span></button>
          </div>
        ) : (
          <div className="task-table-wrap">
            <div className="task-table-head"><span>Task</span><span>Status</span><span>Agent / model</span><span>Cost</span><span>Updated</span><span /></div>
            {visibleSessions.map((session) => (
              <button className="task-row" key={session.id} onClick={() => onOpen(session.id)}>
                <span className="task-identity">
                  <span className={`task-symbol symbol-${session.status}`}>
                    {session.status === "awaiting_approval" ? "◈" : session.status === "approved" ? "✓" : session.status === "failed" ? "!" : "⌘"}
                  </span>
                  <span className="task-copy"><strong>{session.title || session.prompt || `Task ${session.id.slice(0, 8)}`}</strong><small><span className="repo-icon">⌂</span>{session.projectName || session.repo || session.projectId}</small></span>
                </span>
                <span><span className={`status-badge badge-${session.status}`}>{statusLabel(session.status)}</span></span>
                <span className="agent-cell"><strong>{session.agent}</strong><small>{session.model || "default model"}</small></span>
                <span className="cost-cell">${(session.costUsd || 0).toFixed(2)}</span>
                <span className="time-cell">{timeAgo(session.createdAt)}</span>
                <span className="row-chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: string; tone: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon metric-${tone}`}>{icon}</div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </div>
  );
}
