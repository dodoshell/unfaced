import { extname, resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";

const FILL = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";

/** Encoder options by the extension of the file written; the ffmpeg that ships with Remotion has no WebP encoder. */
const OUTPUT: Record<string, string[]> = {
  ".png": ["-frames:v", "1", "-update", "1", "-c:v", "png"],
  ".jpg": ["-frames:v", "1", "-update", "1", "-c:v", "mjpeg", "-q:v", "2"],
  ".jpeg": ["-frames:v", "1", "-update", "1", "-c:v", "mjpeg", "-q:v", "2"],
  ".mp4": ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart"],
};

/**
 * Fills 1080×1920 with the picture or clip at `src`, cropping what overflows around the centre,
 * and writes `dest` in the format its extension names: PNG, JPEG, or an H.264 MP4 without sound.
 */
export async function fitPortrait(src: string, dest: string): Promise<void> {
  const output = OUTPUT[extname(dest).toLowerCase()];
  if (!output) throw new Error(`Can't write ${extname(dest) || "files without an extension"} at 9:16; use .png, .jpg or .mp4`);
  await runFfmpeg(["-v", "error", "-i", resolve(src), "-vf", FILL, ...output, "-y", resolve(dest)]);
}
