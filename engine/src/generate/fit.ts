import { extname, resolve } from "node:path";
import { runFfmpeg } from "../ffmpeg.js";

const FILL = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920";

/**
 * How each input type is read: its demuxer forced, so ffmpeg never picks one from the content
 * (a playlist or a concat list disguised as a picture could read other files), and only local
 * files allowed. image2 decodes by the file's extension, so the extension must match the content.
 */
const INPUT: Record<string, string[]> = {
  ".png": ["-f", "image2", "-pattern_type", "none"],
  ".jpg": ["-f", "image2", "-pattern_type", "none"],
  ".jpeg": ["-f", "image2", "-pattern_type", "none"],
  ".mp4": ["-f", "mov"],
};

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
export async function fitPortrait(src: string, dest: string, run: typeof runFfmpeg = runFfmpeg): Promise<void> {
  const input = INPUT[extname(src).toLowerCase()];
  if (!input) throw new Error(`Can't read ${extname(src) || "files without an extension"} files safely; use .png, .jpg or .mp4`);
  const output = OUTPUT[extname(dest).toLowerCase()];
  if (!output) throw new Error(`Can't write ${extname(dest) || "files without an extension"} at 9:16; use .png, .jpg or .mp4`);
  await run(["-v", "error", ...input, "-protocol_whitelist", "file", "-i", resolve(src), "-vf", FILL, ...output, "-y", resolve(dest)]);
}
