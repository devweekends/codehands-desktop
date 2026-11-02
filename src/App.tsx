import { useState, useEffect, useRef, useCallback } from "react";
import type { AgentKind, CommandKind, AuthResult } from "@codehands/contracts";
import { cloudApi } from "./api/cloud";
import { getDeviceToken, deleteDeviceToken } from "./services/keychain";
import { Topbar } from "./components/Topbar";
import { AuthModal } from "./components/AuthModal";
import { TaskDashboard } from "./components/TaskDashboard";
import { NewTaskForm } from "./components/NewTaskForm";
import { TaskDetail, type DesktopSession, type SessionEvent } from "./components/TaskDetail";
import { AgentsPage, CloudPage, ProjectsPage, type DesktopProject, type ProviderStatus } from "./components/WorkspacePages";
import "./App.css";

const DAEMON_WS_URL = "ws://127.0.0.1:8788";
type SessionFilter = "all" | "running" | "review" | "completed";

type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "session"; id: string }
  | { name: "projects" }
  | { name: "agents" }
  | { name: "cloud" };

export default function App() {
  const [sessions, setSessions] = useState<DesktopSession[]>([]);
  const [projects, setProjects] = useState<DesktopProject[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [events, setEvents] = useState<Record<string, SessionEvent[]>>({});
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [daemonState, setDaemonState] = useState<"starting" | "running" | "unavailable">("starting");
  const [notice, setNotice] = useState<string | null>(null);
  const [initialRepo, setInitialRepo] = useState("");

  // Auth & OS Keychain state (COD-291)
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequest = useRef<string | null>(null);

  // 1. Initial Keychain Check (COD-291: Token in the OS keychain)
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await getDeviceToken();
        if (storedToken) {
          // Try to load full stored auth from localStorage (stored after real login)
          const storedAuthRaw = localStorage.getItem("codehands_auth_meta");
          if (storedAuthRaw) {
            try {
              const meta = JSON.parse(storedAuthRaw) as AuthResult;
              const restored: AuthResult = { ...meta, deviceToken: storedToken };
              setAuth(restored);
              cloudApi.setToken(storedToken);
            } catch {
              // Fallback if meta is corrupted
              setAuth({
                userId: "",
                device: { id: "", name: "this-device", createdAt: new Date().toISOString() },
                deviceToken: storedToken,
              });
              cloudApi.setToken(storedToken);
            }
          } else {
            // No meta yet — minimal hydration so app knows you're logged in
            setAuth({
              userId: "",
              device: { id: "", name: "this-device", createdAt: new Date().toISOString() },
              deviceToken: storedToken,
            });
            cloudApi.setToken(storedToken);
          }
        }
      } catch (err) {
        console.error("Failed to read token from keychain:", err);
      }
    }
    loadStoredAuth();

    // Configure cloud API client to notify on token expiration
    cloudApi.setExpiredHandler(() => {
      setIsTokenExpired(true);
      setIsAuthModalOpen(true);
    });
  }, []);

  // 2. Connect to Local Daemon (L1 Contract via WebSocket)
  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const connect = () => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(DAEMON_WS_URL);
      } catch {
        setConnected(false);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === "state") {
            setSessions(msg.sessions || []);
            setProjects(msg.projects || []);
            setProviders(msg.providers || []);
            setEvents(msg.events || {});
            setDaemonState(msg.daemon?.watcher === "running" ? "running" : "unavailable");
          }

          if (msg.type === "session") {
            const s: DesktopSession = msg.session;
            setSessions((prev) => {
              const rest = prev.filter((x) => x.id !== s.id);
              return [s, ...rest];
            });

            if (msg.requestId && msg.requestId === pendingRequest.current) {
              pendingRequest.current = null;
              setView({ name: "session", id: s.id });
            }
          }

          if (msg.type === "event") {
            const ev: SessionEvent = msg.event;
            setEvents((prev) => {
              const list = prev[ev.sessionId] ?? [];
              if (list.some((x) => x.id === ev.id)) return prev;
              return { ...prev, [ev.sessionId]: [...list, ev] };
            });
          }

          if (msg.type === "accepted") {
            setNotice("Task added to the local daemon queue.");
            setView({ name: "list" });
          }

          if (msg.type === "error") {
            setNotice(msg.message || "The local daemon could not process that request.");
            pendingRequest.current = null;
          }
        } catch (err) {
          console.error("Error parsing daemon message:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!stopped) timer = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setView({ name: "new" });
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const sendCommand = useCallback((command: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(command));
      return true;
    }
    return false;
  }, []);

  // 3. New Task submission (COD-293: writes one tasks row and nothing else)
  const handleStartTask = (taskData: {
    repo: string;
    prompt: string;
    agent: AgentKind;
    model: string;
    phaseModels?: Record<string, string>;
  }) => {
    const requestId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    pendingRequest.current = requestId;

    return sendCommand({
      type: "command",
      commandType: "start",
      requestId,
      payload: {
        repo: taskData.repo,
        task: taskData.prompt,
        agent: taskData.agent,
        model: taskData.model,
        phaseModels: taskData.phaseModels,
      },
    });
  };

  // 4. Session Action Commands (Approve, Reject, Stop)
  const handleSessionCommand = (sessionId: string, commandKind: CommandKind) => {
    return sendCommand({
      type: "command",
      commandType: commandKind,
      sessionId,
    });
  };

  // 5. Auth Handlers
  const handleAuthSuccess = (result: AuthResult) => {
    setAuth(result);
    cloudApi.setToken(result.deviceToken);
    // Persist auth meta (userId, device) separately — token is in keychain
    localStorage.setItem(
      "codehands_auth_meta",
      JSON.stringify({ userId: result.userId, device: result.device, deviceToken: "" })
    );
    setIsAuthModalOpen(false);
    setIsTokenExpired(false);
  };

  const handleLogout = async () => {
    try {
      await cloudApi.logOut();
    } catch {
      // Proceed with local logout regardless of network
    }
    await deleteDeviceToken();
    localStorage.removeItem("codehands_auth_meta");
    cloudApi.setToken(null);
    setAuth(null);
  };

  const sortedSessions = [...sessions].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">C</div>
          <div><strong>Code Hands</strong><span>LOCAL WORKSPACE</span></div>
        </div>

        <button className="workspace-switcher" onClick={() => { setView({ name: "list" }); setFilter("all"); }}>
          <span className="workspace-avatar">D</span>
          <span className="workspace-label"><strong>My workspace</strong><small>This device</small></span>
          <span className="workspace-chevron">⌄</span>
        </button>

        <button className="sidebar-new-task" onClick={() => setView({ name: "new" })}>
          <span>＋</span> New task <kbd>Ctrl K</kbd>
        </button>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Task filters">
          <button className={view.name === "list" && filter === "all" ? "nav-item active" : "nav-item"} onClick={() => { setView({ name: "list" }); setFilter("all"); }}>
            <span className="nav-icon">▦</span><span>All tasks</span><span className="nav-count">{sessions.length}</span>
          </button>
          <button className={view.name === "list" && filter === "running" ? "nav-item active" : "nav-item"} onClick={() => { setView({ name: "list" }); setFilter("running"); }}>
            <span className="nav-icon">◌</span><span>In progress</span><span className="nav-count">{sessions.filter((s) => s.status === "running" || s.status === "queued").length}</span>
          </button>
          <button className={view.name === "list" && filter === "review" ? "nav-item active" : "nav-item"} onClick={() => { setView({ name: "list" }); setFilter("review"); }}>
            <span className="nav-icon">◈</span><span>Needs review</span><span className="nav-count">{sessions.filter((s) => s.status === "awaiting_approval").length}</span>
          </button>
          <button className={view.name === "list" && filter === "completed" ? "nav-item active" : "nav-item"} onClick={() => { setView({ name: "list" }); setFilter("completed"); }}>
            <span className="nav-icon">✓</span><span>Completed</span>
          </button>
          <button className={view.name === "projects" ? "nav-item active" : "nav-item"} onClick={() => setView({ name: "projects" })}>
            <span className="nav-icon">⌂</span><span>Projects</span><span className="nav-count">{projects.length}</span>
          </button>
        </nav>

        <div className="sidebar-section-label secondary-section">CONFIGURE</div>
        <nav className="sidebar-nav" aria-label="Configuration">
          <button className={view.name === "agents" ? "nav-item active" : "nav-item"} onClick={() => setView({ name: "agents" })}>
            <span className="nav-icon">◉</span><span>Agents & models</span>
          </button>
          <button className={view.name === "cloud" ? "nav-item active" : "nav-item"} onClick={() => setView({ name: "cloud" })}>
            <span className="nav-icon">☁</span><span>Cloud workers</span><span className="nav-count">Soon</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className={`daemon-card ${connected && daemonState === "running" ? "daemon-ready" : "daemon-offline"}`}>
            <span className="daemon-indicator" />
            <div><strong>{connected && daemonState === "running" ? "Daemon connected" : connected ? "Queue connected" : "Connecting locally"}</strong><small>{connected && daemonState === "running" ? "Watcher is running" : "Local SQLite workspace"}</small></div>
          </div>
          <div className="sidebar-account">
            <div className="account-avatar">{auth ? (auth.userId.slice(0, 1).toUpperCase() || "U") : "G"}</div>
            <div className="account-copy"><strong>{auth?.userId || "Guest account"}</strong><small>{auth?.device.name || "Local-only mode"}</small></div>
            {auth ? <button className="account-action" onClick={handleLogout} title="Log out">⋯</button> : <button className="account-signin" onClick={() => setIsAuthModalOpen(true)}>Sign in</button>}
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Topbar
          connected={connected}
        />
        {notice && <button className="notice-banner" onClick={() => setNotice(null)}>{notice}<span>×</span></button>}
        {connected && (
          <div className="runner-notice"><span>ⓘ</span><p><strong>Local queue is connected.</strong> The cloned daemon currently has no agent runner wired in, so tasks can be queued and observed but are not executed yet.</p></div>
        )}

        {view.name === "list" && (
          <TaskDashboard
            sessions={sortedSessions}
            onOpen={(id) => setView({ name: "session", id })}
            onNew={() => setView({ name: "new" })}
            filter={filter}
            onFilterChange={setFilter}
          />
        )}

        {view.name === "new" && (
          <NewTaskForm
            connected={connected}
            initialRepo={initialRepo}
            onStart={handleStartTask}
            onCancel={() => setView({ name: "list" })}
          />
        )}

        {view.name === "projects" && (
          <ProjectsPage
            projects={projects}
            onCreateTask={(path) => {
              setInitialRepo(path);
              setView({ name: "new" });
            }}
          />
        )}

        {view.name === "agents" && <AgentsPage providers={providers} />}

        {view.name === "cloud" && <CloudPage />}

        {view.name === "session" && (
          <TaskDetail
            session={sessions.find((s) => s.id === view.id)}
            events={events[view.id] || []}
            onCommand={(cmd) => handleSessionCommand(view.id, cmd)}
            onBack={() => setView({ name: "list" })}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        isExpiredPrompt={isTokenExpired}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          if (!isTokenExpired) setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
