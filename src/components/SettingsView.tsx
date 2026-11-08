import { useState } from "react";
import { SettingsIcon, UserIcon, CpuIcon, BellIcon, MoonIcon, TerminalIcon } from "./Icons";

interface SettingsViewProps {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export function SettingsView({ userName, userEmail, onLogout, theme, onToggleTheme }: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<
    "general" | "account" | "ai" | "notifications" | "appearance" | "shortcuts"
  >("general");

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
            <UserIcon size={16} /> Account & Profile
          </button>
          <button
            className={`settings-nav-btn ${activeSection === "ai" ? "active" : ""}`}
            onClick={() => setActiveSection("ai")}
          >
            <CpuIcon size={16} /> AI & Model Routing
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
            <MoonIcon size={16} /> Appearance & Theme
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
            <h2>Account & Security</h2>
            <p className="section-sub">Manage identity and device keychain credentials.</p>

            <div className="profile-identity-card">
              <div className="user-avatar-lg">
                {(userName || "Developer").slice(0, 1).toUpperCase()}
              </div>
              <div className="identity-info">
                <strong>{userName || "Local Developer Account"}</strong>
                <span>{userEmail || "OS Keychain Credentials Active"}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Device Identifier</label>
              <input type="text" defaultValue="desktop-client-windows" readOnly />
            </div>

            {userEmail && (
              <button className="btn-danger" onClick={onLogout}>
                Sign Out of Cloud Sync
              </button>
            )}
          </div>
        )}

        {activeSection === "ai" && (
          <div className="settings-section-card">
            <h2>AI & Model Routing Configuration</h2>
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
                <option value="qwen-2-5-coder">Qwen 2.5 Coder 32B (Fast & Precise)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <button className="btn-primary">Update Model Preferences</button>
          </div>
        )}

        {activeSection === "appearance" && (
          <div className="settings-section-card">
            <h2>Appearance & Theme</h2>
            <p className="section-sub">Customize the visual presentation of your engineering workspace.</p>

            <div className="theme-toggle-row">
              <div>
                <strong>Active Theme</strong>
                <p>Currently configured for Dark Grey Engineering theme.</p>
              </div>
              <button className="btn-secondary" onClick={onToggleTheme}>
                Toggle {theme === "dark" ? "Light" : "Dark"} Mode
              </button>
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
