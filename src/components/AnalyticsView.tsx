import { useState } from "react";
import { BarChartIcon } from "./Icons";

export function AnalyticsView() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const modelUsageStats = [
    { model: "Claude 3.5 Sonnet", requests: 1420, tokens: "2.4M", cost: "$7.20", pct: 45, color: "#27B7F5" },
    { model: "Qwen 2.5 Coder", requests: 980, tokens: "1.8M", cost: "$1.44", pct: 30, color: "#27B7F5" },
    { model: "GPT-4o Mini", requests: 520, tokens: "650K", cost: "$0.39", pct: 15, color: "#20C997" },
    { model: "Claude 3.5 Haiku", requests: 310, tokens: "420K", cost: "$0.21", pct: 10, color: "#FFB547" },
  ];

  return (
    <div className="analytics-view-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title-col">
          <div className="title-row">
            <BarChartIcon size={20} color="#27B7F5" />
            <h2>Usage & Engineering Analytics</h2>
          </div>
          <p>Telemetry, token consumption, and cost tracking across all local and cloud runs</p>
        </div>

        <div className="date-filter-segmented">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              className={`date-seg-btn ${dateRange === r ? "active" : ""}`}
              onClick={() => setDateRange(r)}
            >
              Last {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="analytics-metrics-grid">
        <div className="metric-card">
          <span className="m-label">TOTAL TASKS EXECUTED</span>
          <strong className="m-val">3,230</strong>
          <span className="m-sub green">↑ 18% vs prior period</span>
        </div>

        <div className="metric-card">
          <span className="m-label">SUCCESSFUL MERGES</span>
          <strong className="m-val green">99.2%</strong>
          <span className="m-sub">Passing tests & approved</span>
        </div>

        <div className="metric-card">
          <span className="m-label">TOTAL AI SPEND</span>
          <strong className="m-val">$9.24</strong>
          <span className="m-sub">Avg $0.0028 per task</span>
        </div>

        <div className="metric-card">
          <span className="m-label">AVG WORKFLOW DURATION</span>
          <strong className="m-val">1m 42s</strong>
          <span className="m-sub">Analyze to verification</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts-grid">
        {/* Cost & Task Frequency Chart */}
        <div className="chart-card">
          <div className="chart-head">
            <h3>Daily Task Execution Volume</h3>
            <span className="chart-legend">Tasks / Day</span>
          </div>

          <div className="css-bar-chart">
            {[45, 62, 38, 85, 92, 110, 78, 95, 120, 88, 105, 130, 95, 115].map((val, i) => (
              <div key={i} className="chart-col">
                <div
                  className="bar-fill"
                  style={{ height: `${(val / 140) * 100}%` }}
                  title={`Day ${i + 1}: ${val} tasks`}
                />
                <span className="bar-x-label">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Model Breakdown */}
        <div className="chart-card">
          <div className="chart-head">
            <h3>AI Model Distribution</h3>
            <span className="chart-legend">By Token Share</span>
          </div>

          <div className="models-distribution-list">
            {modelUsageStats.map((item) => (
              <div key={item.model} className="model-dist-row">
                <div className="dist-row-top">
                  <strong>{item.model}</strong>
                  <span>{item.cost} · {item.tokens} tokens</span>
                </div>
                <div className="dist-progress-track">
                  <div
                    className="dist-progress-fill"
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                  />
                </div>
                <div className="dist-row-bottom">
                  <span>{item.requests} requests</span>
                  <span>{item.pct}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
