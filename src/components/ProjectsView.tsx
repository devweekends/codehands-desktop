import { useState } from "react";
import type { DesktopProject } from "./WorkspacePages";
import type { DesktopSession } from "./TaskDetail";
import { PlusIcon, ArrowRightIcon } from "./Icons";
import { DemoNote, DemoTag } from "./Demo";

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

  return (
    <div className="projects-view-layout">
      <div className="pane-list">
        <div className="pane-list-head">
          <div className="row">
            <h2 className="grow">Projects</h2>
            {usingDemoProjects && <DemoTag />}
            <button className="btn sm" onClick={() => setIsAddModalOpen(true)} title="Add project">
              <PlusIcon size={13} />
            </button>
          </div>
          <input type="text" placeholder="Filter projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pane-list-body">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              className={`pick-row ${p.id === currentProject?.id ? "active" : ""}`}
              onClick={() => setActiveProjectId(p.id)}
            >
              <div className="grow">
                <div className="ell">{p.name}</div>
                <div className="mono mut ell">{p.path}</div>
              </div>
              <span className="mut sm">{p.sessionCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pane-main">
        {currentProject ? (
          <>
            <div className="task-head">
              <div className="task-head-top">
                <div className="task-head-title">
                  <h2 className="ell">{currentProject.name}</h2>
                  <div className="mono mut ell">{currentProject.path}</div>
                </div>
                <button className="btn primary" onClick={() => onNewTask(currentProject.path)}>
                  <PlusIcon size={13} color="#ffffff" />
                  New Task on Project
                </button>
              </div>
              <div className="tabs">
                {TABS.map(([id, label, demo]) => (
                  <button key={id} className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)}>
                    {label}
                    {demo && <DemoTag label="Demo" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pane-scroll">
              <div className="col">
                {usingDemoProjects && <DemoNote>This is a sample project. Yours appear here after you run your first task.</DemoNote>}

                {activeTab === "overview" && (
                  <>
                    <div className="card pad stat">
                      <span className="mut sm">Tasks recorded for this project</span>
                      <b>{currentProject.sessionCount}</b>
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
                    <div className="sec-h"><span className="row">Project health <DemoTag /></span></div>
                    <div className="grid3">
                      <div className="card pad stat"><span className="mut sm">Completed work</span><b>94%</b><span className="mut sm">Passing tests</span></div>
                      <div className="card pad stat"><span className="mut sm">AI usage</span><b>$4.82</b><span className="mut sm">342k tokens</span></div>
                      <div className="card pad stat"><span className="mut sm">Repository</span><b>Connected</b><span className="mut sm">Across 5 branches</span></div>
                    </div>
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

                {activeTab === "workflows" && (
                  <>
                    <DemoNote>A sample workflow. It is not used when a task runs.</DemoNote>
                    <div className="card list">
                      {["Analyze · Claude 3.5 Sonnet", "Plan · Claude 3.5 Sonnet", "Implement · Qwen 2.5 Coder", "Test · Haiku / Mini", "Review · you"].map((step, i) => (
                        <div key={step}><span className="mut">{i + 1}</span><span>{step}</span></div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === "memory" && (
                  <>
                    <DemoNote>Sample notes. They are not read from your repository.</DemoNote>
                    <div className="sec-h"><span>Conventions</span></div>
                    <div className="card list">
                      <div>React 19 + TypeScript + Vite with custom CSS design tokens.</div>
                      <div>Clear separation between API boundaries, state and UI.</div>
                      <div>All user-facing components need accessibility attributes and keyboard traps.</div>
                    </div>
                    <div className="sec-h"><span>Key files</span></div>
                    <div className="card list">
                      <div><code>src/App.tsx</code><span className="mut">Main desktop shell and routing</span></div>
                      <div><code>src/App.css</code><span className="mut">Design tokens and layout</span></div>
                      <div><code>src/components/TaskDetail.tsx</code><span className="mut">Shared task types</span></div>
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
          </>
        ) : (
          <div className="empty">
            <p>Select a project on the left, or add a repository.</p>
          </div>
        )}
      </div>

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
    </div>
  );
}
