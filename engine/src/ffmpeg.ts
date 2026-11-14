import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { RenderInternals } from "@remotion/renderer";

/**
 * Runs the ffmpeg that ships with Remotion, the same way Remotion does (from its own
 * folder, so file arguments must be absolute). Resolves with stdout and stderr;
 * rejects with the end of stderr when ffmpeg fails.
 *
 * RenderInternals is not Remotion's public API: it can change in any release. That is one
 * reason every Remotion package is pinned to the same exact version in package.json; when
 * upgrading them, check that getExecutablePath still takes these options.
 */
export function runFfmpeg(args: string[], input?: Buffer): Promise<{ stdout: Buffer; stderr: string }> {
  const exe = RenderInternals.getExecutablePath({ type: "ffmpeg", indent: false, logLevel: "error", binariesDirectory: null });
  const cwd = dirname(exe);
  const env = process.platform === "darwin" ? { ...process.env, DYLD_LIBRARY_PATH: cwd } : process.env;
  return new Promise((resolve, reject) => {
    const child = spawn(exe, ["-hide_banner", ...args], { cwd, env, stdio: [input ? "pipe" : "ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout!.on("data", (chunk: Buffer) => out.push(chunk));
    child.stderr!.on("data", (chunk: Buffer) => err.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const stderr = Buffer.concat(err).toString("utf8");
      if (code === 0) resolve({ stdout: Buffer.concat(out), stderr });
      else reject(new Error(`ffmpeg failed (exit ${code}): ${stderr.trim().split("\n").slice(-3).join(" ")}`));
    });
    if (input && child.stdin) {
      child.stdin.on("error", () => {}); // ffmpeg may close stdin early; its exit code says what happened
      child.stdin.end(input);
    }
  });
}
