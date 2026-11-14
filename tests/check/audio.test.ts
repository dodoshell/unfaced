import { describe, expect, it } from "vitest";
import { checkLoudness, parseLoudnorm } from "../../engine/src/check/audio.js";

describe("audio checks", () => {
  it("passes audio between −16 and −12 LUFS with a true peak at or under −1 dBTP", () => {
    expect(checkLoudness({ integratedLufs: -14, truePeakDb: -1.5 })).toEqual([]);
    expect(checkLoudness({ integratedLufs: -16, truePeakDb: -1 })).toEqual([]);
  });

  it("warns about audio that is too loud or too quiet", () => {
    expect(checkLoudness({ integratedLufs: -6, truePeakDb: -3 })).toEqual([{ check: "loudness", atMs: 0, severity: "warning", message: expect.stringContaining("-6.0 LUFS") }]);
    expect(checkLoudness({ integratedLufs: -20.4, truePeakDb: -6 })).toEqual([{ check: "loudness", atMs: 0, severity: "warning", message: expect.stringContaining("-20.4 LUFS") }]);
  });

  it("reports a true peak over −1 dBTP as clipping", () => {
    expect(checkLoudness({ integratedLufs: -14, truePeakDb: -0.4 })).toEqual([{ check: "clipping", atMs: 0, severity: "error", message: expect.stringContaining("-0.4 dBTP") }]);
  });

  it("reads integrated loudness and true peak from ffmpeg's loudnorm report", () => {
    const stderr = `[Parsed_loudnorm_0 @ 000001] \n{\n\t"input_i" : "-20.43",\n\t"input_tp" : "-17.95",\n\t"input_lra" : "0.00",\n\t"input_thresh" : "-30.43"\n}\n`;
    expect(parseLoudnorm(stderr)).toEqual({ integratedLufs: -20.43, truePeakDb: -17.95 });
  });
});
