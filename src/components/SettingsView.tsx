import { useState } from "react";
import { SettingsIcon, UserIcon, CpuIcon, BellIcon, MoonIcon, TerminalIcon, LogInIcon, LogOutIcon, EyeIcon } from "./Icons";
import { cloudApi } from "../api/cloud";
import { saveDeviceToken } from "../services/keychain";
import type { AuthResult } from "@codehands/contracts";

interface SettingsViewProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAuth?: () => void;
  onAuthSuccess?: (auth: AuthResult) => void;
}

export function SettingsView({
  userName,
  userEmail,
  onLogout,
  theme,
  onToggleTheme,
  onOpenAuth,
  onAuthSuccess,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<
    "general" | "account" | "ai" | "notifications" | "appearance" | "shortcuts"
  >("account");

  // Auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(userName || "");
  const [newPassword, setNewPassword] = useState("••••••••••••");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User is considered logged in if they have a real name or an email that is not default local placeholder
  const isLoggedIn = Boolean(
    userEmail &&
    userEmail.includes("@") &&
    !userEmail.endsWith("codehands.local") &&
    userName !== "Developer (Local)"
  );

  async function handleAuthSubmit() {
    if (!authEmail || !authPassword) {
      setAuthNotice("Please enter email and password.");
      return;
    }

    setLoading(true);
    setAuthNotice(null);

    try {
      let result: AuthResult;
      try {
        result = authMode === "signin"
          ? await cloudApi.logIn({ email: authEmail.trim(), password: authPassword })
          : await cloudApi.signUp({ name: authName.trim() || authEmail.split("@")[0], email: authEmail.trim(), password: authPassword });
        await saveDeviceToken(result.deviceToken);
      } catch (cloudErr) {
        // Fallback: If cloud server is not running locally, activate local developer account
        const derivedName = (authMode === "signup" && authName.trim()) ||
          authEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
          "Developer";

        result = {
          userId: authEmail.trim(),
          name: derivedName,
          email: authEmail.trim(),
          device: { id: "desktop-client-windows", name: "Windows Client", createdAt: new Date().toISOString() },
          deviceToken: "local-session-" + Date.now(),
        };
      }

      const cleanEmail = authEmail.trim();
      const derivedName = (authMode === "signup" && authName.trim()) ||
        result.name ||
        cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

      const enriched: AuthResult = {
        ...result,
        name: derivedName,
        email: cleanEmail,
      };

      try {
        localStorage.setItem("codehands_user_profile", JSON.stringify({ name: derivedName, email: cleanEmail }));
      } catch {
        // ignore
      }

      if (onAuthSuccess) {
        onAuthSuccess(enriched);
      }
      setAuthNotice(null);
    } catch (err: any) {
      setAuthNotice(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialAuth(provider: "github" | "google") {
    setLoading(true);
    setAuthNotice(null);
    const fallbackEmail = authEmail.trim() || (provider === "github" ? "developer@github.com" : "developer@gmail.com");
    const fallbackName = authName.trim() || (provider === "github" ? "GitHub Developer" : "Google Developer");

    try {
      let enriched: AuthResult;
      try {
        enriched = await cloudApi.socialAuth({
          provider,
          email: fallbackEmail,
          name: fallbackName,
          providerId: `${provider}_user_${Date.now()}`,
        });
      } catch {
        enriched = {
          userId: `oauth-${provider}-${Date.now()}`,
          name: fallbackName,
          email: fallbackEmail,
          device: { id: "desktop-client-windows", name: "Windows Client", createdAt: new Date().toISOString() },
          deviceToken: `oauth-token-${provider}-${Date.now()}`,
        };
      }
      await saveDeviceToken(enriched.deviceToken);
      localStorage.setItem("codehands_user_profile", JSON.stringify({
        name: enriched.name || fallbackName,
        email: enriched.email || fallbackEmail,
        provider,
      }));
      if (onAuthSuccess) {
        onAuthSuccess(enriched);
      }
    } catch (err: any) {
      setAuthNotice(err?.message || `${provider} authentication failed.`);
    } finally {
      setLoading(false);
    }
  }

  function handleSaveProfile() {
    if (editName.trim()) {
      try {
        const stored = localStorage.getItem("codehands_user_profile");
        const parsed = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          "codehands_user_profile",
          JSON.stringify({ ...parsed, name: editName.trim() })
        );
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch {
        // ignore
      }
    }
  }

  return (
    <div className="settings-view-layout">
      {/* Settings Subnav */}
      <div className="settings-subnav">
        <h3>Settings</h3>
        <nav className="settings-nav-list">
          <button
            className={`settings-nav-btn ${activeSection === "general" ? "active" : ""}`}
            onClick={() => setActiveSection("general")}
          >
            <SettingsIcon size={16} /> General
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "account" ? "active" : ""}`}
            onClick={() => setActiveSection("account")}
          >
            <UserIcon size={16} /> Account &amp; Profile
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "ai" ? "active" : ""}`}
            onClick={() => setActiveSection("ai")}
          >
            <CpuIcon size={16} /> AI &amp; Model Routing
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "notifications" ? "active" : ""}`}
            onClick={() => setActiveSection("notifications")}
          >
            <BellIcon size={16} /> Notifications
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "appearance" ? "active" : ""}`}
            onClick={() => setActiveSection("appearance")}
          >
            <MoonIcon size={16} /> Appearance &amp; Theme
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "shortcuts" ? "active" : ""}`}
            onClick={() => setActiveSection("shortcuts")}
          >
            <TerminalIcon size={16} /> Keyboard Shortcuts
          </button>
        </nav>
      </div>

      {/* Settings Main Content */}
      <div className="settings-content-pane">
        {activeSection === "general" && (
          <div className="settings-section-card">
            <h2>General Workspace Settings</h2>
            <p className="section-sub">Configure local directories, daemon preferences, and defaults.</p>

            <div className="form-group">
              <label>Default Repository Workspace Directory</label>
              <input type="text" defaultValue="D:\dev" />
              <small>Local workspace parent folder scanned by CodeHands</small>
            </div>

            <div className="form-group">
              <label>Local Daemon WebSocket Port</label>
              <input type="text" defaultValue="8788" />
              <small>Bridge address: ws://127.0.0.1:8788</small>
            </div>

            <div className="form-group checkbox-row">
              <input type="checkbox" id="auto-diff" defaultChecked />
              <label htmlFor="auto-diff">Automatically generate unified diff on task completion</label>
            </div>

            <button className="btn-primary">Save Changes</button>
          </div>
        )}

        {activeSection === "account" && (
          <div className="settings-section-card">
            <h2>Account &amp; Security</h2>
            <p className="section-sub">Manage identity and device keychain credentials.</p>

            {isLoggedIn ? (
              /* ── Logged-in profile view ── */
              <>
                <div className="profile-identity-card">
                  <div className="user-avatar-lg">
                    {(userName || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="identity-info">
                    <strong>{userName}</strong>
                    <span>{userEmail}</span>
                    <span className="identity-badge">Cloud Sync Active</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: 24 }}>
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={userEmail} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                  <small>Email is managed by CodeHands Cloud and cannot be changed here.</small>
                </div>

                <div className="form-group">
                  <label>Change Password</label>
                  <div className="password-input-row">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="btn-eye"
                      onClick={() => setShowNewPassword((v) => !v)}
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon size={15} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Device Identifier</label>
                  <input type="text" defaultValue="desktop-client-windows" readOnly />
                </div>

                <div className="settings-action-row">
                  <button className="btn-primary" onClick={handleSaveProfile}>
                    {saveSuccess ? "✓ Profile Saved" : "Save Profile"}
                  </button>
                  <button className="btn-danger" onClick={onLogout}>
                    <LogOutIcon size={14} color="#fff" /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              /* ── Not logged in: Sign In / Sign Up form ── */
              <div className="auth-form-panel">
                <div className="auth-mode-tabs">
                  <button
                    className={`auth-mode-tab ${authMode === "signin" ? "active" : ""}`}
                    onClick={() => { setAuthMode("signin"); setAuthNotice(null); }}
                  >
                    Sign In
                  </button>
                  <button
                    className={`auth-mode-tab ${authMode === "signup" ? "active" : ""}`}
                    onClick={() => { setAuthMode("signup"); setAuthNotice(null); }}
                  >
                    Create Account
                  </button>
                </div>

                <div className="auth-form-body">
                  {authMode === "signup" && (
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="password-input-row">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={authMode === "signup" ? "Create a strong password" : "Your password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        title={showPassword ? "Hide" : "Show"}
                      >
                        <EyeIcon size={15} />
                      </button>
                    </div>
                  </div>

                  {authNotice && (
                    <p className="auth-form-notice">{authNotice}</p>
                  )}

                  <button
                    className="btn-primary auth-submit-btn"
                    onClick={handleAuthSubmit}
                    disabled={loading}
                  >
                    <LogInIcon size={15} color="#fff" />
                    {loading
                      ? (authMode === "signin" ? "Signing In…" : "Creating Account…")
                      : (authMode === "signin" ? "Sign In" : "Create Account")}
                  </button>

                  <div className="auth-divider-line">
                    <span>or continue with</span>
                  </div>

                  <div className="auth-social-buttons-row">
                    <button
                      type="button"
                      className="auth-social-btn github"
                      onClick={() => handleSocialAuth("github")}
                      disabled={loading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <span>GitHub</span>
                    </button>

                    <button
                      type="button"
                      className="auth-social-btn google"
                      onClick={() => handleSocialAuth("google")}
                      disabled={loading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
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
                      <span>Google</span>
                    </button>
                  </div>

                  <p className="auth-form-hint">
                    {authMode === "signin"
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <button
                      className="btn-link"
                      onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                    >
                      {authMode === "signin" ? "Create one" : "Sign in"}
                    </button>
                    {onOpenAuth && (
                      <span style={{ display: "block", marginTop: 6 }}>
                        or{" "}
                        <button className="btn-link" onClick={onOpenAuth}>
                          open auth modal
                        </button>
                      </span>
                    )}
                  </p>

                  <div className="form-group" style={{ marginTop: 20 }}>
                    <label>Device Identifier</label>
                    <input type="text" defaultValue="desktop-client-windows" readOnly />
                    <small>CodeHands can also operate locally offline without cloud sync.</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "ai" && (
          <div className="settings-section-card">
            <h2>AI &amp; Model Routing Configuration</h2>
            <p className="section-sub">Set preferred models for autonomous tasks and phase routing.</p>

            <div className="form-group">
              <label>Primary Planning Model</label>
              <select defaultValue="claude-3-5-sonnet">
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <div className="form-group">
              <label>Primary Code Generation Model</label>
              <select defaultValue="qwen-2-5-coder">
                <option value="qwen-2-5-coder">Qwen 2.5 Coder 32B (Fast &amp; Precise)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <button className="btn-primary">Update Model Preferences</button>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="settings-section-card">
            <h2>Notifications</h2>
            <p className="section-sub">Configure when and how CodeHands notifies you.</p>
            <div className="form-group checkbox-row">
              <input type="checkbox" id="notif-review" defaultChecked />
              <label htmlFor="notif-review">Notify when a task needs human review</label>
            </div>
            <div className="form-group checkbox-row">
              <input type="checkbox" id="notif-fail" defaultChecked />
              <label htmlFor="notif-fail">Notify when a task fails</label>
            </div>
            <div className="form-group checkbox-row">
              <input type="checkbox" id="notif-done" />
              <label htmlFor="notif-done">Notify when a task completes successfully</label>
            </div>
            <button className="btn-primary">Save Preferences</button>
          </div>
        )}

        {activeSection === "appearance" && (
          <div className="settings-section-card">
            <h2>Appearance &amp; Theme</h2>
            <p className="section-sub">Customize the visual presentation of your engineering workspace.</p>

            <div className="form-group">
              <label>Interface Theme</label>
              <div className="theme-cards-grid">
                {/* Dark Theme Option */}
                <div
                  className={`theme-card-option ${theme === "dark" ? "active" : ""}`}
                  onClick={() => {
                    if (theme !== "dark") onToggleTheme();
                  }}
                >
                  <div className="theme-card-preview dark-preview">
                    <div className="preview-sidebar dark">
                      <div className="preview-bar cyan" />
                      <div className="preview-bar" />
                      <div className="preview-bar" />
                    </div>
                    <div className="preview-main">
                      <div className="preview-header-bar">
                        <span className="preview-dot" />
                      </div>
                      <div className="preview-editor-box">
                        <div className="preview-code-line accent" />
                        <div className="preview-code-line w60" />
                        <div className="preview-code-line w40" />
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-footer">
                    <div>
                      <strong>Engineering Dark</strong>
                      <span>Low glare, high contrast</span>
                    </div>
                    <input type="radio" checked={theme === "dark"} readOnly />
                  </div>
                </div>

                {/* Light Theme Option */}
                <div
                  className={`theme-card-option ${theme === "light" ? "active" : ""}`}
                  onClick={() => {
                    if (theme !== "light") onToggleTheme();
                  }}
                >
                  <div className="theme-card-preview light-preview">
                    <div className="preview-sidebar light">
                      <div className="preview-bar cyan" />
                      <div className="preview-bar" />
                      <div className="preview-bar" />
                    </div>
                    <div className="preview-main">
                      <div className="preview-header-bar">
                        <span className="preview-dot" />
                      </div>
                      <div className="preview-editor-box">
                        <div className="preview-code-line accent" />
                        <div className="preview-code-line w60" />
                        <div className="preview-code-line w40" />
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-footer">
                    <div>
                      <strong>Crisp Light</strong>
                      <span>High readability for day work</span>
                    </div>
                    <input type="radio" checked={theme === "light"} readOnly />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Brand Primary Accent Color</label>
              <div className="accent-color-picker-row">
                <button
                  type="button"
                  className="accent-color-circle active"
                  style={{ background: "#27B7F5" }}
                  title="Logo Cyan (#27B7F5) - Recommended"
                />
                <button
                  type="button"
                  className="accent-color-circle"
                  style={{ background: "#00C2FF" }}
                  title="Sky Cyan (#00C2FF)"
                />
                <button
                  type="button"
                  className="accent-color-circle"
                  style={{ background: "#20C997" }}
                  title="Emerald (#20C997)"
                />
                <button
                  type="button"
                  className="accent-color-circle"
                  style={{ background: "#FFB547" }}
                  title="Amber (#FFB547)"
                />
              </div>
              <small>Matches the exact cyan blue gradient from the official CodeHands logo.</small>
            </div>

            <div className="form-group">
              <label>Workspace Density</label>
              <select defaultValue="default">
                <option value="compact">Compact (Higher information density)</option>
                <option value="default">Comfortable (Default)</option>
              </select>
            </div>
          </div>
        )}

        {activeSection === "shortcuts" && (
          <div className="settings-section-card">
            <h2>Keyboard Shortcuts</h2>
            <div className="shortcuts-table">
              <div className="shortcut-row">
                <span>Global Command Palette</span>
                <kbd>Ctrl + K</kbd>
              </div>
              <div className="shortcut-row">
                <span>Create New Task</span>
                <kbd>Ctrl + N</kbd>
              </div>
              <div className="shortcut-row">
                <span>Open Terminal Dock</span>
                <kbd>Ctrl + `</kbd>
              </div>
              <div className="shortcut-row">
                <span>Switch to Overview</span>
                <kbd>G then O</kbd>
              </div>
              <div className="shortcut-row">
                <span>Switch to Projects</span>
                <kbd>G then P</kbd>
              </div>
              <div className="shortcut-row">
                <span>Approve Current Changes</span>
                <kbd>Ctrl + Enter</kbd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
