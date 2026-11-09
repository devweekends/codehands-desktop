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
  const [history, setHistory] = useState<NavView[]>(["overview"]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showSplash, setShowSplash] = useState(true);

  // Global Ctrl+B shortcut to toggle sidebar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        // Do not intercept if user is typing in input or textarea
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigateTo = useCallback((view: NavView) => {
    setCurrentView(view);
    setHistory((prev) => {
      const next = prev.slice(0, historyIndex + 1);
      return [...next, view];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setCurrentView(history[targetIndex]);
    }
  }, [history, historyIndex]);

  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setCurrentView(history[targetIndex]);
    }
  }, [history, historyIndex]);

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
        } else {
          setIsAuthModalOpen(true);
        }
      } catch (err) {
        console.error("Failed to read token from keychain:", err);
        setIsAuthModalOpen(true);
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
              navigateTo("tasks");
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
            navigateTo("tasks");
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
        navigateTo("new");
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

  // Session Action Commands (Approve, Reject, Stop, Resume, Delete)
  const handleSessionCommand = (sessionId: string, commandKind: CommandKind) => {
    if ((commandKind as string) === "delete") {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return sendCommand({
        type: "command",
        commandType: "delete",
        sessionId,
      });
    }
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
    // Enter the project workspace right after sign in
    navigateTo("projects");
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

  const finishSplash = useCallback(() => {
    setShowSplash(false);
    if (!auth?.deviceToken && !auth?.userId) {
      setIsAuthModalOpen(true);
    }
  }, [auth]);

  const userDisplayName = resolveUserDisplayName(auth);
  const userDisplayEmail = resolveUserEmail(auth);
  const isLoggedIn = Boolean(auth?.deviceToken || auth?.userId);

  return (
    <div className={`app-shell theme-${theme}`}>
      {showSplash && <SplashScreen minDurationMs={1200} onFinish={finishSplash} />}

      <AppSidebar
        currentView={currentView}
        onNavigate={(view, extraId) => {
          navigateTo(view);
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
          onNewTask={() => navigateTo("new")}
          notificationCount={sessions.filter((s) => s.status === "awaiting_approval" || s.status === "failed").length}
          sessions={sessions}
          onSelectSession={(id) => {
            setActiveSessionId(id);
            navigateTo("tasks");
          }}
          onOpenReview={() => navigateTo("review")}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          onNavigateBack={handleBack}
          onNavigateForward={handleForward}
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
                navigateTo("tasks");
              }}
              onOpenProject={(projId) => {
                setSelectedProjectId(projId);
                navigateTo("projects");
              }}
              onNewTask={(repoPath) => {
                if (repoPath) setInitialRepo(repoPath);
                navigateTo("new");
              }}
              onNewProject={() => {
                navigateTo("projects");
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
                navigateTo("tasks");
              }}
              onNewTask={(repoPath) => {
                if (repoPath) setInitialRepo(repoPath);
                navigateTo("new");
              }}
            />
          )}

          {currentView === "tasks" && (
            <ModernWorkspace
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={(id) => setActiveSessionId(id)}
              onNewTask={() => navigateTo("new")}
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
                navigateTo("tasks");
              }}
            />
          )}

          {currentView === "models" && <ModelHubView />}

          {currentView === "memory" && <RepositoryMemoryPage />}

          {currentView === "scheduler" && <SchedulerQueuePage />}

          {currentView === "environments" && <EnvironmentsPage />}

          {currentView === "runtime" && <RuntimeLogsPage />}

          {currentView === "analytics" && (
            <AnalyticsView sessions={sessions} projects={projects} />
          )}

          {currentView === "integrations" && <IntegrationsPage />}

          {currentView === "security" && <SecurityPage />}

          {currentView === "settings" && (
            <SettingsView
              userName={userDisplayName}
              userEmail={userDisplayEmail}
              onLogout={handleLogout}
              theme={theme}
              onToggleTheme={toggleTheme}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onAuthSuccess={handleAuthSuccess}
            />
          )}

          {currentView === "new" && (
            <NewTaskForm
              connected={connected}
              initialRepo={initialRepo}
              onStart={handleStartTask}
              onCancel={() => navigateTo("overview")}
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
        onNavigate={(view) => navigateTo(view as NavView)}
        onNewTask={() => navigateTo("new")}
        toggleTheme={toggleTheme}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        isExpiredPrompt={isTokenExpired}
        isRequired={!isLoggedIn}
        onSuccess={handleAuthSuccess}
        onClose={() => {
          if (!isTokenExpired && isLoggedIn) setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
