import logoImg from "../assets/codehands-logo.png";

interface CodeHandsLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function CodeHandsLogo({ size = 32, showWordmark = false, className = "" }: CodeHandsLogoProps) {
  return (
    <div className={`codehands-logo-container ${showWordmark ? "with-wordmark" : ""} ${className}`}>
      <div
        className="codehands-logo-img-wrapper"
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.round(size * 0.25),
          overflow: "hidden",
          background: "#16171B",
          border: "1px solid #2D313A",
          flexShrink: 0,
        }}
      >
        <img
          src={logoImg}
          alt="CodeHands AI"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      {showWordmark && (
        <div className="codehands-brand-text">
          <span className="brand-name">
            CodeHands <span className="brand-accent">AI</span>
          </span>
          <span className="brand-tagline">Engineering work, orchestrated.</span>
        </div>
      )}
    </div>
  );
}
