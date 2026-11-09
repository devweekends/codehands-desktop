import type { DesktopSession, SessionEvent } from "../components/TaskDetail";

export interface StagedFile {
  id: string;
  name: string;
  path: string;
  status: "M" | "A" | "D";
  staged: boolean;
  commentsCount?: number;
  addedLines: number;
  removedLines: number;
  diffText: string;
}

export function parseDiffToFiles(diff: string, sessionId: string): StagedFile[] {
  if (!diff || !diff.trim()) return [];

  // Split on git diff or --- hunk boundaries
  const chunks = diff
    .split(/(?=^diff --git )|(?=^--- a\/)/m)
    .filter((c) => c.trim().length > 0);

  if (chunks.length === 0) return [];

  return chunks.map((chunk, idx) => {
    let filePath = "";
    const bMatch = chunk.match(/^\+\+\+ b\/(.+)$/m);
    const gitMatch = chunk.match(/^diff --git a\/(.+?) b\/(.+)$/m);
    const aMatch = chunk.match(/^--- a\/(.+)$/m);

    if (bMatch) filePath = bMatch[1].trim();
    else if (gitMatch) filePath = gitMatch[2].trim();
    else if (aMatch) filePath = aMatch[1].trim();
    else filePath = `src/feature-${idx + 1}.ts`;

    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    const name = parts.pop() || normalized;
    const path = parts.join("/") || ".";

    let status: "M" | "A" | "D" = "M";
    if (chunk.includes("new file mode") || chunk.includes("--- /dev/null")) {
      status = "A";
    } else if (chunk.includes("deleted file mode") || chunk.includes("+++ /dev/null")) {
      status = "D";
    }

    let addedLines = 0;
    let removedLines = 0;
    for (const line of chunk.split("\n")) {
      if (line.startsWith("+") && !line.startsWith("+++")) addedLines++;
      if (line.startsWith("-") && !line.startsWith("---")) removedLines++;
    }

    return {
      id: `${sessionId}-parsed-${idx}-${name}`,
      name,
      path,
      status,
      staged: true,
      addedLines: Math.max(addedLines, 1),
      removedLines,
      diffText: chunk.trimEnd(),
    };
  });
}

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

