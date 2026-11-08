import { useState } from "react";
import type { CommandKind } from "@codehands/contracts";
import type { DesktopSession } from "./TaskDetail";
import { ReviewIcon, BranchIcon, CheckCircleIcon } from "./Icons";

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

  return (
    <div className="review-queue-container">
      {/* Top Banner */}
      <div className="review-queue-header">
        <div className="header-title-row">
          <ReviewIcon size={20} color="#FFB547" />
          <div className="header-text">
            <h2>Human Review Queue</h2>
            <p>Code changes produced by AI agents requiring developer approval before committing</p>
          </div>
        </div>
        <div className="header-meta-pill">
          <span className="count-num">{realAwaiting.length}</span>
          <span>Tasks Awaiting Approval</span>
        </div>
      </div>

      {actionNotice && (
        <div className="action-feedback-banner">
          <CheckCircleIcon size={16} color="#20C997" />
          <span>{actionNotice}</span>
        </div>
      )}

      {realAwaiting.length === 0 ? (
        <div className="review-empty-state-card">
          <div className="empty-state-icon">
            <CheckCircleIcon size={36} color="#20C997" />
          </div>
          <h3>All Caught Up! No Tasks Awaiting Review</h3>
          <p>
            When an autonomous agent completes implementation and test execution, changes will
            appear here with diff inspection, test results, and one-click commit authorization.
          </p>
          {sessions.length > 0 && (
            <div className="empty-state-hint">
              <span>{sessions.length} total tasks tracked in this workspace.</span>
            </div>
          )}
        </div>
      ) : (
        /* Review Layout: Left List + Right Review Detail */
        <div className="review-queue-body">
          {/* Left List */}
          <div className="review-items-list">
            {realAwaiting.map((s) => {
              const isSelected = s.id === (selectedSession?.id || activeReviewId);
              return (
                <div
                  key={s.id}
                  className={`review-card-item ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveReviewId(s.id)}
                >
                  <div className="card-top">
                    <span className="status-indicator-pill awaiting">Awaiting Approval</span>
                    <span className="time-ago">{new Date(s.createdAt).toLocaleTimeString()}</span>
                  </div>

                  <strong className="review-title" title={s.title || s.prompt}>
                    {s.title || s.prompt || `Task #${s.id.slice(0, 8)}`}
                  </strong>

                  <div className="review-meta-row">
                    <span className="repo-tag">{s.projectName || s.repo?.split("\\").pop() || "sample-repo"}</span>
                    <span className="branch-tag">
                      <BranchIcon size={12} /> {s.branch || "main"}
                    </span>
                  </div>

                  <div className="stats-badges-row">
                    <span className="stat-pill files">{s.agent || "claude-code"}</span>
                    <span className="stat-pill tests">Model: {s.model || "sonnet"}</span>
                    <span className="stat-pill cost">${(s.costUsd || 0).toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Detail Pane */}
          <div className="review-detail-pane">
            {selectedSession && (
              <div className="review-detail-card">
                <div className="detail-top-bar">
                  <div className="detail-title-col">
                    <div className="eyebrow-tag">HUMAN DECISION REQUIRED</div>
                    <h3>{selectedSession.title || selectedSession.prompt}</h3>
                    <div className="meta-chain">
                      <span>{selectedSession.projectName || selectedSession.repo?.split("\\").pop() || "sample-repo"}</span>
                      <span>·</span>
                      <span>⎇ {selectedSession.branch || "main"}</span>
                      <span>·</span>
                      <span>Agent: {selectedSession.agent}</span>
                      <span>·</span>
                      <span>Model: {selectedSession.model}</span>
                      <span>·</span>
                      <span>Cost: ${(selectedSession.costUsd || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="decision-actions">
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(selectedSession.id)}
                    >
                      Reject Changes
                    </button>
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(selectedSession.id)}
                    >
                      ✓ Approve & Commit
                    </button>
                  </div>
                </div>

                {/* Execution Summary */}
                <div className="review-summary-section">
                  <h4>Execution Summary</h4>
                  <div className="summary-metrics-grid">
                    <div className="metric-box">
                      <span className="metric-label">STATUS</span>
                      <strong className="metric-val" style={{ color: "var(--warning)" }}>
                        Awaiting Approval
                      </strong>
                      <span className="metric-sub">Tests passing, staged</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-label">TARGET REPO</span>
                      <strong className="metric-val">
                        {selectedSession.projectName || selectedSession.repo?.split("\\").pop()}
                      </strong>
                      <span className="metric-sub">{selectedSession.repo}</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-label">AGENT RUNNER</span>
                      <strong className="metric-val">{selectedSession.agent}</strong>
                      <span className="metric-sub">{selectedSession.model}</span>
                    </div>

                    <div className="metric-box">
                      <span className="metric-label">TASK SPECIFICATION</span>
                      <p className="spec-text">{selectedSession.prompt}</p>
                    </div>
                  </div>
                </div>

                <div className="review-footer-action">
                  <span>Want to inspect full diff and comment before approving?</span>
                  <button
                    className="btn-link-inspect"
                    onClick={() => onOpenSession(selectedSession.id)}
                  >
                    Open Workspace Diff Inspector &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
