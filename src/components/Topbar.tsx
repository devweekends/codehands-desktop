import { useState, useRef, useEffect } from "react";
import type { NavView } from "./AppSidebar";
import type { DesktopSession } from "./TaskDetail";
import { SearchIcon, PlusIcon, BellIcon, SunIcon, MoonIcon, CheckCircleIcon, ReviewIcon } from "./Icons";

interface TopbarProps {
  currentView: NavView;
  connected: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onNewTask: () => void;
  notificationCount?: number;
  sessions?: DesktopSession[];
  onSelectSession?: (id: string) => void;
  onOpenReview?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
}

const VIEW_TITLES: Record<NavView, string> = {
  overview: "Workspace Overview",
  projects: "Projects",
  "project-detail": "Project Details",
  tasks: "Task Workspace",
  workflows: "Workflow Builder",
  review: "Review Queue",
  models: "Models & Routing",
  memory: "Repository Memory",
  scheduler: "Scheduler & Queue",
  environments: "Environments",
  runtime: "Runtime & Logs",
  analytics: "Usage & Analytics",
  integrations: "Integrations",
  security: "Security",
  settings: "Settings",
  new: "New Task",
};

export function Topbar({
  currentView,
  connected,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onNewTask,
  notificationCount = 0,
  sessions = [],
  onSelectSession,
  onOpenReview,
  isSidebarCollapsed = false,
  onToggleSidebar,
  canGoBack = false,
  canGoForward = false,
  onNavigateBack,
  onNavigateForward,
}: TopbarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications popover on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen]);

  // Derive notifications from actual sessions
  const pendingApprovals = sessions.filter((s) => s.status === "awaiting_approval");
  const failedTasks = sessions.filter((s) => s.status === "failed");
  const recentApproved = sessions.filter((s) => s.status === "approved").slice(0, 3);
  const totalAlerts = pendingApprovals.length + failedTasks.length;

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleSidebar && (
          <button
            className={`topbar-toggle-sidebar-btn ${isSidebarCollapsed ? "collapsed" : ""}`}
            onClick={onToggleSidebar}
            title="Toggle Sidebar (Ctrl+B)"
            aria-label="Toggle Sidebar (Ctrl+B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        )}

        {(onNavigateBack || onNavigateForward) && (
          <div className="topbar-history-arrows">
            <button
              className="topbar-arrow-btn"
              onClick={onNavigateBack}
              disabled={!canGoBack}
              title="Back"
              aria-label="Back"
            >
              ←
            </button>
            <button
              className="topbar-arrow-btn"
              onClick={onNavigateForward}
              disabled={!canGoForward}
              title="Forward"
              aria-label="Forward"
            >
              →
            </button>
          </div>
        )}

        <div className="breadcrumbs">
          <span className="crumb-root">CodeHands</span>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">{VIEW_TITLES[currentView] || "Workspace"}</span>
        </div>
      </div>

      <div className="topbar-center">
        <button className="topbar-search-trigger" onClick={onOpenCommandPalette}>
          <SearchIcon size={14} color="#666C7E" />
          <span className="search-placeholder">Search workspace, tasks, models...</span>
          <kbd className="topbar-kbd">Ctrl+K</kbd>
        </button>
      </div>

      <div className="topbar-right">
        <button className="btn-topbar-new" onClick={onNewTask}>
          <PlusIcon size={13} color="#ffffff" />
          <span>New Task</span>
        </button>

        <span className={`connection-pill ${connected ? "connected" : "disconnected"}`}>
          <i className="status-dot" />
          <span className="connection-text">{connected ? "Daemon Active" : "Offline"}</span>
        </span>

        {/* Notifications Button & Dropdown */}
        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button
            className={`topbar-icon-btn notification-btn ${isNotifOpen ? "active" : ""}`}
            title="Notifications"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Notifications"
          >
            <BellIcon size={15} />
            {(notificationCount > 0 || totalAlerts > 0) && (
              <span className="notification-badge">
                {totalAlerts > 0 ? totalAlerts : notificationCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="topbar-notif-popover">
              <div className="notif-popover-header">
                <div className="notif-popover-title">
                  <BellIcon size={14} color="#27B7F5" />
                  <strong>Notifications</strong>
                  <span className="notif-count-badge">{totalAlerts} active</span>
                </div>
                {onOpenReview && pendingApprovals.length > 0 && (
                  <button
                    className="notif-link-btn"
                    onClick={() => {
                      setIsNotifOpen(false);
                      onOpenReview();
                    }}
                  >
                    Open Queue →
                  </button>
                )}
              </div>

              <div className="notif-items-list">
                {/* Pending Approval Notifications */}
                {pendingApprovals.map((s) => (
                  <div
                    key={s.id}
                    className="notif-item alert-review"
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (onSelectSession) onSelectSession(s.id);
                    }}
                  >
                    <div className="notif-item-icon review">
                      <ReviewIcon size={14} color="#FFB547" />
                    </div>
                    <div className="notif-item-text">
                      <div className="notif-item-top">
                        <span className="notif-tag review">Needs Approval</span>
                        <span className="notif-repo">{s.projectName || s.repo || "sample-repo"}</span>
                      </div>
                      <p className="notif-prompt">{s.prompt || s.title || "Code changes ready"}</p>
                      <small className="notif-action-hint">Click to inspect and approve diff</small>
                    </div>
                  </div>
                ))}

                {/* Failed Task Notifications */}
                {failedTasks.map((s) => (
                  <div
                    key={s.id}
                    className="notif-item alert-fail"
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (onSelectSession) onSelectSession(s.id);
                    }}
                  >
                    <div className="notif-item-icon fail">
                      <span className="dot-red" />
                    </div>
                    <div className="notif-item-text">
                      <div className="notif-item-top">
                        <span className="notif-tag fail">Execution Failed</span>
                        <span className="notif-repo">{s.projectName || s.repo || "sample-repo"}</span>
                      </div>
                      <p className="notif-prompt">{s.prompt || s.title || "Task failed"}</p>
                      <small className="notif-action-hint">Click to review diagnostic logs</small>
                    </div>
                  </div>
                ))}

                {/* Recent Completed / Approved */}
                {recentApproved.map((s) => (
                  <div
                    key={s.id}
                    className="notif-item alert-success"
                    onClick={() => {
                      setIsNotifOpen(false);
                      if (onSelectSession) onSelectSession(s.id);
                    }}
                  >
                    <div className="notif-item-icon success">
                      <CheckCircleIcon size={14} color="#20C997" />
                    </div>
                    <div className="notif-item-text">
                      <div className="notif-item-top">
                        <span className="notif-tag success">Approved &amp; Merged</span>
                        <span className="notif-repo">{s.projectName || s.repo || "sample-repo"}</span>
                      </div>
                      <p className="notif-prompt">{s.prompt || s.title}</p>
                    </div>
                  </div>
                ))}

                {totalAlerts === 0 && recentApproved.length === 0 && (
                  <div className="notif-empty-state">
                    <CheckCircleIcon size={28} color="#20C997" />
                    <span>No unread notifications</span>
                    <small>All automated tasks are up to date.</small>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="topbar-icon-btn theme-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>
      </div>
    </header>
  );
}
