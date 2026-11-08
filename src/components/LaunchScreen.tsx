import logoImg from "../assets/codehands-logo.png";

interface LaunchScreenProps {
  onStart: () => void;
}

export function LaunchScreen({ onStart }: LaunchScreenProps) {
  return (
    <div className="launch-screen-container">
      <div className="launch-card">
        <div className="launch-logo-box">
          <img src={logoImg} alt="CodeHands AI" className="launch-logo-img" />
        </div>
        <h2>Welcome to CodeHands AI</h2>
        <p className="launch-desc">
          Your autonomous engineering workspace. Connect local repositories, configure AI
          model routing, and orchestrate complex development tasks with full developer review.
        </p>

        <div className="launch-features-list">
          <div className="feature-item">
            <span className="feature-dot" />
            <div>
              <strong>Local-First & Private</strong>
              <p>Repositories and credentials remain secured on your device.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            <div>
              <strong>Autonomous Multi-Agent Routing</strong>
              <p>Specialized models for analyze, plan, implement, and review.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            <div>
              <strong>Developer Review Gate</strong>
              <p>Inspect staged files and full code diffs before commits.</p>
            </div>
          </div>
        </div>

        <button className="btn-primary launch-start-btn" onClick={onStart}>
          Enter Engineering Workspace
        </button>
      </div>
    </div>
  );
}
