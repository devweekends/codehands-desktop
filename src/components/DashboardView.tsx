import { useState } from "react";
import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";
import {
  SearchIcon,
  PlusIcon,
  GridIcon,
  ListIcon,
  StarIcon,
  BranchIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  BoxIcon,
  ZapIcon,
} from "./Icons";

interface DashboardViewProps {
  sessions: DesktopSession[];
  projects: DesktopProject[];
  onOpenSession: (id: string) => void;
  onOpenProject: (projectId: string) => void;
  onNewTask: (defaultRepo?: string) => void;
  onNewProject: () => void;
}

interface ProjectCardData {
  id: string;
  name: string;
  tag: "GSD" | "ACTIVE" | "BARE";
  description: string;
  phases: number;
  todos: number;
  blockers?: number;
  completedTasks: number;
  totalTasks: number;
  branch: string;
  updatedAt: string;
  starred: boolean;
  repoPath?: string;
}

const DEFAULT_PROJECT_CARDS: ProjectCardData[] = [
  {
    id: "saas-dashboard",
    name: "SaaS Dashboard",
    tag: "GSD",
    description: "Full-stack analytics dashboard with real-time metrics, user management, and billing integration.",
    phases: 8,
    todos: 2,
    completedTasks: 16,
    totalTasks: 24,
    branch: "main",
    updatedAt: "1d ago",
    starred: true,
    repoPath: "d:\\dev\\saas-dashboard",
  },
  {
    id: "ml-pipeline",
    name: "ML Pipeline",
    tag: "GSD",
    description: "Data processing pipeline with model training, evaluation, and deployment automation.",
    phases: 7,
    todos: 2,
    completedTasks: 12,
    totalTasks: 21,
    branch: "main",
    updatedAt: "1d ago",
    starred: true,
    repoPath: "d:\\dev\\ml-pipeline",
  },
  {
    id: "taskflow-mobile",
    name: "TaskFlow Mobile",
    tag: "GSD",
    description: "Cross-platform mobile app with offline sync, kanban boards, and team collaboration features.",
    phases: 6,
    todos: 2,
    blockers: 2,
    completedTasks: 10,
    totalTasks: 18,
    branch: "main",
    updatedAt: "2d ago",
    starred: true,
    repoPath: "d:\\dev\\taskflow-mobile",
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    tag: "GSD",
    description: "High-performance API gateway with rate limiting, auth middleware, and request transformation.",
    phases: 5,
    todos: 1,
    completedTasks: 6,
    totalTasks: 15,
    branch: "main",
    updatedAt: "3d ago",
    starred: false,
    repoPath: "d:\\dev\\api-gateway",
  },
  {
    id: "design-system",
    name: "Design System",
    tag: "GSD",
    description: "Component library with Storybook, accessibility testing, and automated visual regression.",
    phases: 4,
    todos: 1,
    completedTasks: 9,
    totalTasks: 12,
    branch: "main",
    updatedAt: "4d ago",
    starred: false,
    repoPath: "d:\\dev\\design-system",
  },
  {
    id: "ecommerce-platform",
    name: "E-Commerce Platform",
    tag: "BARE",
    description: "Headless commerce platform with Stripe integration, inventory management, and order processing.",
    phases: 0,
    todos: 0,
    completedTasks: 0,
    totalTasks: 0,
    branch: "main",
    updatedAt: "Jan 30, 3:00 PM",
    starred: false,
    repoPath: "d:\\dev\\ecommerce-platform",
  },
];

