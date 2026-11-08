import { useState } from "react";
import type { CommandKind, Session } from "@codehands/contracts";

export interface DesktopSession extends Session {
  taskId: string;
  title?: string;
  prompt?: string;
  projectName?: string;
  repo?: string;
}

export interface SessionEvent {
  id: number;
  sessionId: string;
  eventType: string;
  payload: { summary?: string; files?: DiffFile[]; from?: string; to?: string; reason?: string; result?: string };
  ts: string;
}

interface DiffFile {
  path: string;
  status: string;
  patch: string;
}

interface TaskDetailProps {
  session: DesktopSession | undefined;
  events: SessionEvent[];
  onCommand: (kind: CommandKind) => boolean;
  onBack: () => void;
}

type WorkspaceTab = "execution" | "changes" | "logs" | "artifacts" | "timeline";

const EVENT_LABELS: Record<string, string> = {
  "task.claimed": "Task accepted by the local daemon",
  "task.started": "Task execution started",
  "step.plan": "Planning task",
  "step.implement": "Implementing changes",
  "step.test": "Running tests",
  "approval.requested": "Changes are ready for review",
  "task.finished": "Task finished",
  "task.rejected": "Task rejected",
  "task.stopped": "Task stopped",
  "session.status_changed": "Session status updated",
};

function filesFromDiff(diff: string): DiffFile[] {
  if (!diff.trim()) return [];
  const sections = diff.split(/(?=^diff --git )/m).filter(Boolean);
  return sections.map((patch, index) => {
    const path = patch.match(/^\+\+\+ b\/(.+)$/m)?.[1]
      || patch.match(/^diff --git a\/(.+?) b\/(.+)$/m)?.[2]
      || `change-${index + 1}`;
    return { path, status: patch.includes("new file mode") ? "added" : "modified", patch: patch.trimEnd() };
  });
}

function eventName(event: SessionEvent) {
  if (event.eventType === "session.status_changed" && event.payload.to) {
    return `Status changed to ${event.payload.to.replace(/_/g, " ")}`;
  }
  return EVENT_LABELS[event.eventType] || event.eventType.replace(/\./g, " ");
}

