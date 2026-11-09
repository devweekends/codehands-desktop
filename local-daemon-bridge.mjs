import { createHash, randomUUID } from "node:crypto";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { WebSocketServer } from "ws";

const APP_ROOT = dirname(fileURLToPath(import.meta.url));
const DAEMON_ROOT = process.env.CODEHANDS_DAEMON_DIR
  ? resolve(process.env.CODEHANDS_DAEMON_DIR)
  : resolve(APP_ROOT, "..", "codehands-backend", "daemon");
const DB_PATH = process.env.CODEHANDS_DB || join(homedir(), ".codehands", "state.db");
const PORT = Number(process.env.CODEHANDS_LOCAL_PORT || 8788);
const CLAUDE_PATH = process.env.CODEHANDS_CLAUDE_PATH || "claude";
const RUNNER_MODE = process.env.CODEHANDS_RUNNER || "fake";
const USE_FAKE_RUNNER = RUNNER_MODE !== "real";
const VALID_AGENTS = new Set(["claude-code", "codex", "codehands"]);
const VALID_COMMANDS = new Set(["approve", "reject", "stop", "resume", "delete"]);

if (!existsSync(join(DAEMON_ROOT, "migrations"))) {
  throw new Error(`Could not find daemon migrations at ${DAEMON_ROOT}. Set CODEHANDS_DAEMON_DIR to the daemon clone.`);
}