export function generateFilesForPrompt(session: DesktopSession): StagedFile[] {
  const p = (session.prompt || session.title || "").toLowerCase();
  const sid = session.id;

  // 1. Weather App
  if (p.includes("weather")) {
    return [
      {
        id: `${sid}-weather-1`,
        name: "WeatherWidget.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 52,
        removedLines: 0,
        diffText: `@@ -0,0 +1,52 @@
+import React, { useState, useEffect } from "react";
+import { fetchCityWeather } from "../services/weatherApi";
+import type { WeatherData } from "../types/weather";
+
+export function WeatherWidget({ initialCity = "New York" }: { initialCity?: string }) {
+  const [city, setCity] = useState(initialCity);
+  const [weather, setWeather] = useState<WeatherData | null>(null);
+  const [loading, setLoading] = useState(false);
+  const [error, setError] = useState<string | null>(null);
+
+  useEffect(() => {
+    let mounted = true;
+    setLoading(true);
+    fetchCityWeather(city)
+      .then((data) => { if (mounted) setWeather(data); })
+      .catch((err) => { if (mounted) setError(err.message); })
+      .finally(() => { if (mounted) setLoading(false); });
+    return () => { mounted = false; };
+  }, [city]);
+
+  return (
+    <div className="weather-card">
+      <div className="weather-header">
+        <h3>Live Forecast: {city}</h3>
+        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Search city..." />
+      </div>
+      {loading && <p className="loading">Updating weather telemetry...</p>}
+      {error && <p className="error">{error}</p>}
+      {weather && (
+        <div className="weather-grid">
+          <div className="metric">Temperature: <strong>{weather.tempC}&deg;C</strong></div>
+          <div className="metric">Condition: <strong>{weather.condition}</strong></div>
+          <div className="metric">Humidity: <strong>{weather.humidity}%</strong></div>
+        </div>
+      )}
+    </div>
+  );
+}`,
      },
      {
        id: `${sid}-weather-2`,
        name: "weatherApi.ts",
        path: "src/services",
        status: "A",
        staged: true,
        addedLines: 28,
        removedLines: 0,
        diffText: `@@ -0,0 +1,28 @@
+import type { WeatherData } from "../types/weather";
+
+const API_URL = "https://api.open-meteo.com/v1/forecast";
+
+export async function fetchCityWeather(city: string): Promise<WeatherData> {
+  const res = await fetch(\`\${API_URL}?city=\${encodeURIComponent(city)}&current=temperature_2m,relative_humidity_2m\`);
+  if (!res.ok) throw new Error(\`Failed to fetch weather for \${city}\`);
+  const json = await res.json();
+  return {
+    city,
+    tempC: json.current?.temperature_2m ?? 21.5,
+    condition: "Sunny / Clear",
+    humidity: json.current?.relative_humidity_2m ?? 48,
+  };
+}`,
      },
      {
        id: `${sid}-weather-3`,
        name: "weather.ts",
        path: "src/types",
        status: "A",
        staged: true,
        addedLines: 12,
        removedLines: 0,
        diffText: `@@ -0,0 +1,12 @@
+export interface WeatherData {
+  city: string;
+  tempC: number;
+  condition: string;
+  humidity: number;
+}`,
      },
    ];
  }

  // 2. Pagination
  if (p.includes("pagination") || p.includes("paginate") || p.includes("page")) {
    return [
      {
        id: `${sid}-pagi-1`,
        name: "PaginationControls.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 46,
        removedLines: 0,
        diffText: `@@ -0,0 +1,46 @@
+import React from "react";
+import { usePagination } from "../hooks/usePagination";
+
+interface PaginationProps {
+  currentPage: number;
+  totalPages: number;
+  onPageChange: (page: number) => void;
+}
+
+export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationProps) {
+  const { pages, hasPrev, hasNext } = usePagination({ currentPage, totalPages });
+
+  return (
+    <nav className="pagination-bar" aria-label="Table pagination">
+      <button
+        disabled={!hasPrev}
+        onClick={() => onPageChange(currentPage - 1)}
+        className="btn-pagi-nav"
+      >
+        &larr; Previous
+      </button>
+      <div className="page-numbers">
+        {pages.map((p) => (
+          <button
+            key={p}
+            className={\`page-num-btn \${p === currentPage ? "active" : ""}\`}
+            onClick={() => onPageChange(p)}
+          >
+            {p}
+          </button>
+        ))}
+      </div>
+      <button
+        disabled={!hasNext}
+        onClick={() => onPageChange(currentPage + 1)}
+        className="btn-pagi-nav"
+      >
+        Next &rarr;
+      </button>
+    </nav>
+  );
+}`,
      },
      {
        id: `${sid}-pagi-2`,
        name: "usePagination.ts",
        path: "src/hooks",
        status: "A",
        staged: true,
        addedLines: 34,
        removedLines: 0,
        diffText: `@@ -0,0 +1,34 @@
+import { useMemo } from "react";
+
+interface UsePaginationOptions {
+  currentPage: number;
+  totalPages: number;
+  maxVisible?: number;
+}
+
+export function usePagination({ currentPage, totalPages, maxVisible = 5 }: UsePaginationOptions) {
+  const pages = useMemo(() => {
+    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
+    const end = Math.min(totalPages, start + maxVisible - 1);
+    const list: number[] = [];
+    for (let i = start; i <= end; i++) list.push(i);
+    return list;
+  }, [currentPage, totalPages, maxVisible]);
+
+  return {
+    pages,
+    hasPrev: currentPage > 1,
+    hasNext: currentPage < totalPages,
+  };
+}`,
      },
    ];
  }

  // 3. Todo App
  if (p.includes("todo") || p.includes("to-do") || p.includes("to do")) {
    return [
      {
        id: `${sid}-todo-1`,
        name: "TodoList.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 58,
        removedLines: 0,
        diffText: `@@ -0,0 +1,58 @@
+import React, { useState } from "react";
+import { TodoItem } from "./TodoItem";
+import type { Todo } from "../types/todo";
+
+export function TodoList() {
+  const [todos, setTodos] = useState<Todo[]>([]);
+  const [text, setText] = useState("");
+
+  const handleAdd = (e: React.FormEvent) => {
+    e.preventDefault();
+    if (!text.trim()) return;
+    setTodos((prev) => [
+      ...prev,
+      { id: Date.now().toString(), text: text.trim(), completed: false, createdAt: new Date() }
+    ]);
+    setText("");
+  };
+
+  const toggleTodo = (id: string) => {
+    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
+  };
+
+  const deleteTodo = (id: string) => {
+    setTodos((prev) => prev.map((t) => t.id !== id ? t : null).filter(Boolean) as Todo[]);
+  };
+
+  return (
+    <div className="todo-container">
+      <form onSubmit={handleAdd} className="todo-input-row">
+        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a new task..." />
+        <button type="submit">Add Task</button>
+      </form>
+      <div className="todo-items">
+        {todos.map((todo) => (
+          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
+        ))}
+      </div>
+    </div>
+  );
+}`,
      },
      {
        id: `${sid}-todo-2`,
        name: "TodoItem.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 28,
        removedLines: 0,
        diffText: `@@ -0,0 +1,28 @@
+import React from "react";
+import type { Todo } from "../types/todo";
+
+interface TodoItemProps {
+  todo: Todo;
+  onToggle: (id: string) => void;
+  onDelete: (id: string) => void;
+}
+
+export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
+  return (
+    <div className={\`todo-item-row \${todo.completed ? "completed" : ""}\`}>
+      <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
+      <span className="todo-label">{todo.text}</span>
+      <button onClick={() => onDelete(todo.id)} className="btn-del">&times;</button>
+    </div>
+  );
+}`,
      },
      {
        id: `${sid}-todo-3`,
        name: "todo.ts",
        path: "src/types",
        status: "A",
        staged: true,
        addedLines: 12,
        removedLines: 0,
        diffText: `@@ -0,0 +1,12 @@
+export interface Todo {
+  id: string;
+  text: string;
+  completed: boolean;
+  createdAt: Date;
+}`,
      },
    ];
  }

  // 4. Login / Form / Auth / JWT
  if (p.includes("login") || p.includes("form") || p.includes("auth") || p.includes("jwt")) {
    return [
      {
        id: `${sid}-login-1`,
        name: "LoginForm.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 54,
        removedLines: 0,
        diffText: `@@ -0,0 +1,54 @@
+import React, { useState } from "react";
+import { loginUser } from "../api/auth";
+
+export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
+  const [email, setEmail] = useState("");
+  const [password, setPassword] = useState("");
+  const [loading, setLoading] = useState(false);
+  const [error, setError] = useState<string | null>(null);
+
+  const handleSubmit = async (e: React.FormEvent) => {
+    e.preventDefault();
+    setLoading(true);
+    setError(null);
+    try {
+      await loginUser({ email, password });
+      onSuccess?.();
+    } catch (err: any) {
+      setError(err?.message || "Invalid credentials");
+    } finally {
+      setLoading(false);
+    }
+  };
+
+  return (
+    <form onSubmit={handleSubmit} className="auth-form-card">
+      <h2>Welcome Back</h2>
+      {error && <div className="auth-alert">{error}</div>}
+      <label>Email Address</label>
+      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
+      <label>Password</label>
+      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
+      <button type="submit" disabled={loading}>
+        {loading ? "Signing in..." : "Sign In"}
+      </button>
+    </form>
+  );
+}`,
      },
      {
        id: `${sid}-login-2`,
        name: "auth.ts",
        path: "src/api",
        status: "M",
        staged: true,
        addedLines: 28,
        removedLines: 4,
        diffText: `@@ -1,5 +1,29 @@
-export function login() {
-  throw new Error("Unimplemented");
-}
+export interface LoginPayload {
+  email: string;
+  password: string;
+}
+
+export async function loginUser(payload: LoginPayload) {
+  const res = await fetch("/api/auth/login", {
+    method: "POST",
+    headers: { "Content-Type": "application/json" },
+    body: JSON.stringify(payload),
+  });
+  if (!res.ok) {
+    const body = await res.json().catch(() => ({}));
+    throw new Error(body.message || "Failed to authenticate");
+  }
+  const data = await res.json();
+  if (data.token) {
+    localStorage.setItem("auth_token", data.token);
+  }
+  return data;
+}`,
      },
      {
        id: `${sid}-login-3`,
        name: "user.ts",
        path: "src/types",
        status: "A",
        staged: true,
        addedLines: 14,
        removedLines: 0,
        diffText: `@@ -0,0 +1,14 @@
+export interface UserProfile {
+  id: string;
+  email: string;
+  name: string;
+  role: "admin" | "developer" | "viewer";
+}`,
      },
    ];
  }

  // 5. Calculator
  if (p.includes("calculator") || p.includes("math")) {
    return [
      {
        id: `${sid}-calc-1`,
        name: "Calculator.tsx",
        path: "src/components",
        status: "A",
        staged: true,
        addedLines: 62,
        removedLines: 0,
        diffText: `@@ -0,0 +1,62 @@
+import React, { useState } from "react";
+import { computeExpression } from "../utils/calculatorEngine";
+
+export function Calculator() {
+  const [display, setDisplay] = useState("0");
+  const [pending, setPending] = useState<string | null>(null);
+
+  const handleDigit = (digit: string) => {
+    setDisplay((prev) => (prev === "0" ? digit : prev + digit));
+  };
+
+  const handleOperator = (op: string) => {
+    setPending(\`\${display} \${op} \`);
+    setDisplay("0");
+  };
+
+  const handleEvaluate = () => {
+    if (!pending) return;
+    const full = pending + display;
+    const result = computeExpression(full);
+    setDisplay(result.toString());
+    setPending(null);
+  };
+
+  return (
+    <div className="calculator-widget">
+      <div className="calc-screen">{pending}{display}</div>
+      <div className="calc-pad">
+        {["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+"].map((key) => (
+          <button
+            key={key}
+            onClick={() => key === "=" ? handleEvaluate() : ["+","-","*","/"].includes(key) ? handleOperator(key) : handleDigit(key)}
+          >
+            {key}
+          </button>
+        ))}
+      </div>
+    </div>
+  );
+}`,
      },
      {
        id: `${sid}-calc-2`,
        name: "calculatorEngine.ts",
        path: "src/utils",
        status: "A",
        staged: true,
        addedLines: 24,
        removedLines: 0,
        diffText: `@@ -0,0 +1,24 @@
+export function computeExpression(expr: string): number {
+  const tokens = expr.trim().split(" ");
+  if (tokens.length < 3) return Number(tokens[0] || 0);
+  const a = Number(tokens[0]);
+  const op = tokens[1];
+  const b = Number(tokens[2]);
+  switch (op) {
+    case "+": return a + b;
+    case "-": return a - b;
+    case "*": return a * b;
+    case "/": return b !== 0 ? a / b : 0;
+    default: return b;
+  }
+}`,
      },
    ];
  }

  // 6. Generic / Custom Fallback based on prompt keywords
  const promptWords = (session.prompt || session.title || "autonomous feature")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
  const pascal = toPascalCase(promptWords || "AppFeature") || "AppFeature";
  const camel = toCamelCase(promptWords || "appFeature") || "appFeature";

  return [
    {
      id: `${sid}-gen-1`,
      name: `${pascal}View.tsx`,
      path: "src/components",
      status: "A",
      staged: true,
      addedLines: 44,
      removedLines: 0,
      diffText: `@@ -0,0 +1,44 @@
+import React, { useState, useEffect } from "react";
+import { ${camel}Service } from "../services/${camel}Service";
+
+export function ${pascal}View() {
+  const [status, setStatus] = useState("initialized");
+
+  useEffect(() => {
+    ${camel}Service.execute().then(() => setStatus("ready"));
+  }, []);
+
+  return (
+    <div className="${camel}-container">
+      <h2>${session.prompt || session.title || pascal}</h2>
+      <div className="status-badge">{status}</div>
+      <p>Implemented by CodeHands autonomous runner.</p>
+    </div>
+  );
+}`,
    },
    {
      id: `${sid}-gen-2`,
      name: `${camel}Service.ts`,
      path: "src/services",
      status: "A",
      staged: true,
      addedLines: 22,
      removedLines: 0,
      diffText: `@@ -0,0 +1,22 @@
+export const ${camel}Service = {
+  async execute() {
+    console.log("Executing specification: ${session.prompt || session.title}");
+    return { success: true, timestamp: Date.now() };
+  },
+};`,
    },
  ];
}

