import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";
import {
  PlusIcon,
  HomeIcon,
  FolderIcon,
  ClockIcon,
  WorkflowIcon,
  ReviewIcon,
  CpuIcon,
  DatabaseIcon,
  CheckCircleIcon,
  BoxIcon,
  TerminalIcon,
  BarChartIcon,
  ZapIcon,
  ShieldIcon,
  SettingsIcon,
} from "./Icons";
import { DemoTag } from "./Demo";

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
  activeSessionId?: string | null;
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

type NavEntry = { view: NavView; name: string; label: string; Icon: typeof HomeIcon; demo?: boolean };

// name is the page's original title. "demo" pages show sample content only.
const NAV_GROUPS: { title: string; items: NavEntry[] }[] = [
  {
    title: "Workspace",
    items: [
      { view: "overview", name: "Overview", label: "Home", Icon: HomeIcon },
      { view: "projects", name: "Projects", label: "Projects", Icon: FolderIcon },
      { view: "tasks", name: "Tasks", label: "All tasks", Icon: CheckCircleIcon },
      { view: "workflows", name: "Workflows", label: "Workflows", Icon: WorkflowIcon, demo: true },
      { view: "review", name: "Review Queue", label: "Review queue", Icon: ReviewIcon },
    ],
  },
  {
    title: "Engineering",
    items: [
      { view: "models", name: "Models & Routing", label: "Models & Routing", Icon: CpuIcon, demo: true },
      { view: "memory", name: "Repository Memory", label: "Repository Memory", Icon: DatabaseIcon, demo: true },
      { view: "scheduler", name: "Scheduler & Queue", label: "Scheduler & Queue", Icon: ClockIcon, demo: true },
      { view: "environments", name: "Environments", label: "Environments", Icon: BoxIcon, demo: true },
      { view: "runtime", name: "Runtime & Logs", label: "Runtime & Logs", Icon: TerminalIcon, demo: true },
    ],
  },
  {
    title: "Management",
    items: [
      { view: "analytics", name: "Usage & Analytics", label: "Insights", Icon: BarChartIcon },
      { view: "integrations", name: "Integrations", label: "Integrations", Icon: ZapIcon, demo: true },
      { view: "security", name: "Security", label: "Security", Icon: ShieldIcon, demo: true },
      { view: "settings", name: "Settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

export function AppSidebar({
  currentView,
  activeSessionId,
  onNavigate,
  sessions,
  projects,
  connected,
  daemonState,
  userName = "Developer (Local)",
  isCollapsed,
}: AppSidebarProps) {
  const pendingReviewCount = sessions.filter((s) => s.status === "awaiting_approval").length;

  // Live lists, built only from real sessions.
  const newestFirst = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const needsYou = newestFirst.filter((s) => s.status === "awaiting_approval" || s.status === "failed");
  const running = newestFirst.filter((s) => s.status === "running" || s.status === "queued");
  const recent = newestFirst.filter((s) => !needsYou.includes(s) && !running.includes(s));

  const liveList = (title: string, items: DesktopSession[]) =>
    items.length > 0 && (
      <div>
        <span className="group-label">{title}</span>
        {items.slice(0, 3).map((s) => (
          <button
            key={s.id}
            className={`live-task ${currentView === "tasks" && s.id === activeSessionId ? "active" : ""}`}
            onClick={() => onNavigate("tasks", s.id)}
            title={s.title || s.prompt || s.id}
          >
            <span className={`dot ${s.status}`} />
            <span>{s.title || s.prompt || `Task ${s.id.slice(0, 8)}`}</span>
          </button>
        ))}
      </div>
    );

  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button
        className={`btn-sidebar-new ${currentView === "new" ? "active" : ""}`}
        onClick={() => onNavigate("new")}
        title="Create New Task (Ctrl+N)"
      >
        <PlusIcon size={14} color="#ffffff" />
        {!isCollapsed && <span>New task</span>}
        {!isCollapsed && <kbd>Ctrl N</kbd>}
      </button>

      <div className="sidebar-nav-scroll">
        {NAV_GROUPS.map((group) => (
          <nav key={group.title} className="nav-group">
            {!isCollapsed && <span className="group-label">{group.title}</span>}
            {group.items.map(({ view, name, label, Icon, demo }) => (
              <button
                key={view}
                className={`nav-button ${currentView === view ? "active" : ""}`}
                onClick={() => onNavigate(view)}
                data-nav={name}
                title={`${label}${demo ? " (demo)" : ""}`}
              >
                <span className="nav-btn-icon"><Icon size={15} /></span>
                {!isCollapsed && <span className="nav-btn-label">{label}</span>}
                {!isCollapsed && demo && <DemoTag label="Demo" />}
                {!isCollapsed && view === "review" && pendingReviewCount > 0 && <span className="nav-btn-badge alert">{pendingReviewCount}</span>}
              </button>
            ))}
          </nav>
        ))}

        {!isCollapsed && (
          <>
            {liveList("Needs you", needsYou)}
            {liveList("Running", running)}
            {liveList("Recent", recent)}
            {sessions.length === 0 && projects.length > 0 && (
              <div>
                <span className="group-label">Your projects</span>
                {projects.slice(0, 5).map((p) => (
                  <button key={p.id} className="live-task" onClick={() => onNavigate("projects", p.id)}>
                    <FolderIcon size={13} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <div className="user-avatar-pill" title="Open Settings & Profile" onClick={() => onNavigate("settings")}>
            {(userName || "Developer").slice(0, 1).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="user-details" onClick={() => onNavigate("settings")} title={userName}>
              <div className="ell">{userName}</div>
              <div className={`daemon-status-bar ${connected && daemonState === "running" ? "online" : "offline"}`} title="Local daemon on 127.0.0.1:8788">
                <span className="status-indicator-dot" />
                <span>{connected ? "Daemon connected" : "Daemon offline"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
