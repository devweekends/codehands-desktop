import type { Session, CommandKind } from "@codehands/contracts";

interface DiffFile {
  path: string;
  status: string;
  patch: string;
}

export interface SessionEvent {
  id: number;
  sessionId: string;
  eventType: string;
  payload: { summary?: string; files?: DiffFile[] };
  ts: string;
}

interface SessionViewProps {
  session: Session | undefined;
  events: SessionEvent[];
  onCommand: (commandKind: CommandKind) => boolean;
  onBack: () => void;
}

const EVENT_LABELS: Record<string, string> = {
  "task.started": "Task initialized in worktree",
  "step.plan": "Analyzing repository and generating plan",
  "step.implement": "Writing and modifying code",
  "approval.requested": "Changes ready for human review",
  "step.test": "Executing test suite in isolated sandbox",
  "task.finished": "Task completed successfully",
  "task.rejected": "Changes rejected and worktree cleaned up",
  "task.stopped": "Session stopped",
};

export function SessionView({
  session,
  events,
  onCommand,
  onBack,
}: SessionViewProps) {
  if (!session) {
    return (
      <div className="card empty-state">
        <p className="muted-text">Session not found.</p>
        <button className="btn-secondary" onClick={onBack}>
          &larr; Back to Sessions
        </button>
      </div>
    );
  }

  const approvalEvent = [...events]
    .reverse()
    .find((e) => e.eventType === "approval.requested");
  const files: DiffFile[] = approvalEvent?.payload?.files ?? [];
  const awaitingApproval = session.status === "awaiting_approval";

  return (
    <section className="session-view-container">
      <div className="session-view-header">
        <button className="btn-link" onClick={onBack}>
          &larr; All Sessions
        </button>
        <div className="session-headline">
          <h2>{(session as any).title || `Session ${session.id.slice(0, 8)}`}</h2>
          <span className={`status-badge badge-${session.status}`}>
            {session.status.replace("_", " ")}
          </span>
        </div>
        <p className="session-subtitle">
          Repository: <strong>{(session as any).repo || session.projectId}</strong> &middot; Agent:{" "}
          <strong>{session.agent}</strong> ({session.model})
        </p>
      </div>

      <div className="view-grid">
        <div className="card timeline-panel">
          <h3>Progress & Event Log</h3>
          <ol className="timeline">
            {events.map((e) => (
              <li key={e.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="event-title">
                    {EVENT_LABELS[e.eventType] ?? e.eventType}
                  </span>
                  <span className="event-time">
                    {new Date(e.ts).toLocaleTimeString()}
                  </span>
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="timeline-empty">Waiting for events from daemon...</li>
            )}
          </ol>

          {session.status === "running" && (
            <div className="session-actions">
              <button
                className="btn-danger-outline"
                onClick={() => onCommand("stop")}
              >
                Stop Execution
              </button>
            </div>
          )}
        </div>

        <div className="card diff-panel">
          <div className="diff-header">
            <h3>Code Changes</h3>
            {approvalEvent?.payload?.summary && (
              <p className="diff-summary">{approvalEvent.payload.summary}</p>
            )}
          </div>

          {files.length === 0 ? (
            <div className="no-diff-state">
              <p className="muted-text">
                {session.status === "running"
                  ? "Code edits will appear here once implementation completes."
                  : "No code changes recorded for this session."}
              </p>
            </div>
          ) : (
            <div className="files-list">
              {files.map((file) => (
                <DiffBlock key={file.path} file={file} />
              ))}
            </div>
          )}

          {awaitingApproval && (
            <div className="approval-bar">
              <div className="approval-text">
                <strong>Review Decision:</strong> Accept or discard changes on the branch.
              </div>
              <div className="approval-buttons">
                <button
                  className="btn-danger"
                  onClick={() => onCommand("reject")}
                >
                  Reject & Discard
                </button>
                <button
                  className="btn-success"
                  onClick={() => onCommand("approve")}
                >
                  Approve & Commit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DiffBlock({ file }: { file: DiffFile }) {
  const lines = file.patch.split("\n");
  const added = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
  const removed = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

  return (
    <details className="diff-file" open>
      <summary className="diff-file-header">
        <span className="diff-file-path">{file.path}</span>
        <span className="diff-stats">
          <span className="stat-added">+{added}</span>
          <span className="stat-removed">-{removed}</span>
        </span>
      </summary>
      <div className="diff-code-wrapper">
        <pre className="diff-pre">
          {lines.map((l, i) => {
            const isAdd = l.startsWith("+") && !l.startsWith("+++");
            const isDel = l.startsWith("-") && !l.startsWith("---");
            const isHunk = l.startsWith("@@");
            return (
              <div
                key={i}
                className={`diff-line ${
                  isAdd ? "line-add" : isDel ? "line-del" : isHunk ? "line-hunk" : ""
                }`}
              >
                <span className="line-text">{l || " "}</span>
              </div>
            );
          })}
        </pre>
      </div>
    </details>
  );
}

