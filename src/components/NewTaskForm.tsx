import { useState } from "react";
import type { AgentKind } from "@codehands/contracts";

interface NewTaskFormProps {
  connected: boolean;
  runnerReady: boolean;
  runnerReason?: string | null;
  runnerMode?: "fake" | "real";
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
  "claude-code": ["sonnet", "haiku", "opus"],
  codex: ["gpt-5.5", "gpt-5-mini", "codex-1"],
  codehands: ["claude-3-5-sonnet", "qwen-2.5-coder", "gpt-4o-mini"],
};

const DEFAULT_PHASE_MODELS = {
  analyze: "haiku",
  plan: "opus",
  implement: "sonnet",
  test: "haiku",
  review: "sonnet",
};

const PHASE_DEFAULTS: Record<AgentKind, typeof DEFAULT_PHASE_MODELS> = {
  "claude-code": DEFAULT_PHASE_MODELS,
  codex: {
    analyze: "gpt-5-mini",
    plan: "gpt-5.5",
    implement: "gpt-5.5",
    test: "gpt-5-mini",
    review: "gpt-5.5",
  },
  codehands: {
    analyze: "qwen-2.5-coder",
    plan: "claude-3-5-sonnet",
    implement: "qwen-2.5-coder",
    test: "qwen-2.5-coder",
    review: "claude-3-5-sonnet",
  },
};

export function NewTaskForm({ connected, runnerReady, runnerReason, runnerMode = "fake", initialRepo, onStart, onCancel }: NewTaskFormProps) {
  const [repo, setRepo] = useState(initialRepo || "d:\\dev\\sample-repo");
  const [prompt, setPrompt] = useState("");
  const [agent, setAgent] = useState<AgentKind>("claude-code");
  const [model, setModel] = useState("sonnet");
  const [customizePhases, setCustomizePhases] = useState(false);
  const [phaseModels, setPhaseModels] = useState(DEFAULT_PHASE_MODELS);
  const [error, setError] = useState<string | null>(null);

  const handleAgentChange = (newAgent: AgentKind) => {
    setAgent(newAgent);
    const available = AVAILABLE_MODELS[newAgent] || [];
    if (available.length > 0) setModel(available[0]);
    setPhaseModels(PHASE_DEFAULTS[newAgent]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repo.trim()) {
      setError("Please specify a target repository folder.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please describe the coding task to perform.");
      return;
    }
    if (!connected) {
      setError("Cannot write task: daemon is not connected.");
      return;
    }
    if (!runnerReady) {
      setError(runnerReason || "The local runner is not ready. Restart Code Hands and check the daemon.");
      return;
    }

    const success = onStart({
      repo: repo.trim(),
      prompt: prompt.trim(),
      agent,
      model,
      phaseModels: customizePhases ? phaseModels : undefined,
    });

    if (!success) setError("Failed to dispatch task to local daemon.");
  };

  return (
    <section className="form-container composer-page" aria-labelledby="composer-title">
      <button type="button" className="composer-back-link" onClick={onCancel}>← Browse sessions</button>
      <header className="composer-heading">
        <div className="eyebrow">CODE HANDS · LOCAL WORKSPACE</div>
        <h1 id="composer-title">What would you like to work on?</h1>
        <p>Describe the change in your own words. Your task and repository path stay in this local workspace.</p>
      </header>

      <div className="runner-notice composer-runner-notice" role="note">
        <span aria-hidden="true">ⓘ</span>
        <p><strong>{runnerReady ? (runnerMode === "fake" ? "Demo runner ready." : "Claude runner ready.") : "Daemon connected, runner unavailable."}</strong> {runnerReady ? (runnerMode === "fake" ? "Using pre-generated local events. No Claude subscription is required." : "Claude Code will work in a separate Git worktree; review the diff before approving it.") : runnerReason || "Start the daemon or check runner configuration."}</p>
      </div>

      <form className="task-composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="taskPrompt">Describe the coding task</label>
        <textarea
          id="taskPrompt"
          className="composer-prompt"
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={'Ask Code Hands to make a change…\n\nFor example: Add pagination to the users endpoint and cover the new behavior with tests.'}
          required
        />

        <div className="composer-toolbar">
          <div className="composer-repo-field">
            <label className="sr-only" htmlFor="repoPath">Local repository path</label>
            <span className="composer-toolbar-icon" aria-hidden="true">⌂</span>
            <input
              id="repoPath"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Repository path"
              aria-describedby="repoPathHelp"
              required
            />
          </div>
          <div className="composer-select-field">
            <label className="sr-only" htmlFor="agentKind">Agent</label>
            <select id="agentKind" value={agent} onChange={(e) => handleAgentChange(e.target.value as AgentKind)}>
              <option value="claude-code">Claude Code</option>
              <option value="codex" disabled>Codex CLI (coming soon)</option>
              <option value="codehands" disabled>Code Hands (coming soon)</option>
            </select>
          </div>
          <div className="composer-select-field model-select-field">
            <label className="sr-only" htmlFor="primaryModel">Primary model</label>
            <select id="primaryModel" value={model} onChange={(e) => setModel(e.target.value)}>
              {(AVAILABLE_MODELS[agent] || []).map((availableModel) => (
                <option key={availableModel} value={availableModel}>{availableModel}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary composer-submit" disabled={!connected || !runnerReady || !prompt.trim() || !repo.trim()}>
            Add task <span aria-hidden="true">↑</span>
          </button>
        </div>
        <small className="composer-repo-help" id="repoPathHelp">Repository paths remain on this device.</small>

        <details className="advanced-settings" onToggle={(event) => setCustomizePhases(event.currentTarget.open)}>
          <summary><span>Advanced model routing</span><small>Set a different model for each phase</small></summary>
          <div className="phase-models-panel">
            <div className="phase-grid">
              {(["analyze", "plan", "implement", "test", "review"] as const).map((phase) => (
                <div key={phase} className="phase-item">
                  <label htmlFor={`phase-${phase}`}>{phase}</label>
                  <select
                    id={`phase-${phase}`}
                    value={phaseModels[phase]}
                    onChange={(e) => setPhaseModels({ ...phaseModels, [phase]: e.target.value })}
                  >
                    {(AVAILABLE_MODELS[agent] || []).map((availableModel) => (
                      <option key={availableModel} value={availableModel}>{availableModel}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </details>

        {error && <div className="alert-error" role="alert">{error}</div>}
      </form>
    </section>
  );
}

