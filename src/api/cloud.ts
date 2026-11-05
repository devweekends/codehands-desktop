// Client for the C3 Cloud API (codehands-backend, Memoona's real server)
// Real server runs on port 3000. Override with VITE_CLOUD_URL env var.
import type { CloudAuth, AuthResult, CloudDevice } from "@codehands/contracts";

// Vite exposes env vars prefixed with VITE_ at build time.
// In dev: set VITE_CLOUD_URL=http://localhost:3000 in desktop/.env
// Defaults to the real local API. Set VITE_CLOUD_URL to use another backend.
const DEFAULT_CLOUD_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_CLOUD_URL) ||
  "http://localhost:3000";

export class CloudApiClient implements CloudAuth {
  private baseUrl: string;
  private token: string | null = null;
  private onTokenExpired?: () => void;

  constructor(baseUrl = DEFAULT_CLOUD_URL, onTokenExpired?: () => void) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.onTokenExpired = onTokenExpired;
  }

  setExpiredHandler(handler: () => void) {
    this.onTokenExpired = handler;
  }

  /** Called by App.tsx after loading the stored token from keychain */
  setToken(token: string | null) {
    this.token = token;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  async signUp(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const res = await this.authFetch("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error ?? (body as any).message ?? `Sign up failed: ${res.statusText}`);
    }
    return (await res.json()) as AuthResult;
  }

  async logIn(input: { email: string; password: string }): Promise<AuthResult> {
    const res = await this.authFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error ?? (body as any).message ?? `Log in failed: ${res.statusText}`);
    }
    return (await res.json()) as AuthResult;
  }

  // Real server (Memoona's auth.ts) requires Authorization header on logout
  async logOut(): Promise<{ ok: true }> {
    const res = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
    // Treat 401 as success locally — token already invalid, proceed with local logout
    if (!res.ok && res.status !== 401) {
      throw new Error(`Log out failed: ${res.statusText}`);
    }
    return { ok: true };
  }

  // ── Devices ─────────────────────────────────────────────────────────────

  async listDevices(): Promise<{ devices: CloudDevice[] }> {
    return this.fetchWithAuth<{ devices: CloudDevice[] }>("/devices", this.token ?? "");
  }

  async revokeDevice(id: string): Promise<{ ok: true }> {
    return this.fetchWithAuth<{ ok: true }>(`/devices/${id}/revoke`, this.token ?? "", {
      method: "POST",
    });
  }

  // ── Sync ────────────────────────────────────────────────────────────────

  /** Push local changes to the cloud. Token must be set first. */
  async pushChanges(changes: object[]): Promise<unknown> {
    return this.fetchWithAuth("/sync/push", this.token ?? "", {
      method: "POST",
      body: JSON.stringify({ changes }),
    });
  }

  /** Pull remote changes since cursor. Returns { changes, nextCursor, hasMore }. */
  async pullChanges(cursor: string | null): Promise<unknown> {
    const q = encodeURIComponent(cursor ?? "0");
    return this.fetchWithAuth(`/sync/pull?cursor=${q}`, this.token ?? "");
  }

  // ── Health ───────────────────────────────────────────────────────────────

  async checkHealth(): Promise<{ ok: boolean; db_time?: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const body = await res.json().catch(() => ({})) as { ok?: boolean; db_time?: string; error?: string; message?: string };
      if (!res.ok) return { ok: false, error: body.error ?? body.message ?? `API returned ${res.status}` };
      return { ...body, ok: body.ok === true };
    } catch {
      return { ok: false, error: `Cannot connect to ${this.baseUrl}` };
    }
  }

  private async authFetch(path: string, options: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, options);
    } catch {
      throw new Error(
        `Can't connect to the sign-in server at ${this.baseUrl}. Start the Code Hands backend and check its CORS settings, then try again.`
      );
    }
  }

  // ── Internal helper ──────────────────────────────────────────────────────

  /** Generic authenticated fetch — intercepts 401 and fires onTokenExpired */
  async fetchWithAuth<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers as object | undefined),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      if (this.onTokenExpired) this.onTokenExpired();
      throw new Error("Token expired or revoked");
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as any).error ?? `Cloud request failed: ${res.statusText}`);
    }
    return (await res.json()) as T;
  }
}

export const cloudApi = new CloudApiClient();

