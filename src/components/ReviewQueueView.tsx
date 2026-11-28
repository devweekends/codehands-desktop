import { useState } from "react";
import type { CommandKind } from "@codehands/contracts";
import type { DesktopSession } from "./TaskDetail";
import { BranchIcon, CheckCircleIcon } from "./Icons";
import { DemoNote, hasRealDiff } from "./Demo";

interface ReviewQueueViewProps {
  sessions: DesktopSession[];
  onCommand: (sessionId: string, cmd: CommandKind) => boolean;
  onOpenSession: (id: string) => void;
}

export function ReviewQueueView({ sessions, onCommand, onOpenSession }: ReviewQueueViewProps) {
  // Real sessions awaiting approval from daemon
  const realAwaiting = sessions.filter((s) => s.status === "awaiting_approval");

  const [activeReviewId, setActiveReviewId] = useState<string>(
    realAwaiting.length > 0 ? realAwaiting[0].id : ""
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedSession = realAwaiting.find((r) => r.id === activeReviewId) || realAwaiting[0];

  const handleApprove = (sessionId: string) => {
    const success = onCommand(sessionId, "approve");
    if (success) {
      setActionNotice("Approval command submitted to daemon. Branch changes being merged...");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleReject = (sessionId: string) => {
    const success = onCommand(sessionId, "reject");
    if (success) {
      setActionNotice("Task changes rejected. Daemon notified.");
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const repoName = (s: DesktopSession) => s.projectName || s.repo?.split("\\").pop() || "sample-repo";

  return (
    <div className="review-queue-container">
      <div className="page" style={{ paddingBottom: 12 }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div>
            <h1>Review</h1>
            <p className="sub">Changes waiting for your decision. Nothing is committed until you approve.</p>
          </div>
          <span className="pill awaiting_approval">{realAwaiting.length} waiting</span>
        </div>
      </div>

      {actionNotice && (
        <div className="action-feedback-banner">
          <CheckCircleIcon size={16} color="#20C997" />
          <span>{actionNotice}</span>
        </div>
      )}

      {realAwaiting.length === 0 ? (
        <div className="card empty review-empty-state-card" style={{ margin: "12px 36px" }}>
          <CheckCircleIcon size={30} color="#20C997" />
          <h3>Nothing to review</h3>
          <p>When a task finishes, its change appears here for you to approve or reject.</p>
          {sessions.length > 0 && <p className="sm mt8">{sessions.length} tasks tracked in this workspace.</p>}
        </div>
      ) : (
        <div className="split-view" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="pane-list review-items-list">
            <div className="pane-list-body">
              {realAwaiting.map((s) => (
                <div
                  key={s.id}
                  className={`review-card-item ${s.id === (selectedSession?.id || activeReviewId) ? "active" : ""}`}
                  onClick={() => setActiveReviewId(s.id)}
                >
                  <strong className="ell" style={{ display: "block" }} title={s.title || s.prompt}>
                    {s.title || s.prompt || `Task #${s.id.slice(0, 8)}`}
                  </strong>
                  <div className="mut sm ell">{repoName(s)} · {new Date(s.createdAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pane-main">
            <div className="pane-scroll">
              {selectedSession && (
                <div className="col">
                  <h2>{selectedSession.title || selectedSession.prompt}</h2>
                  <div className="row wrap mut sm mt8">
                    <span>{repoName(selectedSession)}</span>
                    <span className="row" style={{ gap: 4 }}><BranchIcon size={12} />{selectedSession.branch || "main"}</span>
                  </div>

                  <div className="mt16">
                    {!hasRealDiff(selectedSession) && (
                      <DemoNote danger label="No real diff">
                        The daemon sent no diff for this task, so the Changes tab shows sample code. Check the real branch before approving.
                      </DemoNote>
                    )}
                  </div>

                  <div className="fact-grid">
                    <div className="card"><span className="mut sm">Agent</span><b>{selectedSession.agent}</b></div>
                    <div className="card"><span className="mut sm">Model</span><b>{selectedSession.model}</b></div>
                    <div className="card"><span className="mut sm">Cost</span><b>${(selectedSession.costUsd || 0).toFixed(2)}</b></div>
                    <div className="card"><span className="mut sm">Folder</span><b className="sm mono">{selectedSession.repo}</b></div>
                  </div>

                  <div className="sec-h"><span>What you asked for</span></div>
                  <div className="card pad">{selectedSession.prompt}</div>

                  <div className="row wrap mt16">
                    <button className="btn btn-link-inspect" onClick={() => onOpenSession(selectedSession.id)}>
                      See the changes &rarr;
                    </button>
                    <span className="grow" />
                    <button className="btn danger btn-reject" onClick={() => handleReject(selectedSession.id)}>
                      Reject
                    </button>
                    <button className="btn go btn-approve" onClick={() => handleApprove(selectedSession.id)}>
                      Approve &amp; commit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
