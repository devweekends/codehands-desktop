// Client for the C3 Cloud API (codehands-backend)
import type { CloudAuth, AuthResult } from "@codehands/contracts";

const DEFAULT_CLOUD_URL = "http://localhost:4000";

export class CloudApiClient implements CloudAuth {
  private baseUrl: string;
  private onTokenExpired?: () => void;

  constructor(baseUrl = DEFAULT_CLOUD_URL, onTokenExpired?: () => void) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.onTokenExpired = onTokenExpired;
  }

  setExpiredHandler(handler: () => void) {
    this.onTokenExpired = handler;
  }

  async signUp(input: { githubCode: string; deviceName: string }): Promise<AuthResult> {
    const res = await fetch(`${this.baseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Sign up failed: ${res.statusText}`);
    }

    return (await res.json()) as AuthResult;
  }

  async logIn(input: { githubCode: string; deviceName: string }): Promise<AuthResult> {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Log in failed: ${res.statusText}`);
    }

    return (await res.json()) as AuthResult;
  }

  async logOut(): Promise<{ ok: true }> {
    const res = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Log out failed: ${res.statusText}`);
    }

    return (await res.json()) as { ok: true };
  }

  // Wrapper for authenticated cloud calls that intercepts expired tokens (COD-291)
  async fetchWithAuth<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      if (this.onTokenExpired) {
        this.onTokenExpired();
      }
      throw new Error("Token expired");
    }

    if (!res.ok) {
      throw new Error(`Cloud request failed: ${res.statusText}`);
    }

    return (await res.json()) as T;
  }
}

export const cloudApi = new CloudApiClient();

