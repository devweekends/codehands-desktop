import type { ReactNode } from "react";
import { DemoNote, DemoTag } from "./Demo";

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

function DemoPage({ title, sub, note, children }: { title: string; sub: string; note: string; children: ReactNode }) {
  return (
    <div className="page workspace-subpage-container">
      <div className="col">
        <div className="page-head">
          <div>
            <h1 className="row">{title} <DemoTag /></h1>
            <p className="sub">{sub}</p>
          </div>
        </div>
        <DemoNote>{note}</DemoNote>
        {children}
      </div>
    </div>
  );
}

const Rows = ({ items }: { items: [string, string][] }) => (
  <div className="card">
    {items.map(([k, v]) => (
      <div key={k} className="repo-info-row"><span>{k}</span><span>{v}</span></div>
    ))}
  </div>
);

export function RepositoryMemoryPage() {
  return (
    <DemoPage title="Repository Memory" sub="Notes and conventions that would guide the agent." note="Sample notes. They are not read from your repositories and cannot be edited yet.">
      <div className="sec-h"><span>Decisions</span></div>
      <div className="card list">
        <div>Local-first: task work and git operations happen on this machine.</div>
        <div>Components: React 19 and TypeScript with shared design tokens.</div>
        <div>Contract boundary: the daemon talks over a localhost WebSocket on port 8788.</div>
      </div>
      <div className="sec-h"><span>Conventions</span></div>
      <div className="card list">
        <div>Strict TypeScript, no explicit any in production paths.</div>
        <div>Unified and split diffs for every file change.</div>
        <div>No emoji in the interface. SVG icons only.</div>
      </div>
      <div className="sec-h"><span>Indexed files</span></div>
      <Rows items={[["src/App.tsx", "AppShell"], ["src/components/ModernWorkspace.tsx", "TaskWorkspace"], ["src/components/ModelHubView.tsx", "ModelHub"], ["src/components/DashboardView.tsx", "Dashboard"]]} />
    </DemoPage>
  );
}

