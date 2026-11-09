import { useState } from "react";
import type { DesktopProject } from "./WorkspacePages";
import type { DesktopSession } from "./TaskDetail";
import { SearchIcon, PlusIcon, FolderIcon, BranchIcon, ArrowRightIcon } from "./Icons";

interface ProjectsViewProps {
  projects: DesktopProject[];
  sessions: DesktopSession[];
  onOpenSession: (id: string) => void;
  onNewTask: (repoPath?: string) => void;
  selectedProjectId?: string | null;
}

export function ProjectsView({
  projects,
  sessions,
  onOpenSession,
  onNewTask,
  selectedProjectId,
}: ProjectsViewProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    selectedProjectId || (projects.length > 0 ? projects[0].id : "saas-dashboard")
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "repository" | "workflows" | "memory" | "settings"
  >("overview");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectPath, setNewProjectPath] = useState("");

  const sampleProjects: DesktopProject[] = [
    {
      id: "saas-dashboard",
      name: "SaaS Dashboard",
      repoId: "repo-1",
      path: "d:\\dev\\saas-dashboard",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      sessionCount: 8,
    },
    {
      id: "ml-pipeline",
      name: "ML Pipeline",
      repoId: "repo-2",
      path: "d:\\dev\\ml-pipeline",
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      sessionCount: 5,
    },
    {
      id: "taskflow-mobile",
      name: "TaskFlow Mobile",
      repoId: "repo-3",
      path: "d:\\dev\\taskflow-mobile",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      sessionCount: 6,
    },
    {
      id: "api-gateway",
      name: "API Gateway",
      repoId: "repo-4",
      path: "d:\\dev\\api-gateway",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      sessionCount: 3,
    },
    {
      id: "design-system",
      name: "Design System",
      repoId: "repo-5",
      path: "d:\\dev\\design-system",
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      sessionCount: 4,
    },
    {
      id: "ecommerce-platform",
      name: "E-Commerce Platform",
      repoId: "repo-6",
      path: "d:\\dev\\ecommerce-platform",
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      sessionCount: 1,
    },
  ];

  // Deduplicate projects by normalized path/name
  const dedupedProjects = projects.filter(
    (p, idx, arr) =>
      idx ===
      arr.findIndex(
        (other) =>
          (other.path || other.name).trim().toLowerCase() ===
          (p.path || p.name).trim().toLowerCase()
      )
  );

  const allProjects = (dedupedProjects.length > 0 ? dedupedProjects : sampleProjects).map((p) => {
    const matchedCount = sessions.filter(
      (s) =>
        s.projectId === p.id ||
        (s.projectName && s.projectName.trim().toLowerCase() === p.name.trim().toLowerCase()) ||
        (s.repo && p.path && s.repo.trim().toLowerCase() === p.path.trim().toLowerCase())
    ).length;
    return {
      ...p,
      sessionCount: matchedCount > 0 ? matchedCount : p.sessionCount || 0,
    };
  });

  const filteredProjects = allProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  const currentProject =
    allProjects.find((p) => p.id === activeProjectId) || allProjects[0];

  const projectSessions = sessions.filter(
    (s) =>
      s.projectId === currentProject?.id ||
      (s.projectName && currentProject?.name && s.projectName.trim().toLowerCase() === currentProject.name.trim().toLowerCase()) ||
      (s.repo && currentProject?.path && s.repo.trim().toLowerCase() === currentProject.path.trim().toLowerCase())
  );

  return (
    <div className="projects-view-layout">
      {/* Sidebar: Projects List */}
      <div className="projects-list-sidebar">
        <div className="list-sidebar-header">
          <div className="title-row">
            <h2>Projects</h2>
            <button
              className="btn-icon-add"
              onClick={() => setIsAddModalOpen(true)}
              title="Add Project"
            >
              <PlusIcon size={14} />
            </button>
          </div>
          <div className="search-input-wrap">
            <SearchIcon size={13} color="#666C7E" />
            <input
              type="text"
              placeholder="Filter projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="projects-list-items">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              className={`project-sidebar-item ${currentProject?.id === p.id ? "active" : ""}`}
              onClick={() => setActiveProjectId(p.id)}
            >
              <div className="project-avatar-box">
                {p.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="project-sidebar-info">
                <strong>{p.name}</strong>
                <small title={p.path}>{p.path}</small>
              </div>
              <span className="runs-counter">{p.sessionCount} runs</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel: Project Details */}
      <div className="project-detail-panel">
        {currentProject ? (
          <>
            {/* Project Header */}
            <div className="project-main-header">
              <div className="header-meta">
                <div className="badge-row">
                  <span className="repo-type-tag">LOCAL GIT REPOSITORY</span>
                  <span className="branch-tag">
                    <BranchIcon size={11} /> main
                  </span>
                </div>
                <h1>{currentProject.name}</h1>
                <p className="repo-path-label" title={currentProject.path}>
                  <FolderIcon size={13} color="#666C7E" /> {currentProject.path}
                </p>
              </div>

              <div className="header-actions">
                <button
                  className="btn-primary"
                  onClick={() => onNewTask(currentProject.path)}
                >
                  <PlusIcon size={14} color="#ffffff" />
                  <span>New Task on Project</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="project-tabs-nav" role="tablist">
              <button
                className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
                onClick={() => setActiveTab("tasks")}
              >
                Tasks ({projectSessions.length || currentProject.sessionCount})
              </button>
              <button
                className={`tab-btn ${activeTab === "repository" ? "active" : ""}`}
                onClick={() => setActiveTab("repository")}
              >
                Repository
              </button>
              <button
                className={`tab-btn ${activeTab === "workflows" ? "active" : ""}`}
                onClick={() => setActiveTab("workflows")}
              >
                Workflows
              </button>
              <button
                className={`tab-btn ${activeTab === "memory" ? "active" : ""}`}
                onClick={() => setActiveTab("memory")}
              >
                Memory
              </button>
              <button
                className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="project-tab-content">
              {activeTab === "overview" && (
                <div className="overview-tab-pane">
                  <div className="overview-stats-grid">
                    <div className="stat-card">
                      <span className="stat-label">TOTAL SESSIONS</span>
                      <strong className="stat-val">{currentProject.sessionCount || 8}</strong>
                      <span className="stat-sub">Across 5 branches</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">COMPLETED WORK</span>
                      <strong className="stat-val">94%</strong>
                      <span className="stat-sub">Passing tests</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">TOTAL AI USAGE</span>
                      <strong className="stat-val">$4.82</strong>
                      <span className="stat-sub">342k tokens orchestrated</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">INTEGRATED REPO</span>
                      <strong className="stat-val">Connected</strong>
                      <span className="stat-sub">Local Git Watcher</span>
                    </div>
                  </div>

                  <div className="recent-runs-block">
                    <h3>Recent Project Runs</h3>
                    {projectSessions.length === 0 ? (
                      <div className="empty-runs-card">
                        <p>No recorded sessions yet for this workspace path.</p>
                        <button
                          className="btn-secondary"
                          onClick={() => onNewTask(currentProject.path)}
                        >
                          Run task on {currentProject.name}
                        </button>
                      </div>
                    ) : (
                      <div className="runs-table">
                        {projectSessions.map((s) => (
                          <div
                            key={s.id}
                            className="run-row"
                            onClick={() => onOpenSession(s.id)}
                          >
                            <span className={`status-dot-badge status-${s.status}`} />
                            <div className="run-main">
                              <strong>{s.title || s.prompt || s.id}</strong>
                              <small>{s.agent} · {s.model}</small>
                            </div>
                            <span className="run-cost">${(s.costUsd || 0).toFixed(2)}</span>
                            <span className="run-time">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                            <ArrowRightIcon size={12} color="#666C7E" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "tasks" && (
                <div className="tasks-tab-pane">
                  <div className="tasks-pane-toolbar">
                    <p>All automated and human-reviewed tasks for {currentProject.name}</p>
                    <button
                      className="btn-primary"
                      onClick={() => onNewTask(currentProject.path)}
                    >
                      <PlusIcon size={13} color="#ffffff" />
                      <span>New Task</span>
                    </button>
                  </div>
                  <div className="tasks-list-cards">
                    {projectSessions.length > 0 ? (
                      projectSessions.map((s) => (
                        <div
                          key={s.id}
                          className="project-task-card"
                          onClick={() => onOpenSession(s.id)}
                        >
                          <div className="task-card-top">
                            <span className={`status-pill ${s.status}`}>
                              {s.status.replace(/_/g, " ")}
                            </span>
                            <span className="cost-tag">${(s.costUsd || 0).toFixed(2)}</span>
                          </div>
                          <h4>{s.title || s.prompt || `Task ${s.id.slice(0, 8)}`}</h4>
                          <div className="task-card-bottom">
                            <span>Agent: {s.agent}</span>
                            <span>Model: {s.model}</span>
                            <span>{new Date(s.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-runs-card">
                        <p>No active tasks for this project.</p>
                        <button
                          className="btn-primary"
                          onClick={() => onNewTask(currentProject.path)}
                        >
                          Create first task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "repository" && (
                <div className="repository-tab-pane">
                  <div className="repo-info-card">
                    <h3>Repository Details</h3>
                    <div className="repo-info-row">
                      <span>Working Directory:</span>
                      <code>{currentProject.path}</code>
                    </div>
                    <div className="repo-info-row">
                      <span>Active Branch:</span>
                      <code>main</code>
                    </div>
                    <div className="repo-info-row">
                      <span>Git Remote:</span>
                      <code>origin (git@github.com:devweekends/{currentProject.id}.git)</code>
                    </div>
                    <div className="repo-info-row">
                      <span>Local Daemon Sync:</span>
                      <span className="sync-status online">Active file watcher</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "workflows" && (
                <div className="workflows-tab-pane">
                  <div className="workflow-card-item">
                    <div className="wf-head">
                      <div>
                        <h4>Autonomous Feature Development</h4>
                        <p>Analyze → Plan → Implement → Test → Human Approval</p>
                      </div>
                      <span className="status-badge active">Default Workflow</span>
                    </div>
                    <div className="wf-phases-preview">
                      <span className="phase-step">Analyze (Claude 3.5 Sonnet)</span>
                      <span className="arrow">→</span>
                      <span className="phase-step">Plan (Claude 3.5 Sonnet)</span>
                      <span className="arrow">→</span>
                      <span className="phase-step">Implement (Qwen 2.5 Coder)</span>
                      <span className="arrow">→</span>
                      <span className="phase-step">Test (Haiku / Mini)</span>
                      <span className="arrow">→</span>
                      <span className="phase-step review">Review (Human In Loop)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "memory" && (
                <div className="memory-tab-pane">
                  <div className="memory-box">
                    <h3>Repository Knowledge Base</h3>
                    <p className="memory-desc">
                      CodeHands AI parses architectural patterns, coding conventions, and testing
                      standards to guide all coding tasks in this repository.
                    </p>
                    <div className="memory-section">
                      <h4>Architectural Conventions</h4>
                      <ul>
                        <li>React 19 + TypeScript + Vite with custom CSS design tokens.</li>
                        <li>Clean architecture separation between API boundaries, state, and UI.</li>
                        <li>All user-facing components require accessibility attributes and keyboard traps.</li>
                      </ul>
                    </div>
                    <div className="memory-section">
                      <h4>Key Files & Entrypoints</h4>
                      <ul>
                        <li><code>src/App.tsx</code> — Main desktop workspace shell & routing</li>
                        <li><code>src/App.css</code> — Global design tokens & responsive system</li>
                        <li><code>src/components/TaskDetail.tsx</code> — Execution, Changes, Logs, Artifacts, Timeline</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="settings-tab-pane">
                  <div className="settings-form-group">
                    <label>Project Display Name</label>
                    <input type="text" defaultValue={currentProject.name} />
                  </div>
                  <div className="settings-form-group">
                    <label>Filesystem Path</label>
                    <input type="text" defaultValue={currentProject.path} readOnly />
                  </div>
                  <div className="settings-form-group">
                    <label>Default Branch</label>
                    <input type="text" defaultValue="main" />
                  </div>
                  <button className="btn-primary">Save Project Configuration</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-project-select">
            <p>Select a project from the left or add a new repository.</p>
          </div>
        )}
      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Local Project</h3>
              <button className="btn-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="e.g. My Next.js Service"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              <label>Local Repository Path</label>
              <input
                type="text"
                placeholder="e.g. D:\dev\my-app"
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
              />
              <p className="modal-hint">
                CodeHands will monitor this directory locally and stage changes for your review.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (newProjectName && newProjectPath) {
                    setIsAddModalOpen(false);
                    onNewTask(newProjectPath);
                  }
                }}
              >
                Connect & Start Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
