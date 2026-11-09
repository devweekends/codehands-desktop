import { useState } from "react";
import { WorkflowIcon } from "./Icons";

interface WorkflowNode {
  id: string;
  name: string;
  phase: "Start" | "Analyze" | "Plan" | "Implement" | "Test" | "Review" | "Approval" | "End";
  model: string;
  provider: string;
  timeoutSec: number;
  retries: number;
  status: "configured" | "active" | "idle";
}

const DEFAULT_NODES: WorkflowNode[] = [
  {
    id: "node-1",
    name: "Task Trigger",
    phase: "Start",
    model: "System Trigger",
    provider: "Local Daemon",
    timeoutSec: 30,
    retries: 1,
    status: "configured",
  },
  {
    id: "node-2",
    name: "Codebase Analysis",
    phase: "Analyze",
    model: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    timeoutSec: 120,
    retries: 2,
    status: "configured",
  },
  {
    id: "node-3",
    name: "Architectural Planning",
    phase: "Plan",
    model: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    timeoutSec: 180,
    retries: 2,
    status: "configured",
  },
  {
    id: "node-4",
    name: "Code Synthesis",
    phase: "Implement",
    model: "Qwen 2.5 Coder 32B",
    provider: "Local / OpenRouter",
    timeoutSec: 300,
    retries: 3,
    status: "active",
  },
  {
    id: "node-5",
    name: "Test & Validation Suite",
    phase: "Test",
    model: "GPT-4o Mini",
    provider: "OpenAI",
    timeoutSec: 180,
    retries: 2,
    status: "configured",
  },
  {
    id: "node-6",
    name: "Human Decision & Review",
    phase: "Approval",
    model: "Developer In Loop",
    provider: "Local Terminal",
    timeoutSec: 0,
    retries: 0,
    status: "configured",
  },
  {
    id: "node-7",
    name: "Git Branch Commit",
    phase: "End",
    model: "Git CLI Engine",
    provider: "Local Git",
    timeoutSec: 60,
    retries: 1,
    status: "configured",
  },
];

export function WorkflowBuilderView() {
  const [nodes, setNodes] = useState<WorkflowNode[]>(DEFAULT_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("node-4");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activePreset, setActivePreset] = useState<string>("full");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const updateSelectedNode = (field: keyof WorkflowNode, val: any) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, [field]: val } : n))
    );
  };

  return (
    <div className="workflow-builder-container">
      {/* Top Toolbar */}
      <div className="workflow-top-toolbar">
        <div className="wf-title-block">
          <WorkflowIcon size={18} color="#27B7F5" />
          <div className="wf-title-text">
            <h2>Autonomous Engineering Workflow</h2>
            <span className="wf-version-tag">v2.4 · Active Preset</span>
          </div>
        </div>

        <div className="wf-presets-row">
          <button
            className={`preset-btn ${activePreset === "full" ? "active" : ""}`}
            onClick={() => setActivePreset("full")}
          >
            Full Orchestration
          </button>
          <button
            className={`preset-btn ${activePreset === "rapid" ? "active" : ""}`}
            onClick={() => setActivePreset("rapid")}
          >
            Rapid Hotfix
          </button>
          <button
            className={`preset-btn ${activePreset === "tdd" ? "active" : ""}`}
            onClick={() => setActivePreset("tdd")}
          >
            TDD Enforcement
          </button>
        </div>

        <div className="wf-actions-right">
          <div className="zoom-controls">
            <button className="btn-zoom" onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}>-</button>
            <span className="zoom-label">{zoomLevel}%</span>
            <button className="btn-zoom" onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}>+</button>
          </div>
          <button className="btn-primary-sm">
            Save Workflow
          </button>
        </div>
      </div>

      {/* Main Canvas & Configuration Sidebar */}
      <div className="workflow-editor-body">
        {/* Visual Node Canvas */}
        <div className="workflow-canvas-scroll">
          <div
            className="workflow-canvas-grid"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top left" }}
          >
            {nodes.map((node, idx) => {
              const isSelected = node.id === selectedNodeId;
              const isLast = idx === nodes.length - 1;

              return (
                <div key={node.id} className="wf-node-wrapper">
                  <div
                    className={`wf-node-card ${isSelected ? "selected" : ""} ${node.status}`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="node-card-header">
                      <span className="phase-indicator-pill">{node.phase}</span>
                      <span className="node-status-dot" />
                    </div>
                    <div className="node-card-body">
                      <strong className="node-name">{node.name}</strong>
                      <span className="node-model-label">{node.model}</span>
                      <span className="node-provider-label">{node.provider}</span>
                    </div>
                    <div className="node-card-footer">
                      <span>Timeout: {node.timeoutSec ? `${node.timeoutSec}s` : "Manual"}</span>
                      <span>Retries: {node.retries}</span>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="wf-node-connector">
                      <div className="connector-line" />
                      <div className="connector-arrow">↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Node Configuration Inspector Sidebar */}
        <div className="workflow-inspector-panel">
          <div className="inspector-header">
            <h3>Node Configuration</h3>
            <span className="node-id-tag">#{selectedNode.id}</span>
          </div>

          <div className="inspector-form">
            <div className="form-group">
              <label>Phase Stage</label>
              <input
                type="text"
                value={selectedNode.phase}
                onChange={(e) => updateSelectedNode("phase", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Step Display Name</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => updateSelectedNode("name", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Assigned AI Model</label>
              <select
                value={selectedNode.model}
                onChange={(e) => updateSelectedNode("model", e.target.value)}
              >
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Anthropic)</option>
                <option value="Claude 3.5 Haiku">Claude 3.5 Haiku (Fast)</option>
                <option value="GPT-4o">GPT-4o (OpenAI)</option>
                <option value="GPT-4o Mini">GPT-4o Mini (Cost Efficient)</option>
                <option value="Qwen 2.5 Coder 32B">Qwen 2.5 Coder 32B (Coding)</option>
                <option value="Developer In Loop">Developer In Loop (Human Action)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Execution Provider</label>
              <input
                type="text"
                value={selectedNode.provider}
                onChange={(e) => updateSelectedNode("provider", e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Timeout (seconds)</label>
                <input
                  type="number"
                  value={selectedNode.timeoutSec}
                  onChange={(e) => updateSelectedNode("timeoutSec", Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Retry Attempts</label>
                <input
                  type="number"
                  value={selectedNode.retries}
                  onChange={(e) => updateSelectedNode("retries", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Fallback Model on Failure</label>
              <select defaultValue="Claude 3.5 Haiku">
                <option value="Claude 3.5 Haiku">Claude 3.5 Haiku</option>
                <option value="GPT-4o Mini">GPT-4o Mini</option>
                <option value="Llama 3.1 70B">Llama 3.1 70B</option>
                <option value="None">None (Halt on failure)</option>
              </select>
            </div>

            <div className="inspector-notes-card">
              <h4>Phase Rules</h4>
              <p>
                Inputs are staged in the local daemon. If this phase encounters a linter or test failure,
                it executes retry logic before triggering human review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
