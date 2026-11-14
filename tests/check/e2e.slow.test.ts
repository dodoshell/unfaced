import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkLoudness, measureLoudness } from "../../engine/src/check/audio.js";
import { runFfmpeg } from "../../engine/src/ffmpeg.js";
import { checkFrames, readGrayFrames } from "../../engine/src/check/frames.js";

const W = 108;
const H = 192;

/** A 24-bit BMP: light grey with a white square that moves, or plain black. */
function bmp(frame: number, dark: boolean): Buffer {
  const row = W * 3;
  const out = Buffer.alloc(54 + row * H);
  out.write("BM", 0);
  out.writeUInt32LE(out.length, 2);
  out.writeUInt32LE(54, 10);
  out.writeUInt32LE(40, 14);
  out.writeInt32LE(W, 18);
  out.writeInt32LE(H, 22);
  out.writeUInt16LE(1, 26);
  out.writeUInt16LE(24, 28);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inSquare = Math.abs(x - ((frame * 3) % W)) < 10 && Math.abs(y - H / 2) < 10;
      out.fill(dark ? 0 : inSquare ? 255 : 180, 54 + y * row + x * 3, 54 + y * row + x * 3 + 3);
    }
  }
  return out;
}

/** 3 s at 30 fps: one second of motion, one of black, one of motion, over a loud 1 kHz tone. */
async function fixture(): Promise<string> {
  const out = join(mkdtempSync(join(tmpdir(), "unfaced check ")), "fixture.mp4");
  const frames = Buffer.concat(Array.from({ length: 90 }, (_, i) => bmp(i, i >= 30 && i < 60)));
  await runFfmpeg(
    ["-f", "image2pipe", "-c:v", "bmp", "-framerate", "30", "-i", "-", "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000:duration=3",
      "-af", "volume=14.4dB", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", "-y", out],
    frames,
  );
  return out;
}

// Real ffmpeg on a real file. Run with UNFACED_SLOW=1.
describe.skipIf(!process.env.UNFACED_SLOW)("checks on an encoded video (slow)", () => {
  it("finds the second of black and warns about a −6 LUFS soundtrack", async () => {
    const video = await fixture();

    const black = checkFrames(await readGrayFrames(video), 30);
    expect(black).toHaveLength(1);
    expect(black[0]).toMatchObject({ check: "black-frame", severity: "error" });
    expect(Math.abs(black[0]!.atMs - 1000)).toBeLessThanOrEqual(100);

    const loudness = await measureLoudness(video);
    expect(Math.abs(loudness.integratedLufs - -6)).toBeLessThanOrEqual(1.5);
    expect(checkLoudness(loudness).map((i) => [i.check, i.severity])).toContainEqual(["loudness", "warning"]);
  }, 120_000);
});
