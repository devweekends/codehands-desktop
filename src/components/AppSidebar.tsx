import { useState, useRef, useEffect } from "react";
import { CodeHandsLogo } from "./CodeHandsLogo";
import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";
import {
  SearchIcon,
  PlusIcon,
  HomeIcon,
  FolderIcon,
  CheckCircleIcon,
  WorkflowIcon,
  ReviewIcon,
  CpuIcon,
  DatabaseIcon,
  ClockIcon,
  BoxIcon,
  TerminalIcon,
  BarChartIcon,
  ZapIcon,
  ShieldIcon,
  SettingsIcon,
  UserIcon,
  LogOutIcon,
  LogInIcon,
  SunIcon,
  MoonIcon,
} from "./Icons";

export type NavView =
  | "overview"
  | "projects"
  | "project-detail"
  | "tasks"
  | "workflows"
  | "review"
  | "models"
  | "memory"
  | "scheduler"
  | "environments"
  | "runtime"
  | "analytics"
  | "integrations"
  | "security"
  | "settings"
  | "new";

interface AppSidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView, extraId?: string) => void;
  sessions: DesktopSession[];
  projects: DesktopProject[];
  connected: boolean;
  daemonState: "starting" | "running" | "unavailable";
  userName?: string;
  userEmail?: string;
  isLoggedIn?: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenCommandPalette: () => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  sessions,
  projects,
  connected,
  daemonState,
  userName = "Developer (Local)",
  userEmail,
  isLoggedIn = false,
  onOpenAuth,
  onLogout,
  onOpenCommandPalette,
  isCollapsed,
  onToggleCollapse: _onToggleCollapse,
  theme = "dark",
  onToggleTheme,
}: AppSidebarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const pendingReviewCount = sessions.filter((s) => s.status === "awaiting_approval").length;
  const runningTasksCount = sessions.filter((s) => s.status === "running" || s.status === "queued").length;

  // Build recent items from real sessions + projects (most recent 5 by createdAt)
  const recentItems = (() => {
    if (sessions.length === 0 && projects.length === 0) return [];
    // Prefer sessions sorted by createdAt desc, pick unique project names
    const seen = new Set<string>();
    const items: { id: string; name: string; sessionId?: string }[] = [];
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const s of sorted) {
      const key = (s.projectName || s.repo || s.id).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ id: s.projectId || s.id, name: s.projectName || s.repo || "Unknown", sessionId: s.id });
      }
      if (items.length >= 5) break;
    }
    // Fill remaining slots from projects if needed
    for (const p of projects) {
      const key = p.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ id: p.id, name: p.name });
      }
      if (items.length >= 5) break;
    }
    return items;
  })();

  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-row" onClick={() => onNavigate("overview")}>
        <CodeHandsLogo size={32} />
        {!isCollapsed && (
          <div className="brand-text-block">
            <span className="brand-title">CodeHands <span className="brand-badge">AI</span></span>
            <span className="brand-sub">LOCAL WORKSPACE</span>
          </div>
        )}
      </div>

      {/* Global Search / Command Palette shortcut */}
      <div className="sidebar-search-box">
        <button
          className="sidebar-search-btn"
          onClick={onOpenCommandPalette}
          title="Search or command palette (Ctrl+K)"
        >
          <SearchIcon size={14} color="#666C7E" />
          {!isCollapsed && <span className="search-text">Search...</span>}
          {!isCollapsed && <kbd className="shortcut-kbd">Ctrl+K</kbd>}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="sidebar-action-wrap">
        <button
          className={`btn-sidebar-new ${currentView === "new" ? "active" : ""}`}
          onClick={() => onNavigate("new")}
          title="Create New Task (Ctrl+N)"
        >
          <PlusIcon size={14} color="#ffffff" />
          {!isCollapsed && <span>New Task</span>}
        </button>
      </div>

      {/* Scrollable Nav Sections */}
      <div className="sidebar-nav-scroll">
        {/* SECTION: WORKSPACE */}
        <div className="sidebar-group">
          {!isCollapsed && <span className="group-label">WORKSPACE</span>}
          <nav className="nav-items-list">
            <button
              className={`nav-button ${currentView === "overview" ? "active" : ""}`}
              onClick={() => onNavigate("overview")}
              title="Overview"
            >
              <span className="nav-btn-icon"><HomeIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Overview</span>}
            </button>

            <button
              className={`nav-button ${currentView === "projects" ? "active" : ""}`}
              onClick={() => onNavigate("projects")}
              title="Projects"
            >
              <span className="nav-btn-icon"><FolderIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Projects</span>}
              {!isCollapsed && <span className="nav-btn-counter">{projects.length || 6}</span>}
            </button>

            <button
              className={`nav-button ${currentView === "tasks" ? "active" : ""}`}
              onClick={() => onNavigate("tasks")}
              title="Tasks"
            >
              <span className="nav-btn-icon"><CheckCircleIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Tasks</span>}
              {!isCollapsed && runningTasksCount > 0 && (
                <span className="nav-btn-counter running">{runningTasksCount}</span>
              )}
            </button>

            <button
              className={`nav-button ${currentView === "workflows" ? "active" : ""}`}
              onClick={() => onNavigate("workflows")}
              title="Workflows"
            >
              <span className="nav-btn-icon"><WorkflowIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Workflows</span>}
            </button>

            <button
              className={`nav-button ${currentView === "review" ? "active" : ""}`}
              onClick={() => onNavigate("review")}
              title="Review Queue"
            >
              <span className="nav-btn-icon">
                <ReviewIcon size={15} />
                {isCollapsed && pendingReviewCount > 0 && <span className="collapsed-notif-dot" />}
              </span>
              {!isCollapsed && <span className="nav-btn-label">Review Queue</span>}
              {!isCollapsed && pendingReviewCount > 0 && (
                <span className="nav-btn-badge alert">{pendingReviewCount}</span>
              )}
            </button>
          </nav>
        </div>

        {/* SECTION: ENGINEERING */}
        <div className="sidebar-group">
          {!isCollapsed && <span className="group-label">ENGINEERING</span>}
          <nav className="nav-items-list">
            <button
              className={`nav-button ${currentView === "models" ? "active" : ""}`}
              onClick={() => onNavigate("models")}
              title="Models & Routing"
            >
              <span className="nav-btn-icon"><CpuIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Models & Routing</span>}
            </button>

            <button
              className={`nav-button ${currentView === "memory" ? "active" : ""}`}
              onClick={() => onNavigate("memory")}
              title="Repository Memory"
            >
              <span className="nav-btn-icon"><DatabaseIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Repository Memory</span>}
            </button>

            <button
              className={`nav-button ${currentView === "scheduler" ? "active" : ""}`}
              onClick={() => onNavigate("scheduler")}
              title="Scheduler & Queue"
            >
              <span className="nav-btn-icon"><ClockIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Scheduler & Queue</span>}
            </button>

            <button
              className={`nav-button ${currentView === "environments" ? "active" : ""}`}
              onClick={() => onNavigate("environments")}
              title="Environments"
            >
              <span className="nav-btn-icon"><BoxIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Environments</span>}
            </button>

            <button
              className={`nav-button ${currentView === "runtime" ? "active" : ""}`}
              onClick={() => onNavigate("runtime")}
              title="Runtime & Logs"
            >
              <span className="nav-btn-icon"><TerminalIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Runtime & Logs</span>}
            </button>
          </nav>
        </div>

        {/* SECTION: MANAGEMENT */}
        <div className="sidebar-group">
          {!isCollapsed && <span className="group-label">MANAGEMENT</span>}
          <nav className="nav-items-list">
            <button
              className={`nav-button ${currentView === "analytics" ? "active" : ""}`}
              onClick={() => onNavigate("analytics")}
              title="Usage & Analytics"
            >
              <span className="nav-btn-icon"><BarChartIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Usage & Analytics</span>}
            </button>

            <button
              className={`nav-button ${currentView === "integrations" ? "active" : ""}`}
              onClick={() => onNavigate("integrations")}
              title="Integrations"
            >
              <span className="nav-btn-icon"><ZapIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Integrations</span>}
            </button>

            <button
              className={`nav-button ${currentView === "security" ? "active" : ""}`}
              onClick={() => onNavigate("security")}
              title="Security"
            >
              <span className="nav-btn-icon"><ShieldIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Security</span>}
            </button>

            <button
              className={`nav-button ${currentView === "settings" ? "active" : ""}`}
              onClick={() => onNavigate("settings")}
              title="Settings"
            >
              <span className="nav-btn-icon"><SettingsIcon size={15} /></span>
              {!isCollapsed && <span className="nav-btn-label">Settings</span>}
            </button>
          </nav>
        </div>

        {/* SECTION: RECENTS (Screenshot 1) */}
        {!isCollapsed && (
          <div className="sidebar-group recents-group">
            <span className="group-label">RECENTS</span>
            <div className="recents-list">
              {recentItems.length === 0 ? (
                <span className="recents-empty">No recent projects</span>
              ) : (
                recentItems.map((item) => (
                  <button
                    key={item.id}
                    className="recent-item-btn"
                    onClick={() => {
                      if (item.sessionId) {
                        onNavigate("tasks", item.sessionId);
                      } else {
                        onNavigate("projects", item.id);
                      }
                    }}
                  >
                    <FolderIcon size={13} color="#666C7E" />
                    <span className="recent-name">{item.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="sidebar-version-row">
            <span className="app-version">v0.2.0</span>
          </div>
        )}

        <div className={`daemon-status-bar ${connected && daemonState === "running" ? "online" : "offline"}`}>
          <span className="status-indicator-dot" />
          {!isCollapsed && (
            <div className="daemon-status-copy">
              <span className="status-title">{connected ? "Daemon Connected" : "Local Daemon Offline"}</span>
              <span className="status-sub">{connected ? "Ready on 127.0.0.1:8788" : "Click to reconnect"}</span>
            </div>
          )}
        </div>

        <div className="sidebar-user-row" ref={userMenuRef}>
          <div
            className="user-avatar-pill"
            title="Open Settings & Profile"
            onClick={() => onNavigate("settings")}
            style={{ cursor: "pointer" }}
          >
            {(userName || "Developer").slice(0, 1).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div
              className="user-details"
              onClick={() => onNavigate("settings")}
              title="Open Workspace Settings"
              style={{ cursor: "pointer" }}
            >
              <span className="user-name" title={userName}>{userName}</span>
              <span className="user-tier">Workspace Admin</span>
            </div>
          )}
          <button
            className={`btn-sidebar-settings-toggle ${currentView === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
            title="Open Workspace Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={16} />
          </button>

          {/* Floating Settings & Profile Popup Menu */}
          {isUserMenuOpen && (
            <div className="sidebar-user-menu-popover" role="dialog" aria-label="User Menu">
              <div className="popover-user-header">
                <div className="popover-avatar">
                  {(userName || "Developer").slice(0, 1).toUpperCase()}
                </div>
                <div className="popover-user-info">
                  <span className="popover-user-name">{userName}</span>
                  <span className="popover-user-email">{userEmail || "Local Workspace"}</span>
                </div>
              </div>

              <div className="popover-divider" />

              <div className="popover-menu-list">
                <button
                  className="popover-menu-item"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate("settings");
                  }}
                >
                  <UserIcon size={14} color="var(--accent-secondary)" />
                  <span>Profile Settings</span>
                </button>

                <button
                  className="popover-menu-item"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigate("settings");
                  }}
                >
                  <SettingsIcon size={14} color="var(--accent-primary)" />
                  <span>Workspace Preferences</span>
                </button>

                {onToggleTheme && (
                  <button
                    className="popover-menu-item"
                    onClick={() => {
                      onToggleTheme();
                    }}
                  >
                    {theme === "dark" ? <SunIcon size={14} color="#FFB547" /> : <MoonIcon size={14} color="#27B7F5" />}
                    <span>Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </button>
                )}
              </div>

              <div className="popover-divider" />

              <div className="popover-footer-action">
                {isLoggedIn ? (
                  <button
                    className="popover-menu-item logout-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOutIcon size={14} color="#FF647C" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <button
                    className="popover-menu-item signin-btn"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAuth();
                    }}
                  >
                    <LogInIcon size={14} color="#27B7F5" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