export function DashboardView({
  sessions,
  projects,
  onOpenSession,
  onOpenProject,
  onNewTask,
  onNewProject,
}: DashboardViewProps) {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Deduplicate real projects by normalized path/name
  const dedupedProjects = projects.filter(
    (p, idx, arr) =>
      idx ===
      arr.findIndex(
        (other) =>
          (other.path || other.name).trim().toLowerCase() ===
          (p.path || p.name).trim().toLowerCase()
      )
  );

  // Show ONLY real existing projects if any exist; do NOT append static demo projects
  const projectCards: ProjectCardData[] = dedupedProjects.length > 0
    ? dedupedProjects.map((p, idx) => {
        const projSessions = sessions.filter(
          (s) =>
            s.projectId === p.id ||
            (s.repo && p.path && s.repo.trim().toLowerCase() === p.path.trim().toLowerCase())
        );
        const doneCount = projSessions.filter(
          (s) => (s.status as string) === "approved" || (s.status as string) === "finished"
        ).length;
        const total = projSessions.length;

        return {
          id: p.id || `proj-${idx}`,
          name: p.name,
          tag: "GSD",
          description: `Local workspace directory at ${p.path}`,
          phases: 5,
          todos: total > 0 ? total - doneCount : 0,
          completedTasks: doneCount,
          totalTasks: total > 0 ? total : 1,
          branch: "main",
          updatedAt: "Just now",
          starred: idx === 0,
          repoPath: p.path,
        };
      })
    : DEFAULT_PROJECT_CARDS;

  const [starredIds, setStarredIds] = useState<Record<string, boolean>>({});

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStarredIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = projectCards.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "active") return matchesSearch && p.tag !== "BARE";
    if (filter === "archived") return matchesSearch && p.tag === "BARE";
    return matchesSearch;
  });

  const totalProjects = projectCards.length;
  const pendingTodos = projectCards.reduce((acc, curr) => acc + curr.todos, 0);
  const gsdProjectsCount = projectCards.filter((p) => p.tag === "GSD").length;

  return (
    <div className="dashboard-view-container">
      {/* Top Banner / Header matching Screenshot 1 */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <div className="dashboard-title-row">
            <BoxIcon size={20} color="#27B7F5" />
            <h1>All Your Projects</h1>
          </div>
          <p className="dashboard-sub">Your engineering workspaces and AI orchestration at a glance</p>
        </div>
        <div className="dashboard-header-actions">
          <button className="add-project-btn" onClick={onNewProject}>
            <PlusIcon size={14} color="#ffffff" />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Pill Bar matching Screenshot 1 */}
      <div className="summary-pill-bar">
        <div className="summary-pill-item">
          <BoxIcon size={14} color="#666C7E" />
          <span className="pill-strong">{totalProjects}</span>
          <span className="pill-label">projects</span>
        </div>
        <span className="pill-divider">|</span>
        <div className="summary-pill-item">
          <CheckCircleIcon size={14} color="#27B7F5" />
          <span className="pill-strong violet">{pendingTodos}</span>
          <span className="pill-label">pending tasks</span>
        </div>
        <span className="pill-divider">|</span>
        <div className="summary-pill-item">
          <ZapIcon size={14} color="#27B7F5" />
          <span className="pill-strong blue">{gsdProjectsCount}</span>
          <span className="pill-label">orchestrated projects</span>
        </div>
      </div>

      {/* Filter and View Mode Toolbar matching Screenshot 1 */}
      <div className="dashboard-filter-toolbar">
        <div className="filter-search-box">
          <SearchIcon size={14} color="#666C7E" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-segmented-control">
          <button
            className={`seg-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`seg-btn ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active
          </button>
          <button
            className={`seg-btn ${filter === "archived" ? "active" : ""}`}
            onClick={() => setFilter("archived")}
          >
            Archived
          </button>
        </div>

        <span className="filter-count-badge">{filteredProjects.length} projects</span>

        <div className="toolbar-spacer" />

        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <GridIcon size={14} />
          </button>
          <button
            className={`mode-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <ListIcon size={14} />
          </button>
        </div>
      </div>

      {/* Projects Grid / List matching Screenshot 1 */}
      {viewMode === "grid" ? (
        <div className="projects-card-grid">
          {filteredProjects.map((proj) => {
            const progressPercent =
              proj.totalTasks > 0 ? Math.round((proj.completedTasks / proj.totalTasks) * 100) : 0;

            return (
              <div
                key={proj.id}
                className="gsd-project-card"
                onClick={() => onOpenProject(proj.id)}
              >
                {/* Card Header */}
                <div className="card-header-row">
                  <div className="card-title-left">
                    <button
                      className={`star-toggle-btn ${(starredIds[proj.id] ?? proj.starred) ? "starred" : ""}`}
                      onClick={(e) => toggleStar(proj.id, e)}
                      title="Star project"
                    >
                      <StarIcon
                        size={15}
                        filled={starredIds[proj.id] ?? proj.starred}
                        color={(starredIds[proj.id] ?? proj.starred) ? "#FFB547" : "#666C7E"}
                      />
                    </button>
                    <h3 className="project-title">{proj.name}</h3>
                  </div>
                  <span className={`project-tag-pill ${proj.tag.toLowerCase()}`}>
                    {proj.tag}
                  </span>
                </div>

                {/* Card Description */}
                <p className="project-desc">{proj.description}</p>

                {/* Badge Row (phases, todos, blockers) */}
                <div className="card-badges-row">
                  {proj.phases > 0 && (
                    <span className="badge-pill phases">
                      {proj.phases} phases
                    </span>
                  )}
                  {proj.blockers && proj.blockers > 0 && (
                    <span className="badge-pill blockers">
                      {proj.blockers} blockers
                    </span>
                  )}
                  {proj.todos > 0 && (
                    <span className="badge-pill todos">
                      {proj.todos} todos
                    </span>
                  )}
                  {proj.phases === 0 && (
                    <span className="badge-pill bare">
                      No roadmap
                    </span>
                  )}
                </div>

                {/* Progress Bar with Ratio */}
                {proj.totalTasks > 0 ? (
                  <div className="card-progress-section">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="progress-fraction">
                      {proj.completedTasks}/{proj.totalTasks}
                    </span>
                  </div>
                ) : (
                  <div className="card-progress-placeholder" />
                )}

                {/* Card Footer */}
                <div className="card-footer-row">
                  <div className="branch-meta">
                    <BranchIcon size={12} color="#9FA4B4" />
                    <span className="branch-name">{proj.branch}</span>
                  </div>
                  <div className="time-meta">
                    <ClockIcon size={12} color="#666C7E" />
                    <span>{proj.updatedAt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="projects-table-view">
          <div className="table-header-row">
            <span className="th-name">Project</span>
            <span className="th-tag">Type</span>
            <span className="th-progress">Progress</span>
            <span className="th-branch">Branch</span>
            <span className="th-updated">Updated</span>
            <span className="th-actions">Action</span>
          </div>
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="table-item-row"
              onClick={() => onOpenProject(proj.id)}
            >
              <div className="td-name">
                <button
                  className={`star-toggle-btn ${(starredIds[proj.id] ?? proj.starred) ? "starred" : ""}`}
                  onClick={(e) => toggleStar(proj.id, e)}
                >
                  <StarIcon
                    size={14}
                    filled={starredIds[proj.id] ?? proj.starred}
                    color={(starredIds[proj.id] ?? proj.starred) ? "#FFB547" : "#666C7E"}
                  />
                </button>
                <strong>{proj.name}</strong>
              </div>
              <div className="td-tag">
                <span className={`project-tag-pill ${proj.tag.toLowerCase()}`}>{proj.tag}</span>
              </div>
              <div className="td-progress">
                <div className="mini-progress-bar">
                  <div
                    className="mini-progress-fill"
                    style={{
                      width: `${proj.totalTasks > 0 ? Math.round((proj.completedTasks / proj.totalTasks) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span>{proj.completedTasks}/{proj.totalTasks}</span>
              </div>
              <div className="td-branch">
                <span>{proj.branch}</span>
              </div>
              <div className="td-updated">
                <span>{proj.updatedAt}</span>
              </div>
              <div className="td-actions">
                <button
                  className="btn-table-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewTask(proj.repoPath);
                  }}
                >
                  Run Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Executions & Recent Activity Section */}
      <div className="dashboard-bottom-section">
        <div className="bottom-card">
          <div className="bottom-card-head">
            <h3>Recent Executions</h3>
            <span className="live-pill"><i className="live-dot" /> Live Updates</span>
          </div>
          {sessions.length === 0 ? (
            <div className="mini-empty-state">
              <p>No recent tasks run yet. Start a task to see orchestrated runs here.</p>
              <button className="btn-secondary" onClick={() => onNewTask()}>
                Start First Task
              </button>
            </div>
          ) : (
            <div className="mini-sessions-list">
              {sessions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="mini-session-row"
                  onClick={() => onOpenSession(s.id)}
                >
                  <span className={`status-dot-badge status-${s.status}`} />
                  <div className="session-info">
                    <strong>{s.title || s.prompt || `Task ${s.id.slice(0, 8)}`}</strong>
                    <small>{s.agent} · {s.model}</small>
                  </div>
                  <span className="session-cost">${(s.costUsd || 0).toFixed(2)}</span>
                  <ArrowRightIcon size={12} color="#666C7E" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bottom-card">
          <div className="bottom-card-head">
            <h3>AI Model Orchestration</h3>
            <span className="meta-info">Current Routing</span>
          </div>
          <div className="routing-preview-list">
            <div className="routing-preview-row">
              <span className="phase-badge analyze">Analyze</span>
              <ArrowRightIcon size={12} color="#666C7E" />
              <span className="model-chip">Claude 3.5 Sonnet</span>
              <span className="provider-tag">Anthropic</span>
            </div>
            <div className="routing-preview-row">
              <span className="phase-badge plan">Plan</span>
              <ArrowRightIcon size={12} color="#666C7E" />
              <span className="model-chip">Claude 3.5 Sonnet</span>
              <span className="provider-tag">Anthropic</span>
            </div>
            <div className="routing-preview-row">
              <span className="phase-badge implement">Implement</span>
              <ArrowRightIcon size={12} color="#666C7E" />
              <span className="model-chip">Qwen 2.5 Coder / GPT-4o</span>
              <span className="provider-tag">Fast & Precise</span>
            </div>
            <div className="routing-preview-row">
              <span className="phase-badge test">Test</span>
              <ArrowRightIcon size={12} color="#666C7E" />
              <span className="model-chip">GPT-4o Mini</span>
              <span className="provider-tag">OpenAI</span>
            </div>
            <div className="routing-preview-row">
              <span className="phase-badge review">Review</span>
              <ArrowRightIcon size={12} color="#666C7E" />
              <span className="model-chip">Claude 3.5 Sonnet</span>
              <span className="provider-tag">Anthropic</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
