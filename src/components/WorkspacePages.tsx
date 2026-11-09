import { DatabaseIcon, ClockIcon, BoxIcon, TerminalIcon, ShieldIcon, ZapIcon } from "./Icons";

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

export function RepositoryMemoryPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <DatabaseIcon size={20} color="#27B7F5" />
          <h2>Repository Memory & Architecture Graph</h2>
        </div>
        <p>Stored context, coding standards, and architectural conventions guiding all AI agent tasks</p>
      </div>

      <div className="memory-cards-grid">
        <div className="memory-card">
          <h3>Architectural Decisions (ADRs)</h3>
          <ul>
            <li><strong>Local-First Execution:</strong> All task synthesis and git operations execute locally on this machine.</li>
            <li><strong>Component System:</strong> React 19 + TypeScript with centralized dark grey tokens and SVG primitives.</li>
            <li><strong>L1 Contract Boundary:</strong> Daemon communicates over localhost WebSocket at port 8788.</li>
          </ul>
        </div>

        <div className="memory-card">
          <h3>Codebase Conventions</h3>
          <ul>
            <li>Strict TypeScript mode without any explicit <code>any</code> in production paths.</li>
            <li>Unified and Split diff visualization for all file modifications.</li>
            <li>No unicode emojis in production interfaces; pure SVG vectors only.</li>
          </ul>
        </div>

        <div className="memory-card">
          <h3>Indexed Files & Symbols</h3>
          <div className="symbols-table">
            <div className="sym-row"><span>src/App.tsx</span><code>AppShell</code></div>
            <div className="sym-row"><span>src/components/ModernWorkspace.tsx</span><code>TaskWorkspace</code></div>
            <div className="sym-row"><span>src/components/ModelHubView.tsx</span><code>ModelHub</code></div>
            <div className="sym-row"><span>src/components/DashboardView.tsx</span><code>Dashboard</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SchedulerQueuePage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <ClockIcon size={20} color="#27B7F5" />
          <h2>Scheduler & Execution Queue</h2>
        </div>
        <p>Prioritized orchestration queue for autonomous agent workloads</p>
      </div>

      <div className="queue-table-card">
        <div className="queue-table-head">
          <span>Priority</span>
          <span>Task Title</span>
          <span>Target Repository</span>
          <span>Model</span>
          <span>Status</span>
          <span>Queue Position</span>
        </div>

        <div className="queue-row active">
          <span className="priority-tag high">P0 High</span>
          <strong>API pagination support for feed</strong>
          <code>d:\dev\taskflow-mobile</code>
          <span>Qwen 2.5 Coder</span>
          <span className="status-cell running">Running</span>
          <span>#1 (Active)</span>
        </div>

        <div className="queue-row queued">
          <span className="priority-tag medium">P1 Normal</span>
          <strong>Implement token authentication & refresh</strong>
          <code>d:\dev\saas-dashboard</code>
          <span>Claude 3.5 Sonnet</span>
          <span className="status-cell queued">Queued</span>
          <span>#2</span>
        </div>

        <div className="queue-row queued">
          <span className="priority-tag low">P2 Low</span>
          <strong>Unit tests for payment webhook handlers</strong>
          <code>d:\dev\ecommerce-platform</code>
          <span>GPT-4o Mini</span>
          <span className="status-cell queued">Queued</span>
          <span>#3</span>
        </div>
      </div>
    </div>
  );
}

export function EnvironmentsPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <BoxIcon size={20} color="#20C997" />
          <h2>Execution Environments</h2>
        </div>
        <p>Local and isolated containerized execution environments</p>
      </div>

      <div className="environments-grid">
        <div className="env-card active">
          <div className="env-card-head">
            <h3>Host Machine (Local)</h3>
            <span className="env-status-badge active">Active Default</span>
          </div>
          <p>Windows x86_64 Desktop Host with Node.js 22, Git CLI, and Tauri 2.</p>
          <div className="env-specs">
            <div><span>Runtime:</span><strong>Node.js v22.11 / Vite 8</strong></div>
            <div><span>Isolation:</span><strong>Local Process Boundary</strong></div>
            <div><span>Disk Access:</span><strong>Workspace Subdirectories Only</strong></div>
          </div>
        </div>

        <div className="env-card">
          <div className="env-card-head">
            <h3>Isolated Container Sandbox</h3>
            <span className="env-status-badge standby">Standby</span>
          </div>
          <p>Ephemeral Docker/OCI container runtime for untrusted code execution and tests.</p>
          <div className="env-specs">
            <div><span>Runtime:</span><strong>Alpine Linux / Node 22</strong></div>
            <div><span>Isolation:</span><strong>Network-Gated Container</strong></div>
            <div><span>Status:</span><strong>Ready for dispatch</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RuntimeLogsPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <TerminalIcon size={20} color="#27B7F5" />
          <h2>Daemon Runtime & Telemetry</h2>
        </div>
        <p>System-level daemon execution logs and real-time WebSocket connection state</p>
      </div>

      <div className="runtime-terminal-card">
        <div className="runtime-head">
          <span>Daemon Stream: 127.0.0.1:8788</span>
          <span className="live-status">LIVE STREAMING</span>
        </div>
        <div className="runtime-logs-scroll">
          <pre>
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
      </div>
    </div>
  );
}

export function IntegrationsPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <ZapIcon size={20} color="#27B7F5" />
          <h2>Integrations & Providers</h2>
        </div>
        <p>Connected developer platforms, AI model APIs, and local toolchains</p>
      </div>

      <div className="integrations-grid">
        <div className="integration-card connected">
          <div className="int-head">
            <strong>GitHub Integration</strong>
            <span className="badge connected">Connected</span>
          </div>
          <p>Access to personal and organization repositories, PR review, and commit verification.</p>
        </div>

        <div className="integration-card connected">
          <div className="int-head">
            <strong>OpenRouter API</strong>
            <span className="badge connected">Active Key</span>
          </div>
          <p>Unified model routing across Anthropic, OpenAI, Meta Llama, and Mistral.</p>
        </div>

        <div className="integration-card connected">
          <div className="int-head">
            <strong>Local Git CLI</strong>
            <span className="badge connected">Ready</span>
          </div>
          <p>System git 2.45 installed and accessible via daemon process spawning.</p>
        </div>
      </div>
    </div>
  );
}

export function SecurityPage() {
  return (
    <div className="workspace-subpage-container">
      <div className="subpage-header">
        <div className="subpage-title-row">
          <ShieldIcon size={20} color="#20C997" />
          <h2>Security & Credentials</h2>
        </div>
        <p>OS keychain security, secret isolation, and workspace boundary policies</p>
      </div>

      <div className="security-cards-grid">
        <div className="security-card">
          <h3>Device Keychain Storage</h3>
          <p>All device authentication tokens and API keys are stored in the operating system credential vault.</p>
          <div className="sec-item">
            <span>Windows Credential Vault:</span>
            <strong>Active (Encrypted)</strong>
          </div>
        </div>

        <div className="security-card">
          <h3>Filesystem Isolation</h3>
          <p>CodeHands AI cannot read or write outside configured project workspace folders.</p>
          <div className="sec-item">
            <span>Sandbox Policy:</span>
            <strong>Enforced by Daemon</strong>
          </div>
        </div>
      </div>
    </div>
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
