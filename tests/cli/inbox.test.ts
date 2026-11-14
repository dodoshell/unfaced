import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inboxReport } from "../../engine/src/cli/inbox.js";

const tall = async () => ({ video: { codec: "png", width: 1080, height: 1920 }, durationSec: undefined });

describe("unfaced inbox", () => {
  it("prints one line per file and passes when nothing is wrong", async () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced inbox cli "));
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "b2.png"), "png");
    writeFileSync(join(video, "inbox", "PROMPTS.md"), "## b3.png\nA dog.\n");
    const { lines, pass } = await inboxReport(video, tall);
    expect(lines).toEqual(["ok       b2.png — image 1080×1920", "waiting  b3.png — no file yet; its prompt is in inbox/PROMPTS.md"]);
    expect(pass).toBe(true);
  });

  it("fails when a file can't be used", async () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced inbox cli "));
    mkdirSync(join(video, "inbox"));
    writeFileSync(join(video, "inbox", "b2.gif"), "gif");
    const { lines, pass } = await inboxReport(video, tall);
    expect(lines[0]).toMatch(/^problem {2}b2\.gif — unknown type/);
    expect(pass).toBe(false);
  });

  it("says so when the video has no inbox", async () => {
    const video = mkdtempSync(join(tmpdir(), "unfaced inbox cli "));
    const { lines, pass } = await inboxReport(video, tall);
    expect(lines).toEqual([`No inbox/ in ${video}: nothing handed off yet.`]);
    expect(pass).toBe(true);
  });
});
