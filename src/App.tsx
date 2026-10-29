import { useState, useEffect, useRef, useCallback } from "react";
import type { Session, AgentKind, CommandKind, AuthResult } from "@codehands/contracts";
import { cloudApi } from "./api/cloud";
import { getDeviceToken, deleteDeviceToken } from "./services/keychain";
import { Topbar } from "./components/Topbar";
import { AuthModal } from "./components/AuthModal";
import { SessionList } from "./components/SessionList";
import { NewTaskForm } from "./components/NewTaskForm";
import { SessionView, type SessionEvent } from "./components/SessionView";
import "./App.css";

const DAEMON_WS_URL = "ws://localhost:8787";

type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "session"; id: string };

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Record<string, SessionEvent[]>>({});
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });

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
          // Re-hydrate stored device authentication
          setAuth({
            userId: "user-1",
            device: { id: "device-1", name: "laptop-A", createdAt: new Date().toISOString() },
            deviceToken: storedToken,
          });
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
      const ws = new WebSocket(DAEMON_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === "state") {
            setSessions(msg.sessions || []);
            setEvents(msg.events || {});
          }

          if (msg.type === "session") {
            const s: Session = msg.session;
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
    setAuth(null);
  };

  const sortedSessions = [...sessions].sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  return (
    <div className="app-layout">
      <Topbar
        connected={connected}
        auth={auth}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="content-container">
        {view.name === "list" && (
          <SessionList
            sessions={sortedSessions}
            onOpen={(id) => setView({ name: "session", id })}
            onNew={() => setView({ name: "new" })}
          />
        )}

        {view.name === "new" && (
          <NewTaskForm
            connected={connected}
            onStart={handleStartTask}
            onCancel={() => setView({ name: "list" })}
          />
        )}

        {view.name === "session" && (
          <SessionView
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