mkdirSync(dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");

// Apply the daemon repository's own migration files, keeping it the schema source of truth.
db.exec(`create table if not exists schema_migrations (
  version integer primary key,
  applied_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
)`);
const applied = new Set(db.prepare("select version from schema_migrations").all().map((row) => row.version));
const migrationDir = join(DAEMON_ROOT, "migrations");
for (const filename of readdirSync(migrationDir).filter((name) => /^\d+_.*\.sql$/.test(name)).sort()) {
  const version = Number.parseInt(filename, 10);
  if (applied.has(version)) continue;
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(readFileSync(join(migrationDir, filename), "utf8"));
    db.prepare("insert into schema_migrations (version) values (?)").run(version);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  console.log(`[desktop bridge] applied daemon migration ${filename}`);
}

const watcher = startWatcher();
let watcherState = watcher ? "starting" : "unavailable";
watcher?.on("spawn", () => {
  watcherState = "running";
  broadcastState();
});
watcher?.on("error", (error) => {
  watcherState = "unavailable";
  console.error("[desktop bridge] daemon watcher could not start:", error.message);
  broadcastState();
});
watcher?.on("exit", (code) => {
  watcherState = code === 0 ? "stopped" : "unavailable";
  console.warn(`[desktop bridge] daemon watcher exited with code ${code}`);
  broadcastState();
});

const wss = new WebSocketServer({ host: "127.0.0.1", port: PORT });
const pendingRequests = new Map();
let lastState = null;
wss.on("error", (error) => {
  console.error(`[desktop bridge] could not listen on 127.0.0.1:${PORT}:`, error.message);
  watcher?.kill();
  db.close();
  process.exit(1);
});

function startWatcher() {
  if (process.env.CODEHANDS_START_DAEMON === "false") return null;
  if (!existsSync(join(DAEMON_ROOT, "node_modules"))) {
    console.warn("[desktop bridge] daemon dependencies are not installed; app can queue tasks but watcher will be offline.");
    return null;
  }
  const tsxCli = join(DAEMON_ROOT, "node_modules", "tsx", "dist", "cli.mjs");
  return spawn(process.execPath, [tsxCli, "src/watcher.ts"], {
    cwd: DAEMON_ROOT,
    env: { ...process.env, CODEHANDS_FAKE: USE_FAKE_RUNNER ? "true" : "false" },
    windowsHide: true,
    stdio: "ignore",
  });
}

function readState() {
  const projects = db.prepare(`
    select p.id, p.name, p.repo_id as repoId, p.path,
           p.created_at as createdAt,
           (select count(*) from sessions s where s.project_id = p.id) as sessionCount
    from projects p order by p.name collate nocase
  `).all();
  const providers = db.prepare(`
    select agent, state, reason, retry_at as retryAt, checked_at as checkedAt
    from provider_status order by agent
  `).all();
  const sessions = db.prepare(`
    select s.id, s.task_id as taskId, s.project_id as projectId, s.status,
           s.agent, s.model, s.cost_usd as costUsd, s.branch,
           s.base_commit as baseCommit, s.diff, s.created_at as createdAt,
           t.prompt, p.name as projectName, p.path as repo
    from sessions s
    join tasks t on t.id = s.task_id
    join projects p on p.id = s.project_id
    order by s.created_at desc
  `).all().map((row) => ({
    ...row,
    title: row.prompt.length > 84 ? `${row.prompt.slice(0, 81)}…` : row.prompt,
    model: row.model || "unspecified",
    costUsd: Number(row.costUsd || 0),
  }));
  const events = {};
  const rows = db.prepare(`
    select e.session_id as sessionId, e.seq as id, e.type as eventType,
           e.payload, e.created_at as ts
    from events e order by e.session_id, e.seq
  `).all();
  for (const row of rows) {
    const list = events[row.sessionId] || (events[row.sessionId] = []);
    let payload = {};
    try { payload = JSON.parse(row.payload || "{}"); } catch { /* malformed event payload */ }
    list.push({ ...row, payload });
  }
  return {
    type: "state",
    projects,
    providers,
    sessions,
    events,
    daemon: {
      watcher: watcherState,
      execution: "runner-integrated",
      runner: getRunnerStatus(),
    },
  };
}

function getRunnerStatus() {
  if (USE_FAKE_RUNNER) {
    return {
      available: true,
      mode: "fake",
      command: "built-in fake runner",
      version: "demo",
      reason: "Using the built-in demo runner. No Claude subscription is required.",
    };
  }
  try {
    const version = execFileSync(CLAUDE_PATH, ["--version"], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const auth = spawnSync(CLAUDE_PATH, ["auth", "status"], {
      encoding: "utf8",
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let authStatus = null;
    try { authStatus = JSON.parse(auth.stdout || "{}"); } catch { /* older CLI may not support JSON auth status */ }
    if (authStatus && authStatus.loggedIn === false) {
      return {
        available: false,
        command: CLAUDE_PATH,
        version,
        reason: "Claude Code is installed but not signed in. Run `claude`, choose /login, then restart Code Hands.",
      };
    }
    return { available: true, mode: "real", command: CLAUDE_PATH, version };
  } catch (error) {
    return {
      available: false,
      mode: "real",
      command: CLAUDE_PATH,
      reason: error?.code === "ENOENT"
        ? "Claude Code is not installed or is not on the daemon PATH."
        : "Claude Code could not be started. Check its installation and login.",
    };
  }
}

const syncedSessions = new Set();
async function syncSessionToCloud(session) {
  if (!session || syncedSessions.has(session.id + ':' + session.status)) return;
  syncedSessions.add(session.id + ':' + session.status);
  try {
    await fetch("http://localhost:3000/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: session.id, status: session.status }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Ignore when cloud backend is offline
  }
}

function broadcastState() {
  try {
    lastState = readState();
    for (const s of (lastState.sessions || [])) { syncSessionToCloud(s); }
    const message = JSON.stringify(lastState);
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(message);
    }
    for (const [taskId, requestId] of pendingRequests) {
      const session = lastState.sessions.find((item) => item.taskId === taskId);
      if (session) {
        const message = JSON.stringify({ type: "session", session, requestId });
        for (const client of wss.clients) if (client.readyState === 1) client.send(message);
        pendingRequests.delete(taskId);
      }
    }
  } catch (error) {
    console.error("[desktop bridge] database read failed:", error.message);
  }
}

function getRepoIdentity(repoPath) {
  let origin = "";
  try {
    origin = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: repoPath,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch { /* use local path for repos without a remote */ }
  return createHash("sha256").update(origin || repoPath).digest("hex").slice(0, 16);
}

function createTask(payload) {
  const repo = String(payload.repo || "").trim();
  const prompt = String(payload.task || "").trim();
  const agent = String(payload.agent || "");
  if (!repo || !prompt) throw new Error("Choose a repository and describe the task.");
  if (!VALID_AGENTS.has(agent)) throw new Error("Choose a supported agent.");
  if (!existsSync(repo)) throw new Error("The selected repository path does not exist.");

  const repoPath = resolve(repo);
  const repoId = getRepoIdentity(repoPath);
  let project = db.prepare("select id from projects where repo_id = ?").get(repoId);
  if (!project) {
    project = { id: randomUUID() };
    db.prepare("insert into projects (id, name, repo_id, path) values (?, ?, ?, ?)")
      .run(project.id, basename(repoPath), repoId, repoPath);
  } else {
    db.prepare("update projects set path = ? where id = ?").run(repoPath, project.id);
  }

  const id = randomUUID();
  const models = payload.phaseModels && typeof payload.phaseModels === "object"
    ? payload.phaseModels
    : { implement: String(payload.model || "unspecified") };
  db.prepare("insert into tasks (id, project_id, prompt, agent, models, created_by) values (?, ?, ?, ?, ?, ?)")
    .run(id, project.id, prompt, agent, JSON.stringify(models), "desktop");
  return { taskId: id };
}


function deleteSession(sessionId) {
  const session = db.prepare("select id, task_id as taskId from sessions where id = ?").get(sessionId);
  if (!session) return { success: false, message: "Session not found." };
  try {
    db.prepare("delete from events where session_id = ?").run(sessionId);
    db.prepare("delete from command_receipts where command_id in (select id from commands where session_id = ?)").run(sessionId);
    db.prepare("delete from commands where session_id = ?").run(sessionId);
    db.prepare("delete from sessions where id = ?").run(sessionId);
    if (session.taskId) {
      const other = db.prepare("select count(*) as cnt from sessions where task_id = ?").get(session.taskId);
      if (!other || other.cnt === 0) {
        db.prepare("delete from tasks where id = ?").run(session.taskId);
      }
    }
    return { success: true };
  } catch (err) {
    console.error("[desktop bridge] deleteSession error:", err.message);
    return { success: false, message: err.message };
  }
}

function createCommand(sessionId, commandKind) {
  if (!VALID_COMMANDS.has(commandKind)) {
    throw new Error("This daemon build only supports approve/reject commands. Stop and resume require runner integration.");
  }
  const session = db.prepare("select id, project_id as projectId, status from sessions where id = ?").get(sessionId);
  if (!session) throw new Error("Session not found.");
  const targetStatus = {
    approve: "approved",
    reject: "rejected",
    stop: "stopped",
    resume: "running",
  }[commandKind];
  const expectedStatus = {
    approve: "awaiting_approval",
    reject: "awaiting_approval",
    stop: "running",
    resume: "stopped",
  }[commandKind];
  const allowed = commandKind === "stop"
    ? (session.status === "running" || session.status === "queued")
    : session.status === expectedStatus;
  if (!allowed) throw new Error(`Cannot ${commandKind} a session while it is ${session.status}.`);
  if (commandKind === "stop" && session.status === "queued") {
    db.prepare("update sessions set status = 'stopped', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') where id = ?").run(session.id);
  }
  db.prepare("insert into commands (id, session_id, project_id, kind, created_by) values (?, ?, ?, ?, ?)")
    .run(randomUUID(), session.id, session.projectId, commandKind, "desktop");
  return { accepted: true, targetStatus };
}

wss.on("connection", (socket) => {
  try {
    socket.send(JSON.stringify(lastState || readState()));
  } catch (error) {
    socket.send(JSON.stringify({ type: "error", message: error.message }));
  }
  socket.on("message", (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch { return; }
    if (message.type !== "command") return;
    try {
      if (message.commandType === "start") {
        const { taskId } = createTask(message.payload || {});
        if (message.requestId) pendingRequests.set(taskId, message.requestId);
        socket.send(JSON.stringify({ type: "accepted", requestId: message.requestId, taskId }));
        broadcastState();
      } else if (message.commandType === "delete") {
        deleteSession(message.sessionId);
        socket.send(JSON.stringify({ type: "session.deleted", sessionId: message.sessionId }));
        broadcastState();
      } else {
        createCommand(message.sessionId, message.commandType);
        socket.send(JSON.stringify({ type: "command.accepted", sessionId: message.sessionId, commandType: message.commandType }));
        broadcastState();
      }
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", requestId: message.requestId, message: error.message }));
    }
  });
});

broadcastState();
const poll = setInterval(broadcastState, 900);
console.log(`[desktop bridge] ws://127.0.0.1:${PORT} -> ${DB_PATH}`);

function shutdown() {
  clearInterval(poll);
  watcher?.kill();
  wss.close();
  db.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
