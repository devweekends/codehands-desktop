import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8787 });

const sessions = [
  { id: "1", title: "Fix login bug", status: "running", repo: "acme/api" },
  { id: "2", title: "Add pagination", status: "done", repo: "acme/web" },
  { id: "3", title: "Update dependencies", status: "waiting", repo: "acme/api" },
];

const send = (ws) =>
  ws.readyState === 1 &&
  ws.send(JSON.stringify({ type: "sessions", sessions }));

wss.on("connection", (ws) => send(ws));

// Har 4 second mein ek session ka status badlo, taake "live" nazar aaye
const states = ["running", "waiting", "done"];
setInterval(() => {
  const s = sessions[Math.floor(Math.random() * sessions.length)];
  s.status = states[Math.floor(Math.random() * states.length)];
  wss.clients.forEach(send);
}, 4000);

console.log("Fake daemon ready on ws://localhost:8787");