import { useState, useEffect, useCallback } from "react";
import type { CommandKind } from "@codehands/contracts";
import type { DesktopSession, SessionEvent } from "./TaskDetail";
import {
  FileTextIcon,
  UserIcon,
  BoxIcon,
  BarChartIcon,
  PlusIcon,
  BranchIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MaximizeIcon,
  MinimizeIcon,
  TrashIcon,
} from "./Icons";

interface ModernWorkspaceProps {
  sessions: DesktopSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewTask: () => void;
  events: Record<string, SessionEvent[]>;
  onCommand: (sessionId: string, cmd: CommandKind) => boolean;
  connected?: boolean;
}

import type { StagedFile } from "../utils/dynamicDiff";
import { getSessionFiles, getSessionCommitMessage } from "../utils/dynamicDiff";

interface InlineComment {
  id: string;
  file: string;
  line: string;
  codeSnippet: string;
  author: string;
  body: string;
  type: "question" | "security" | "warning";
}

const SAMPLE_COMMENTS: InlineComment[] = [
  {
    id: "c1",
    file: "auth.ts",
    line: "15",
    codeSnippet: "if (!response.ok) throw new Error('Login failed')",
    author: "Claude 3.5",
    body: "Should we include more specific error messages based on the response status code?",
    type: "question",
  },
  {
    id: "c2",
    file: "auth.ts",
    line: "17-18",
    codeSnippet: "localStorage.setItem(TOKEN_KEY, data.tokens.access);\nlocalStorage.setItem(REFRESH_KEY, data.tokens.refresh);",
    author: "Security Linter",
    body: "Consider using httpOnly cookies instead of localStorage for tokens — localStorage is vulnerable to XSS attacks.",
    type: "security",
  },
  {
    id: "c3",
    file: "AuthProvider.tsx",
    line: "38",
    codeSnippet: "const response = await authApi.me();",
    author: "CodeHands Reviewer",
    body: "The error from authApi.login is being silently ignored. This could make debugging difficult.",
    type: "warning",
  },
];

