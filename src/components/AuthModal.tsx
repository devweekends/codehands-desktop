import { useState } from "react";
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
  const [githubCode, setGithubCode] = useState("gho_mock_code_123");
  const [deviceName, setDeviceName] = useState("laptop-A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input = { githubCode, deviceName };
      const result =
        mode === "login" ? await cloudApi.logIn(input) : await cloudApi.signUp(input);

      // Store deviceToken securely in OS Keychain (COD-291)
      await saveDeviceToken(result.deviceToken);

      onSuccess(result);
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Check if C3 mock server is running.");
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
          Authenticate with the C3 Cloud API to obtain a device token for this machine.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deviceName">Device Name (per laptop)</label>
            <input
              id="deviceName"
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. MacBook-Pro, ThinkPad-X1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="githubCode">GitHub OAuth Code</label>
            <input
              id="githubCode"
              type="text"
              value={githubCode}
              onChange={(e) => setGithubCode(e.target.value)}
              placeholder="GitHub authorization code"
              required
            />
            <small className="muted-text">Using mock OAuth code against local C3 mock.</small>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="modal-footer">
          {mode === "login" ? (
            <p>
              Need a new device account?{" "}
              <button className="btn-link" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button className="btn-link" onClick={() => setMode("login")}>
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