export function SchedulerQueuePage() {
  const queue = [
    ["P0 High", "API pagination support for feed", "d:\\dev\\taskflow-mobile", "Qwen 2.5 Coder", "Running", "1"],
    ["P1 Normal", "Implement token authentication and refresh", "d:\\dev\\saas-dashboard", "Claude 3.5 Sonnet", "Queued", "2"],
    ["P2 Low", "Unit tests for payment webhook handlers", "d:\\dev\\ecommerce-platform", "GPT-4o Mini", "Queued", "3"],
  ];
  return (
    <DemoPage title="Scheduler & Queue" sub="Which task runs next." note="Sample rows. Your real queued and running tasks are on Home and Tasks.">
      <div className="card">
        <table className="t">
          <thead><tr><th>Priority</th><th>Task</th><th>Model</th><th>Status</th><th>Position</th></tr></thead>
          <tbody>
            {queue.map(([priority, title, repo, model, status, position]) => (
              <tr key={title}>
                <td>{priority}</td>
                <td className="main">{title}<div className="mono mut">{repo}</div></td>
                <td>{model}</td>
                <td><span className={`pill ${status.toLowerCase()}`}>{status}</span></td>
                <td>{position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoPage>
  );
}

export function EnvironmentsPage() {
  return (
    <DemoPage title="Environments" sub="Where task commands run." note="Sample descriptions. Nothing here is checked on your machine.">
      <div className="sec-h"><span>This machine (default)</span></div>
      <Rows items={[["Host", "Windows x86_64 with Node.js 22, git and Tauri 2"], ["Runtime", "Node.js v22.11 / Vite 8"], ["Isolation", "Local process boundary"], ["Disk access", "Workspace folders only"]]} />
      <div className="sec-h"><span>Container sandbox (standby)</span></div>
      <Rows items={[["Runtime", "Alpine Linux / Node 22"], ["Isolation", "Network-gated container"], ["Status", "Ready for dispatch"]]} />
    </DemoPage>
  );
}

export function RuntimeLogsPage() {
  return (
    <DemoPage title="Runtime & Logs" sub="What the local daemon is doing." note="These lines are fixed samples, not a live stream. A task's real events are in its Logs tab.">
      <div className="card log-stream">
        <pre className="mono" style={{ padding: "4px 16px", whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
          {`[2026-11-07 14:20:00] [SYSTEM] CodeHands daemon initialized on Windows x86_64
[2026-11-07 14:20:02] [KEYCHAIN] Stored credentials verified via OS Keychain provider
[2026-11-07 14:20:05] [WS_SERVER] WebSocket server bound to 127.0.0.1:8788
[2026-11-07 14:20:10] [WATCHER] Registered file watcher on D:\\dev\\desktop
[2026-11-07 14:20:12] [WATCHER] Registered file watcher on D:\\dev\\saas-dashboard
[2026-11-07 14:21:40] [DISPATCH] Ingested task: "Add API pagination support"
[2026-11-07 14:21:45] [ORCHESTRATOR] Dispatched Phase 1 (Analyze) -> Claude 3.5 Sonnet
[2026-11-07 14:22:00] [ORCHESTRATOR] Dispatched Phase 2 (Plan) -> Claude 3.5 Sonnet
[2026-11-07 14:22:15] [ORCHESTRATOR] Dispatched Phase 3 (Implement) -> Qwen 2.5 Coder
[2026-11-07 14:22:30] [AST_DIFF] Generated unified diff for 8 files. No regressions.`}
        </pre>
      </div>
    </DemoPage>
  );
}

export function IntegrationsPage() {
  const items = [
    ["GitHub", "Repositories, pull request review and commit checks.", "Connected"],
    ["OpenRouter API", "One route to Anthropic, OpenAI, Llama and Mistral models.", "Active key"],
    ["Local git", "System git used by the daemon.", "Ready"],
  ];
  return (
    <DemoPage title="Integrations" sub="Services CodeHands can use." note="The badges are sample text. No connection is checked.">
      <div className="card list">
        {items.map(([name, text, badge]) => (
          <div key={name}>
            <div className="grow"><h3>{name}</h3><div className="mut sm">{text}</div></div>
            <span className="demo-tag">{badge} (sample)</span>
          </div>
        ))}
      </div>
    </DemoPage>
  );
}

export function SecurityPage() {
  return (
    <DemoPage title="Security" sub="What CodeHands may read, write and store." note="Sample text that describes the goal. Nothing on this page is verified. Today the desktop app saves its sign-in token in a file under ~/.codehands, not in the system keychain.">
      <div className="sec-h"><span>Sign-in token storage (goal)</span></div>
      <Rows items={[["Planned store", "Operating system credential vault"]]} />
      <div className="sec-h"><span>File access (goal)</span></div>
      <Rows items={[["Planned policy", "Read and write only inside configured project folders"]]} />
    </DemoPage>
  );
}

// Preserve existing exports
export function ProjectsPage({ projects, onCreateTask }: { projects: DesktopProject[]; onCreateTask: (path: string) => void }) {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <h2>Local Projects</h2>
      </div>
      <div className="project-grid">
        {projects.map((p) => (
          <div key={p.id} className="project-card">
            <h3>{p.name}</h3>
            <code>{p.path}</code>
            <button className="btn-secondary" onClick={() => onCreateTask(p.path)}>Run Task</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentsPage({ providers }: { providers: ProviderStatus[] }) {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <h2>Agents & Providers</h2>
      </div>
      <div className="agent-grid">
        {providers.map((p, i) => (
          <div key={i} className="agent-card">
            <h3>{p.agent}</h3>
            <span>{p.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CloudPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <h2>Cloud Workers</h2>
      </div>
      <p>Cloud execution targets will be supported once secure container dispatch is enabled.</p>
    </div>
  );
}
