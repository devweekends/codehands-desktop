import { useState } from "react";

interface OAuthPopupWindowProps {
  provider: "google" | "github";
}

export function OAuthPopupWindow({ provider }: OAuthPopupWindowProps) {
  // Common states
  const [step, setStep] = useState<"account_select" | "enter_credentials" | "authorizing">("account_select");
  const [email, setEmail] = useState(
    provider === "google" ? "rajpoottania299@gmail.com" : "tania-ashraf"
  );
  const [name, setName] = useState(
    provider === "google" ? "Tania Ashraf" : "Tania Ashraf"
  );
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const completeOAuth = (userEmail: string, userName: string, customProviderId?: string) => {
    setLoading(true);
    setTimeout(() => {
      const payload = {
        provider,
        email: userEmail,
        name: userName,
        providerId: customProviderId || `${provider}_${Date.now()}`,
        avatarUrl:
          provider === "google"
            ? "https://lh3.googleusercontent.com/a/default-user=s96-c"
            : "https://avatars.githubusercontent.com/u/583231?v=4",
      };

      if (window.opener) {
        window.opener.postMessage(
          {
            type: "CODEHANDS_OAUTH_SUCCESS",
            payload,
          },
          "*"
        );
        window.close();
      } else {
        // Fallback if not opened in popup: redirect back with params
        window.location.href = `/?oauth_success=1&provider=${provider}&email=${encodeURIComponent(
          userEmail
        )}&name=${encodeURIComponent(userName)}`;
      }
    }, 600);
  };

  if (provider === "google") {
    return (
      <div className="google-auth-window-container">
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: #f0f4f9;
            font-family: 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            color: #1f1f1f;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .google-auth-card {
            background: #ffffff;
            border-radius: 28px;
            width: 440px;
            max-width: 92vw;
            padding: 40px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            box-sizing: border-box;
          }
          .google-header-logo {
            margin-bottom: 16px;
          }
          .google-title {
            font-size: 24px;
            font-weight: 400;
            margin: 0 0 8px 0;
            color: #1f1f1f;
          }
          .google-subtitle {
            font-size: 15px;
            color: #444746;
            margin: 0 0 28px 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .google-app-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #e8f0fe;
            color: #1a73e8;
            padding: 2px 10px;
            border-radius: 12px;
            font-weight: 500;
            font-size: 13px;
          }
          .google-account-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
          }
          .google-account-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            border-radius: 16px;
            border: 1px solid #e0e2ec;
            background: #ffffff;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease;
            text-align: left;
            width: 100%;
          }
          .google-account-item:hover {
            background: #f8fafd;
            border-color: #1a73e8;
          }
          .google-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #1a73e8;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 500;
            font-size: 16px;
            flex-shrink: 0;
          }
          .google-account-info {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            flex: 1;
          }
          .google-account-name {
            font-size: 14px;
            font-weight: 500;
            color: #1f1f1f;
          }
          .google-account-email {
            font-size: 13px;
            color: #444746;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .google-input-group {
            margin-bottom: 20px;
          }
          .google-input-label {
            display: block;
            font-size: 13px;
            color: #444746;
            margin-bottom: 6px;
          }
          .google-input {
            width: 100%;
            box-sizing: border-box;
            padding: 14px 16px;
            border-radius: 8px;
            border: 1px solid #747775;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s ease;
          }
          .google-input:focus {
            border-color: #1a73e8;
            border-width: 2px;
            padding: 13px 15px;
          }
          .google-actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 12px;
            margin-top: 32px;
          }
          .google-btn-secondary {
            background: transparent;
            color: #1a73e8;
            border: none;
            padding: 10px 18px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }
          .google-btn-secondary:hover {
            background: #f0f4f9;
          }
          .google-btn-primary {
            background: #1a73e8;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s ease, box-shadow 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .google-btn-primary:hover {
            background: #1557b0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .google-footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e0e2ec;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #444746;
          }
          .google-footer a {
            color: #444746;
            text-decoration: none;
          }
          .google-footer a:hover {
            text-decoration: underline;
          }
          .google-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top-color: #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div className="google-auth-card">
          {/* Official Google G Logo */}
          <div className="google-header-logo">
            <svg width="40" height="40" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h1 className="google-title">Sign in with Google</h1>
          <div className="google-subtitle">
            to continue to <span className="google-app-pill">CodeHands AI</span>
          </div>

          {step === "account_select" ? (
            <>
              <div className="google-account-list">
                <button
                  type="button"
                  className="google-account-item"
                  onClick={() => completeOAuth("rajpoottania299@gmail.com", "Tania Ashraf")}
                  disabled={loading}
                >
                  <div className="google-avatar">T</div>
                  <div className="google-account-info">
                    <span className="google-account-name">Tania Ashraf</span>
                    <span className="google-account-email">rajpoottania299@gmail.com</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="google-account-item"
                  onClick={() => completeOAuth("developer@codehands.dev", "CodeHands Developer")}
                  disabled={loading}
                >
                  <div className="google-avatar" style={{ background: "#0b57d0" }}>C</div>
                  <div className="google-account-info">
                    <span className="google-account-name">CodeHands Developer</span>
                    <span className="google-account-email">developer@codehands.dev</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="google-account-item"
                  style={{ borderStyle: "dashed" }}
                  onClick={() => setStep("enter_credentials")}
                  disabled={loading}
                >
                  <div className="google-avatar" style={{ background: "#747775" }}>+</div>
                  <div className="google-account-info">
                    <span className="google-account-name">Use another account</span>
                    <span className="google-account-email">Sign in with custom Google ID</span>
                  </div>
                </button>
              </div>

              <div className="google-actions">
                <button
                  type="button"
                  className="google-btn-secondary"
                  onClick={() => window.close()}
                  disabled={loading}
                >
                  Cancel
                </button>
                {loading && (
                  <button type="button" className="google-btn-primary" disabled>
                    <span className="google-spinner" />
                    Signing in...
                  </button>
                )}
              </div>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                completeOAuth(email, name);
              }}
            >
              <div className="google-input-group">
                <label className="google-input-label">Full Name</label>
                <input
                  type="text"
                  className="google-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="google-input-group">
                <label className="google-input-label">Email or Phone</label>
                <input
                  type="email"
                  className="google-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="google-input-group">
                <label className="google-input-label">Password</label>
                <input
                  type="password"
                  className="google-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="google-actions">
                <button
                  type="button"
                  className="google-btn-secondary"
                  onClick={() => setStep("account_select")}
                  disabled={loading}
                >
                  Back
                </button>
                <button type="submit" className="google-btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="google-spinner" />
                      Signing in...
                    </>
                  ) : (
                    "Next"
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="google-footer">
            <span>English (United States)</span>
            <div style={{ display: "flex", gap: "12px" }}>
              <a href="https://support.google.com" target="_blank" rel="noreferrer">Help</a>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy</a>
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GitHub Auth Window
  return (
    <div className="github-auth-window-container">
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: #0d1117;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
          color: #e6edf3;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .github-auth-card {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 12px;
          width: 480px;
          max-width: 92vw;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          box-sizing: border-box;
        }
        .github-octocat-head {
          text-align: center;
          margin-bottom: 20px;
        }
        .github-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
          text-align: center;
          color: #f0f6fc;
        }
        .github-sub {
          font-size: 14px;
          color: #8b949e;
          text-align: center;
          margin: 0 0 24px 0;
        }
        .github-app-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #21262d;
          border: 1px solid #30363d;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .github-scopes-list {
          border: 1px solid #30363d;
          border-radius: 8px;
          padding: 14px 18px;
          margin-bottom: 24px;
          background: #0d1117;
        }
        .github-scope-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: #c9d1d9;
          margin-bottom: 8px;
        }
        .github-scope-item:last-child {
          margin-bottom: 0;
        }
        .github-btn-primary {
          width: 100%;
          background: #238636;
          color: #ffffff;
          border: 1px solid rgba(240, 246, 252, 0.1);
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease;
        }
        .github-btn-primary:hover {
          background: #2ea043;
        }
        .github-btn-secondary {
          width: 100%;
          background: transparent;
          color: #8b949e;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 10px;
        }
        .github-btn-secondary:hover {
          color: #f0f6fc;
          text-decoration: underline;
        }
        .github-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      <div className="github-auth-card">
        <div className="github-octocat-head">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="#f0f6fc">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </div>

        <h1 className="github-title">Authorize CodeHands AI</h1>
        <p className="github-sub">
          <strong>devweekends/codehands</strong> would like to connect with your GitHub account.
        </p>

        <div className="github-app-badge">
          <span style={{ fontSize: "20px" }}>⚡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#f0f6fc" }}>CodeHands Desktop Orchestrator</div>
            <div style={{ fontSize: "12px", color: "#8b949e" }}>by devweekends · Verified App</div>
          </div>
        </div>

        <div className="github-scopes-list">
          <div className="github-scope-item">
            <span style={{ color: "#3fb950" }}>✓</span>
            <span>Verify your GitHub identity (<strong>{name || "tania-ashraf"}</strong>)</span>
          </div>
          <div className="github-scope-item">
            <span style={{ color: "#3fb950" }}>✓</span>
            <span>Access your public and verified email addresses</span>
          </div>
          <div className="github-scope-item">
            <span style={{ color: "#3fb950" }}>✓</span>
            <span>Sync repository pull requests & reviews</span>
          </div>
        </div>

        <button
          type="button"
          className="github-btn-primary"
          onClick={() => completeOAuth(email, name, "gh_user_tania")}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="github-spinner" />
              Authorizing GitHub...
            </>
          ) : (
            "Authorize devweekends"
          )}
        </button>

        <button
          type="button"
          className="github-btn-secondary"
          onClick={() => window.close()}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
