import { useState, useEffect, useCallback } from "react";
import type { CommandKind } from "@codehands/contracts";
import type { DesktopSession, SessionEvent } from "./TaskDetail";
import {
  FileTextIcon,
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
import { DemoNote, DemoTag, hasRealDiff } from "./Demo";

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
  const [filesWidth, setFilesWidth] = useState(230);
  const [isTasksPanelCollapsed, setIsTasksPanelCollapsed] = useState(false);
  const [isRightPanelMaximized, setIsRightPanelMaximized] = useState(false);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(true); // sample comments, closed until asked for
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

  const files = [...stagedFiles, ...unstagedFiles];
  // Sample code is shown when the daemon stored no diff. Say so wherever someone might act on it.
  const showingSampleCode = files.length > 0 && !hasRealDiff(currentSession);
  const sampleCodeWarning = showingSampleCode && (
    <DemoNote danger label="No real diff">
      The daemon sent no diff for this task, so the files and code shown are samples.{isAwaitingApproval ? " Check the real branch before approving." : ""}
    </DemoNote>
  );
  const statusText = currentSession?.status ? currentSession.status.replace(/_/g, " ") : "";
  const progress: [string, string][] = [
    ["Analyze", "done"],
    ["Plan", isFailed ? "failed" : isApproved || isAwaitingApproval ? "done" : "active"],
    ["Implement", isApproved || isAwaitingApproval ? "done" : isRunning ? "active" : ""],
    ["Test", isApproved || isAwaitingApproval ? "done" : ""],
    ["Review", isApproved ? "done" : isAwaitingApproval ? "active" : ""],
  ];
  const milestones: [string, string][] = [
    ["Inspect workspace boundaries & repository AST", `Bound local git workspace at ${currentSession?.repo || "d:\\dev\\sample-repo"}.`],
    [`Dispatch task to ${currentSession?.agent || "agent runner"}`, `Constructed execution plan for: ${shortTaskName}`],
    [`Synthesize changes for "${shortTaskName}"`, "Generated code diffs and validated AST syntax."],
    ["Execute regression checks & test harness", "All unit tests and regression checks passed."],
    ["Staging sign-off & branch merge", "Ready for developer review."],
  ];
  const act = (kind: string) => currentSession && onCommand(currentSession.id, kind as CommandKind);

  return (
    <div className={`modern-workspace-container ${isTasksPanelCollapsed ? "tasks-collapsed" : ""}`}>
      {/* Task list */}
      {!isRightPanelMaximized && (
        <div
          className={`workspace-left-panel ${isTasksPanelCollapsed ? "collapsed" : ""}`}
          style={{ width: isTasksPanelCollapsed ? 44 : tasksWidth, minWidth: isTasksPanelCollapsed ? 44 : 160 }}
        >
          {isTasksPanelCollapsed ? (
            <div className="collapsed-tasks-strip">
              <button className="icon-btn expand-tasks" onClick={() => setIsTasksPanelCollapsed(false)} title="Show task list">
                <ChevronRightIcon size={14} />
              </button>
              {filteredSessions.map((s) => (
                <button
                  key={s.id}
                  className={`mini-task-dot-btn ${s.id === currentSession?.id ? "selected" : ""}`}
                  onClick={() => onSelectSession(s.id)}
                  title={s.title || s.prompt || s.id}
                >
                  <span className={`dot ${s.status}`} />
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="pane-list-head">
                <div className="row">
                  <h2 className="grow">Tasks</h2>
                  <button className="icon-btn" onClick={onNewTask} title="New task (Ctrl+N)">
                    <PlusIcon size={14} />
                  </button>
                  <button className="icon-btn collapse-tasks" onClick={() => setIsTasksPanelCollapsed(true)} title="Hide task list">
                    <ChevronLeftIcon size={14} />
                  </button>
                </div>
                {availableProjects.length > 1 && (
                  <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} title="Filter tasks by project">
                    <option value="all">All projects ({sessions.length})</option>
                    {availableProjects.map((name) => {
                      const count = sessions.filter((s) => (s.projectName || s.repo?.split("\\").pop()) === name).length;
                      return (
                        <option key={name} value={name}>
                          {name} ({count})
                        </option>
                      );
                    })}
                  </select>
                )}
                <div className="seg">
                  <button className={taskFilter === "all" ? "active" : ""} onClick={() => setTaskFilter("all")}>All ({sessions.length})</button>
                  <button className={taskFilter === "active" ? "active" : ""} onClick={() => setTaskFilter("active")}>Active</button>
                  <button className={taskFilter === "review" ? "active" : ""} onClick={() => setTaskFilter("review")}>Review</button>
                </div>
              </div>

              <div className="pane-list-body">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((s) => {
                    const removable = ["approved", "finished", "failed", "rejected"].includes(s.status as string);
                    return (
                      <div
                        key={s.id}
                        className={`pick-row task-clean-row ${s.id === currentSession?.id ? "selected" : ""}`}
                        onClick={() => onSelectSession(s.id)}
                      >
                        <span className={`dot ${s.status}`} />
                        <div className="task-row-content">
                          <span className="task-row-title" title={s.title || s.prompt}>{s.title || s.prompt || `Task #${s.id.slice(0, 8)}`}</span>
                          <div className="task-row-sub">
                            <span>{s.projectName || s.repo?.split("\\").pop() || "workspace"}</span>
                            <span>·</span>
                            <span>{s.status.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                        <span className="task-row-cost">${(s.costUsd || 0).toFixed(2)}</span>
                        {removable && (
                          <button
                            className="btn-task-delete-icon"
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
                  <p className="mut sm" style={{ padding: 10 }}>No tasks match this filter.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!isRightPanelMaximized && !isTasksPanelCollapsed && (
        <div
          className={`sidebar-resizer-handle ${isDragging ? "dragging" : ""}`}
          onMouseDown={startResizing}
          onDoubleClick={() => setIsTasksPanelCollapsed(true)}
          title="Drag to resize (double-click to hide)"
        />
      )}

      {/* The task */}
      <div className="pane-main">
        {!currentSession ? (
          <div className="empty">
            <h3>No tasks yet</h3>
            <p>Start one and watch it here.</p>
            <button className="btn primary" onClick={onNewTask}>New task</button>
          </div>
        ) : (
          <>
            <div className="task-head">
              <div className="task-head-top">
                <div className="task-head-title">
                  <div className="row">
                    <h2 className="ell" title={taskTitle}>{taskTitle}</h2>
                    <span className={`pill ${currentSession.status}`}>{statusText}</span>
                  </div>
                  <div className="row mut sm">
                    <span>{currentSession.projectName || currentSession.repo?.split("\\").pop() || "workspace"}</span>
                    <span className="row" style={{ gap: 4 }}><BranchIcon size={12} />{currentSession.branch || "main"}</span>
                  </div>
                </div>
                <div className="row">
                  {isAwaitingApproval && (
                    <>
                      <button className="btn danger btn-clean-action reject" onClick={() => act("reject")} title="Discard the change">Reject</button>
                      <button className="btn go btn-clean-action approve" onClick={() => act("approve")} title="Approve and commit the change">Approve</button>
                    </>
                  )}
                  {isRunning && (
                    <button className="btn danger btn-clean-action stop" onClick={() => act("stop")} title="Stop this task">Stop</button>
                  )}
                  {currentSession.status === "stopped" && (
                    <button className="btn primary btn-clean-action resume" onClick={() => act("resume")} title="Resume this task">Resume</button>
                  )}
                  {(isFailed || isApproved) && (
                    <button className="btn ghost btn-clean-action delete" onClick={() => act("delete")} title="Remove this task from history">
                      <TrashIcon size={13} /> Delete task
                    </button>
                  )}
                </div>
              </div>

              <div className="tabs" role="tablist">
                {(
                  [
                    ["execution", "Summary"],
                    ["changes", "Changes"],
                    ["logs", "Logs"],
                    ["artifacts", "Artifacts"],
                    ["timeline", "Timeline"],
                  ] as const
                ).map(([id, label]) => (
                  <button key={id} className={`tab-nav-btn ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>
                    {label}
                    {id === "changes" && <span className="tab-badge">{files.length}</span>}
                    {id === "artifacts" && <DemoTag label="Demo" />}
                  </button>
                ))}
                <span className="tabs-spacer" />
                <button
                  className="btn-panel-size-toggle"
                  onClick={() => setIsRightPanelMaximized(!isRightPanelMaximized)}
                  title={isRightPanelMaximized ? "Show the task list" : "Hide the task list for more room"}
                >
                  {isRightPanelMaximized ? <MinimizeIcon size={13} /> : <MaximizeIcon size={13} />}
                  <span className="sm">{isRightPanelMaximized ? "Restore" : "Maximize"}</span>
                </button>
              </div>
            </div>

            {activeTab === "execution" && (
              <div className="pane-scroll">
                <div className="col">
                  {isAwaitingApproval && sampleCodeWarning}
                  {isFailed && failureReason && (
                    <div className="error-banner-box" style={{ marginBottom: 14 }}>
                      <strong>Why it failed: </strong>{failureReason}
                    </div>
                  )}

                  <div className="fact-grid">
                    <div className="card">
                      <span className="mut sm">Status</span>
                      <b style={{ textTransform: "capitalize" }}>{statusText}</b>
                    </div>
                    <div className="card">
                      <span className="mut sm">Time since start</span>
                      <b>{formatElapsed(elapsedSeconds)}</b>
                      <span className="mut sm">{currentSession.createdAt ? `Started ${new Date(currentSession.createdAt).toLocaleTimeString()}` : ""}</span>
                    </div>
                    <div className="card">
                      <span className="mut sm">Model</span>
                      <b>{currentSession.model || "unspecified"}</b>
                      <span className="mut sm">{currentSession.agent}</span>
                    </div>
                    <div className="card">
                      <span className="mut sm">Cost</span>
                      <b>${(currentSession.costUsd || 0).toFixed(2)}</b>
                      <span className="mut sm">From the local daemon</span>
                    </div>
                  </div>

                  <div className="sec-h"><span>What you asked for</span></div>
                  <div className="card pad">{currentSession.prompt}</div>

                  <div className="sec-h"><span className="row">Progress <DemoTag label="Estimated from status" /></span></div>
                  <div className="card pad">
                    <div className="progress-track">
                      {progress.map(([name, state]) => (
                        <div key={name} className={`progress-step ${state}`}>
                          <i />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentEvents.length > 0 && (
                    <>
                      <div className="sec-h">
                        <span>Latest activity</span>
                        <button className="btn-link" onClick={() => setActiveTab("timeline")}>Full timeline</button>
                      </div>
                      <div className="card list">
                        {currentEvents.slice(-3).map((ev) => (
                          <div key={ev.id}>
                            <span className="mono mut">{new Date(ev.ts).toLocaleTimeString()}</span>
                            <span className="grow ell">{ev.payload?.summary || ev.payload?.reason || ev.eventType}</span>
                            <span className="mono vi">{ev.eventType}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <details className="card demo-details mt16">
                    <summary><span className="grow">Milestone view</span><DemoTag /></summary>
                    <div className="body">
                      <p className="mut sm">Fixed wording. It does not come from the agent, so it is not proof that tests ran or passed.</p>
                      {milestones.map(([title, text]) => (
                        <div key={title} className="mt8">
                          <div>{title}</div>
                          <div className="mut sm">{text}</div>
                        </div>
                      ))}
                    </div>
                  </details>

                  <div className="sec-h"><span className="row">Message the agent <DemoTag label="Not sent yet" /></span></div>
                  <div className="guidance-row">
                    <input
                      type="text"
                      placeholder="Send guidance or instructions to agent..."
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && agentInput.trim()) setAgentInput("");
                      }}
                    />
                    <button className="btn btn-send-guidance" onClick={() => setAgentInput("")} disabled={!agentInput.trim()} title="Send">
                      <ArrowRightIcon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "changes" && (
              <>
                {showingSampleCode && <div style={{ padding: "12px 16px 0" }}>{sampleCodeWarning}</div>}
                <div className="git-changes-layout">
                  <div
                    className={`git-files-column ${isFilesCollapsed ? "collapsed" : ""}`}
                    style={{ width: isFilesCollapsed ? 36 : filesWidth, minWidth: isFilesCollapsed ? 36 : 140 }}
                  >
                    {isFilesCollapsed ? (
                      <button className="icon-btn expand-files" onClick={() => setIsFilesCollapsed(false)} title="Show files">
                        <ChevronRightIcon size={13} />
                      </button>
                    ) : filesList.length === 0 ? (
                      <div className="empty">
                        <h3>{currentSession.status === "queued" ? "Task queued" : currentSession.status === "running" ? "Agent running" : "No files changed"}</h3>
                        <p className="sm">{currentSession.status === "running" ? "Changes appear here when they are ready." : "Nothing to show yet."}</p>
                      </div>
                    ) : (
                      <>
                        {(
                          [
                            ["Staged", stagedFiles, "Unstage all", unstageAll],
                            ["Not staged", unstagedFiles, "Stage all", stageAll],
                          ] as const
                        ).map(([title, list, actionLabel, action], index) => (
                          <div key={title}>
                            <div className="section-head-row">
                              <strong>{title} ({list.length})</strong>
                              <span className="row" style={{ gap: 4 }}>
                                <button className="btn-link-action" onClick={action}>{actionLabel}</button>
                                {index === 0 && (
                                  <button className="icon-btn" onClick={() => setIsFilesCollapsed(true)} title="Hide files">
                                    <ChevronLeftIcon size={12} />
                                  </button>
                                )}
                              </span>
                            </div>
                            {list.map((file) => (
                              <div
                                key={file.id}
                                className={`git-file-row ${selectedFileId === file.id ? "active" : ""}`}
                                onClick={() => setSelectedFileId(file.id)}
                              >
                                <input type="checkbox" checked={file.staged} onChange={() => toggleStageFile(file.id)} onClick={(e) => e.stopPropagation()} />
                                <span className={`file-status-letter ${file.status}`}>{file.status}</span>
                                <div className="file-info-col">
                                  <span className="filename">{file.name}</span>
                                  <span className="filepath">{file.path}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="git-commit-box">
                          <textarea rows={2} value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} placeholder="Commit message..." />
                          <button className="btn btn-commit-action" disabled={stagedFiles.length === 0} onClick={() => act("approve")}>
                            Commit (approves the task)
                          </button>
                          <span className="mut sm">Ticks and the message stay on this screen. The daemon is only told to approve.</span>
                        </div>
                      </>
                    )}
                  </div>

                  {!isFilesCollapsed && (
                    <div
                      className={`sidebar-resizer-handle ${isDragging ? "dragging" : ""}`}
                      onMouseDown={startResizingFiles}
                      onDoubleClick={() => setIsFilesCollapsed(true)}
                      title="Drag to resize (double-click to hide)"
                    />
                  )}

                  <div className="git-diff-column">
                    <div className="diff-header-bar">
                      <span className="diff-filename">
                        {selectedFile ? `${selectedFile.path}/${selectedFile.name}` : "No file selected"}
                      </span>
                      <div className="row">
                        <div className="seg">
                          <button className={diffMode === "unified" ? "active" : ""} onClick={() => setDiffMode("unified")}>Unified</button>
                          <button className={diffMode === "split" ? "active" : ""} onClick={() => setDiffMode("split")}>Split</button>
                        </div>
                        <button className="btn sm" onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}>
                          Comments ({comments.length}) <DemoTag label="Demo" />
                        </button>
                      </div>
                    </div>
                    {selectedFile ? (
                      <div className="diff-code-scroll">
                        <pre className="diff-pre-block">
                          {selectedFile.diffText.split("\n").map((line, idx) => {
                            const isChunkHeader = line.startsWith("@@");
                            const kind = isChunkHeader ? "chunk-header" : line.startsWith("+") ? "added" : line.startsWith("-") ? "removed" : "context";
                            return (
                              <div key={idx} className={`diff-line-row ${kind}`}>
                                <span className="line-num">{idx + 1}</span>
                                <span className="line-code">{line}</span>
                              </div>
                            );
                          })}
                        </pre>
                      </div>
                    ) : (
                      <div className="empty">
                        <BoxIcon size={30} />
                        <h3>{currentSession.status === "queued" ? "Task is queued" : currentSession.status === "running" ? "Still working" : "No changes recorded"}</h3>
                        <p>{currentSession.status === "running" ? "The diff appears when the agent is done." : "There is nothing to compare for this task."}</p>
                      </div>
                    )}
                  </div>

                  {!isCommentsCollapsed && (
                    <div className="git-comments-column">
                      <div className="row">
                        <strong className="grow">{comments.length} comments</strong>
                        <button className="btn-link" onClick={() => navigator.clipboard.writeText(JSON.stringify(comments, null, 2))}>Copy</button>
                        <button className="btn-link" onClick={() => setComments([])}>Clear</button>
                        <button className="btn-link btn-hide-comments" onClick={() => setIsCommentsCollapsed(true)}>Hide</button>
                      </div>
                      <div className="mt8"><DemoNote>Sample comments. They are not about this change.</DemoNote></div>
                      <button className="btn sm">Export for agent</button>
                      {comments.map((comment) => (
                        <div key={comment.id} className="comment-card">
                          <div className="row">
                            <span className="mono grow ell">{comment.file}:{comment.line}</span>
                            <span className="mut sm">{comment.author}</span>
                          </div>
                          <div className="comment-snippet"><code>{comment.codeSnippet}</code></div>
                          <p className="sm">{comment.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "logs" && (
              <div className="pane-scroll">
                <div className="col wide">
                  <div className="row wrap">
                    <div className="seg">
                      {(["ALL", "INFO", "WARN", "ERROR"] as const).map((lvl) => (
                        <button key={lvl} className={logFilter === lvl ? "active" : ""} onClick={() => setLogFilter(lvl)}>{lvl}</button>
                      ))}
                    </div>
                    <DemoTag label="Filter not wired yet" />
                    <span className="grow" />
                    <button
                      className="btn sm btn-copy-logs"
                      onClick={() => {
                        const raw = currentEvents.map((e) => `[${e.ts}] ${e.eventType}: ${JSON.stringify(e.payload)}`).join("\n");
                        navigator.clipboard.writeText(raw);
                      }}
                    >
                      Copy logs
                    </button>
                  </div>
                  {currentEvents.length === 0 && (
                    <div className="mt12"><DemoNote>No events were recorded for this task. The two lines below are samples.</DemoNote></div>
                  )}
                  <div className="card log-stream mt12">
                    {currentEvents.length > 0 ? (
                      currentEvents.map((ev, i) => {
                        const p = (ev.payload || {}) as Record<string, any>;
                        const isErr = ev.eventType.includes("fail") || ev.eventType.includes("error");
                        const isWrn = ev.eventType.includes("warn");
                        // Build summary: prefer human-readable fields, fall back to JSON
                        const summaryText =
                          p.reason || p.summary || p.text || p.command || p.message ||
                          (p.path ? `${p.path}` : null) || (p.file ? `${p.file}` : null) ||
                          (p.files && Array.isArray(p.files) && p.files.length > 0 ? p.files.join(", ") : null) ||
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
                            <span className={`log-lvl ${isErr ? "error" : isWrn ? "warn" : "info"}`}>{isErr ? "ERROR" : isWrn ? "WARN" : "INFO"}</span>
                            <span className="log-type">{ev.eventType}</span>
                            <span className="log-summary">{summaryText}</span>
                            {filePaths.length > 0 && (
                              <div className="log-files-list">
                                {filePaths.map((f: string, fi: number) => (
                                  <span key={fi} className="log-file-pill" title={f}>{f.replace(/\\/g, "/").split("/").pop()}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div className="log-entry-row">
                          <span className="log-ts">12:00:01</span><span className="log-lvl info">INFO</span><span className="log-type">daemon.watch</span>
                          <span className="log-summary">Bound repository workspace at {currentSession.repo || "d:\\dev\\sample-repo"}.</span>
                        </div>
                        <div className="log-entry-row">
                          <span className="log-ts">12:00:03</span><span className="log-lvl info">INFO</span><span className="log-type">task.ingested</span>
                          <span className="log-summary">Task prompt validated and queued.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "artifacts" && (
              <div className="pane-scroll">
                <div className="col">
                  <DemoNote>These files are examples. The runner does not produce them yet.</DemoNote>
                  <div className="card list">
                    <div>
                      <FileTextIcon size={18} />
                      <div className="grow">
                        <div className="ell">task-specification-plan.md</div>
                        <div className="mut sm ell">Markdown · plan for {shortTaskName}</div>
                      </div>
                      <button className="btn sm" onClick={() => alert(`Previewing specification for: ${taskTitle}`)}>Preview</button>
                    </div>
                    <div>
                      <BarChartIcon size={18} />
                      <div className="grow">
                        <div className="ell">test-coverage-report.json</div>
                        <div className="mut sm">JSON report</div>
                      </div>
                      <button className="btn sm" onClick={() => alert("Demo report: no real test results are attached to this task.")}>View</button>
                    </div>
                    <div>
                      <BoxIcon size={18} />
                      <div className="grow">
                        <div className="ell">{currentSession.projectName || "sample-repo"}-patch.diff</div>
                        <div className="mut sm">Unified diff</div>
                      </div>
                      <button className="btn sm" onClick={() => setActiveTab("changes")}>Inspect diff</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="pane-scroll">
                <div className="col">
                  {currentEvents.length > 0 ? (
                    currentEvents.map((ev, idx) => {
                      const p = (ev.payload || {}) as Record<string, any>;
                      const isErr = ev.eventType.includes("fail") || ev.eventType.includes("reject");
                      const isDone = ev.eventType.includes("finish") || ev.eventType.includes("approved");
                      const eventSummary = p.reason || p.summary || p.text || (p.command ? `Command: ${p.command}` : null) || (p.path ? `File: ${p.path}` : null) || ev.eventType;
                      return (
                        <div key={idx} className="timeline-event-item">
                          <div className={`event-bullet ${isErr ? "failed" : isDone ? "done" : "active"}`} />
                          <div className="grow">
                            <div className="mut sm"><span>{new Date(ev.ts).toLocaleTimeString()}</span> · <span className="mono">{ev.eventType}</span></div>
                            <div>{eventSummary}</div>
                            {p.files && p.files.length > 0 && <div className="mut sm">Files: {Array.isArray(p.files) ? p.files.join(", ") : JSON.stringify(p.files)}</div>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <DemoNote>No events were recorded for this task. This timeline is a sample.</DemoNote>
                      <div className="timeline-event-item">
                        <div className="event-bullet done" />
                        <div className="grow">
                          <div className="mut sm">12:00:00 · task.claimed</div>
                          <div>Task received and workspace bound at {currentSession.repo || "d:\\dev\\sample-repo"}.</div>
                        </div>
                      </div>
                      <div className="timeline-event-item">
                        <div className={`event-bullet ${isFailed ? "failed" : isApproved ? "done" : "active"}`} />
                        <div className="grow">
                          <div className="mut sm">12:00:05 · {isFailed ? "task.failed" : isApproved ? "task.finished" : "task.running"}</div>
                          <div>{isFailed ? `Task failed: ${failureReason || "Runner error"}` : isApproved ? "Task approved" : `Executing: ${shortTaskName}`}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
