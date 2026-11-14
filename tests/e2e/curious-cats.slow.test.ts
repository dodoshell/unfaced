import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getVideoMetadata } from "@remotion/renderer";
import { describe, expect, it } from "vitest";
import { defaultMakeDeps, makeVideo } from "../../engine/src/cli/make.js";
import type { VideoPlan } from "../../engine/src/plan/types.js";

const page = join(import.meta.dirname, "..", "..", "examples", "pages", "curious-cats");

// The whole free pipeline for real: voice, whisper, plan, render. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("curious-cats sample page (slow)", () => {
  it.each(["why-cats-purr", "cats-and-milk"])(
    "makes %s as a 1080×1920 30 fps H.264/AAC video as long as its plan that passes every check, then reuses the voice",
    async (name) => {
      const video = join(page, "videos", name);
      const logs: string[] = [];
      const deps = { ...defaultMakeDeps(), log: (m: string) => logs.push(m) };

      await makeVideo(video, deps);
      const plan = JSON.parse(readFileSync(join(video, "plan.json"), "utf8")) as VideoPlan;
      const meta = await getVideoMetadata(join(video, "video.mp4"));
      expect([meta.width, meta.height, meta.fps]).toEqual([1080, 1920, 30]);
      expect(meta.codec).toBe("h264");
      expect(meta.audioCodec).toBe("aac");
      expect(Math.abs((meta.durationInSeconds ?? 0) - plan.durationInFrames / 30)).toBeLessThanOrEqual(0.2);
      expect(logs.join("\n")).not.toMatch(/No spoken words|shares that scene|asks for/);
      expect(JSON.parse(readFileSync(join(video, "check.json"), "utf8"))).toEqual({ pass: true, issues: [] });

      logs.length = 0;
      await makeVideo(video, deps);
      expect(logs.join("\n")).toContain("Voice-over unchanged");
    },
    1_800_000,
  );
});
