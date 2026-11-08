import { useState, useEffect, useRef, useCallback } from "react";
import type { AgentKind, CommandKind, AuthResult } from "@codehands/contracts";
import { cloudApi } from "./api/cloud";
import { getDeviceToken, deleteDeviceToken } from "./services/keychain";

// Reusable UI Components
import { AppSidebar, type NavView } from "./components/AppSidebar";
import { Topbar } from "./components/Topbar";
import { CommandPalette } from "./components/CommandPalette";
import { TerminalDock } from "./components/TerminalDock";
import { SplashScreen } from "./components/SplashScreen";
import { AuthModal } from "./components/AuthModal";

// Views
import { DashboardView } from "./components/DashboardView";
import { ProjectsView } from "./components/ProjectsView";
import { ModernWorkspace } from "./components/ModernWorkspace";
import { WorkflowBuilderView } from "./components/WorkflowBuilderView";
import { ReviewQueueView } from "./components/ReviewQueueView";
import { ModelHubView } from "./components/ModelHubView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsView } from "./components/SettingsView";
import { NewTaskForm } from "./components/NewTaskForm";
import {
  RepositoryMemoryPage,
  SchedulerQueuePage,
  EnvironmentsPage,
  RuntimeLogsPage,
  IntegrationsPage,
  SecurityPage,
  type DesktopProject,
  type ProviderStatus,
} from "./components/WorkspacePages";
import type { DesktopSession, SessionEvent } from "./components/TaskDetail";

import "./App.css";

const DAEMON_WS_URL = "ws://127.0.0.1:8788";

function isValidUuid(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

function resolveUserDisplayName(auth: AuthResult | null): string {
  if (!auth) return "Developer (Local)";
  if (auth.name && auth.name.trim() && !isValidUuid(auth.name)) {
    return auth.name.trim();
  }
  if (auth.email && auth.email.includes("@")) {
    const local = auth.email.split("@")[0];
    return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
  try {
    const raw = localStorage.getItem("codehands_user_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.name && parsed.name.trim() && !isValidUuid(parsed.name)) {
        return parsed.name.trim();
      }
      if (parsed.email && parsed.email.includes("@")) {
        const local = parsed.email.split("@")[0];
        return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }
  } catch {
    // Ignore error
  }

  if (auth.userId && !isValidUuid(auth.userId)) {
    return auth.userId;
  }

  return "Alex Developer";
}

function resolveUserEmail(auth: AuthResult | null): string | undefined {
  if (!auth) return undefined;
  if (auth.email && auth.email.includes("@")) return auth.email;
  try {
    const raw = localStorage.getItem("codehands_user_profile");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email && parsed.email.includes("@")) return parsed.email;
    }
  } catch {
    // Ignore error
  }
  return "developer@codehands.local";
}

