import { useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  status: string;
  repo: string;
};

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let timer: number;

    const connect = () => {
      ws = new WebSocket("ws://localhost:8787");
      ws.onopen = () => setConnected(true);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === "sessions") setSessions(msg.sessions);
      };
      ws.onclose = () => {
        setConnected(false);
        timer = window.setTimeout(connect, 2000); // 2 second baad dobara koshish
      };
    };

    connect();
    return () => {
      window.clearTimeout(timer);
      ws.onclose = null;
      ws.close();
    };
  }, []);

  return (
    <main style={{ padding: 24, textAlign: "left" }}>
      <h1>Sessions</h1>
      <p>{connected ? "🟢 Daemon connected" : "🔴 Daemon not connected"}</p>
      {sessions.map((s) => (
        <div
          key={s.id}
          style={{
            padding: 12,
            marginBottom: 8,
            border: "1px solid #555",
            borderRadius: 8,
          }}
        >
          <strong>{s.title}</strong>
          <div>
            {s.status} · {s.repo}
          </div>
        </div>
      ))}
    </main>
  );
}