export function TaskDetail({ session, events, onCommand, onBack }: TaskDetailProps) {
  if (!session) {
    return <div className="detail-empty"><button className="btn-link" onClick={onBack}>← Back to tasks</button><h2>Task not found</h2></div>;
  }

  const approvalEvent = [...events].reverse().find((event) => event.eventType === "approval.requested");
  const files = approvalEvent?.payload.files?.length ? approvalEvent.payload.files : filesFromDiff(session.diff || "");
  const totalAdded = files.reduce((total, file) => total + file.patch.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).length, 0);
  const totalRemoved = files.reduce((total, file) => total + file.patch.split("\n").filter((line) => line.startsWith("-") && !line.startsWith("---")).length, 0);
  const phases = ["Analyze", "Plan", "Implement", "Test", "Review"];
  const phaseEvents = new Set(events.map((event) => event.eventType));
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("execution");

  return (
    <section className="detail-page">
      <button className="back-link" onClick={onBack}>← <span>All tasks</span></button>
      <div className="detail-heading">
        <div className="detail-title-block">
          <div className="eyebrow">TASK SESSION</div>
          <h1>{session.title || session.prompt || `Task ${session.id.slice(0, 8)}`}</h1>
          <div className="detail-meta"><span className="repo-icon">⌂</span>{session.projectName || session.repo || session.projectId}<span className="meta-divider">·</span><span>{session.agent}</span><span className="meta-divider">·</span><span>{session.model}</span></div>
        </div>
        <span className={`status-badge badge-${session.status}`}>{session.status.replace(/_/g, " ")}</span>
      </div>

      <div className="detail-stats">
        <div><span>SESSION</span><strong>#{session.id.slice(0, 8)}</strong></div>
        <div><span>CREATED</span><strong>{new Date(session.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</strong></div>
        <div><span>MODEL COST</span><strong>${(session.costUsd || 0).toFixed(2)}</strong></div>
        <div><span>BRANCH</span><strong>{session.branch || "Not created"}</strong></div>
      </div>

      <nav className="workspace-tabs" aria-label="Task workspace views" role="tablist">
        {([
          ["execution", "Execution"],
          ["changes", "Changes"],
          ["logs", "Logs"],
          ["artifacts", "Artifacts"],
          ["timeline", "Timeline"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            className={activeTab === id ? "workspace-tab active" : "workspace-tab"}
            onClick={() => setActiveTab(id)}
            role="tab"
            aria-selected={activeTab === id}
          >
            {label}
            {id === "logs" && events.length > 0 && <span className="workspace-tab-count">{events.length}</span>}
            {id === "changes" && files.length > 0 && <span className="workspace-tab-count">{files.length}</span>}
          </button>
        ))}
      </nav>

      {activeTab === "execution" && <div className="detail-grid">
        <aside className="progress-column">
          <div className="panel-heading"><div><h2>Run progress</h2><p>Events reported by the local daemon</p></div><span className="event-count">{events.length}</span></div>
          <div className="phase-list">
            {phases.map((phase) => {
              const key = phase.toLowerCase();
              const completed = phaseEvents.has(`step.${key}`) || (phase === "Analyze" && phaseEvents.has("task.claimed"));
              const active = !completed && ((phase === "Implement" && session.status === "running") || (phase === "Review" && session.status === "awaiting_approval"));
              return <div className={`phase-row ${completed ? "phase-complete" : active ? "phase-active" : ""}`} key={phase}><span className="phase-check">{completed ? "✓" : active ? "•" : ""}</span><span>{phase}</span><small>{completed ? "Done" : active ? "In progress" : "Waiting"}</small></div>;
            })}
          </div>

          <div className="panel-heading activity-heading"><div><h2>Activity</h2><p>Newest updates appear below</p></div></div>
          <ol className="activity-list">
            {events.length ? [...events].reverse().map((event) => (
              <li key={`${event.sessionId}-${event.id}`}>
                <span className="activity-marker" />
                <div><strong>{eventName(event)}</strong>{(event.payload.reason || event.payload.result) && <p>{event.payload.reason || event.payload.result}</p>}<time>{new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>
              </li>
            )) : <li className="activity-placeholder"><span className="activity-marker" /><div><strong>Waiting for daemon events</strong><time>Connected to local session state</time></div></li>}
          </ol>
        </aside>

        <div className="diff-column">
          <div className="diff-toolbar"><div><h2>Change review</h2><p>{files.length} {files.length === 1 ? "file" : "files"} changed <span className="stat-added">+{totalAdded}</span> <span className="stat-removed">−{totalRemoved}</span></p></div><div className="diff-legend"><span><i className="legend-add" /> Added</span><span><i className="legend-remove" /> Removed</span></div></div>
          {files.length ? <div className="review-files">{files.map((file) => <DiffBlock key={file.path} file={file} />)}</div> : <div className="diff-empty"><div className="diff-empty-icon">⌘</div><h3>No diff attached yet</h3><p>The daemon will attach the patch here when an agent runner is connected and reports changes.</p></div>}
          {session.status === "awaiting_approval" && <div className="approval-bar"><div><strong>Review decision</strong><p>These controls record your decision with the daemon. The current daemon build does not commit or delete worktrees.</p></div><div className="approval-buttons"><button className="btn-secondary reject-button" onClick={() => onCommand("reject")}>Reject task</button><button className="btn-primary" onClick={() => onCommand("approve")}>Record approval</button></div></div>}
        </div>
      </div>}

      {activeTab === "changes" && <section className="workspace-tab-panel" role="tabpanel">
        <div className="diff-toolbar"><div><h2>Changes</h2><p>{files.length} {files.length === 1 ? "file" : "files"} changed <span className="stat-added">+{totalAdded}</span> <span className="stat-removed">−{totalRemoved}</span></p></div><div className="diff-legend"><span><i className="legend-add" /> Added</span><span><i className="legend-remove" /> Removed</span></div></div>
        {files.length ? <div className="review-files">{files.map((file) => <DiffBlock key={file.path} file={file} />)}</div> : <EmptyWorkspace title="No changes attached" description="The daemon will attach a patch here when an agent runner reports changes." />}
      </section>}

      {activeTab === "logs" && <section className="workspace-tab-panel log-panel" role="tabpanel">
        <div className="panel-heading"><div><h2>Execution logs</h2><p>Event records reported by the local daemon</p></div><span className="event-count">{events.length}</span></div>
        {events.length ? <div className="log-list">{events.map((event) => <div className="log-row" key={`${event.sessionId}-${event.id}`}><time>{new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time><span className="log-level">INFO</span><strong>{eventName(event)}</strong><span>{event.payload.reason || event.payload.result || event.payload.summary || "Event received"}</span></div>)}</div> : <EmptyWorkspace title="No logs yet" description="Live execution records will appear here when the daemon emits events." />}
      </section>}

      {activeTab === "artifacts" && <section className="workspace-tab-panel" role="tabpanel"><EmptyWorkspace title="No artifacts available" description="This local session does not expose an artifact store yet. Generated files attached to the task are available in Changes." /></section>}

      {activeTab === "timeline" && <section className="workspace-tab-panel" role="tabpanel">
        <div className="panel-heading"><div><h2>Task timeline</h2><p>Chronological history for this session</p></div></div>
        {events.length ? <ol className="timeline-list">{events.map((event) => <li key={`${event.sessionId}-${event.id}`}><span className="timeline-marker" /><div><time>{new Date(event.ts).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time><strong>{eventName(event)}</strong><p>{event.payload.reason || event.payload.result || event.payload.summary || "The daemon recorded this event."}</p></div></li>)}</ol> : <EmptyWorkspace title="Timeline is empty" description="The session timeline will populate as the daemon reports progress." />}
      </section>}
    </section>
  );
}

function EmptyWorkspace({ title, description }: { title: string; description: string }) {
  return <div className="workspace-empty"><div className="workspace-empty-mark">◌</div><h3>{title}</h3><p>{description}</p></div>;
}

function DiffBlock({ file }: { file: DiffFile }) {
  const lines = file.patch.split("\n");
  return <details className="diff-file" open><summary className="diff-file-header"><span className="file-type-icon">{file.path.split(".").pop()?.slice(0, 2).toUpperCase() || "<>"}</span><span className="diff-file-path">{file.path}</span><span className={`file-change-label ${file.status}`}>{file.status}</span><span className="diff-stats"><span className="stat-added">+{lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length}</span><span className="stat-removed">−{lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length}</span></span></summary><div className="diff-code-wrapper"><pre className="diff-pre">{lines.map((line, index) => {const added = line.startsWith("+") && !line.startsWith("+++"); const removed = line.startsWith("-") && !line.startsWith("---"); const hunk = line.startsWith("@@"); return <div key={index} className={`diff-line ${added ? "line-add" : removed ? "line-del" : hunk ? "line-hunk" : ""}`}><span className="line-number">{String(index + 1).padStart(3, "0")}</span><span className="line-text">{line || " "}</span></div>; })}</pre></div></details>;
}
