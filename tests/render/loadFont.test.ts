// Loading a style's font: a request to the render's own server can fail once under load, and a
// render that gives up on the first failure costs the user a whole make.
import { cancelRender, continueRender } from "remotion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadFonts } from "../../engine/remotion/core/fonts.js";
import { loadFont } from "../../engine/remotion/core/loadFont.js";

vi.mock("remotion", () => ({ delayRender: vi.fn(() => 1), continueRender: vi.fn(), cancelRender: vi.fn() }));
vi.mock("../../engine/remotion/fonts/Fredoka.ttf", () => ({ default: "/Fredoka.ttf" }));

/** A FontFace whose load() fails the first `failures` times it is created. */
function fakeFontFace(failures: number) {
  let made = 0;
  return class {
    load() {
      made++;
      return made <= failures ? Promise.reject(new Error("NetworkError: A network error occurred.")) : Promise.resolve(this);
    }
  };
}

describe("loadFont", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("document", { fonts: { add: vi.fn() } });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("tries again when the font fails to load, and the render goes on", async () => {
    vi.stubGlobal("FontFace", fakeFontFace(2));
    loadFont("Retry Sans", "/fonts/a.ttf");
    await vi.runAllTimersAsync();
    expect(continueRender).toHaveBeenCalledOnce();
    expect(cancelRender).not.toHaveBeenCalled();
  });

  it("stops the render with the font's name when it never loads", async () => {
    vi.stubGlobal("FontFace", fakeFontFace(99));
    loadFont("Broken Sans", "/fonts/b.ttf");
    await vi.runAllTimersAsync();
    expect(continueRender).not.toHaveBeenCalled();
    expect(String(vi.mocked(cancelRender).mock.calls[0]![0])).toContain("Could not load the Broken Sans font");
  });

  it("stops the render with a message when the caption font never loads, instead of waiting for the timeout", async () => {
    vi.stubGlobal("FontFace", fakeFontFace(99));
    loadFonts();
    await vi.runAllTimersAsync();
    expect(continueRender).not.toHaveBeenCalled();
    expect(String(vi.mocked(cancelRender).mock.calls[0]![0])).toContain("Could not load the Fredoka font");
  });
});
