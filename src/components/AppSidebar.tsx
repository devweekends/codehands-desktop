import { useState } from "react";
import { CodeHandsLogo } from "./CodeHandsLogo";
import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";
import {
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
  ChevronDownIcon,
  ChevronRightIcon,
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

// Screens that show sample content only. They stay reachable, out of the way, and are labelled as demo.
const DEMO_SCREENS: { view: NavView; label: string; Icon: typeof HomeIcon }[] = [
  { view: "workflows", label: "Workflows", Icon: WorkflowIcon },
  { view: "models", label: "Models & Routing", Icon: CpuIcon },
  { view: "memory", label: "Repository Memory", Icon: DatabaseIcon },
  { view: "scheduler", label: "Scheduler & Queue", Icon: ClockIcon },
  { view: "environments", label: "Environments", Icon: BoxIcon },
  { view: "runtime", label: "Runtime & Logs", Icon: TerminalIcon },
  { view: "integrations", label: "Integrations", Icon: ZapIcon },
  { view: "security", label: "Security", Icon: ShieldIcon },
];

export function AppSidebar({
  currentView,
  onNavigate,
  sessions,
  projects,
  connected,
  daemonState,
  userName = "Developer (Local)",
  isCollapsed,
}: AppSidebarProps) {
  const [showMore, setShowMore] = useState(false);
  const onDemoScreen = DEMO_SCREENS.some((s) => s.view === currentView);
  const moreOpen = showMore || onDemoScreen;

  const pendingReviewCount = sessions.filter((s) => s.status === "awaiting_approval").length;

  // Live lists, built only from real sessions.
  const newestFirst = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const needsYou = newestFirst.filter((s) => s.status === "awaiting_approval" || s.status === "failed");
  const running = newestFirst.filter((s) => s.status === "running" || s.status === "queued");
  const recent = newestFirst.filter((s) => !needsYou.includes(s) && !running.includes(s));

  const navButton = (view: NavView, name: string, label: string, Icon: typeof HomeIcon, badge?: number) => (
    <button
      key={view}
      className={`nav-button ${currentView === view ? "active" : ""}`}
      onClick={() => onNavigate(view)}
      data-nav={name}
      title={isCollapsed ? label : undefined}
    >
      <span className="nav-btn-icon"><Icon size={15} /></span>
      {!isCollapsed && <span className="nav-btn-label">{label}</span>}
      {!isCollapsed && badge ? <span className="nav-btn-badge alert">{badge}</span> : null}
    </button>
  );

  const liveList = (title: string, items: DesktopSession[]) =>
    items.length > 0 && (
      <div>
        <span className="group-label">{title}</span>
        {items.slice(0, 4).map((s) => (
          <button key={s.id} className="live-task" onClick={() => onNavigate("tasks", s.id)} title={s.title || s.prompt || s.id}>
            <span className={`dot ${s.status}`} />
            <span>{s.title || s.prompt || `Task ${s.id.slice(0, 8)}`}</span>
          </button>
        ))}
      </div>
    );

  return (
    <aside className={`app-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand-row" onClick={() => onNavigate("overview")}>
        <CodeHandsLogo size={26} />
        {!isCollapsed && <span>CodeHands</span>}
      </div>

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
        <nav>
          {navButton("overview", "Overview", "Home", HomeIcon)}
          {navButton("projects", "Projects", "Projects", FolderIcon)}
          {navButton("tasks", "Tasks", "Tasks", CheckCircleIcon)}
          {navButton("review", "Review Queue", "Review", ReviewIcon, pendingReviewCount)}
          {navButton("analytics", "Usage & Analytics", "Insights", BarChartIcon)}
        </nav>

        {/* The Tasks screen has its own task list, so the live lists are hidden there. */}
        {!isCollapsed && currentView !== "tasks" && (
          <>
            {liveList("Needs you", needsYou)}
            {liveList("Running", running)}
            {liveList("Recent", recent)}
            {sessions.length === 0 && projects.length > 0 && (
              <div>
                <span className="group-label">Projects</span>
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

        <button
          className="nav-more-toggle"
          onClick={() => setShowMore(!moreOpen)}
          aria-expanded={moreOpen}
          title="Screens that show sample content"
        >
          {moreOpen ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
          {!isCollapsed && <span>More screens</span>}
          {!isCollapsed && <DemoTag label="Demo" />}
        </button>
        {moreOpen && <nav>{DEMO_SCREENS.map((s) => navButton(s.view, s.label, s.label, s.Icon))}</nav>}
      </div>

      <div className="sidebar-footer">
        <div className={`daemon-status-bar ${connected && daemonState === "running" ? "online" : "offline"}`} title="Local daemon on 127.0.0.1:8788">
          <span className="status-indicator-dot" />
          {!isCollapsed && <span>{connected ? "Daemon connected" : "Local daemon offline"}</span>}
        </div>
        <div className="sidebar-user-row">
          <div className="user-avatar-pill" title="Open Settings & Profile" onClick={() => onNavigate("settings")}>
            {(userName || "Developer").slice(0, 1).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="user-details" onClick={() => onNavigate("settings")} title={userName}>
              {userName}
            </div>
          )}
          <button
            className={`btn-sidebar-settings-toggle ${currentView === "settings" ? "active" : ""}`}
            onClick={() => onNavigate("settings")}
            data-nav="Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
