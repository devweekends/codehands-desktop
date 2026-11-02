import { useState } from "react";
import type { AgentKind } from "@codehands/contracts";

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

export function NewTaskForm({ connected, initialRepo, onStart, onCancel }: NewTaskFormProps) {
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
    if (available.length > 0) {
      setModel(available[0]);
    }
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

    // Strictly writes one tasks row to daemon (COD-293)
    const success = onStart({
      repo: repo.trim(),
      prompt: prompt.trim(),
      agent,
      model,
      phaseModels: customizePhases ? phaseModels : undefined,
    });

    if (!success) {
      setError("Failed to dispatch task to local daemon.");
    }
  };

  return (
    <section className="form-container">
      <div className="task-form-card">
      <div className="card-header">
        <div className="eyebrow">LOCAL WORKSPACE / NEW TASK</div>
        <h2>Start a coding task</h2>
        <p className="muted-text">
          Describe the outcome you want. Code Hands will add it to the task queue in your local daemon database.
        </p>
      </div>

      <div className="runner-notice"><span>ⓘ</span><p><strong>Runner integration is still in progress.</strong> The current daemon accepts and tracks queued tasks, but does not yet invoke Claude Code or Codex.</p></div>

      <div className="form-group run-target-group">
        <label>Run location</label>
        <div className="run-target-options">
          <div className="run-target selected"><span className="target-icon">⌘</span><span><strong>This device</strong><small>Local daemon · private workspace</small></span><i>Selected</i></div>
          <div className="run-target unavailable"><span className="target-icon">☁</span><span><strong>Cloud worker</strong><small>Remote execution will be opt-in</small></span><i>Planned</i></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repoPath">Repository Path</label>
          <div className="input-group">
            <input
              id="repoPath"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g. D:\dev\my-project"
              required
            />
          </div>
          <small className="muted-text">
            This path is stored locally and is not sent to the cloud.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="taskPrompt">Task Prompt</label>
          <textarea
            id="taskPrompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Add query parameter pagination to the list users endpoint with unit tests"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="agentKind">Agent</label>
            <select
              id="agentKind"
              value={agent}
              onChange={(e) => handleAgentChange(e.target.value as AgentKind)}
            >
              <option value="claude-code">Claude Code (Headless)</option>
              <option value="codex">Codex (CLI)</option>
              <option value="codehands">Code Hands Engine (Local)</option>
            </select>
          </div>

          <div className="form-group flex-1">
            <label htmlFor="primaryModel">Primary Model</label>
            <select
              id="primaryModel"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {(AVAILABLE_MODELS[agent] || []).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={customizePhases}
              onChange={(e) => setCustomizePhases(e.target.checked)}
            />
            <span>Configure model per phase (SIG Models architecture)</span>
          </label>
        </div>

        {customizePhases && (
          <div className="phase-models-panel">
            <h4>Models Per Phase</h4>
            <div className="phase-grid">
              {(["analyze", "plan", "implement", "test", "review"] as const).map(
                (phase) => (
                  <div key={phase} className="phase-item">
                    <label>{phase.toUpperCase()}</label>
                    <select
                      value={phaseModels[phase]}
                      onChange={(e) =>
                        setPhaseModels({
                          ...phaseModels,
                          [phase]: e.target.value,
                        })
                      }
                    >
                      {(AVAILABLE_MODELS[agent] || []).map((availableModel) => (
                        <option key={availableModel} value={availableModel}>{availableModel}</option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {error && <div className="alert-error">{error}</div>}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!connected || !prompt.trim()}
          >
            Start Task
          </button>
        </div>
      </form>
      </div>
    </section>
  );
}