export default function App() {
  const [sessions, setSessions] = useState<DesktopSession[]>([]);
  const [projects, setProjects] = useState<DesktopProject[]>([]);
  const [, setProviders] = useState<ProviderStatus[]>([]);
  const [events, setEvents] = useState<Record<string, SessionEvent[]>>({});
  const [connected, setConnected] = useState(false);
  const [daemonState, setDaemonState] = useState<"starting" | "running" | "unavailable">("starting");
  const [notice, setNotice] = useState<string | null>(null);
  const [initialRepo, setInitialRepo] = useState("");

  // Navigation & Shell state
  const [currentView, setCurrentView] = useState<NavView>("overview");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showSplash, setShowSplash] = useState(true);

  // Auth & OS Keychain state (COD-291)
  const [auth, setAuth] = useState<AuthResult | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequest = useRef<string | null>(null);

  // Initial Keychain Check
  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await getDeviceToken();
        if (storedToken) {
          const storedAuthRaw = localStorage.getItem("codehands_auth_meta");
          if (storedAuthRaw) {
            try {
              const meta = JSON.parse(storedAuthRaw) as AuthResult;
              const restored: AuthResult = { ...meta, deviceToken: storedToken };
              setAuth(restored);
              cloudApi.setToken(storedToken);
            } catch {
              setAuth({
                userId: "",
                device: { id: "", name: "this-device", createdAt: new Date().toISOString() },
                deviceToken: storedToken,
              });
              cloudApi.setToken(storedToken);
            }
          } else {
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

    cloudApi.setExpiredHandler(() => {
      setIsTokenExpired(true);
      setIsAuthModalOpen(true);
    });
  }, []);

  // Connect to Local Daemon
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
              setActiveSessionId(s.id);
              setCurrentView("tasks");
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
            setCurrentView("tasks");
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

  // Keyboard shortcut listener for Ctrl+K, Ctrl+N
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setCurrentView("new");
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

  // New Task submission
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

  // Session Action Commands (Approve, Reject, Stop, Resume)
  const handleSessionCommand = (sessionId: string, commandKind: CommandKind) => {
    return sendCommand({
      type: "command",
      commandType: commandKind,
      sessionId,
    });
  };

  const handleAuthSuccess = (result: AuthResult) => {
    setAuth(result);
    cloudApi.setToken(result.deviceToken);
    localStorage.setItem(
      "codehands_auth_meta",
      JSON.stringify({
        userId: result.userId,
        name: result.name,
        email: result.email,
        device: result.device,
        deviceToken: "",
      })
    );
    if (result.name || result.email) {
      try {
        localStorage.setItem(
          "codehands_user_profile",
          JSON.stringify({ name: result.name, email: result.email })
        );
      } catch {
        // Ignore error
      }
    }
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
    localStorage.removeItem("codehands_user_profile");
    cloudApi.setToken(null);
    setAuth(null);
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const userDisplayName = resolveUserDisplayName(auth);
  const userDisplayEmail = resolveUserEmail(auth);
  const isLoggedIn = Boolean(auth?.deviceToken || auth?.userId);

  return (
    <div className={`app-shell theme-${theme}`}>
      {showSplash && <SplashScreen minDurationMs={1200} onFinish={() => setShowSplash(false)} />}

      <AppSidebar
        currentView={currentView}
        onNavigate={(view, extraId) => {
          setCurrentView(view);
          if (extraId) setActiveSessionId(extraId);
        }}
        sessions={sessions}
        projects={projects}
        connected={connected}
        daemonState={daemonState}
        userName={userDisplayName}
        userEmail={userDisplayEmail}
        isLoggedIn={isLoggedIn}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <div className="app-main-layout">
        <Topbar
          currentView={currentView}
          connected={connected}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onNewTask={() => setCurrentView("new")}
          notificationCount={sessions.filter((s) => s.status === "awaiting_approval").length || 3}
        />

        {notice && (
          <div className="notice-banner-row">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)}>×</button>
          </div>
        )}

        <main className="app-content-viewport">
          {currentView === "overview" && (
            <DashboardView
              sessions={sessions}
              projects={projects}
              onOpenSession={(id) => {
                setActiveSessionId(id);
                setCurrentView("tasks");
              }}
              onOpenProject={(projId) => {
                setSelectedProjectId(projId);
                setCurrentView("projects");
              }}
              onNewTask={(repoPath) => {
                if (repoPath) setInitialRepo(repoPath);
                setCurrentView("new");
              }}
              onNewProject={() => {
                setCurrentView("projects");
              }}
            />
          )}

          {currentView === "projects" && (
            <ProjectsView
              projects={projects}
              sessions={sessions}
              selectedProjectId={selectedProjectId}
              onOpenSession={(id) => {
                setActiveSessionId(id);
                setCurrentView("tasks");
              }}
              onNewTask={(repoPath) => {
                if (repoPath) setInitialRepo(repoPath);
                setCurrentView("new");
              }}
            />
          )}

          {currentView === "tasks" && (
            <ModernWorkspace
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => setActiveSessionId(id)}
              onNewTask={() => setCurrentView("new")}
              events={events}
              onCommand={handleSessionCommand}
              connected={connected}
            />
          )}

          {currentView === "workflows" && <WorkflowBuilderView />}

          {currentView === "review" && (
            <ReviewQueueView
              sessions={sessions}
              onCommand={handleSessionCommand}
              onOpenSession={(id) => {
                setActiveSessionId(id);
                setCurrentView("tasks");
              }}
            />
          )}

          {currentView === "models" && <ModelHubView />}

          {currentView === "memory" && <RepositoryMemoryPage />}

          {currentView === "scheduler" && <SchedulerQueuePage />}

          {currentView === "environments" && <EnvironmentsPage />}

          {currentView === "runtime" && <RuntimeLogsPage />}

          {currentView === "analytics" && <AnalyticsView />}

          {currentView === "integrations" && <IntegrationsPage />}

          {currentView === "security" && <SecurityPage />}

          {currentView === "settings" && (
            <SettingsView
              userName={userDisplayName}
              userEmail={userDisplayEmail}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}

          {currentView === "new" && (
            <NewTaskForm
              connected={connected}
              initialRepo={initialRepo}
              onStart={handleStartTask}
              onCancel={() => setCurrentView("overview")}
            />
          )}
        </main>

        <TerminalDock
          connected={connected}
          projectsCount={projects.length}
          sessionsCount={sessions.length}
        />
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => setCurrentView(view as NavView)}
        onNewTask={() => setCurrentView("new")}
        toggleTheme={toggleTheme}
      />

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
