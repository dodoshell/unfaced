import { Catalog } from "./catalog/catalog.js";
import { checkVideo, summaryLines } from "./cli/check.js";
import { defaultChecks, runDoctor } from "./cli/doctor.js";
import { parseEvery, renderFrames } from "./cli/frames.js";
import { listLines } from "./cli/list.js";
import { makeVideo } from "./cli/make.js";
import { setup } from "./cli/setup.js";
import { CATALOG_DIR } from "./paths.js";

const USAGE = `Usage: unfaced <command>

Commands:
  list <kind>                    List a catalog (style, script, hook, voice, captions, music, ending, duration)
  make <videoDir>                Make the video in <videoDir> (script.md; page.yaml two folders up)
  check <videoDir>               Run the automatic checks on a made video; writes <videoDir>/check.json
  frames <videoDir> [--every 1s] Render review frames of a made video into <videoDir>/frames/
  doctor                         Check that everything the free pipeline needs is installed
  setup                          Download the voice model, whisper and the render browser`;

function need(value: string | undefined, what: string): string {
  if (!value) throw new Error(`Missing ${what}.\n\n${USAGE}`);
  return value;
}

async function main(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  switch (command) {
    case "list":
      console.log(listLines(Catalog.load(CATALOG_DIR), need(rest[0], "the catalog to list")).join("\n"));
      return 0;
    case "make":
      await makeVideo(need(rest[0], "the video folder"));
      return 0;
    case "check": {
      const report = await checkVideo(need(rest[0], "the video folder"));
      console.log(summaryLines(report).join("\n"));
      return report.pass ? 0 : 1;
    }
    case "frames": {
      const at = rest.indexOf("--every");
      await renderFrames(need(rest[0], "the video folder"), at >= 0 ? parseEvery(need(rest[at + 1], "a value for --every")) : 1);
      return 0;
    }
    case "doctor":
      return runDoctor(defaultChecks());
    case "setup":
      await setup();
      return runDoctor(defaultChecks());
    case undefined:
    case "help":
    case "--help":
      console.log(USAGE);
      return 0;
    default:
      console.error(`Unknown command "${command}".\n\n${USAGE}`);
      return 1;
  }
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}
