import { useState } from "react";
import type { DesktopProject } from "./WorkspacePages";
import type { DesktopSession } from "./TaskDetail";
import { PlusIcon, ArrowRightIcon, FolderIcon, ChevronLeftIcon } from "./Icons";
import { WorkflowBuilderView } from "./WorkflowBuilderView";
import { RepositoryMemoryPage } from "./WorkspacePages";
import { DemoNote, DemoTag } from "./Demo";

interface ProjectsViewProps {
  projects: DesktopProject[];
  sessions: DesktopSession[];
  onOpenSession: (id: string) => void;
  onNewTask: (repoPath?: string) => void;
  selectedProjectId?: string | null;
  /** Set when the command palette asks for a project's workflow or memory. */
  initialTab?: "workflows" | "memory";
}

export function ProjectsView({
  projects,
  sessions,
  onOpenSession,
  onNewTask,
  selectedProjectId,
  initialTab,
}: ProjectsViewProps) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(
    selectedProjectId || null
  );
  const [isProjectOpen, setIsProjectOpen] = useState(Boolean(selectedProjectId || initialTab));
  const [activeTab, setActiveTab] = useState<
    "overview" | "tasks" | "repository" | "workflows" | "memory" | "settings"
  >(initialTab ?? "overview");
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

  const usingDemoProjects = dedupedProjects.length === 0;
  const TABS = [
    ["overview", "Overview", false],
    ["tasks", `Tasks (${projectSessions.length})`, false],
    ["repository", "Repository", false],
    ["workflows", "Workflow", true],
    ["memory", "Memory", true],
    ["settings", "Settings", true],
  ] as const;

  const runList = (
    <div className="card list">
      {projectSessions.map((s) => (
        <div key={s.id} className="click run-row" onClick={() => onOpenSession(s.id)}>
          <span className={`dot ${s.status}`} />
          <div className="grow">
            <div className="ell">{s.title || s.prompt || s.id}</div>
            <div className="mut sm ell">{s.agent} · {s.model} · {new Date(s.createdAt).toLocaleDateString()}</div>
          </div>
          <span className={`pill ${s.status}`}>{s.status.replace(/_/g, " ")}</span>
          <span className="mono mut">${(s.costUsd || 0).toFixed(2)}</span>
          <ArrowRightIcon size={12} />
        </div>
      ))}
    </div>
  );

  const sessionsOf = (project: DesktopProject) =>
    sessions.filter(
      (s) =>
        s.projectId === project.id ||
        (s.projectName && s.projectName.trim().toLowerCase() === project.name.trim().toLowerCase()) ||
        (s.repo && project.path && s.repo.trim().toLowerCase() === project.path.trim().toLowerCase())
    );
  const approvedCount = projectSessions.filter((s) => s.status === "approved").length;
  const projectSpend = projectSessions.reduce((total, s) => total + (s.costUsd || 0), 0);

  const addModal = (
    <>
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add a project</h2>
              <button className="btn-close" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <label>Project name</label>
              <input type="text" placeholder="e.g. My Next.js Service" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
              <label>Local repository path</label>
              <input type="text" placeholder="e.g. D:\dev\my-app" value={newProjectPath} onChange={(e) => setNewProjectPath(e.target.value)} />
              <p className="modal-hint">The project is saved when you start its first task.</p>
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button
                className="btn primary"
                onClick={() => {
                  if (newProjectName && newProjectPath) {
                    setIsAddModalOpen(false);
                    onNewTask(newProjectPath);
                  }
                }}
              >
                Connect &amp; start task
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  /* ---------- All projects ---------- */
  if (!isProjectOpen || !currentProject) {
    return (
      <div className="page projects-view-layout">
        <div className="col wide">
          <div className="page-head">
            <div>
              <h1 className="row">Projects {usingDemoProjects && <DemoTag />}</h1>
              <p className="sub">The repositories CodeHands can work on.</p>
            </div>
            <button className="btn primary" onClick={() => setIsAddModalOpen(true)}>
              <PlusIcon size={13} color="#ffffff" /> Add project
            </button>
          </div>
          <input type="text" placeholder="Filter projects..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          {usingDemoProjects && <div className="mt12"><DemoNote>These are sample projects. Yours appear here after you run your first task.</DemoNote></div>}
          <div className="grid3 mt16">
            {filteredProjects.map((p) => {
              const own = sessionsOf(p);
              const toReview = own.filter((s) => s.status === "awaiting_approval").length;
              const latest = own[0];
              return (
                <button
                  key={p.id}
                  className="card pad project-grid-card"
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setActiveTab("overview");
                    setIsProjectOpen(true);
                  }}
                >
                  <div className="row">
                    <span className="icon-tile violet"><FolderIcon size={15} /></span>
                    <div className="grow">
                      <h3 className="ell">{p.name}</h3>
                      <div className="mono mut ell">{p.path}</div>
                    </div>
                    {toReview > 0 && <span className="pill plain awaiting_approval">{toReview} to review</span>}
                  </div>
                  <div className="sub ell mt16">{latest ? latest.title || latest.prompt : "No runs yet"}</div>
                  <div className="mut sm mt12">{p.sessionCount} {p.sessionCount === 1 ? "task" : "tasks"}{own.length > 0 ? ` · ${own.filter((s) => s.status === "approved").length} approved` : ""}</div>
                </button>
              );
            })}
          </div>
        </div>
        {addModal}
      </div>
    );
  }

  /* ---------- One project ---------- */
  return (
    <div className="projects-view-layout project-page">
      <div className="pane-main">
        <div className="task-head">
          <button className="btn-all-tasks" onClick={() => setIsProjectOpen(false)}><ChevronLeftIcon size={12} /> Projects</button>
          <div className="task-head-top">
            <div className="task-head-title">
              <h2 className="row">{currentProject.name} {usingDemoProjects && <DemoTag />}</h2>
              <div className="mono mut ell">{currentProject.path}</div>
            </div>
            <button className="btn primary" onClick={() => onNewTask(currentProject.path)}>
              <PlusIcon size={13} color="#ffffff" />
              New Task on Project
            </button>
          </div>
          <div className="tabs">
            {TABS.map(([id, label, demo]) => (
              <button
                key={id}
                className={activeTab === id ? "active" : ""}
                onClick={() => setActiveTab(id)}
                data-nav={id === "workflows" ? "Workflows" : id === "memory" ? "Repository Memory" : undefined}
              >
                {label}
                {demo && <DemoTag label="Demo" />}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "workflows" ? (
          <WorkflowBuilderView />
        ) : activeTab === "memory" ? (
          <div className="pane-scroll embedded-page"><RepositoryMemoryPage /></div>
        ) : (
          <div className="pane-scroll">
            <div className="col">
              {activeTab === "overview" && (
                <>
                  <div className="grid3">
                    <div className="card pad stat"><span className="mut sm">Tasks recorded</span><b>{currentProject.sessionCount}</b></div>
                    <div className="card pad stat"><span className="mut sm">Approved</span><b>{approvedCount}</b></div>
                    <div className="card pad stat"><span className="mut sm">Spent</span><b>${projectSpend.toFixed(2)}</b></div>
                  </div>
                  <div className="sec-h"><span>Recent runs</span></div>
                  {projectSessions.length === 0 ? (
                    <div className="card empty">
                      <p>No runs recorded for this folder yet.</p>
                      <button className="btn" onClick={() => onNewTask(currentProject.path)}>Run a task on {currentProject.name}</button>
                    </div>
                  ) : (
                    runList
                  )}
                  <details className="card demo-details mt16">
                    <summary><span className="grow">Project health</span><DemoTag /></summary>
                    <div className="body">
                      <div className="repo-info-row"><span>Completed work</span><span>94% passing tests</span></div>
                      <div className="repo-info-row"><span>AI usage</span><span>$4.82 · 342k tokens</span></div>
                      <div className="repo-info-row"><span>Repository</span><span>Connected · across 5 branches</span></div>
                    </div>
                  </details>
                </>
              )}

                {activeTab === "tasks" &&
                  (projectSessions.length > 0 ? (
                    runList
                  ) : (
                    <div className="card empty">
                      <p>No tasks for this project yet.</p>
                      <button className="btn" onClick={() => onNewTask(currentProject.path)}>Create first task</button>
                    </div>
                  ))}

                {activeTab === "repository" && (
                  <>
                    <div className="card">
                      <div className="repo-info-row"><span>Working folder</span><code>{currentProject.path}</code></div>
                    </div>
                    <div className="sec-h"><span className="row">Git details <DemoTag /></span></div>
                    <div className="card">
                      <div className="repo-info-row"><span>Active branch</span><code>main</code></div>
                      <div className="repo-info-row"><span>Git remote</span><code>origin (git@github.com:devweekends/{currentProject.id}.git)</code></div>
                      <div className="repo-info-row"><span>Daemon sync</span><span>Active file watcher</span></div>
                    </div>
                  </>
                )}

                {activeTab === "settings" && (
                  <>
                    <DemoNote>These settings are not saved yet.</DemoNote>
                    <div className="card pad">
                      <div className="form-group"><label>Project name</label><input type="text" key={currentProject.id} defaultValue={currentProject.name} /></div>
                      <div className="form-group"><label>Folder</label><input type="text" value={currentProject.path} readOnly /></div>
                      <div className="form-group"><label>Default branch</label><input type="text" defaultValue="main" /></div>
                      <button className="btn">Save project settings</button>
                    </div>
                  </>
                )}
            </div>
          </div>
        )}
      </div>
      {addModal}
    </div>
  );
}