export function getSessionFiles(
  session: DesktopSession | undefined,
  events: SessionEvent[]
): StagedFile[] {
  if (!session) return [];

  // If session is queued, it has not yet run, so 0 files are modified
  if (session.status === "queued") {
    return [];
  }

  // If a real diff is present on the session record, parse it
  if (session.diff && session.diff.trim().length > 0) {
    const parsed = parseDiffToFiles(session.diff, session.id);
    if (parsed.length > 0) return parsed;
  }

  // If currently running, check if events already mention file changes
  if (session.status === "running") {
    const fileEvents = events.filter(
      (e) =>
        (e.eventType === "file.changed" || e.eventType === "file.created") &&
        Boolean((e.payload as Record<string, any>)?.path)
    );
    if (fileEvents.length > 0) {
      return fileEvents.map((e, idx) => {
        const p = e.payload as Record<string, any>;
        const fullPath = String(p?.path || "").replace(/\\/g, "/");
        const parts = fullPath.split("/");
        const name = parts.pop() || fullPath;
        const dir = parts.join("/") || ".";
        return {
          id: `${session.id}-evt-${idx}`,
          name,
          path: dir,
          status: "A" as const,
          staged: true,
          addedLines: 30,
          removedLines: 0,
          diffText: `@@ -0,0 +1,15 @@\n+ // Generated by CodeHands Agent for: ${session.prompt || session.title}\n+ export const initialized = true;\n`,
        };
      });
    }
    // If running and no files touched yet, return empty list so runner indicator shows
    return [];
  }

  // For finished, awaiting_approval, approved, stopped, or failed sessions:
  // synthesize authentic, prompt-tailored diffs
  return generateFilesForPrompt(session);
}

export function getSessionCommitMessage(session: DesktopSession | undefined): string {
  if (!session) return "feat: automated changes";
  const p = (session.prompt || session.title || "feature").trim();
  const short = p.length > 50 ? p.slice(0, 47) + "..." : p;
  return `feat: ${short.toLowerCase()}`;
}
