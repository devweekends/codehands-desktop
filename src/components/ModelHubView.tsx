import { useState } from "react";
import { GlobeIcon } from "./Icons";

export function ModelHubView() {
  const [subTab, setSubTab] = useState<
    "routing" | "fallback" | "groups" | "headers" | "traffic" | "usage" | "keys"
  >("routing");
  const [sdkLang, setSdkLang] = useState<"curl" | "python" | "js" | "go">("curl");
  const [costMetric, setCostMetric] = useState<"input" | "output" | "total">("total");

  const models = [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      sub: "gpt-4o",
      letter: "G",
      color: "#20C997",
      latency: "742 ms",
      latencyStatus: "Good",
      cost: "$2.50",
      costDelta: "-12%",
      uptime: "99.9%",
      uptimeStatus: "Excellent",
      score: 9.3,
    },
    {
      id: "claude-3-5-sonnet",
      name: "Claude",
      sub: "claude-3.5-sonnet",
      letter: "C",
      color: "#FFB547",
      latency: "812 ms",
      latencyStatus: "Fair",
      cost: "$3.00",
      costDelta: "-5%",
      uptime: "99.7%",
      uptimeStatus: "Excellent",
      score: 8.7,
    },
    {
      id: "llama-3-1-70b",
      name: "Llama",
      sub: "llama-3.1-70b",
      letter: "L",
      color: "#27B7F5",
      latency: "588 ms",
      latencyStatus: "Good",
      cost: "$0.80",
      costDelta: "-8%",
      uptime: "99.5%",
      uptimeStatus: "Excellent",
      score: 8.1,
    },
    {
      id: "mistral-large-2",
      name: "Mistral",
      sub: "mistral-large-2",
      letter: "M",
      color: "#27B7F5",
      latency: "623 ms",
      latencyStatus: "Good",
      cost: "$0.70",
      costDelta: "-3%",
      uptime: "99.4%",
      uptimeStatus: "Excellent",
      score: 7.8,
    },
  ];

  const codeSnippets = {
    curl: `curl https://api.openrouter.ai/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    python: `import openai

client = openai.OpenAI(
    base_url="https://api.openrouter.ai/v1",
    api_key="your-api-key"
)
response = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hello!"}]
)`,
    js: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.openrouter.ai/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
const response = await openai.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello!" }],
});`,
    go: `package main

import (
  "context"
  "github.com/sashabaranov/go-openai"
)

func main() {
  config := openai.DefaultConfig("your-api-key")
  config.BaseURL = "https://api.openrouter.ai/v1"
  client := openai.NewClientWithConfig(config)
}`,
  };

  return (
    <div className="model-hub-container">
      {/* Sub Navigation Sidebar */}
      <div className="model-hub-subnav">
        <div className="subnav-section">
          <span className="subnav-label">ROUTING</span>
          <button
            className={`subnav-btn ${subTab === "routing" ? "active" : ""}`}
            onClick={() => setSubTab("routing")}
          >
            Model Routing
          </button>
          <button
            className={`subnav-btn ${subTab === "fallback" ? "active" : ""}`}
            onClick={() => setSubTab("fallback")}
          >
            Fallback Chains
          </button>
          <button
            className={`subnav-btn ${subTab === "groups" ? "active" : ""}`}
            onClick={() => setSubTab("groups")}
          >
            Route Groups
          </button>
          <button
            className={`subnav-btn ${subTab === "headers" ? "active" : ""}`}
            onClick={() => setSubTab("headers")}
          >
            Headers & Context
          </button>
          <button
            className={`subnav-btn ${subTab === "traffic" ? "active" : ""}`}
            onClick={() => setSubTab("traffic")}
          >
            Traffic Policies
          </button>
        </div>

        <div className="subnav-section">
          <span className="subnav-label">ANALYTICS</span>
          <button
            className={`subnav-btn ${subTab === "usage" ? "active" : ""}`}
            onClick={() => setSubTab("usage")}
          >
            Usage
          </button>
          <button className="subnav-btn">Performance</button>
          <button className="subnav-btn">Costs</button>
          <button className="subnav-btn">Logs</button>
        </div>

        <div className="subnav-section">
          <span className="subnav-label">SETTINGS</span>
          <button
            className={`subnav-btn ${subTab === "keys" ? "active" : ""}`}
            onClick={() => setSubTab("keys")}
          >
            API Keys
          </button>
          <button className="subnav-btn">Team</button>
          <button className="subnav-btn">Billing</button>
          <button className="subnav-btn">Limits</button>
        </div>

        <div className="plan-usage-card">
          <div className="plan-title-row">
            <span className="plan-name">Pro Tier</span>
            <span className="plan-tier">Active</span>
          </div>
          <div className="plan-cost">$128.47 / $500</div>
          <div className="plan-progress-bar">
            <div className="bar-fill" style={{ width: "25%" }} />
          </div>
          <span className="plan-reset">25% · Resets in 12 days</span>
        </div>
      </div>

      {/* Main Model Hub Center & Right Panels */}
      <div className="model-hub-content-area">
        {/* Top 4 Model Comparison Cards matching Screenshot 4 */}
        <div className="models-cards-row">
          {models.map((m) => (
            <div key={m.id} className="model-telemetry-card">
              <div className="card-top-identity">
                <span className="model-avatar-badge" style={{ backgroundColor: m.color }}>
                  {m.letter}
                </span>
                <div className="model-names">
                  <strong>{m.name}</strong>
                  <small>{m.sub}</small>
                </div>
              </div>

              <div className="telemetry-metrics-grid">
                <div className="metric-box">
                  <span className="m-val">{m.latency}</span>
                  <span className="m-tag good">{m.latencyStatus}</span>
                </div>
                <div className="metric-box">
                  <span className="m-val">{m.cost}</span>
                  <span className="m-tag delta">{m.costDelta}</span>
                </div>
                <div className="metric-box">
                  <span className="m-val">{m.uptime}</span>
                  <span className="m-tag excellent">{m.uptimeStatus}</span>
                </div>
              </div>

              <div className="model-score-row">
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${(m.score / 10) * 100}%` }} />
                </div>
                <span className="score-num">{m.score}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section: Unified API Endpoint & SDK Code */}
        <div className="unified-endpoint-section">
          <div className="endpoint-banner-card">
            <div className="banner-left">
              <GlobeIcon size={24} color="#27B7F5" />
              <div className="endpoint-info">
                <h3>api.openrouter.ai/v1</h3>
                <div className="tags-row">
                  <span className="tag-pill">OpenAI-Compatible</span>
                  <span className="tag-pill">REST API</span>
                </div>
                <p>One endpoint. All models. Autonomous fallback and load routing.</p>
              </div>
            </div>

            <div className="sdk-code-box">
              <div className="sdk-tabs-row">
                <span>Use your existing SDK</span>
                <div className="sdk-pills">
                  {(["curl", "python", "js", "go"] as const).map((lang) => (
                    <button
                      key={lang}
                      className={`lang-btn ${sdkLang === lang ? "active" : ""}`}
                      onClick={() => setSdkLang(lang)}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
              <pre className="sdk-snippet">
                <code>{codeSnippets[sdkLang]}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Bottom Split: Live Request Router + Fallback Chain & Health */}
        <div className="hub-bottom-split">
          <div className="live-router-card">
            <div className="router-header">
              <h3>Live Request Router</h3>
              <span className="traffic-split-label">Traffic Split</span>
            </div>

            <div className="traffic-diagram">
              <div className="incoming-node">
                <span className="incoming-title">Incoming Requests</span>
                <strong className="incoming-rate">1,248 req/min</strong>
              </div>

              <div className="router-hub-icon">⇄</div>

              <div className="routed-destinations">
                <div className="dest-row">
                  <span className="model-badge-mini" style={{ background: "#20C997" }}>G</span>
                  <span className="dest-name">GPT-4o</span>
                  <div className="dest-bar">
                    <div className="dest-fill" style={{ width: "45%", background: "#20C997" }} />
                  </div>
                  <span className="dest-pct">45%</span>
                  <span className="dest-speed">562 req/min · 742 ms</span>
                </div>

                <div className="dest-row">
                  <span className="model-badge-mini" style={{ background: "#FFB547" }}>C</span>
                  <span className="dest-name">Claude</span>
                  <div className="dest-bar">
                    <div className="dest-fill" style={{ width: "25%", background: "#FFB547" }} />
                  </div>
                  <span className="dest-pct">25%</span>
                  <span className="dest-speed">312 req/min · 812 ms</span>
                </div>

                <div className="dest-row">
                  <span className="model-badge-mini" style={{ background: "#27B7F5" }}>L</span>
                  <span className="dest-name">Llama</span>
                  <div className="dest-bar">
                    <div className="dest-fill" style={{ width: "20%", background: "#27B7F5" }} />
                  </div>
                  <span className="dest-pct">20%</span>
                  <span className="dest-speed">250 req/min · 588 ms</span>
                </div>

                <div className="dest-row">
                  <span className="model-badge-mini" style={{ background: "#27B7F5" }}>M</span>
                  <span className="dest-name">Mistral</span>
                  <div className="dest-bar">
                    <div className="dest-fill" style={{ width: "10%", background: "#27B7F5" }} />
                  </div>
                  <span className="dest-pct">10%</span>
                  <span className="dest-speed">124 req/min · 623 ms</span>
                </div>
              </div>
            </div>

            <div className="router-stats-foot">
              <span>Total Throughput: <strong>1,248 req/min</strong></span>
              <span>Successful: <strong className="green">99.6%</strong></span>
              <span>Failed: <strong className="red">0.4%</strong></span>
              <span>P95 Latency: <strong>1.28s</strong></span>
            </div>
          </div>

          <div className="hub-right-column">
            <div className="fallback-chain-card">
              <h3>Automated Fallback Chain</h3>
              <div className="chain-steps-tree">
                <div className="chain-step-box primary">
                  <span className="step-num">1</span>
                  <span className="step-label">Primary: <strong>GPT-4o</strong></span>
                  <span className="step-badge">Auto</span>
                </div>
                <div className="chain-connector">
                  <span>↓ On Failure / Rate Limit</span>
                </div>
                <div className="chain-step-box backup">
                  <span className="step-num">2</span>
                  <span className="step-label">Backup: <strong>Claude 3.5 Sonnet</strong></span>
                  <span className="step-badge">Auto</span>
                </div>
                <div className="chain-connector">
                  <span>↓ On Failure</span>
                </div>
                <div className="chain-step-box backup">
                  <span className="step-num">3</span>
                  <span className="step-label">Fallback 2: <strong>Llama 3.1 70B</strong></span>
                  <span className="step-badge">Auto</span>
                </div>
                <div className="chain-connector">
                  <span>↓ Final Fallback</span>
                </div>
                <div className="chain-step-box final">
                  <span className="step-num">4</span>
                  <span className="step-label">Local Failover: <strong>Mistral Large 2</strong></span>
                  <span className="step-badge">Auto</span>
                </div>
              </div>
              <p className="chain-foot-note">
                Requests flow top to bottom automatically until successful execution.
              </p>
            </div>

            <div className="cost-comparison-card">
              <div className="cost-chart-head">
                <h3>Cost Comparison (per 1M tokens)</h3>
                <div className="cost-metric-pills">
                  {(["input", "output", "total"] as const).map((m) => (
                    <button
                      key={m}
                      className={`cost-pill ${costMetric === m ? "active" : ""}`}
                      onClick={() => setCostMetric(m)}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cost-bar-chart">
                <div className="chart-bar-col">
                  <div className="bar-fill-vertical gpt" style={{ height: "70%" }}>
                    <span className="bar-val">$2.50</span>
                  </div>
                  <span className="bar-label">GPT-4o</span>
                </div>
                <div className="chart-bar-col">
                  <div className="bar-fill-vertical claude" style={{ height: "85%" }}>
                    <span className="bar-val">$3.00</span>
                  </div>
                  <span className="bar-label">Claude</span>
                </div>
                <div className="chart-bar-col">
                  <div className="bar-fill-vertical llama" style={{ height: "25%" }}>
                    <span className="bar-val">$0.80</span>
                  </div>
                  <span className="bar-label">Llama</span>
                </div>
                <div className="chart-bar-col">
                  <div className="bar-fill-vertical mistral" style={{ height: "22%" }}>
                    <span className="bar-val">$0.70</span>
                  </div>
                  <span className="bar-label">Mistral</span>
                </div>
              </div>
            </div>

            <div className="routing-health-card">
              <div className="health-head">
                <h3>Routing Health</h3>
                <button className="btn-link-sm">View Logs</button>
              </div>
              <div className="health-metrics-row">
                <div className="health-stat">
                  <span className="stat-label">Success Rate</span>
                  <strong className="stat-value green">99.6%</strong>
                </div>
                <div className="health-stat">
                  <span className="stat-label">Avg Latency (p95)</span>
                  <strong className="stat-value">1.28s</strong>
                </div>
                <div className="health-stat">
                  <span className="stat-label">Error Rate</span>
                  <strong className="stat-value">0.4%</strong>
                </div>
                <div className="health-stat">
                  <span className="stat-label">Throttled Rate</span>
                  <strong className="stat-value">0.0%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
