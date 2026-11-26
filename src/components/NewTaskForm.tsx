import { useState } from "react";
import type { AgentKind } from "@codehands/contracts";
import { FolderIcon, ArrowRightIcon, AlertTriangleIcon } from "./Icons";

interface NewTaskFormProps {
  connected: boolean;
  initialRepo?: string;
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

export function NewTaskForm({ connected, initialRepo, onStart, onCancel }: NewTaskFormProps) {
  const [repo, setRepo] = useState(initialRepo || "D:\\dev\\sample-repo");
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState<AgentKind>("codehands");
  const [model, setModel] = useState("claude-3-5-sonnet");
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
          {/* Prompt Specification */}
          <div className="composer-card">
            <textarea
              id="task-prompt"
              aria-label="Task description"
              className="prompt-textarea"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="For example: add input validation to the signup form and a test for an empty email"
              required
              autoFocus
            />

            {/* Target Repository Path */}
            <div className="repo-path-row">
              <div className="repo-input-wrap">
                <span className="repo-icon"><FolderIcon size={15} color="#9FA4B4" /></span>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="Target Local Repository Path (e.g. D:\dev\my-app)"
                  required
                />
              </div>
              <span className="mut sm">Local git folder</span>
            </div>
          </div>

          {/* Configuration Grid: Agent & Model */}
          <div className="config-grid-cards">
            <div className="config-card">
              <label>Agent</label>
              <select value={agent} onChange={(e) => handleAgentChange(e.target.value as AgentKind)}>
                <option value="codehands">CodeHands Native Orchestrator (Multi-Phase)</option>
                <option value="claude-code">Claude Code CLI</option>
                <option value="codex">Codex CLI</option>
              </select>
              {agent === "claude-code" ? (
                <span className="config-note">Runs Claude Code in a separate copy of your repo.</span>
              ) : (
                <span className="config-note warn">
                  The current daemon only runs Claude Code and Codex{agent === "codehands" ? ", so this agent will fail. Pick Claude Code." : "."}
                </span>
              )}
            </div>

            <div className="config-card">
              <label>Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)}>
                {(AVAILABLE_MODELS[agent] || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Advanced Model-Per-Phase Toggle */}
          <div className="advanced-routing-accordion">
            <button
              type="button"
              className="accordion-toggle-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <span>{showAdvanced ? "▾" : "▸"} A different model for each step</span>
              <span className="mut sm">{showAdvanced ? "On" : "Optional"}</span>
            </button>

            {showAdvanced && (
              <div className="phase-routing-grid">
                {(["analyze", "plan", "implement", "test", "review"] as const).map((phase) => (
                  <div key={phase} className="phase-config-item">
                    <span className="phase-item-label">{phase.toUpperCase()}</span>
                    <select
                      value={phaseModels[phase]}
                      onChange={(e) => setPhaseModels({ ...phaseModels, [phase]: e.target.value })}
                    >
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
          </div>

          {/* Form Actions */}
          <div className="composer-actions-bar">
            <button type="button" className="btn ghost btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary lg btn-submit-task"
              disabled={!prompt.trim() || !repo.trim()}
            >
              <span>Start task</span>
              <ArrowRightIcon size={14} color="#ffffff" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
