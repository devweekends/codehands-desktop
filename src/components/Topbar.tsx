import type { NavView } from "./AppSidebar";
import { SearchIcon, PlusIcon, BellIcon, SunIcon, MoonIcon } from "./Icons";

interface TopbarProps {
  currentView: NavView;
  connected: boolean;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onNewTask: () => void;
  notificationCount?: number;
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
  notificationCount = 3,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
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

        <button className="topbar-icon-btn notification-btn" title="Notifications">
          <BellIcon size={15} />
          {notificationCount > 0 && <span className="notification-badge">{notificationCount}</span>}
        </button>

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
