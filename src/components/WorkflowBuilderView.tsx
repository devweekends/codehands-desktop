import { useState } from "react";
import { DemoNote, DemoTag } from "./Demo";

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
  const [activePreset, setActivePreset] = useState<string>("full");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const updateSelectedNode = (field: keyof WorkflowNode, val: any) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, [field]: val } : n))
    );
  };

  return (
    <div className="split-view workflow-builder-container">
      <div className="pane-main">
        <div className="pane-scroll">
          <div className="col">
            <div className="page-head">
              <div>
                <h1 className="row">Workflows <DemoTag /></h1>
                <p className="sub">The steps a task would go through.</p>
              </div>
              <div className="seg">
                {([["full", "Full"], ["rapid", "Rapid hotfix"], ["tdd", "Tests first"]] as const).map(([id, label]) => (
                  <button key={id} className={activePreset === id ? "active" : ""} onClick={() => setActivePreset(id)}>{label}</button>
                ))}
              </div>
            </div>
            <DemoNote>A sample workflow. Your edits stay on this screen and are not used when a task runs.</DemoNote>
            <div className="card list">
              {nodes.map((node, idx) => (
                <div
                  key={node.id}
                  className="click"
                  style={node.id === selectedNode.id ? { background: "var(--hover)", boxShadow: "inset 2px 0 0 var(--accent-primary)" } : undefined}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <span className="mut" style={{ width: 18 }}>{idx + 1}</span>
                  <div className="grow">
                    <div className="ell">{node.name}</div>
                    <div className="mut sm ell">{node.model} · {node.provider}</div>
                  </div>
                  <span className="mut sm">{node.timeoutSec ? `${node.timeoutSec}s` : "Manual"} · retries {node.retries}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="pane-list" style={{ width: 300, borderRight: 0, borderLeft: "1px solid var(--line)", overflow: "auto", padding: 18 }}>
        <h2>{selectedNode.phase} step</h2>
        <div className="form-group mt12">
          <label>Phase</label>
          <input type="text" value={selectedNode.phase} onChange={(e) => updateSelectedNode("phase", e.target.value)} />
        </div>
        <div className="form-group">
          <label>Step name</label>
          <input type="text" value={selectedNode.name} onChange={(e) => updateSelectedNode("name", e.target.value)} />
        </div>
        <div className="form-group">
          <label>Model</label>
          <select value={selectedNode.model} onChange={(e) => updateSelectedNode("model", e.target.value)}>
            <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Anthropic)</option>
            <option value="Claude 3.5 Haiku">Claude 3.5 Haiku (Fast)</option>
            <option value="GPT-4o">GPT-4o (OpenAI)</option>
            <option value="GPT-4o Mini">GPT-4o Mini (Cost Efficient)</option>
            <option value="Qwen 2.5 Coder 32B">Qwen 2.5 Coder 32B (Coding)</option>
            <option value="Developer In Loop">Developer In Loop (Human Action)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Provider</label>
          <input type="text" value={selectedNode.provider} onChange={(e) => updateSelectedNode("provider", e.target.value)} />
        </div>
        <div className="grid2">
          <div className="form-group">
            <label>Timeout (s)</label>
            <input type="number" value={selectedNode.timeoutSec} onChange={(e) => updateSelectedNode("timeoutSec", Number(e.target.value))} />
          </div>
          <div className="form-group">
            <label>Retries</label>
            <input type="number" value={selectedNode.retries} onChange={(e) => updateSelectedNode("retries", Number(e.target.value))} />
          </div>
        </div>
        <div className="form-group">
          <label>If it fails, use</label>
          <select defaultValue="Claude 3.5 Haiku">
            <option value="Claude 3.5 Haiku">Claude 3.5 Haiku</option>
            <option value="GPT-4o Mini">GPT-4o Mini</option>
            <option value="Llama 3.1 70B">Llama 3.1 70B</option>
            <option value="None">None (halt on failure)</option>
          </select>
        </div>
        <button className="btn">Save workflow</button>
      </aside>
    </div>
  );
}
