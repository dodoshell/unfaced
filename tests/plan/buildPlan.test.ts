import { describe, expect, it, vi } from "vitest";
import type { Page } from "../../engine/src/page/types.js";
import { buildPlan } from "../../engine/src/plan/buildPlan.js";
import { parseScript } from "../../engine/src/script/parseScript.js";
import type { WordTiming } from "../../engine/src/timing/align.js";

const page: Page = {
  dir: "pages/curious-cats",
  name: "Curious Cats",
  language: "en",
  niche: "cat facts",
  choices: {},
  providers: { voice: "free", ai_clips: "none", images: "none" },
};

const script = parseScript(`---
title: Cats
script_type: 9
hook: 1
ending: 5
---

## Hook
Why do cats purr?

## Body
Cats sleep a lot.

Three things cats hate:
- water
- noise
- closed doors

## Ending
That's cats.
`);

// What whisper heard: close to the script, with one number written differently and an extra word.
const heard = "Why do cats purr? Cats sleep a lot. 3 things cats hate: water, noise, um, closed doors. That's cats.".split(" ");
const words: WordTiming[] = heard.map((text, i) => ({ text, startMs: 200 + i * 400, endMs: 200 + i * 400 + 350 }));
const audioDurationSec = (200 + heard.length * 400) / 1000;

const build = (over: Partial<Parameters<typeof buildPlan>[0]> = {}) =>
  buildPlan({ script, words, audioDurationSec, page, style: 3, captions: 1, warn: () => {}, ...over });

describe("buildPlan", () => {
  it("is 1080×1920 at 30 fps, as long as the audio plus a 15-frame tail", () => {
    const plan = build();
    expect(plan).toMatchObject({ fps: 30, width: 1080, height: 1920, style: 3, captions: 1 });
    expect(plan.durationInFrames).toBe(Math.ceil(audioDurationSec * 30) + 15);
  });

  it("makes contiguous scenes from frame 0 to the end", () => {
    const plan = build();
    expect(plan.scenes[0]!.fromFrame).toBe(0);
    for (let i = 1; i < plan.scenes.length; i++) {
      const prev = plan.scenes[i - 1]!;
      expect(plan.scenes[i]!.fromFrame).toBe(prev.fromFrame + prev.durationInFrames);
    }
    const last = plan.scenes.at(-1)!;
    expect(last.fromFrame + last.durationInFrames).toBe(plan.durationInFrames);
    for (const s of plan.scenes) expect(s.durationInFrames).toBeGreaterThan(0);
  });

  it("picks the scene kind from the beat: title, fact, list, outro", () => {
    expect(build().scenes.map((s) => [s.beatId, s.kind])).toEqual([
      ["hook", "title"],
      ["b1", "fact"],
      ["b2", "list"],
      ["ending", "outro"],
    ]);
  });

  it("starts each scene at its first word, even when whisper wrote a word differently", () => {
    const plan = build();
    const b2 = plan.scenes[2]!;
    expect(b2.words[0]!.text).toBe("3");
    expect(b2.fromFrame).toBe(Math.floor((b2.words[0]!.startMs / 1000) * 30));
    expect(plan.scenes[3]!.words.map((w) => w.text)).toEqual(["That's", "cats."]);
    expect(b2.words.map((w) => w.text)).toContain("um,");
  });

  it("warns when the voice-over is outside the page's duration, and still returns a plan", () => {
    const warn = vi.fn();
    const plan = build({ audioDurationSec: 70, page: { ...page, duration: { minSec: 30, maxSec: 45 } }, warn });
    expect(plan.scenes.length).toBe(4);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("70s");
    expect(warn.mock.calls[0]![0]).toContain("30–45s");
  });

  it("does not warn when the voice-over fits the page's duration", () => {
    const warn = vi.fn();
    build({ page: { ...page, duration: { minSec: 5, maxSec: 60 } }, warn });
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses the page palette, or the style's default palette when the page has none", () => {
    expect(build({ page: { ...page, palette: ["#000000", "#FFFFFF"] } }).palette).toEqual(["#000000", "#FFFFFF"]);
    expect(build().palette).toEqual(["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"]);
  });

  it("points the audio at voice.wav unless told otherwise", () => {
    expect(build().audioSrc).toBe("voice.wav");
    expect(build({ audioSrc: "other.wav" }).audioSrc).toBe("other.wav");
  });
});

describe("parseScript lists", () => {
  it("keeps list items on their own lines and reads them without the dashes", () => {
    expect(script.beats[2]!.text).toBe("Three things cats hate:\n- water\n- noise\n- closed doors");
    expect(script.spokenText).toContain("Three things cats hate: water, noise, closed doors.");
  });
});
