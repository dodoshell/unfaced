export type CheckName =
  | "overlap"
  | "safe-zone"
  | "sync"
  | "black-frame"
  | "frozen-frame"
  | "loudness"
  | "clipping"
  | "cut-word"
  | "post-safe-area"
  | "post-overlap"
  | "contrast"
  | "cover-crop";

/** One problem found in a made video, at a time from its start (a post's issues are at 0 and name the slide). */
export interface CheckIssue {
  check: CheckName;
  atMs: number;
  severity: "error" | "warning";
  message: string;
}

/** What `unfaced check` writes to check.json; any error fails the video. */
export interface CheckReport {
  pass: boolean;
  issues: CheckIssue[];
}

export function toReport(issues: CheckIssue[]): CheckReport {
  const sorted = [...issues].sort((a, b) => a.atMs - b.atMs);
  return { pass: !sorted.some((i) => i.severity === "error"), issues: sorted };
}

export const frameMs = (frame: number, fps: number): number => (frame / fps) * 1000;
