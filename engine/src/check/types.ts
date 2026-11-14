export type CheckName = "overlap" | "safe-zone" | "sync" | "black-frame" | "frozen-frame" | "loudness" | "clipping" | "cut-word";

/** One problem found in a made video, at a time from its start. */
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
