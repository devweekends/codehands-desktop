import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

// ---- Settings you may want to change --------------------------------------

const DAEMON_URL = "ws://localhost:8787";

// Agent -> models it can use. Change these to whatever the runner accepts.
const AGENTS: Record<string, string[]> = {
  "Claude Code": ["sonnet", "haiku", "opus"],
  Codex: ["gpt-5.5", "gpt-5-mini"],
};

// ---- Types ----------------------------------------------------------------

type Session = {
  id: string;
  title: string;
  repo: string;
  agent: string;
  model: string;
  status: string;
  createdAt: string;
};

type DiffFile = { path: string; status: string; patch: string };

type DaemonEvent = {
  id: number;
  sessionId: string;
  eventType: string;
  payload: { summary?: string; files?: DiffFile[] };
  ts: string;
};

type View =
  | { name: "list" }
  | { name: "new" }
  | { name: "session"; id: string };

const EVENT_LABELS: Record<string, string> = {
  "task.started": "Task started",
  "step.plan": "Planning",
  "step.implement": "Implementing",
  "approval.requested": "Waiting for your approval",
  "step.test": "Running tests",
  "task.finished": "Finished",
  "task.rejected": "Rejected",
  "task.stopped": "Stopped",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  awaiting_approval: "Needs approval",
  finished: "Finished",
  rejected: "Rejected",
  stopped: "Stopped",
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ---- App ------------------------------------------------------------------

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [events, setEvents] = useState<Record<string, DaemonEvent[]>>({});
  const [connected, setConnected] = useState(false);
  const [view, setView] = useState<View>({ name: "list" });

  const wsRef = useRef<WebSocket | null>(null);
  const pendingRequest = useRef<string | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;

    const connect = () => {
      const ws = new WebSocket(DAEMON_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "state") {
          setSessions(msg.sessions);
          setEvents(msg.events);
        }

        if (msg.type === "session") {
          const s: Session = msg.session;
          setSessions((prev) => {
            const rest = prev.filter((x) => x.id !== s.id);
            return [s, ...rest];
          });
          // The new task this window just started: open it
          if (msg.requestId && msg.requestId === pendingRequest.current) {
            pendingRequest.current = null;
            setView({ name: "session", id: s.id });
          }
        }

        if (msg.type === "event") {
          const ev: DaemonEvent = msg.event;
          setEvents((prev) => {
            const list = prev[ev.sessionId] ?? [];
            if (list.some((x) => x.id === ev.id)) return prev;
            return { ...prev, [ev.sessionId]: [...list, ev] };
          });
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

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  const startTask = (payload: {
    repo: string;
    task: string;
    agent: string;
    model: string;
  }) => {
    const requestId = uid();
    pendingRequest.current = requestId;
    const ok = send({ type: "command", commandType: "start", requestId, payload });
    if (!ok) pendingRequest.current = null;
    return ok;
  };

  const sorted = [...sessions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <main className="app">
      <header className="topbar">
        <h1>Code Hands</h1>
        <span className={connected ? "pill ok" : "pill bad"}>
          {connected ? "Daemon connected" : "Daemon not connected"}
        </span>
        {view.name !== "list" && (
          <button className="link" onClick={() => setView({ name: "list" })}>
            &larr; All sessions
          </button>
        )}
      </header>

      {view.name === "list" && (
        <SessionList
          sessions={sorted}
          onOpen={(id) => setView({ name: "session", id })}
          onNew={() => setView({ name: "new" })}
        />
      )}

      {view.name === "new" && (
        <NewTask connected={connected} onStart={startTask} />
      )}

      {view.name === "session" && (
        <SessionView
          session={sessions.find((s) => s.id === view.id)}
          events={events[view.id] ?? []}
          onCommand={(commandType) =>
            send({ type: "command", commandType, sessionId: view.id })
          }
        />
      )}
    </main>
  );
}

// ---- Session list ---------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status}`}>{STATUS_LABELS[status] ?? status}</span>
  );
}

