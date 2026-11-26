import type { ReactNode } from "react";
import { parseDiffToFiles } from "../utils/dynamicDiff";
import type { DesktopSession } from "./TaskDetail";

/** Marks anything on screen that is made-up sample content, so nobody mistakes it for real data. */
export function DemoTag({ label = "Demo data" }: { label?: string }) {
  return <span className="demo-tag">{label}</span>;
}

export function DemoNote({ children, danger = false, label }: { children: ReactNode; danger?: boolean; label?: string }) {
  return (
    <div className={`demo-note${danger ? " danger" : ""}`}>
      <DemoTag label={label} />
      <span>{children}</span>
    </div>
  );
}

/** True when the daemon stored a diff for this task that the app can read. Otherwise the Changes tab shows sample code. */
export function hasRealDiff(session: DesktopSession | undefined): boolean {
  return Boolean(session?.diff?.trim()) && parseDiffToFiles(session!.diff as string, session!.id).length > 0;
}
