import { useEffect, useState } from "react";
import type { AuthResult } from "@codehands/contracts";
import { cloudApi } from "../api/cloud";
import { saveDeviceToken } from "../services/keychain";

interface AuthModalProps {
  isOpen: boolean;
  isExpiredPrompt?: boolean;
  onSuccess: (auth: AuthResult) => void;
  onClose?: () => void;
}

export function AuthModal({ isOpen, isExpiredPrompt, onSuccess, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverAvailable, setServerAvailable] = useState<boolean | null>(null);
  const [serverIssue, setServerIssue] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    cloudApi.checkHealth().then(({ ok, error: issue }) => {
      if (active) {
        setServerAvailable(ok);
        setServerIssue(issue ?? null);
      }
    });
    return () => { active = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result =
        mode === "login"
          ? await cloudApi.logIn({ email: email.trim(), password })
          : await cloudApi.signUp({ name: name.trim(), email: email.trim(), password });

      // Store deviceToken securely in OS Keychain (COD-291)
      await saveDeviceToken(result.deviceToken);

      onSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        !message || message === "Failed to fetch" || message.includes("NetworkError")
          ? `Can't reach the sign-in server at ${cloudApi.getBaseUrl()}. Start the backend or configure VITE_CLOUD_URL.`
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{mode === "login" ? "Sign In to Code Hands" : "Create Code Hands Account"}</h2>
          {onClose && !isExpiredPrompt && (
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {isExpiredPrompt && (
          <div className="alert-warning">
            Your session token expired. Please sign in again to continue where you left off.
          </div>
        )}

        <p className="modal-description">
          {mode === "login" ? "Sign in to sync your account." : "Create an account to get started."}
        </p>

        {serverAvailable === false && (
          <div className="alert-warning" role="status">
            {serverIssue || `Sign-in server is unreachable at ${cloudApi.getBaseUrl()}. Check VITE_CLOUD_URL.`}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="authName">Name</label>
              <input
                id="authName"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={100}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="authEmail">Email</label>
            <input
              id="authEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="authPassword">Password</label>
            <input
              id="authPassword"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create account"}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          {mode === "login" ? (
            <p>
              Don’t have an account?{" "}
              <button type="button" className="btn-link" onClick={() => { setError(null); setMode("signup"); }}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button type="button" className="btn-link" onClick={() => { setError(null); setMode("login"); }}>
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

