import type { DesktopSession, SessionEvent } from "./TaskDetail";
import { DemoTag } from "./Demo";

const STEPS = ["Understand", "Plan", "Build", "Test", "Review"] as const;
type StepState = "done" | "active" | "waiting" | "failed" | "";

/** Which step each daemon event belongs to. */
const EVENT_STEP: Record<string, number> = { "step.analyze": 0, "step.plan": 1, "step.implement": 2, "step.test": 3, "step.review": 4 };

/**
 * The five-step track. Where the daemon sent step events it follows them. Otherwise it is a guess from the task's
 * status, and says so. "Test" only turns green when the daemon reported a test step: a green bar must not suggest
 * that tests ran when nothing says they did.
 */
export function stepStates(session: DesktopSession, events: SessionEvent[] = []): { states: StepState[]; estimated: boolean } {
  const reached = events.reduce((max, e) => Math.max(max, EVENT_STEP[e.eventType] ?? -1), -1);
  const tested = events.some((e) => e.eventType === "step.test");
  const status = session.status as string;
  const upTo = (n: number, last: StepState): StepState[] => STEPS.map((_, i) => (i < n ? "done" : i === n ? last : ""));
  const withHonestTest = (states: StepState[]): StepState[] => states.map((s, i) => (i === 3 && s === "done" && !tested ? "" : s));

  if (status === "queued") return { states: upTo(-1, ""), estimated: false };
  if (status === "awaiting_approval") return { states: withHonestTest(upTo(4, "waiting")), estimated: reached < 0 };
  if (status === "approved" || status === "finished") return { states: withHonestTest(upTo(5, "")), estimated: reached < 0 };
  const current = reached >= 0 ? reached : 1;
  const last: StepState = status === "failed" || status === "rejected" ? "failed" : status === "stopped" ? "waiting" : "active";
  return { states: withHonestTest(upTo(current, last)), estimated: reached < 0 };
}

export function Track({ session, events }: { session: DesktopSession; events?: SessionEvent[] }) {
  const { states, estimated } = stepStates(session, events);
  return (
    <div>
      <div className="progress-track">
        {STEPS.map((name, i) => (
          <div key={name} className={`progress-step ${states[i]}`}>
            <i />
            <span>{states[i] === "done" ? "✓ " : ""}{name}</span>
          </div>
        ))}
      </div>
      {estimated && (
        <div className="track-note"><DemoTag label="Estimated from status" /></div>
      )}
    </div>
  );
}
