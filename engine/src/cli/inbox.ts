import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkInbox, formatInboxLine, type Probe, probeMedia } from "../inbox/inbox.js";

/** `unfaced inbox`: one line per handed-off file and per prompt still waiting; fails when a file can't be used. */
export async function inboxReport(videoDir: string, probe: (path: string) => Promise<Probe> = probeMedia): Promise<{ lines: string[]; pass: boolean }> {
  const dir = resolve(videoDir);
  if (!existsSync(join(dir, "inbox"))) return { lines: [`No inbox/ in ${dir}: nothing handed off yet.`], pass: true };
  const lines = await checkInbox(dir, probe);
  if (lines.length === 0) return { lines: [`inbox/ in ${dir} is empty.`], pass: true };
  return { lines: lines.map(formatInboxLine), pass: lines.every((l) => l.status !== "problem") };
}
