import { useState, useMemo } from "react";
import { DemoNote, DemoTag } from "./Demo";
import type { DesktopSession } from "./TaskDetail";
import type { DesktopProject } from "./WorkspacePages";

interface AnalyticsViewProps {
  sessions?: DesktopSession[];
  projects?: DesktopProject[];
}

export function AnalyticsView({ sessions = [], projects = [] }: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Real aggregate statistics
  const metrics = useMemo(() => {
    const total = sessions.length;
    const approved = sessions.filter((s) => s.status === "approved").length;
    const failed = sessions.filter((s) => s.status === "failed").length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "100.0";
    const totalSpend = sessions.reduce((acc, s) => acc + (s.costUsd || 0), 0);
    const avgCost = total > 0 ? (totalSpend / total).toFixed(4) : "0.0000";

    return {
      total,
      approved,
      failed,
      approvalRate,
      totalSpend: totalSpend.toFixed(2),
      avgCost,
      projectsCount: projects.length,
    };
  }, [sessions, projects]);

  // Real Model distribution calculation
  const modelStats = useMemo(() => {
    if (sessions.length === 0) {
      return [
        { model: "Claude 3.5 Sonnet", count: 0, pct: 60, cost: "$0.00", color: "#27B7F5" },
        { model: "Qwen 2.5 Coder", count: 0, pct: 40, cost: "$0.00", color: "#00C2FF" },
      ];
    }

    const counts: Record<string, { count: number; cost: number }> = {};
    for (const s of sessions) {
      const m = s.model && s.model !== "unspecified" ? s.model : "claude-3-5-sonnet";
      const key = m.toLowerCase().includes("claude")
        ? "Claude 3.5 Sonnet"
        : m.toLowerCase().includes("qwen")
        ? "Qwen 2.5 Coder"
        : m.toLowerCase().includes("gpt")
        ? "GPT-4o"
        : m;

      if (!counts[key]) counts[key] = { count: 0, cost: 0 };
      counts[key].count += 1;
      counts[key].cost += s.costUsd || 0;
    }

    const total = sessions.length;
    const colors = ["#27B7F5", "#00C2FF", "#20C997", "#FFB547"];
    return Object.entries(counts).map(([model, data], i) => ({
      model,
      count: data.count,
      pct: Math.round((data.count / total) * 100),
      cost: `$${data.cost.toFixed(2)}`,
      color: colors[i % colors.length],
    }));
  }, [sessions]);

  // Daily task volume chart (grouping last 14 days)
  const chartData = useMemo(() => {
    const days = 14;
    const buckets: { day: string; count: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;

      const count = sessions.filter((s) => {
        try {
          return s.createdAt.slice(0, 10) === dateStr;
        } catch {
          return false;
        }
      }).length;

      buckets.push({ day: dayLabel, count });
    }

    // If no sessions yet, provide a baseline visualization curve
    const max = Math.max(...buckets.map((b) => b.count), 1);
    return { buckets, max };
  }, [sessions]);

  // Format relative time helper
  function formatTime(iso: string) {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return "Recently";
    }
  }

  return (
    <div className="page analytics-view-container">
      <div className="col wide">
        <div className="page-head">
          <div>
            <h1>Insights</h1>
            <p className="sub">
              {sessions.length === 0
                ? "Numbers appear after your first task."
                : `${metrics.approved} of ${metrics.total} tasks approved, for $${metrics.totalSpend} in total.`}
            </p>
          </div>
          <div className="row">
            <DemoTag label="Date filter not wired yet" />
            <div className="seg">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button key={r} className={dateRange === r ? "active" : ""} onClick={() => setDateRange(r)}>
                  Last {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid4">
          <div className="card pad stat"><span className="mut sm">Tasks run</span><b>{metrics.total}</b><span className="mut sm">Across {metrics.projectsCount || 1} {(metrics.projectsCount || 1) > 1 ? "repositories" : "repository"}</span></div>
          <div className="card pad stat"><span className="mut sm">Approval rate</span><b>{metrics.approvalRate}%</b><span className="mut sm">{metrics.approved} approved · {metrics.failed} failed</span></div>
          <div className="card pad stat"><span className="mut sm">AI spend</span><b>${metrics.totalSpend}</b><span className="mut sm">Average ${metrics.avgCost} per task</span></div>
          <div className="card pad stat"><span className="mut sm">Projects</span><b>{metrics.projectsCount || 1}</b><span className="mut sm">Local git repositories</span></div>
        </div>

        <div className="grid2 mt16">
          <div className="card pad">
            <div className="row"><h3 className="grow">Tasks per day</h3><span className="mut sm">Past 14 days</span></div>
            <div className="mt16" style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 130 }}>
              {chartData.buckets.map((b, i) => (
                <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 5 }} title={`${b.day}: ${b.count} tasks`}>
                  <div style={{ width: "100%", borderRadius: 4, height: b.count ? `${(b.count / chartData.max) * 82}%` : 2, background: b.count ? "var(--accent-primary)" : "var(--line2)" }} />
                  <span className="mut" style={{ fontSize: 10 }}>{b.day.split("/")[1]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card pad">
            <div className="row"><h3 className="grow">Models used</h3>{sessions.length === 0 && <DemoTag />}</div>
            {modelStats.map((item) => (
              <div key={item.model} className="mt12">
                <div className="row"><span className="grow ell">{item.model}</span><span className="mut sm">{item.cost} · {item.count} tasks · {item.pct}%</span></div>
                <div className="bar mt8"><i style={{ width: `${Math.max(item.pct, 5)}%`, background: item.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="sec-h"><span>Recent tasks</span><span>{sessions.length} recorded</span></div>
        {sessions.length === 0 ? (
          <DemoNote label="Nothing yet">No tasks have run yet.</DemoNote>
        ) : (
          <div className="card">
            <table className="t analytics-history-table">
              <thead><tr><th>Task</th><th>Repository</th><th>Agent and model</th><th>Status</th><th>Cost</th><th>When</th></tr></thead>
              <tbody>
                {sessions.slice(0, 8).map((s) => (
                  <tr key={s.id}>
                    <td className="main"><div className="ell">{s.prompt || s.title || "Task"}</div></td>
                    <td>{s.projectName || s.repo || "sample-repo"}</td>
                    <td className="mono">{s.agent} · {s.model || "claude-3-5"}</td>
                    <td><span className={`pill ${s.status}`}>{s.status.replace("_", " ")}</span></td>
                    <td className="mono">${Number(s.costUsd || 0).toFixed(2)}</td>
                    <td>{formatTime(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
