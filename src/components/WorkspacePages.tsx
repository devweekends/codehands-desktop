export interface DesktopProject {
  id: string;
  name: string;
  repoId: string;
  path: string;
  createdAt: string;
  sessionCount: number;
}

export interface ProviderStatus {
  agent: string;
  state: string;
  reason?: string | null;
  retryAt?: string | null;
  checkedAt?: string;
}

export function ProjectsPage({ projects, onCreateTask }: { projects: DesktopProject[]; onCreateTask: (path: string) => void }) {
  return <section className="workspace-page">
    <div className="page-heading"><div><div className="eyebrow">YOUR LOCAL WORKSPACE</div><h1>Projects</h1><p>Repositories registered on this device. Paths stay local.</p></div><button className="btn-primary" onClick={() => onCreateTask("")}>＋ Add project task</button></div>
    {!projects.length ? <div className="tasks-empty project-empty"><div className="empty-illustration"><span>⌂</span></div><h3>No projects yet</h3><p>Start a task with a local repository path. Code Hands will add that repository here.</p><button className="btn-primary" onClick={() => onCreateTask("")}>Start with a repository</button></div> : <div className="project-grid">{projects.map((project) => <article className="project-card" key={project.id}><div className="project-card-top"><div className="project-avatar">{project.name.slice(0, 1).toUpperCase()}</div><span className="project-runs">{project.sessionCount} {project.sessionCount === 1 ? "run" : "runs"}</span></div><h2>{project.name}</h2><p className="project-path" title={project.path}>{project.path}</p><div className="project-card-footer"><span><i className="local-path-dot" /> Local repository</span><button className="btn-secondary" onClick={() => onCreateTask(project.path)}>New task <span>→</span></button></div></article>)}</div>}
  </section>;
}

const AGENTS = [
  { id: "claude-code", name: "Claude Code", description: "Anthropic's coding agent CLI", mark: "A", kind: "Claude" },
  { id: "codex", name: "Codex CLI", description: "OpenAI's coding agent CLI", mark: "O", kind: "OpenAI" },
  { id: "codehands", name: "Code Hands Engine", description: "Multi-phase local orchestrator", mark: "C", kind: "Native" },
];

function providerLabel(status?: ProviderStatus) {
  if (!status) return { label: "Not checked", className: "provider-unknown" };
  const map: Record<string, { label: string; className: string }> = {
    ok: { label: "Ready", className: "provider-ready" },
    not_installed: { label: "CLI not installed", className: "provider-missing" },
    not_logged_in: { label: "Sign-in required", className: "provider-missing" },
    rate_limited: { label: "Rate limited", className: "provider-warning" },
    usage_limited: { label: "Usage limit", className: "provider-warning" },
    outage: { label: "Provider outage", className: "provider-warning" },
  };
  return map[status.state] || { label: status.state.replace(/_/g, " "), className: "provider-unknown" };
}

export function AgentsPage({ providers }: { providers: ProviderStatus[] }) {
  return <section className="workspace-page">
    <div className="page-heading"><div><div className="eyebrow">MODEL ROUTING</div><h1>Agents & models</h1><p>Choose the agent for a task, then assign models to each workflow phase.</p></div></div>
    <div className="runner-notice"><span>ⓘ</span><p><strong>Credentials stay on this device.</strong> Code Hands reads provider readiness from the local daemon and never uploads agent keys.</p></div>
    <div className="agent-grid">{AGENTS.map((agent) => {const status = providers.find((item) => item.agent === agent.id); const badge = providerLabel(status); return <article className="agent-card" key={agent.id}><div className="agent-card-head"><div className={`agent-logo agent-${agent.id}`}>{agent.mark}</div><span className={`provider-badge ${badge.className}`}><i />{badge.label}</span></div><h2>{agent.name}</h2><p>{agent.description}</p><div className="agent-card-foot"><span>{agent.kind}</span><span>{status?.checkedAt ? `Checked ${new Date(status.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Status from local daemon"}</span></div>{status?.reason && <div className="provider-reason">{status.reason}</div>}</article>; })}</div>
    <div className="phase-routing-card"><div><div className="eyebrow">WORKFLOW DEFAULTS</div><h2>Model per phase</h2><p>Configure a model independently for analysis, planning, implementation, tests, and review when creating a task.</p></div><div className="phase-chips"><span>Analyze</span><span>Plan</span><span>Implement</span><span>Test</span><span>Review</span></div></div>
  </section>;
}

export function CloudPage() {
  return <section className="workspace-page cloud-page">
    <div className="page-heading"><div><div className="eyebrow">CODE HANDS CLOUD</div><h1>Cloud workers</h1><p>Move a workflow from your laptop to a managed worker when cloud execution is available.</p></div><span className="coming-soon-badge">PLANNED</span></div>
    <div className="cloud-hero"><div className="cloud-orbit"><span>☁</span><i /><i /><i /></div><div className="eyebrow">LOCAL-FIRST TODAY · CLOUD-READY BY DESIGN</div><h2>Your agents. Your models. A workspace that can grow.</h2><p>Today, Code Hands stores tasks and session state locally. Cloud sign-in is for account identity and sync—not remote code execution. Cloud workers will be a separate, opt-in execution target once secure isolation and dispatch are ready.</p><div className="cloud-status-row"><span><i className="cloud-status-dot" /> Cloud execution</span><strong>Not available yet</strong></div></div>
    <div className="cloud-feature-grid"><article><span>01</span><h3>Local runs</h3><p>Use your installed agent CLIs. Repository files and credentials remain on this device.</p><b>Current direction</b></article><article><span>02</span><h3>Remote control</h3><p>Sync session state and review work from another signed-in device, without sending repository contents.</p><b>Planned</b></article><article><span>03</span><h3>Cloud workers</h3><p>Run a workflow in an isolated cloud worker only after the user explicitly selects that target.</p><b>Future execution target</b></article></div>
  </section>;
}
