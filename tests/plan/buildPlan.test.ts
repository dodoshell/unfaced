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

  it("cuts a seamless loop back to the start after a shorter tail", () => {
    const loop = build({ script: { ...script, ending: 1 } });
    expect(loop.durationInFrames).toBeLessThan(build().durationInFrames);
    expect(loop.durationInFrames).toBeGreaterThan(Math.ceil(audioDurationSec * 30));
    expect(loop.scenes.at(-1)!.fromFrame + loop.scenes.at(-1)!.durationInFrames).toBe(loop.durationInFrames);
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
    const three = heard.indexOf("3");
    expect(b2.words[0]).toEqual({ text: "Three", startMs: words[three]!.startMs, endMs: words[three]!.endMs });
    expect(b2.fromFrame).toBe(Math.floor((b2.words[0]!.startMs / 1000) * 30));
    expect(plan.scenes[3]!.words.map((w) => w.text)).toEqual(["That's", "cats."]);
  });

  it("captions the script's words, folding a word only whisper heard into the one before", () => {
    const b2 = build().scenes[2]!;
    expect(b2.words.map((w) => w.text)).toEqual(["Three", "things", "cats", "hate:", "water", "noise", "closed", "doors"]);
    const noise = b2.words[5]!;
    expect(noise.startMs).toBe(words[heard.indexOf("noise,")]!.startMs);
    expect(noise.endMs).toBe(words[heard.indexOf("um,")]!.endMs);
  });

  const captioned = (body: string, heardText: string) => {
    const s = parseScript(`---\ntitle: T\nscript_type: 9\nhook: 1\nending: 5\n---\n\n## Hook\nHi there.\n\n## Body\n${body}\n\n## Ending\nBye now.\n`);
    const h = `Hi there. ${heardText} Bye now.`.split(" ");
    const timed = h.map((text, i) => ({ text, startMs: 200 + i * 400, endMs: 550 + i * 400 }));
    const plan = buildPlan({ script: s, words: timed, audioDurationSec: (200 + h.length * 400) / 1000, page, style: 3, captions: 1, warn: () => {} });
    return plan.scenes[1]!.words.map((w) => w.text);
  };

  it("keeps the script's punctuation, contractions, accents and emoji in the captions", () => {
    expect(captioned("Still giving your cat milk? They're happy.", "Still giving your cat milk. They are happy.")).toEqual(["Still", "giving", "your", "cat", "milk?", "They're", "happy."]);
    expect(captioned("Perché l’acqua è blu?", "Perche l'acqua e blu.")).toEqual(["Perché", "l’acqua", "è", "blu?"]);
    expect(captioned("Cats 🐱 purr.", "Cats purr.")).toEqual(["Cats 🐱", "purr."]);
  });

  it("keeps a written word whisper missed, captioned together with the word before", () => {
    expect(captioned("A bowl of milk.", "A of milk.")).toEqual(["A bowl", "of", "milk."]);
  });

  it("warns when the voice-over is outside the page's duration, and still returns a plan", () => {
    const warn = vi.fn();
    const plan = build({ audioDurationSec: 70, page: { ...page, duration: { minSec: 30, maxSec: 45 } }, warn });
    expect(plan.scenes.length).toBe(4);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]![0]).toContain("70s");
    expect(warn.mock.calls[0]![0]).toContain("30–45s");
  });

  it("shows a tenth of a second when a whole number would look inside the range", () => {
    const warn = vi.fn();
    build({ audioDurationSec: 45.3, page: { ...page, duration: { minSec: 30, maxSec: 45 } }, warn });
    expect(warn.mock.calls[0]![0]).toContain("45.3s");
  });

  it("warns about a list of more than 7 items, which the styles can only show small or cut", () => {
    const items = Array.from({ length: 8 }, (_, i) => `- toy ${i + 1}`);
    const long = parseScript(`---\ntitle: Toys\nscript_type: 9\nhook: 1\nending: 5\n---\n\n## Hook\nHi.\n\n## Body\nToys:\n${items.join("\n")}\n\n## Ending\nBye.\n`);
    const said = ["Hi.", "Toys:", ...items.map((l) => l.slice(2)), "Bye."].join(" ").split(" ");
    const timed = said.map((text, i) => ({ text, startMs: 200 + i * 400, endMs: 200 + i * 400 + 350 }));
    const warn = vi.fn();
    buildPlan({ script: long, words: timed, audioDurationSec: (200 + said.length * 400) / 1000, page, style: 3, captions: 1, warn });
    expect(warn).toHaveBeenCalledWith('The list in beat "b1" has 8 items; a list shows up to 7 legibly, so split it into two paragraphs.');
    const short = vi.fn();
    build({ warn: short });
    expect(short).not.toHaveBeenCalled();
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
