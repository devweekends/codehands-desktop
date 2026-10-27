// Temporary local daemon for the desktop app (COD-166/167/169).
//
// It speaks the SAME command and event names as codehands-server's daemon
// (start / approve / reject / stop, and task.started, step.plan, step.implement,
// approval.requested, step.test, task.finished, task.rejected, task.stopped),
// but over a plain local WebSocket so the app works without Postgres.
//
// Replace it with the real daemon + server once the server can list sessions,
// stream events to the UI, and send a diff inside approval.requested.

import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";

const PORT = 8787;
const STEP_MS = 1200; // time between steps, slow enough to watch

const sessions = new Map(); // sessionId -> session
const events = new Map(); // sessionId -> event[]
const tasks = new Map(); // sessionId -> { timers: Timeout[] }

const SAMPLE_DIFF = {
  summary: "Add page and limit query params to the users endpoint, with a test.",
  files: [
    {
      path: "src/controllers/users.ts",
      status: "modified",
      patch: [
        "@@ -12,6 +12,9 @@ export async function listUsers(req, res) {",
        "-  const users = await db.users.findAll();",
        "+  const page = Number(req.query.page ?? 1);",
        "+  const limit = Number(req.query.limit ?? 20);",
        "+  const users = await db.users.findAll({ offset: (page - 1) * limit, limit });",
        "   res.json(users);",
        " }",
      ].join("\n"),
    },
    {
      path: "tests/users.test.ts",
      status: "added",
      patch: [
        "@@ -0,0 +1,6 @@",
        '+import { listUsers } from "../src/controllers/users";',
        "+",
        '+test("returns the first page", async () => {',
        '+  const res = await listUsers({ query: { page: "1" } });',
        "+  expect(res.length).toBeLessThanOrEqual(20);",
        "+});",
      ].join("\n"),
    },
  ],
};

const STATUS_FOR_EVENT = {
  "task.started": "running",
  "step.plan": "running",
  "step.implement": "running",
  "step.test": "running",
  "approval.requested": "awaiting_approval",
  "task.finished": "finished",
  "task.rejected": "rejected",
  "task.stopped": "stopped",
};

const wss = new WebSocketServer({ port: PORT });

function broadcast(msg) {
  const text = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(text);
  }
}

function emit(sessionId, eventType, payload = {}) {
  const list = events.get(sessionId);
  const session = sessions.get(sessionId);
  if (!list || !session) return;
  const event = {
    id: list.length + 1,
    sessionId,
    eventType,
    payload,
    ts: new Date().toISOString(),
  };
  list.push(event);
  const status = STATUS_FOR_EVENT[eventType];
  if (status) session.status = status;
  broadcast({ type: "event", event });
  broadcast({ type: "session", session });
}

function schedule(sessionId, ms, fn) {
  const task = tasks.get(sessionId);
  if (task) task.timers.push(setTimeout(fn, ms));
}

function startTask(sessionId) {
  tasks.set(sessionId, { timers: [] });
  emit(sessionId, "task.started");
  schedule(sessionId, STEP_MS, () => emit(sessionId, "step.plan"));
  schedule(sessionId, STEP_MS * 2, () => emit(sessionId, "step.implement"));
  schedule(sessionId, STEP_MS * 3, () =>
    emit(sessionId, "approval.requested", SAMPLE_DIFF)
  );
}

function approve(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.status !== "awaiting_approval") return;
  schedule(sessionId, STEP_MS, () => emit(sessionId, "step.test"));
  schedule(sessionId, STEP_MS * 2, () => {
    emit(sessionId, "task.finished");
    tasks.delete(sessionId);
  });
  // Mark as running right away so the Approve button cannot be pressed twice
  session.status = "running";
  broadcast({ type: "session", session });
}

function endTask(sessionId, eventType) {
  const session = sessions.get(sessionId);
  if (!session) return;
  const task = tasks.get(sessionId);
  if (task) task.timers.forEach(clearTimeout);
  tasks.delete(sessionId);
  emit(sessionId, eventType);
}

// ---- Seed data so the list is not empty on first launch -------------------

function seed(title, repo, agent, model, minutesAgo, eventTypes, status, extra = {}) {
  const id = randomUUID();
  const createdAt = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  sessions.set(id, { id, title, repo, agent, model, status, createdAt });
  events.set(
    id,
    eventTypes.map((eventType, i) => ({
      id: i + 1,
      sessionId: id,
      eventType,
      payload: eventType === "approval.requested" ? SAMPLE_DIFF : {},
      ts: new Date(Date.parse(createdAt) + i * 4000).toISOString(),
    }))
  );
  if (extra.waiting) tasks.set(id, { timers: [] });
}

seed(
  "Add pagination to /api/users",
  "acme/api",
  "Claude Code",
  "sonnet",
  12,
  ["task.started", "step.plan", "step.implement", "approval.requested"],
  "awaiting_approval",
  { waiting: true }
);
seed(
  "Fix login bug",
  "acme/web",
  "Claude Code",
  "haiku",
  95,
  ["task.started", "step.plan", "step.implement", "approval.requested", "step.test", "task.finished"],
  "finished"
);
seed(
  "Update dependencies",
  "acme/api",
  "Codex",
  "gpt-5.5",
  240,
  ["task.started", "step.plan", "step.implement", "approval.requested", "task.rejected"],
  "rejected"
);

// ---- Connections ----------------------------------------------------------

wss.on("connection", (ws) => {
  ws.send(
    JSON.stringify({
      type: "state",
      sessions: [...sessions.values()],
      events: Object.fromEntries(events),
    })
  );

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type !== "command") return;

    switch (msg.commandType) {
      case "start": {
        const p = msg.payload ?? {};
        if (!p.repo || !p.task) return;
        const id = randomUUID();
        const session = {
          id,
          title: String(p.task).slice(0, 80),
          repo: String(p.repo),
          agent: String(p.agent ?? "Claude Code"),
          model: String(p.model ?? ""),
          status: "running",
          createdAt: new Date().toISOString(),
        };
        sessions.set(id, session);
        events.set(id, []);
        // requestId lets the UI that sent the command open the new session
        broadcast({ type: "session", session, requestId: msg.requestId });
        startTask(id);
        break;
      }
      case "approve":
        approve(msg.sessionId);
        break;
      case "reject":
        endTask(msg.sessionId, "task.rejected");
        break;
      case "stop":
        endTask(msg.sessionId, "task.stopped");
        break;
      default:
        console.log("unknown command:", msg.commandType);
    }
  });
});

console.log(`Fake daemon ready on ws://localhost:${PORT}`);
