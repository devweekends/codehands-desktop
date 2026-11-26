import { useState } from "react";
import { DemoNote, DemoTag } from "./Demo";
import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";
import {
  PlusIcon,
  GridIcon,
  ListIcon,
  StarIcon,
  ArrowRightIcon,
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

const DEMO_ROUTING = [
  ["Analyze", "Claude 3.5 Sonnet", "Anthropic"],
  ["Plan", "Claude 3.5 Sonnet", "Anthropic"],
  ["Implement", "Qwen 2.5 Coder / GPT-4o", "Fast & Precise"],
  ["Test", "GPT-4o Mini", "OpenAI"],
  ["Review", "Claude 3.5 Sonnet", "Anthropic"],
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

  const usingDemoProjects = dedupedProjects.length === 0;
  const waiting = sessions.filter((s) => s.status === "awaiting_approval");
  const running = sessions.filter((s) => s.status === "running" || s.status === "queued");
  const titleOf = (s: DesktopSession) => s.title || s.prompt || `Task ${s.id.slice(0, 8)}`;
  const headline = [
    waiting.length ? `${waiting.length} change${waiting.length > 1 ? "s" : ""} waiting for you` : "Nothing is waiting for you",
    running.length ? `${running.length} task${running.length > 1 ? "s" : ""} running or queued` : "",
  ].filter(Boolean).join(" · ");

  return (
    <div className="page dashboard-view-container">
      <div className="col">
        <div className="page-head">
          <div>
            <h1>Home</h1>
            <p className="sub">{headline}</p>
          </div>
          <button className="btn add-project-btn" onClick={onNewProject}>
            <PlusIcon size={13} />
            <span>Add project</span>
          </button>
        </div>

        {waiting.length > 0 && (
          <>
            <div className="sec-h"><span>Needs you</span></div>
            {waiting.map((s) => (
              <div key={s.id} className="card pad attention need-card row" onClick={() => onOpenSession(s.id)}>
                <span className="dot awaiting_approval" />
                <div className="grow">
                  <h3 className="ell">{titleOf(s)}</h3>
                  <div className="mut sm ell">{s.projectName || s.repo} · {s.agent} · {s.model} · ${(s.costUsd || 0).toFixed(2)}</div>
                </div>
                <button className="btn primary sm">Review changes <ArrowRightIcon size={12} /></button>
              </div>
            ))}
          </>
        )}

        {running.length > 0 && (
          <>
            <div className="sec-h"><span>Running now</span></div>
            <div className="card list">
              {running.map((s) => (
                <div key={s.id} className="click" onClick={() => onOpenSession(s.id)}>
                  <span className={`dot ${s.status}`} />
                  <span className="grow ell">{titleOf(s)}</span>
                  <span className="mut sm">{s.status}</span>
                  <span className="mono mut">${(s.costUsd || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="sec-h"><span>Recent runs</span></div>
        {sessions.length === 0 ? (
          <div className="card empty">
            <h3>No tasks yet</h3>
            <p>Describe a change and CodeHands will work on it. You approve it before anything is committed.</p>
            <button className="btn primary" onClick={() => onNewTask()}>Start first task</button>
          </div>
        ) : (
          <div className="card list">
            {sessions.slice(0, 4).map((s) => (
              <div key={s.id} className="click mini-session-row" onClick={() => onOpenSession(s.id)}>
                <span className={`dot ${s.status}`} />
                <div className="grow">
                  <div className="ell">{titleOf(s)}</div>
                  <div className="mut sm ell">{s.agent} · {s.model}</div>
                </div>
                <span className={`pill ${s.status}`}>{s.status.replace(/_/g, " ")}</span>
                <span className="mono mut">${(s.costUsd || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sec-h">
          <span className="row">Projects {usingDemoProjects && <DemoTag />}</span>
          <div className="row wrap">
            <input type="text" style={{ width: 200 }} placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="seg">
              {(["all", "active", "archived"] as const).map((f) => (
                <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="seg">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view"><GridIcon size={13} /></button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view"><ListIcon size={13} /></button>
            </div>
          </div>
        </div>

        {usingDemoProjects && (
          <DemoNote>These are sample projects. Yours appear here after you run your first task.</DemoNote>
        )}

        <div className={viewMode === "grid" ? "grid3" : "card list"}>
          {filteredProjects.map((proj) => {
            const starred = starredIds[proj.id] ?? proj.starred;
            const percent = proj.totalTasks > 0 ? Math.round((proj.completedTasks / proj.totalTasks) * 100) : 0;
            const star = (
              <button className="icon-btn" onClick={(e) => toggleStar(proj.id, e)} title={starred ? "Remove star" : "Star project"}>
                <StarIcon size={14} color={starred ? "#FFB547" : "currentColor"} />
              </button>
            );
            const run = (
              <button
                className="btn sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onNewTask(proj.repoPath);
                }}
              >
                Run task
              </button>
            );
            return viewMode === "grid" ? (
              <div key={proj.id} className="card pad project-card" onClick={() => onOpenProject(proj.id)}>
                <div className="row">
                  <h3 className="grow ell">{proj.name}</h3>
                  {star}
                </div>
                <div className="mono mut ell" title={proj.repoPath}>{proj.repoPath}</div>
                {usingDemoProjects && <p className="sub sm mt8">{proj.description}</p>}
                <div className="bar mt12"><i style={{ width: `${percent}%` }} /></div>
                <div className="row mt8">
                  <span className="mut sm grow">{proj.completedTasks} of {proj.totalTasks} approved</span>
                  {run}
                </div>
              </div>
            ) : (
              <div key={proj.id} className="click" onClick={() => onOpenProject(proj.id)}>
                {star}
                <div className="grow">
                  <div className="ell">{proj.name}</div>
                  <div className="mono mut ell">{proj.repoPath}</div>
                </div>
                <span className="mut sm">{proj.completedTasks}/{proj.totalTasks}</span>
                {run}
              </div>
            );
          })}
        </div>

        <details className="card demo-details mt24">
          <summary>
            <span className="grow">Model routing</span>
            <DemoTag />
          </summary>
          <div className="body sub sm">
            {DEMO_ROUTING.map(([phase, model, provider]) => (
              <div key={phase} className="repo-info-row">
                <span>{phase}</span>
                <span>{model} · {provider}</span>
              </div>
            ))}
            <p className="mt8">Fixed sample text. It does not follow the models you choose for a task.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