function SessionList(props: {
  sessions: Session[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <section>
      <div className="row">
        <h2>Sessions</h2>
        <button className="primary" onClick={props.onNew}>
          + New task
        </button>
      </div>
      {props.sessions.length === 0 && <p className="muted">No sessions yet.</p>}
      {props.sessions.map((s) => (
        <button key={s.id} className="card" onClick={() => props.onOpen(s.id)}>
          <div className="row">
            <strong>{s.title}</strong>
            <StatusBadge status={s.status} />
          </div>
          <div className="muted">
            {s.repo} &middot; {s.agent}
            {s.model ? ` (${s.model})` : ""}
          </div>
        </button>
      ))}
    </section>
  );
}

// ---- New task (COD-167) ---------------------------------------------------

function NewTask(props: {
  connected: boolean;
  onStart: (p: {
    repo: string;
    task: string;
    agent: string;
    model: string;
  }) => boolean;
}) {
  const [repo, setRepo] = useState("");
  const [task, setTask] = useState("");
  const [agent, setAgent] = useState("Claude Code");
  const [model, setModel] = useState(AGENTS["Claude Code"][0]);
  const [error, setError] = useState("");

  const browse = async () => {
    try {
      const picked = await open({ directory: true, multiple: false });
      if (typeof picked === "string") setRepo(picked);
    } catch {
      setError("Could not open the folder picker. Type the path instead.");
    }
  };

  const changeAgent = (name: string) => {
    setAgent(name);
    setModel(AGENTS[name][0]);
  };

  const canStart = props.connected && repo.trim() !== "" && task.trim() !== "";

  const submit = () => {
    setError("");
    const ok = props.onStart({
      repo: repo.trim(),
      task: task.trim(),
      agent,
      model,
    });
    if (!ok) setError("Not connected to the daemon.");
  };

  return (
    <section className="form">
      <h2>New task</h2>

      <label>
        Repository folder
        <div className="row gap">
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="D:\projects\my-repo"
          />
          <button onClick={browse}>Browse...</button>
        </div>
      </label>

      <label>
        Task
        <textarea
          rows={4}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Describe what the agent should do"
        />
      </label>

      <div className="row gap">
        <label className="grow">
          Agent
          <select value={agent} onChange={(e) => changeAgent(e.target.value)}>
            {Object.keys(AGENTS).map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="grow">
          Model
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {AGENTS[agent].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="primary" disabled={!canStart} onClick={submit}>
        Start task
      </button>
    </section>
  );
}

// ---- Session view and approval (COD-169) ----------------------------------

function SessionView(props: {
  session: Session | undefined;
  events: DaemonEvent[];
  onCommand: (commandType: "approve" | "reject" | "stop") => boolean;
}) {
  const { session, events } = props;
  if (!session) return <p className="muted">Session not found.</p>;

  const approval = [...events]
    .reverse()
    .find((e) => e.eventType === "approval.requested");
  const files = approval?.payload.files ?? [];
  const waiting = session.status === "awaiting_approval";

  return (
    <section>
      <div className="row">
        <h2>{session.title}</h2>
        <StatusBadge status={session.status} />
      </div>
      <p className="muted">
        {session.repo} &middot; {session.agent}
        {session.model ? ` (${session.model})` : ""}
      </p>

      <h3>Progress</h3>
      <ol className="timeline">
        {events.map((e) => (
          <li key={e.id}>
            {EVENT_LABELS[e.eventType] ?? e.eventType}
            <span className="muted"> {new Date(e.ts).toLocaleTimeString()}</span>
          </li>
        ))}
        {events.length === 0 && <li className="muted">Waiting for events...</li>}
      </ol>

      {session.status === "running" && (
        <button onClick={() => props.onCommand("stop")}>Stop</button>
      )}

      {approval && (
        <>
          <h3>Changes</h3>
          {approval.payload.summary && <p>{approval.payload.summary}</p>}
          {files.length === 0 && <p className="muted">No file changes sent.</p>}
          {files.map((f) => (
            <DiffBlock key={f.path} file={f} />
          ))}
        </>
      )}

      {waiting && (
        <div className="row gap actions">
          <button className="primary" onClick={() => props.onCommand("approve")}>
            Approve
          </button>
          <button className="danger" onClick={() => props.onCommand("reject")}>
            Reject
          </button>
        </div>
      )}
    </section>
  );
}

function DiffBlock({ file }: { file: DiffFile }) {
  const lines = file.patch.split("\n");
  const added = lines.filter((l) => l.startsWith("+")).length;
  const removed = lines.filter((l) => l.startsWith("-")).length;

  return (
    <details className="diff" open>
      <summary>
        <span className="path">{file.path}</span>
        <span className="muted"> {file.status} </span>
        <span className="add">+{added}</span>{" "}
        <span className="del">-{removed}</span>
      </summary>
      <pre>
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.startsWith("+")
                ? "line add"
                : l.startsWith("-")
                  ? "line del"
                  : l.startsWith("@@")
                    ? "line hunk"
                    : "line"
            }
          >
            {l || " "}
          </div>
        ))}
      </pre>
    </details>
  );
}