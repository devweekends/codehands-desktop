import { useEffect, useState } from "react";
import type { AgentKind } from "@codehands/contracts";
import { FolderIcon, ArrowRightIcon, AlertTriangleIcon } from "./Icons";

/** What "Try again" carries over from a failed task. */
export interface TaskDraft {
  repo: string;
  prompt: string;
  agent: string;
  model: string;
}

interface NewTaskFormProps {
  connected: boolean;
  initialRepo?: string;
  draft?: TaskDraft | null;
  /** Called once the form has taken the draft, so the next new task starts empty. */
  onDraftUsed?: () => void;
  onStart: (taskData: {
    repo: string;
    prompt: string;
    agent: AgentKind;
    model: string;
    phaseModels?: {
      analyze: string;
      plan: string;
      implement: string;
      test: string;
      review: string;
    };
  }) => boolean;
  onCancel: () => void;
}

const AVAILABLE_MODELS: Record<string, string[]> = {
  "claude-code": ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
  codex: ["gpt-4o", "gpt-4o-mini", "o1-preview"],
  codehands: ["claude-3-5-sonnet", "qwen-2.5-coder", "gpt-4o-mini"],
};

const DEFAULT_PHASE_MODELS = {
  analyze: "claude-3-5-sonnet",
  plan: "claude-3-5-sonnet",
  implement: "qwen-2.5-coder",
  test: "gpt-4o-mini",
  review: "claude-3-5-sonnet",
};

export function NewTaskForm({ connected, initialRepo, draft, onDraftUsed, onStart, onCancel }: NewTaskFormProps) {
  // The daemon only runs Claude Code and Codex. Retrying with any other agent would just fail again.
  const [retry] = useState(() => {
    if (!draft) return null;
    const retryAgent: AgentKind = draft.agent === "codex" ? "codex" : "claude-code";
    const models = AVAILABLE_MODELS[retryAgent];
    return {
      repo: draft.repo,
      prompt: draft.prompt,
      agent: retryAgent,
      model: retryAgent === draft.agent && models.includes(draft.model) ? draft.model : models[0],
      switchedFrom: retryAgent === draft.agent ? null : draft.agent,
    };
  });
  useEffect(() => {
    if (draft) onDraftUsed?.();
    // runs once: the draft is already copied into the form
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [repo, setRepo] = useState(retry?.repo || initialRepo || "D:\\dev\\sample-repo");
  const [prompt, setPrompt] = useState(retry?.prompt ?? "");
  const [agent, setAgent] = useState<AgentKind>(retry?.agent ?? "codehands");
  const [model, setModel] = useState(retry?.model ?? "claude-3-5-sonnet");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [phaseModels, setPhaseModels] = useState(DEFAULT_PHASE_MODELS);
  const [error, setError] = useState<string | null>(null);

  const handleAgentChange = (newAgent: AgentKind) => {
    setAgent(newAgent);
    const available = AVAILABLE_MODELS[newAgent] || [];
    if (available.length > 0) setModel(available[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repo.trim()) {
      setError("Please specify a target local repository path.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe the coding task to perform.");
      return;
    }
    if (!connected) {
      setError("Cannot dispatch task: local daemon is not connected. Ensure daemon is running on 127.0.0.1:8788.");
      return;
    }

    const success = onStart({
      repo: repo.trim(),
      prompt: prompt.trim(),
      agent,
      model,
      phaseModels: showAdvanced ? phaseModels : undefined,
    });

    if (!success) {
      setError("Failed to dispatch task to local daemon. Please verify the connection.");
    }
  };

  return (
    <div className="new-task-page-wrapper">
      <div className="new-task-container">
        {/* Top Header */}
        <div className="new-task-header">
          <button type="button" className="btn-back-link" onClick={onCancel}>
            ← Back to Home
          </button>
          <div className="header-title-block">
            <h1>What should we build or fix?</h1>
            <p className="sub">Describe it like you would to a teammate. You approve the change before it is committed.</p>
          </div>
        </div>

        {retry && (
          <div className="retry-note">
            Filled in from your failed task. Check it, then click Start task. This creates a new task; the failed one stays in your history.
            {retry.switchedFrom && ` The agent was changed to Claude Code, because the daemon cannot run "${retry.switchedFrom}".`}
          </div>
        )}

        {/* Notice alert */}
        {!connected && (
          <div className="new-task-alert offline">
            <AlertTriangleIcon size={16} color="#FF647C" />
            <div>
              <strong>Local Daemon Offline:</strong> Tasks require the local daemon running on <code>127.0.0.1:8788</code>. Start the local daemon or run bridge script.
            </div>
          </div>
        )}

        {error && (
          <div className="new-task-alert error">
            <AlertTriangleIcon size={16} color="#FF647C" />
            <div>{error}</div>
          </div>
        )}

        {/* Main Form */}
        <form className="new-task-form" onSubmit={handleSubmit}>
          <div className="composer-card">
            <textarea
              id="task-prompt"
              aria-label="Task description"
              className="prompt-textarea"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") e.currentTarget.form?.requestSubmit();
              }}
              placeholder="For example: add input validation to the signup form and a test for an empty email"
              required
              autoFocus
            />

            <div className="composer-chips">
              <div className="chip repo-input-wrap" title="Local git folder">
                <FolderIcon size={13} />
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="D:\dev\my-app"
                  aria-label="Local git folder"
                  required
                />
              </div>
              <div className="chip config-card" title="Agent">
                <select value={agent} onChange={(e) => handleAgentChange(e.target.value as AgentKind)} aria-label="Agent">
                  <option value="codehands">CodeHands Native Orchestrator (Multi-Phase)</option>
                  <option value="claude-code">Claude Code CLI</option>
                  <option value="codex">Codex CLI</option>
                </select>
              </div>
              <div className="chip config-card" title="Model">
                <select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
                  {(AVAILABLE_MODELS[agent] || []).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <button type="button" className={`chip accordion-toggle-btn ${showAdvanced ? "on" : ""}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                Models per step: {showAdvanced ? "on" : "off"}
              </button>
              <span className="grow" />
              <button type="submit" className="btn primary btn-submit-task" disabled={!prompt.trim() || !repo.trim()}>
                <span>Start task</span>
                <ArrowRightIcon size={14} color="#ffffff" />
                <kbd>Ctrl ↵</kbd>
              </button>
            </div>
          </div>

          {agent !== "claude-code" && (
            <p className="config-note warn">
              The current daemon only runs Claude Code and Codex{agent === "codehands" ? ", so this agent will fail. Pick Claude Code." : "."}
            </p>
          )}

          {showAdvanced && (
            <div className="card mt12 phase-routing-grid">
              <div className="phase-head">Model for each step</div>
              {(
                [
                  ["analyze", "Understand", "Reads the code"],
                  ["plan", "Plan", "Decides what to change"],
                  ["implement", "Build", "Writes the change"],
                  ["test", "Test", "Runs your tests"],
                  ["review", "Review", "A second look before you"],
                ] as const
              ).map(([phase, label, why]) => (
                <div key={phase} className="phase-config-item">
                  <span className="phase-item-label">{label}</span>
                  <span className="mut sm grow">{why}</span>
                  <select value={phaseModels[phase]} onChange={(e) => setPhaseModels({ ...phaseModels, [phase]: e.target.value })} aria-label={`${label} model`}>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="qwen-2.5-coder">Qwen 2.5 Coder</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="composer-actions-bar">
            <span className="mut sm grow">Nothing is committed until you approve the change.</span>
            <button type="button" className="btn ghost btn-cancel" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
