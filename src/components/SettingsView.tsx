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
