import { useEffect, useState } from "react";
import logoImg from "../assets/codehands-logo.png";

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export function SplashScreen({ onFinish, minDurationMs = 1500 }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const closeTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(closeTimer);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  return (
    <div className={`splash-screen-overlay ${fading ? "fade-out" : ""}`}>
      <div className="splash-content-box">
        <div className="splash-logo-wrapper">
          <img src={logoImg} alt="CodeHands AI" className="splash-logo-image" />
        </div>
        <h1 className="splash-brand-title">
          CodeHands <span className="splash-accent">AI</span>
        </h1>
        <p className="splash-tagline">Engineering work, orchestrated.</p>
        <div className="splash-loader-bar">
          <div className="splash-loader-indicator" />
        </div>
        <span className="splash-status-text">Initializing local workspace & daemon bridge...</span>
      </div>
    </div>
  );
}
