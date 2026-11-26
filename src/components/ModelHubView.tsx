import { useState } from "react";
import { DemoNote, DemoTag } from "./Demo";

export function ModelHubView() {
  const [sdkLang, setSdkLang] = useState<"curl" | "python" | "js" | "go">("curl");

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
    <div className="page model-hub-container">
      <div className="col wide">
        <div className="page-head">
          <div>
            <h1 className="row">Models &amp; Routing <DemoTag /></h1>
            <p className="sub">How requests would be shared between models.</p>
          </div>
        </div>
        <DemoNote>Every number on this page is sample data. It is not connected to a provider, a bill or the cost ledger.</DemoNote>

        <div className="card">
          <table className="t">
            <thead><tr><th>Model</th><th>Latency</th><th>Price</th><th>Uptime</th><th>Score</th></tr></thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td className="main">{m.name}<div className="mono mut">{m.sub}</div></td>
                  <td>{m.latency} · {m.latencyStatus}</td>
                  <td>{m.cost} ({m.costDelta})</td>
                  <td>{m.uptime} · {m.uptimeStatus}</td>
                  <td>{m.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid2 mt16">
          <div className="card pad">
            <h3>Traffic split</h3>
            <p className="mut sm">1,248 requests a minute</p>
            {([["GPT-4o", 45], ["Claude", 25], ["Llama", 20], ["Mistral", 10]] as const).map(([name, share]) => (
              <div key={name} className="row mt12">
                <span style={{ width: 64 }}>{name}</span>
                <div className="bar grow"><i style={{ width: `${share}%` }} /></div>
                <span className="mono mut">{share}%</span>
              </div>
            ))}
          </div>
          <div className="card pad">
            <h3>Fallback order</h3>
            {["Primary: GPT-4o", "Backup: Claude 3.5 Sonnet", "Then: Llama 3.1 70B", "Last: Mistral Large 2"].map((step, i) => (
              <div key={step} className="row mt12"><span className="mut">{i + 1}</span><span>{step}</span></div>
            ))}
            <p className="mut sm mt12">Plan: Pro tier, $128.47 of $500 used.</p>
          </div>
        </div>

        <details className="card demo-details mt16">
          <summary><span className="grow">Use your existing SDK (api.openrouter.ai/v1)</span></summary>
          <div className="body">
            <div className="seg">
              {(["curl", "python", "js", "go"] as const).map((lang) => (
                <button key={lang} className={sdkLang === lang ? "active" : ""} onClick={() => setSdkLang(lang)}>{lang}</button>
              ))}
            </div>
            <pre className="mono mt12" style={{ whiteSpace: "pre-wrap" }}>{codeSnippets[sdkLang]}</pre>
          </div>
        </details>
      </div>
    </div>
  );
}
