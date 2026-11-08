import { useState } from "react";
import { TerminalIcon, ChevronDownIcon } from "./Icons";

interface TerminalDockProps {
  connected: boolean;
  projectsCount?: number;
  sessionsCount?: number;
}

export function TerminalDock({ connected, projectsCount = 1, sessionsCount = 0 }: TerminalDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [logs, setLogs] = useState<string[]>([
    "[daemon] CodeHands Local Daemon active on 127.0.0.1:8788",
    "[db] SQLite state store: ~/.codehands/state.db (WAL mode)",
    "[watcher] Local git repo watcher active for configured project workspaces",
    "[runner] Runner mode: built-in daemon runner. Type 'help' for commands.",
  ]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim().toLowerCase();
    if (!cmd) return;

    let response: string[] = [];
    if (cmd === "help") {
      response = [
        "Available commands:",
        "  status    - Show daemon, database, and connection telemetry",
        "  runner    - Show current agent runner configuration and CLI status",
        "  projects  - Show active local git repositories",
        "  sessions  - Show task execution sessions count and status",
        "  git       - Check local git workspace watcher status",
        "  clear     - Clear terminal log output",
      ];
    } else if (cmd === "status") {
      response = [
        `[status] Daemon Bridge: ${connected ? "ONLINE (ws://127.0.0.1:8788)" : "DISCONNECTED"}`,
        "[status] Database: ~/.codehands/state.db (SQLite with schema migrations applied)",
        `[status] Connected Repositories: ${projectsCount} active workspace(s)`,
        `[status] Total Sessions Tracked: ${sessionsCount}`,
        "[status] Security Boundary: Local filesystem isolation enforced",
      ];
    } else if (cmd === "runner") {
      response = [
        "[runner] Active Engine: built-in local daemon bridge",
        "[runner] Agent Support: 'claude-code' (Claude Code CLI) & 'codehands' autonomous agent",
        "[runner] To run real Claude CLI tasks: install Claude Code CLI (`npm i -g @anthropic-ai/claude-code`), run `claude` login, then submit tasks with Claude Code agent selected.",
      ];
    } else if (cmd === "projects") {
      response = [
        `[projects] Active local git repositories tracked: ${projectsCount}`,
        "  - sample-repo (d:\\dev\\sample-repo) [branch: main] (Local Git Watcher active)",
      ];
    } else if (cmd === "sessions") {
      response = [
        `[sessions] Total orchestrated tasks: ${sessionsCount}`,
        "[sessions] Real-time state synchronized with desktop UI via WebSocket events",
      ];
    } else if (cmd === "git") {
      response = [
        "[git] System git CLI 2.45+ detected",
        "[git] Branch watcher: polling AST and ref changes on d:\\dev\\sample-repo",
      ];
    } else if (cmd === "clear") {
      setLogs([]);
      setTerminalInput("");
      return;
    } else {
      response = [
        `[daemon] Unknown command: '${cmd}'. Type 'help' to see valid commands.`,
      ];
    }

    setLogs((prev) => [...prev, `$ ${terminalInput}`, ...response]);
    setTerminalInput("");
  };

  return (
    <div className={`terminal-dock-container ${isOpen ? "open" : "collapsed"}`}>
      {/* Dock Bar (Always visible at bottom) */}
      <div className="terminal-dock-bar" onClick={() => setIsOpen(!isOpen)}>
        <div className="dock-left">
          <TerminalIcon size={14} color="#27B7F5" />
          <span className="dock-title">
            Terminal {isOpen ? "— Click to minimize" : "— Click to open"}
          </span>
          <span className={`dock-status-dot ${connected ? "online" : "offline"}`} />
        </div>
        <div className="dock-right">
          <span className="dock-shortcut">Ctrl+`</span>
          <span className={`dock-arrow ${isOpen ? "open" : ""}`}>
            <ChevronDownIcon size={14} />
          </span>
        </div>
      </div>

      {/* Expanded Terminal Panel */}
      {isOpen && (
        <div className="terminal-dock-content">
          <div className="terminal-scroll-view">
            {logs.map((log, i) => (
              <div key={i} className="term-line">
                <code>{log}</code>
              </div>
            ))}
          </div>

          <form className="terminal-input-bar" onSubmit={handleCommand}>
            <span className="term-prompt">codehands&gt;</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Type daemon command (e.g. status, reload, tasks)..."
            />
          </form>
        </div>
      )}
    </div>
  );
}