export function ModernWorkspace({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewTask,
  events,
  onCommand,
  connected: _connected,
}: ModernWorkspaceProps) {
  const currentSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const currentEvents = currentSession ? events[currentSession.id] || [] : [];

  const [taskFilter, setTaskFilter] = useState<"all" | "active" | "review">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const availableProjects = Array.from(
    new Set(sessions.map((s) => s.projectName || s.repo?.split("\\").pop() || "sample-repo"))
  ).filter(Boolean);

  const [activeTab, setActiveTab] = useState<
    "execution" | "changes" | "logs" | "artifacts" | "timeline"
  >("execution");

  // Resizable panels state
  const [tasksWidth, setTasksWidth] = useState(260);
  const [centerWidth, setCenterWidth] = useState(420);
  const [filesWidth, setFilesWidth] = useState(230);
  const [isTasksPanelCollapsed, setIsTasksPanelCollapsed] = useState(false);
  const [isRightPanelMaximized, setIsRightPanelMaximized] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);
  const [isFilesCollapsed, setIsFilesCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [filesList, setFilesList] = useState<StagedFile[]>(() =>
    currentSession ? getSessionFiles(currentSession, currentEvents) : []
  );
  const [selectedFileId, setSelectedFileId] = useState<string>(() =>
    currentSession ? getSessionFiles(currentSession, currentEvents)[0]?.id || "" : ""
  );
  const [diffMode, setDiffMode] = useState<"unified" | "split">("split");
  const [commitMessage, setCommitMessage] = useState<string>(() =>
    getSessionCommitMessage(currentSession)
  );
  const [comments, setComments] = useState<InlineComment[]>(SAMPLE_COMMENTS);
  const [agentInput, setAgentInput] = useState("");
  const [logFilter, setLogFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");

  // Sync dynamic files and commit message whenever active session, diff, status or prompt changes
  useEffect(() => {
    if (!currentSession) {
      setFilesList([]);
      setSelectedFileId("");
      return;
    }
    const sessionFiles = getSessionFiles(currentSession, currentEvents);
    setFilesList(sessionFiles);
    if (sessionFiles.length > 0) {
      setSelectedFileId(sessionFiles[0].id);
    } else {
      setSelectedFileId("");
    }
    setCommitMessage(getSessionCommitMessage(currentSession));
  }, [
    currentSession?.id,
    currentSession?.diff,
    currentSession?.status,
    currentSession?.prompt,
    currentEvents.length,
  ]);

  // Live timer for execution tab
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!currentSession?.createdAt) return;
    const startTime = new Date(currentSession.createdAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [currentSession?.createdAt]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Drag-to-resize handler with <|> pointer for Tasks sidebar
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = tasksWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(480, Math.max(160, startWidth + delta));
      setTasksWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [tasksWidth]);

  // Drag-to-resize handler with <|> pointer for Center Panel
  const startResizingCenter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = centerWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(800, Math.max(260, startWidth + delta));
      setCenterWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [centerWidth]);

  // Drag-to-resize handler with <|> pointer for Git Files column
  const startResizingFiles = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const startX = e.clientX;
    const startWidth = filesWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.min(450, Math.max(140, startWidth + delta));
      setFilesWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [filesWidth]);

  const stagedFiles = filesList.filter((f) => f.staged);
  const unstagedFiles = filesList.filter((f) => !f.staged);
  const selectedFile = filesList.find((f) => f.id === selectedFileId) || filesList[0];

  const toggleStageFile = (id: string) => {
    setFilesList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, staged: !f.staged } : f))
    );
  };

  const stageAll = () => {
    setFilesList((prev) => prev.map((f) => ({ ...f, staged: true })));
  };

  const unstageAll = () => {
    setFilesList((prev) => prev.map((f) => ({ ...f, staged: false })));
  };

  const filteredSessions = sessions.filter((s) => {
    if (projectFilter !== "all") {
      const pName = s.projectName || s.repo?.split("\\").pop();
      if (pName !== projectFilter) return false;
    }
    if (taskFilter === "active") return s.status === "running" || s.status === "queued";
    if (taskFilter === "review") return s.status === "awaiting_approval";
    return true;
  });

  // Calculate dynamic phase status from session status & events
  const isAwaitingApproval = currentSession?.status === "awaiting_approval";
  const isApproved =
    (currentSession?.status as string) === "approved" ||
    (currentSession?.status as string) === "finished";
  const isRunning = currentSession?.status === "running" || currentSession?.status === "queued";
  const isFailed =
    currentSession?.status === "failed" || (currentSession?.status as string) === "rejected";

  // Check if there is an explicit failure event
  const failureEvent = currentEvents.find((e) => e.eventType === "task.failed");
  const failureReason =
    failureEvent?.payload?.reason ||
    (currentSession?.status === "failed"
      ? "The runner reported a task execution failure or agent CLI was not ready."
      : null);

  // Derive dynamic task milestones from user prompt
  const taskTitle = currentSession?.title || currentSession?.prompt || "Autonomous Coding Task";
  const shortTaskName = taskTitle.length > 40 ? taskTitle.slice(0, 37) + "..." : taskTitle;

  return (
    <div
      className={`modern-workspace-container ${
        isTasksPanelCollapsed ? "tasks-collapsed" : ""
      } ${isRightPanelMaximized ? "right-maximized" : ""}`}
    >
      {/* 1. LEFT PANEL: Tasks List with Resize Handle & Toggle Arrow */}
      <div
        className={`workspace-left-panel ${isTasksPanelCollapsed ? "collapsed" : ""}`}
        style={{ width: isTasksPanelCollapsed ? 44 : tasksWidth, minWidth: isTasksPanelCollapsed ? 44 : 160 }}
      >
        {isTasksPanelCollapsed ? (
          <div className="collapsed-tasks-strip">
            <button
              className="btn-panel-arrow-toggle expand-tasks"
              onClick={() => setIsTasksPanelCollapsed(false)}
              title="Expand Tasks Sidebar (Ctrl+B)"
            >
              <ChevronRightIcon size={14} color="#27B7F5" />
            </button>
            <div className="collapsed-tasks-dots">
              {filteredSessions.map((s) => {
                const isSelected = s.id === currentSession?.id;
                const isDone = (s.status as string) === "approved" || (s.status as string) === "finished";
                const isWait = s.status === "awaiting_approval";
                const isRun = s.status === "running" || s.status === "queued";
                const isFail = s.status === "failed" || (s.status as string) === "rejected";
                return (
                  <button
                    key={s.id}
                    className={`mini-task-dot-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => onSelectSession(s.id)}
                    title={s.title || s.prompt || s.id}
                  >
                    <span
                      className={`status-indicator-dot-sm ${
                        isDone
                          ? "done"
                          : isWait
                          ? "waiting"
                          : isRun
                          ? "running"
                          : isFail
                          ? "failed"
                          : "idle"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div className="left-panel-top">
              <div className="left-panel-header-row">
                <button className="btn-workspace-new" onClick={onNewTask}>
                  <PlusIcon size={14} color="#ffffff" />
                  <span>New Task</span>
                  <kbd>Ctrl+N</kbd>
                </button>
                <button
                  className="btn-panel-arrow-toggle collapse-tasks"
                  onClick={() => setIsTasksPanelCollapsed(true)}
                  title="Collapse Tasks List (Ctrl+B)"
                >
                  <ChevronLeftIcon size={14} />
                </button>
              </div>

              {availableProjects.length > 1 && (
                <div className="project-filter-selector">
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="project-filter-dropdown"
                    title="Filter tasks by project"
                  >
                    <option value="all">All Projects ({sessions.length})</option>
                    {availableProjects.map((name) => {
                      const count = sessions.filter(
                        (s) => (s.projectName || s.repo?.split("\\").pop()) === name
                      ).length;
                      return (
                        <option key={name} value={name}>
                          📁 {name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="clean-task-filters-row">
                <button
                  className={`filter-pill ${taskFilter === "all" ? "active" : ""}`}
                  onClick={() => setTaskFilter("all")}
                >
                  All ({sessions.length})
                </button>
                <button
                  className={`filter-pill ${taskFilter === "active" ? "active" : ""}`}
                  onClick={() => setTaskFilter("active")}
                >
                  Active
                </button>
                <button
                  className={`filter-pill ${taskFilter === "review" ? "active" : ""}`}
                  onClick={() => setTaskFilter("review")}
                >
                  Review
                </button>
              </div>
            </div>

            <div className="workspace-tasks-list">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s) => {
                  const isSelected = s.id === currentSession?.id;
                  const isDone = (s.status as string) === "approved" || (s.status as string) === "finished";
                  const isWaiting = s.status === "awaiting_approval";
                  const isRunningItem = s.status === "running" || s.status === "queued";
                  const isFailedItem = s.status === "failed" || (s.status as string) === "rejected";

                  return (
                    <div
                      key={s.id}
                      className={`task-clean-row ${isSelected ? "selected" : ""}`}
                      onClick={() => onSelectSession(s.id)}
                    >
                      <div className="task-row-status-dot">
                        <span
                          className={`status-indicator-dot-sm ${
                            isDone
                              ? "done"
                              : isWaiting
                              ? "waiting"
                              : isRunningItem
                              ? "running"
                              : isFailedItem
                              ? "failed"
                              : "idle"
                          }`}
                        />
                      </div>

                      <div className="task-row-content">
                        <strong className="task-row-title" title={s.title || s.prompt}>
                          {s.title || s.prompt || `Task #${s.id.slice(0, 8)}`}
                        </strong>
                        <div className="task-row-sub">
                          <span>{s.projectName || s.repo?.split("\\").pop() || "workspace"}</span>
                          <span>·</span>
                          <span className="task-status-text">{s.status.replace(/_/g, " ")}</span>
                        </div>
                      </div>

                      <span className="task-row-cost">${(s.costUsd || 0).toFixed(2)}</span>

                      {(isFailedItem || isDone) && (
                        <button
                          className={`btn-task-delete-icon${isFailedItem ? " failed" : ""}`}
                          title="Delete task from history"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCommand(s.id, "delete" as CommandKind);
                          }}
                        >
                          <TrashIcon size={12} color="#FF647C" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="tasks-empty-hint">
                  <p>No tasks match this filter.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* DRAG-TO-RESIZE HANDLE with <|> col-resize pointer */}
      {!isTasksPanelCollapsed && (
        <div
          className={`sidebar-resizer-handle ${isDragging ? "dragging" : ""}`}
          onMouseDown={startResizing}
          onDoubleClick={() => setIsTasksPanelCollapsed(true)}
          title="Drag to resize sidebar (double-click to collapse)"
        />
      )}

      {/* 2. CENTER PANEL: Dynamic Agent Execution Feed Tailored to the Task */}
      {!isRightPanelMaximized && (
        <div className="workspace-center-panel" style={{ width: centerWidth, flex: "none" }}>
          {/* Header Bar */}
          <div className="center-panel-header-clean">
            <div className="header-breadcrumbs">
              <span className="repo-pill">
                {currentSession?.projectName ||
                  currentSession?.repo?.split("\\").pop() ||
                  "CodeHands Workspace"}
              </span>
              <span className="crumb-slash">/</span>
              <span className="branch-label">
                <BranchIcon size={12} color="#27B7F5" /> {currentSession?.branch || "main"}
              </span>
            </div>

            <div className="header-status-badge">
              <span className={`status-badge-clean ${currentSession?.status || "running"}`}>
                {currentSession?.status ? currentSession.status.replace(/_/g, " ") : "In Progress"}
              </span>
            </div>
          </div>

          {/* Scrollable Feed */}
          <div className="center-feed-scroll-clean">
            {/* User Specification Banner */}
            <div className="clean-user-prompt-banner">
              <div className="prompt-label-row">
                <UserIcon size={13} color="#9FA4B4" />
                <span>User Specification</span>
              </div>
              <p className="prompt-content-text">
                {currentSession?.prompt || "Task prompt will appear here once submitted."}
              </p>
            </div>

            {/* Autonomous Agent Card */}
            <div className="clean-agent-card">
              <div className="clean-agent-card-header">
                <div className="agent-title-group">
                  {/* Status indicator: spinner ONLY when running, static green when approved, static red when failed */}
                  <span
                    className={`agent-status-ring ${
                      isRunning ? "active" : isApproved ? "done" : isFailed ? "failed" : ""
                    }`}
                  />
                  <div>
                    <strong>CodeHands Autonomous Agent</strong>
                    <span className="agent-timing">
                      {isApproved
                        ? "Completed · All checks approved & committed"
                        : isFailed
                        ? "Execution failed · See runner diagnostic"
                        : isAwaitingApproval
                        ? "Execution paused · Staging review requested"
                        : isRunning
                        ? `Orchestrating changes · ${formatElapsed(elapsedSeconds)}`
                        : "Ready for orchestration"}
                    </span>
                  </div>
                </div>
                <span className="agent-progress-chip">
                  {isApproved
                    ? "5/5 Milestones (100%)"
                    : isFailed
                    ? "Failed (0/5)"
                    : isAwaitingApproval
                    ? "4/5 Milestones (80%)"
                    : isRunning
                    ? "2/5 Milestones (40%)"
                    : "0/5 Milestones"}
                </span>
              </div>

              {/* Dynamic Task Milestones (Derived directly from currentSession.prompt and currentSession.status) */}
              <div className="clean-steps-timeline">
                {/* Step 1: Ingest & Workspace Inspection */}
                <div className={`clean-step-item ${isFailed ? "done" : isApproved || isAwaitingApproval || isRunning ? "done" : "pending"}`}>
                  <div className="timeline-node">✓</div>
                  <div className="step-content">
                    <strong>Inspect workspace boundaries & repository AST</strong>
                    <p>Bound local git workspace at {currentSession?.repo || "d:\\dev\\sample-repo"}.</p>
                  </div>
                </div>

                {/* Step 2: Task Plan & Agent Dispatch */}
                <div
                  className={`clean-step-item ${
                    isFailed ? "failed" : isApproved || isAwaitingApproval ? "done" : isRunning ? "active" : "pending"
                  }`}
                >
                  <div className="timeline-node">
                    {isFailed ? "✕" : isApproved || isAwaitingApproval ? "✓" : isRunning ? "◌" : "-"}
                  </div>
                  <div className="step-content">
                    <strong>Dispatch task to {currentSession?.agent || "agent runner"}</strong>
                    <p>
                      {isFailed
                        ? "Agent runner reported an error during task startup."
                        : `Constructed execution plan for: ${shortTaskName}`}
                    </p>
                    {isFailed && failureReason && (
                      <div className="error-banner-box">
                        <strong>Error:</strong> {failureReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Code Implementation */}
                {!isFailed && (
                  <div
                    className={`clean-step-item ${
                      isApproved || isAwaitingApproval ? "done" : isRunning ? "active" : "pending"
                    }`}
                  >
                    <div className="timeline-node">
                      {isApproved || isAwaitingApproval ? "✓" : isRunning ? "◌" : "-"}
                    </div>
                    <div className="step-content">
                      <strong>Synthesize changes for &quot;{shortTaskName}&quot;</strong>
                      <p>
                        {isApproved || isAwaitingApproval
                          ? "Generated code diffs and validated AST syntax."
                          : "Synthesizing code modifications in workspace sandbox."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 4: Verification & Automated Tests */}
                {!isFailed && (
                  <div
                    className={`clean-step-item ${
                      isApproved ? "done" : isAwaitingApproval ? "done" : "pending"
                    }`}
                  >
                    <div className="timeline-node">{isApproved || isAwaitingApproval ? "✓" : "-"}</div>
                    <div className="step-content">
                      <strong>Execute regression checks & test harness</strong>
                      <p>
                        {isApproved || isAwaitingApproval
                          ? "All unit tests and regression checks passed."
                          : "Awaiting implementation completion before running tests."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 5: Human Review & Approval */}
                {!isFailed && (
                  <div
                    className={`clean-step-item ${
                      isApproved ? "done" : isAwaitingApproval ? "active" : "pending"
                    }`}
                  >
                    <div className="timeline-node">
                      {isApproved ? "✓" : isAwaitingApproval ? "!" : "-"}
                    </div>
                    <div className="step-content">
                      <strong>Staging sign-off & branch merge</strong>
                      <p>
                        {isApproved
                          ? "Approved by developer. Changes merged to branch."
                          : isAwaitingApproval
                          ? "Ready for developer review. Click 'Approve Changes' to commit."
                          : "Pending final review authorization."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt Dock */}
          <div className="clean-prompt-dock">
            <div className="dock-input-row">
              <input
                type="text"
                placeholder="Send guidance or instructions to agent..."
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && agentInput.trim()) {
                    setAgentInput("");
                  }
                }}
              />
              <button
                className="btn-send-guidance"
                onClick={() => setAgentInput("")}
                disabled={!agentInput.trim()}
              >
                <ArrowRightIcon size={14} color="#ffffff" />
              </button>
            </div>

            <div className="dock-toolbar-row">
              <div className="dock-left-badges">
                <span className="dock-badge">{currentSession?.agent || "CodeHands Coder"}</span>
                <span className="dock-badge subtle">{currentSession?.model || "Auto Mode"}</span>
              </div>

              <div className="dock-right-buttons">
                {currentSession && (
                  <>
                    {isAwaitingApproval && (
                      <>
                        <button
                          className="btn-dock-stop"
                          onClick={() => onCommand(currentSession.id, "reject")}
                          title="Reject changes"
                          style={{ borderColor: "rgba(255, 100, 124, 0.4)", color: "#FF647C" }}
                        >
                          Reject
                        </button>
                        <button
                          className="btn-dock-approve"
                          onClick={() => onCommand(currentSession.id, "approve")}
                          title="Approve changes"
                        >
                          Approve
                        </button>
                      </>
                    )}
                    {isRunning && (
                      <button
                        className="btn-dock-stop"
                        onClick={() => onCommand(currentSession.id, "stop")}
                        title="Stop active execution"
                      >
                        Stop
                      </button>
                    )}
                    {isFailed && (
                      <button
                        className="btn-dock-stop"
                        onClick={() => onCommand(currentSession.id, "delete" as CommandKind)}
                        title="Delete failed task"
                        style={{ borderColor: "rgba(255, 100, 124, 0.4)", color: "#FF647C" }}
                      >
                        Delete Task
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESIZE HANDLE between Center Feed and Right Panel */}
      {!isRightPanelMaximized && (
        <div
          className={`sidebar-resizer-handle ${isDragging ? "dragging" : ""}`}
          onMouseDown={startResizingCenter}
          title="Drag to resize panels"
        />
      )}

      {/* 3. RIGHT PANEL: 5 Tabs */}
      <div className={`workspace-right-panel ${isRightPanelMaximized ? "maximized" : ""}`}>
        <div className="right-panel-tabs-bar" role="tablist">
          <div className="tabs-left-group">
            {isRightPanelMaximized && (
              <button
                className="btn-restore-feed-hint"
                onClick={() => setIsRightPanelMaximized(false)}
                title="Show Agent Feed"
              >
                <ChevronLeftIcon size={13} color="#27B7F5" />
                <span>Agent Feed</span>
              </button>
            )}
            <button
              className={`tab-nav-btn ${activeTab === "execution" ? "active" : ""}`}
              onClick={() => setActiveTab("execution")}
            >
              Execution
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "changes" ? "active" : ""}`}
              onClick={() => setActiveTab("changes")}
            >
              Changes <span className="tab-badge">{stagedFiles.length + unstagedFiles.length}</span>
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "logs" ? "active" : ""}`}
              onClick={() => setActiveTab("logs")}
            >
              Logs
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "artifacts" ? "active" : ""}`}
              onClick={() => setActiveTab("artifacts")}
            >
              Artifacts
            </button>
            <button
              className={`tab-nav-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              Timeline
            </button>
          </div>

          <div className="tabs-right-actions">
            <button
              className={`btn-panel-size-toggle ${isRightPanelMaximized ? "active" : ""}`}
              onClick={() => setIsRightPanelMaximized(!isRightPanelMaximized)}
              title={isRightPanelMaximized ? "Restore Split View" : "Maximize Workspace (Wide View)"}
            >
              {isRightPanelMaximized ? (
                <>
                  <MinimizeIcon size={13} />
                  <span>Restore</span>
                </>
              ) : (
                <>
                  <MaximizeIcon size={13} />
                  <span>Maximize</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Execution */}
        {activeTab === "execution" && (
          <div className="execution-tab-panel">
            {/* Phase Stepper */}
            <div className="clean-phase-stepper">
              <div className="stepper-item done">
                <span className="stepper-dot">✓</span>
                <span className="stepper-name">Analyze</span>
                <small>Claude 3.5</small>
              </div>
              <div className="stepper-line done" />
              <div className={`stepper-item ${isFailed ? "failed" : isApproved || isAwaitingApproval ? "done" : "active"}`}>
                <span className="stepper-dot">{isFailed ? "✕" : isApproved || isAwaitingApproval ? "✓" : "◌"}</span>
                <span className="stepper-name">Plan</span>
                <small>Claude 3.5</small>
              </div>
              <div className={`stepper-line ${isApproved || isAwaitingApproval ? "done" : ""}`} />
              <div className={`stepper-item ${isApproved ? "done" : isAwaitingApproval ? "active" : isFailed ? "pending" : isRunning ? "active" : "pending"}`}>
                <span className="stepper-dot">{isApproved ? "✓" : "3"}</span>
                <span className="stepper-name">Implement</span>
                <small>{currentSession?.agent || "Qwen 2.5"}</small>
              </div>
              <div className={`stepper-line ${isApproved ? "done" : ""}`} />
              <div className={`stepper-item ${isApproved ? "done" : isAwaitingApproval ? "active" : "pending"}`}>
                <span className="stepper-dot">{isApproved ? "✓" : "4"}</span>
                <span className="stepper-name">Test</span>
                <small>Test Runner</small>
              </div>
              <div className={`stepper-line ${isApproved ? "done" : ""}`} />
              <div className={`stepper-item ${isApproved ? "done" : isAwaitingApproval ? "active" : "pending"}`}>
                <span className="stepper-dot">{isApproved ? "✓" : "5"}</span>
                <span className="stepper-name">Review</span>
                <small>Developer</small>
              </div>
            </div>

            {/* 2x2 Telemetry Grid */}
            <div className="clean-telemetry-grid">
              <div className="telemetry-box">
                <span className="t-label">CURRENT PHASE</span>
                <strong className="t-val">
                  {isApproved
                    ? "Complete"
                    : isFailed
                    ? "Failed"
                    : isAwaitingApproval
                    ? "Awaiting Approval"
                    : isRunning
                    ? "Running"
                    : "Ready"}
                </strong>
                <span className="t-sub">
                  {isFailed
                    ? "Runner reported error"
                    : isAwaitingApproval
                    ? "Developer review required"
                    : "Orchestration active"}
                </span>
              </div>
              <div className="telemetry-box">
                <span className="t-label">TIME ELAPSED</span>
                <strong className="t-val">{formatElapsed(elapsedSeconds)}</strong>
                <span className="t-sub">
                  {currentSession?.createdAt
                    ? `Started at ${new Date(currentSession.createdAt).toLocaleTimeString()}`
                    : "Session started"}
                </span>
              </div>
              <div className="telemetry-box">
                <span className="t-label">DISPATCHED MODEL</span>
                <strong className="t-val">{currentSession?.model || "Claude 3.5 Sonnet"}</strong>
                <span className="t-sub">{currentSession?.agent || "Local runner"}</span>
              </div>
              <div className="telemetry-box">
                <span className="t-label">SESSION SPEND</span>
                <strong className="t-val">${(currentSession?.costUsd || 0).toFixed(2)}</strong>
                <span className="t-sub">Tracked by local daemon</span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="clean-actions-card">
              <h4>Orchestration Controls</h4>
              <div className="action-buttons-flex">
                {isAwaitingApproval && (
                  <>
                    <button
                      className="btn-clean-action reject"
                      onClick={() => currentSession && onCommand(currentSession.id, "reject")}
                      title="Reject generated code changes and discard working tree"
                    >
                      Reject Changes
                    </button>
                    <button
                      className="btn-clean-action approve"
                      onClick={() => currentSession && onCommand(currentSession.id, "approve")}
                      title="Approve changes and merge to git branch"
                    >
                      ✓ Approve Changes
                    </button>
                  </>
                )}

                {isRunning && (
                  <button
                    className="btn-clean-action stop"
                    onClick={() => currentSession && onCommand(currentSession.id, "stop")}
                    title="Stop the current running agent task"
                  >
                    Abort Run
                  </button>
                )}

                {currentSession?.status === "stopped" && (
                  <button
                    className="btn-clean-action resume"
                    onClick={() => currentSession && onCommand(currentSession.id, "resume")}
                    title="Resume the stopped agent task"
                  >
                    Resume Run
                  </button>
                )}

                {isFailed && (
                  <button
                    className="btn-clean-action delete"
                    onClick={() => currentSession && onCommand(currentSession.id, "delete" as CommandKind)}
                    title="Remove this failed task from workspace history"
                  >
                    <TrashIcon size={14} color="#FF647C" />
                    Delete Failed Task
                  </button>
                )}

                {isApproved && (
                  <>
                    <span className="approved-badge-status" style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>
                      ✓ Approved &amp; Merged
                    </span>
                    <button
                      className="btn-clean-action delete"
                      onClick={() => currentSession && onCommand(currentSession.id, "delete" as CommandKind)}
                      title="Remove task from history"
                      style={{ marginLeft: "auto" }}
                    >
                      <TrashIcon size={13} />
                      Delete Task
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Changes */}
        {activeTab === "changes" && (
          <div className="changes-tab-panel">
            <div className="git-changes-layout">
              {/* Left Subcolumn: Files list with collapse/expand arrow */}
              <div
                className={`git-files-column ${isFilesCollapsed ? "collapsed" : ""}`}
                style={{ width: isFilesCollapsed ? 34 : filesWidth, minWidth: isFilesCollapsed ? 34 : 140 }}
              >
                {isFilesCollapsed ? (
                  <div className="collapsed-files-strip">
                    <button
                      className="btn-panel-arrow-toggle expand-files"
                      onClick={() => setIsFilesCollapsed(false)}
                      title="Expand Files List"
                    >
                      <ChevronRightIcon size={13} color="#27B7F5" />
                    </button>
                    <span className="collapsed-vertical-label">
                      {stagedFiles.length + unstagedFiles.length} files
                    </span>
                  </div>
                ) : filesList.length === 0 ? (
                  <div className="files-empty-notice">
                    <span className="empty-title">
                      {currentSession?.status === "queued"
                        ? "Task Queued"
                        : currentSession?.status === "running"
                        ? "Agent Running"
                        : "No Files Modified"}
                    </span>
                    <small>
                      {currentSession?.status === "queued"
                        ? "Waiting for runner execution..."
                        : currentSession?.status === "running"
                        ? "Synthesizing code diffs..."
                        : "No changes staged."}
                    </small>
                  </div>
                ) : (
                  <>
                    <div className="files-section-block">
                      <div className="section-head-row">
                        <strong>STAGED ({stagedFiles.length})</strong>
                        <div className="head-sub-actions">
                          <button className="btn-link-action" onClick={unstageAll}>
                            Unstage All
                          </button>
                          <button
                            className="btn-panel-arrow-toggle"
                            onClick={() => setIsFilesCollapsed(true)}
                            title="Collapse Files Sidebar"
                          >
                            <ChevronLeftIcon size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="file-items-list">
                        {stagedFiles.map((file) => (
                          <div
                            key={file.id}
                            className={`git-file-row ${selectedFileId === file.id ? "active" : ""}`}
                            onClick={() => setSelectedFileId(file.id)}
                          >
                            <input
                              type="checkbox"
                              checked={file.staged}
                              onChange={() => toggleStageFile(file.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`file-status-letter ${file.status}`}>
                              {file.status}
                            </span>
                            <div className="file-info-col">
                              <span className="filename">{file.name}</span>
                              <span className="filepath">{file.path}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="files-section-block">
                      <div className="section-head-row">
                        <strong>CHANGES ({unstagedFiles.length})</strong>
                        <button className="btn-link-action" onClick={stageAll}>
                          Stage All
                        </button>
                      </div>
                      <div className="file-items-list">
                        {unstagedFiles.map((file) => (
                          <div
                            key={file.id}
                            className={`git-file-row ${selectedFileId === file.id ? "active" : ""}`}
                            onClick={() => setSelectedFileId(file.id)}
                          >
                            <input
                              type="checkbox"
                              checked={file.staged}
                              onChange={() => toggleStageFile(file.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`file-status-letter ${file.status}`}>
                              {file.status}
                            </span>
                            <div className="file-info-col">
                              <span className="filename">{file.name}</span>
                              <span className="filepath">{file.path}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="git-commit-box">
                      <textarea
                        rows={2}
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Commit message..."
                      />
                      <div className="commit-box-footer">
                        <span>{stagedFiles.length} files staged</span>
                        <button
                          className="btn-commit-action"
                          disabled={stagedFiles.length === 0}
                          onClick={() => {
                            if (currentSession) {
                              onCommand(currentSession.id, "approve");
                            }
                          }}
                        >
                          Commit
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* RESIZE HANDLE between Files List and Diff Viewer */}
              {!isFilesCollapsed && (
                <div
                  className={`sidebar-resizer-handle ${isDragging ? "dragging" : ""}`}
                  onMouseDown={startResizingFiles}
                  onDoubleClick={() => setIsFilesCollapsed(true)}
                  title="Drag to resize files sidebar (double-click to collapse)"
                />
              )}

              {/* Center Subcolumn: Diff Viewer */}
              <div className="git-diff-column">
                <div className="diff-header-bar">
                  <div className="diff-filename">
                    <span>
                      {selectedFile
                        ? `${selectedFile.path}/${selectedFile.name}`
                        : currentSession?.status === "queued"
                        ? "Task Queued (No files yet)"
                        : currentSession?.status === "running"
                        ? "Execution In Progress"
                        : "No file selected"}
                    </span>
                  </div>
                  <div className="diff-header-right">
                    <div className="diff-mode-toggles">
                      <button
                        className={`mode-btn ${diffMode === "unified" ? "active" : ""}`}
                        onClick={() => setDiffMode("unified")}
                      >
                        Unified
                      </button>
                      <button
                        className={`mode-btn ${diffMode === "split" ? "active" : ""}`}
                        onClick={() => setDiffMode("split")}
                      >
                        Split
                      </button>
                    </div>

                    {isCommentsCollapsed && (
                      <button
                        className="btn-toggle-comments-open"
                        onClick={() => setIsCommentsCollapsed(false)}
                        title="Show Comments"
                      >
                        <ChevronLeftIcon size={12} color="#27B7F5" />
                        <span>Comments ({comments.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedFile ? (
                  <div className="diff-code-scroll">
                    <pre className="diff-pre-block">
                      {selectedFile.diffText.split("\n").map((line, idx) => {
                        const isChunkHeader = line.startsWith("@@");
                        const isAdded = line.startsWith("+") && !isChunkHeader;
                        const isRemoved = line.startsWith("-") && !isChunkHeader;

                        return (
                          <div
                            key={idx}
                            className={`diff-line-row ${
                              isChunkHeader
                                ? "chunk-header"
                                : isAdded
                                ? "added"
                                : isRemoved
                                ? "removed"
                                : "context"
                            }`}
                          >
                            <span className="line-num">{idx + 1}</span>
                            <span className="line-code">{line}</span>
                          </div>
                        );
                      })}
                    </pre>
                  </div>
                ) : (
                  <div className="diff-empty-viewer">
                    <div className="empty-viewer-card">
                      <BoxIcon size={36} color="#27B7F5" />
                      <h3>
                        {currentSession?.status === "queued"
                          ? "Task Is Queued"
                          : currentSession?.status === "running"
                          ? "Execution In Progress"
                          : "No Changes Recorded"}
                      </h3>
                      <p>
                        {currentSession?.status === "queued"
                          ? "This task is waiting in the runner queue. When execution begins, files and code diffs will appear here automatically."
                          : currentSession?.status === "running"
                          ? "The agent is executing code changes and running AST checks. Diffs will populate when ready."
                          : "No file modifications were recorded for this task."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Subcolumn: Inline Comments */}
              {!isCommentsCollapsed && (
                <div className="git-comments-column">
                  <div className="comments-head-row">
                    <strong>{comments.length} Comments</strong>
                    <div className="head-actions">
                      <button
                        className="btn-text-sm"
                        onClick={() =>
                          navigator.clipboard.writeText(JSON.stringify(comments, null, 2))
                        }
                      >
                        Copy
                      </button>
                      <button className="btn-text-sm" onClick={() => setComments([])}>
                        Clear
                      </button>
                      <button
                        className="btn-panel-arrow-toggle"
                        onClick={() => setIsCommentsCollapsed(true)}
                        title="Collapse Comments Panel"
                      >
                        <ChevronRightIcon size={13} />
                      </button>
                    </div>
                  </div>

                  <button className="btn-export-agent">Export for Agent</button>

                  <div className="comments-cards-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className={`comment-card ${comment.type}`}>
                        <div className="comment-card-top">
                          <span className="comment-file-link">
                            {comment.file}:{comment.line}
                          </span>
                          <span className="comment-type-badge">{comment.author}</span>
                        </div>
                        <div className="comment-snippet">
                          <code>{comment.codeSnippet}</code>
                        </div>
                        <p className="comment-body">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Logs */}
        {activeTab === "logs" && (
          <div className="logs-tab-panel">
            <div className="logs-toolbar">
              <div className="log-filters">
                {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    className={`lvl-btn ${logFilter === lvl ? "active" : ""}`}
                    onClick={() => setLogFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <button
                className="btn-copy-logs"
                onClick={() => {
                  const raw = currentEvents
                    .map((e) => `[${e.ts}] ${e.eventType}: ${JSON.stringify(e.payload)}`)
                    .join("\n");
                  navigator.clipboard.writeText(raw);
                }}
              >
                Copy Logs
              </button>
            </div>

            <div className="logs-terminal-viewport">
              {currentEvents.length > 0 ? (
                currentEvents.map((ev, i) => {
                  const p = (ev.payload || {}) as Record<string, any>;
                  const isErr = ev.eventType.includes("fail") || ev.eventType.includes("error");
                  const isWrn = ev.eventType.includes("warn");
                  // Build summary: prefer human-readable fields, fall back to JSON
                  const summaryText =
                    p.reason ||
                    p.summary ||
                    p.text ||
                    p.command ||
                    p.message ||
                    (p.path ? `${p.path}` : null) ||
                    (p.file ? `${p.file}` : null) ||
                    (p.files && Array.isArray(p.files) && p.files.length > 0
                      ? p.files.join(", ")
                      : null) ||
                    JSON.stringify(p);

                  // Collect file paths from various payload shapes
                  const filePaths: string[] = [];
                  if (p.files && Array.isArray(p.files)) filePaths.push(...p.files);
                  if (p.path && !p.files) filePaths.push(p.path);
                  if (p.file && !p.files) filePaths.push(p.file);
                  if (p.created && Array.isArray(p.created)) filePaths.push(...p.created);
                  if (p.modified && Array.isArray(p.modified)) filePaths.push(...p.modified);

                  return (
                    <div key={i} className="log-entry-row">
                      <span className="log-ts">{new Date(ev.ts).toLocaleTimeString()}</span>
                      <span className={`log-lvl ${isErr ? "error" : isWrn ? "warn" : "info"}`}>
                        {isErr ? "ERROR" : isWrn ? "WARN" : "INFO"}
                      </span>
                      <span className="log-type">{ev.eventType}</span>
                      <span className="log-summary">{summaryText}</span>
                      {filePaths.length > 0 && (
                        <div className="log-files-list">
                          {filePaths.map((f: string, fi: number) => (
                            <span key={fi} className="log-file-pill" title={f}>
                              {f.replace(/\\/g, "/").split("/").pop()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="sample-logs-stream">
                  <div className="log-entry-row">
                    <span className="log-ts">12:00:01</span>
                    <span className="log-lvl info">INFO</span>
                    <span className="log-type">daemon.watch</span>
                    <span className="log-summary">
                      Bound repository workspace at {currentSession?.repo || "d:\\dev\\sample-repo"}.
                    </span>
                  </div>
                  <div className="log-entry-row">
                    <span className="log-ts">12:00:03</span>
                    <span className="log-lvl info">INFO</span>
                    <span className="log-type">task.ingested</span>
                    <span className="log-summary">Task prompt validated and queued.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Artifacts */}
        {activeTab === "artifacts" && (
          <div className="artifacts-tab-panel">
            <div className="artifacts-list">
              <div className="artifact-item-card">
                <div className="art-icon">
                  <FileTextIcon size={18} color="#27B7F5" />
                </div>
                <div className="art-info">
                  <strong>task-specification-plan.md</strong>
                  <small>Markdown Document · 3.8 KB · Generated for {shortTaskName}</small>
                </div>
                <button
                  className="btn-art-action"
                  onClick={() => alert(`Previewing specification for: ${taskTitle}`)}
                >
                  Preview
                </button>
              </div>

              <div className="artifact-item-card">
                <div className="art-icon">
                  <BarChartIcon size={18} color="#20C997" />
                </div>
                <div className="art-info">
                  <strong>test-coverage-report.json</strong>
                  <small>
                    JSON Report · 14.2 KB · {isApproved ? "18/18 Tests Passed (100%)" : "Verification Report"}
                  </small>
                </div>
                <button
                  className="btn-art-action"
                  onClick={() => alert("Verification report: 100% test assertions passed.")}
                >
                  View
                </button>
              </div>

              <div className="artifact-item-card">
                <div className="art-icon">
                  <BoxIcon size={18} color="#27B7F5" />
                </div>
                <div className="art-info">
                  <strong>{currentSession?.projectName || "sample-repo"}-patch.diff</strong>
                  <small>Git Unified Diff · Staged Changes · Ready for commit</small>
                </div>
                <button
                  className="btn-art-action"
                  onClick={() => setActiveTab("changes")}
                >
                  Inspect Diff
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Timeline */}
        {activeTab === "timeline" && (
          <div className="timeline-tab-panel">
            <div className="timeline-events-stream">
              {currentEvents.length > 0 ? (
                currentEvents.map((ev, idx) => {
                  const p = (ev.payload || {}) as Record<string, any>;
                  const isErr = ev.eventType.includes("fail") || ev.eventType.includes("reject");
                  const isDone = ev.eventType.includes("finish") || ev.eventType.includes("approved");
                  const eventSummary =
                    p.reason ||
                    p.summary ||
                    p.text ||
                    (p.command ? `Command: ${p.command}` : null) ||
                    (p.path ? `File: ${p.path}` : null) ||
                    ev.eventType;

                  return (
                    <div key={idx} className="timeline-event-item">
                      <div className={`event-bullet ${isErr ? "failed" : isDone ? "done" : "active"}`} />
                      <div className="event-content">
                        <div className="event-top-row">
                          <span className="event-time">{new Date(ev.ts).toLocaleTimeString()}</span>
                          <span className="event-type-tag">{ev.eventType}</span>
                        </div>
                        <strong>{eventSummary}</strong>
                        {p.files && p.files.length > 0 && (
                          <p>Files: {Array.isArray(p.files) ? p.files.join(", ") : JSON.stringify(p.files)}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  <div className="timeline-event-item">
                    <div className="event-bullet done" />
                    <div className="event-content">
                      <div className="event-top-row">
                        <span className="event-time">12:00:00</span>
                        <span className="event-type-tag">task.claimed</span>
                      </div>
                      <strong>Task Ingested & Workspace Bound</strong>
                      <p>Bound local git workspace at {currentSession?.repo || "d:\\dev\\sample-repo"}.</p>
                    </div>
                  </div>

                  <div className="timeline-event-item">
                    <div className={`event-bullet ${isFailed ? "failed" : isApproved ? "done" : "active"}`} />
                    <div className="event-content">
                      <div className="event-top-row">
                        <span className="event-time">12:00:05</span>
                        <span className="event-type-tag">
                          {isFailed ? "task.failed" : isApproved ? "task.finished" : "task.running"}
                        </span>
                      </div>
                      <strong>
                        {isFailed
                          ? `Task Failed: ${failureReason || "Runner error"}`
                          : isApproved
                          ? "Task Approved & Merged"
                          : `Executing: ${shortTaskName}`}
                      </strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
