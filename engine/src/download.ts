import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { unfacedHome } from "./paths.js";

export interface ModelArchive {
  /** Folder name inside the archive, and inside `~/.unfaced/models/`. */
  name: string;
  /** A .tar.bz2 archive. */
  url: string;
  sha256: string;
  sizeMb: number;
  /** What the model is for, shown while downloading. */
  label: string;
}

/**
 * Returns the folder of a model, downloading and unpacking it into
 * `<unfaced home>/models/` the first time. The archive is checked against its SHA-256.
 */
export async function ensureModel(model: ModelArchive, log: (msg: string) => void = console.error, env = process.env): Promise<string> {
  const modelsDir = join(unfacedHome(env), "models");
  const dir = join(modelsDir, model.name);
  if (existsSync(dir)) return dir;

  mkdirSync(modelsDir, { recursive: true });
  const archiveName = `${model.name}.tar.bz2.part`;
  const archive = join(modelsDir, archiveName);
  log(`Downloading the ${model.label} (${model.sizeMb} MB, only once) into ${modelsDir}`);
  const res = await fetch(model.url);
  if (!res.ok || !res.body) throw new Error(`Could not download ${model.url}: HTTP ${res.status}`);

  const hash = createHash("sha256");
  const hasher = new Transform({
    transform(chunk: Buffer, _enc, done) {
      hash.update(chunk);
      done(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), hasher, createWriteStream(archive));
  const digest = hash.digest("hex");
  if (digest !== model.sha256) {
    rmSync(archive, { force: true });
    throw new Error(`The ${model.label} download is corrupted (SHA-256 ${digest}); run the command again`);
  }

  // Unpack into a temporary folder next to the final one, then rename, so an
  // interrupted run never leaves a half-unpacked model behind. The archive is
  // passed by a relative name: GNU tar reads "C:\..." as a remote host.
  const staging = join(modelsDir, `${model.name}.unpacking`);
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging);
  const tar = spawnSync("tar", ["-xjf", join("..", archiveName)], { cwd: staging, encoding: "utf8" });
  rmSync(archive, { force: true });
  if (tar.error || tar.status !== 0) {
    rmSync(staging, { recursive: true, force: true });
    throw new Error(`Could not unpack the ${model.label}: ${tar.error?.message ?? tar.stderr}. Is "tar" installed?`);
  }
  renameSync(join(staging, model.name), dir);
  rmSync(staging, { recursive: true, force: true });
  return dir;
}
