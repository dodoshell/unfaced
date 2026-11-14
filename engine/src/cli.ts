import { Catalog } from "./catalog/catalog.js";
import { checkVideo, summaryLines } from "./cli/check.js";
import { defaultChecks, runDoctor } from "./cli/doctor.js";
import { makeCover } from "./cli/cover.js";
import { docText } from "./cli/docs.js";
import { parseEvery, renderFrames } from "./cli/frames.js";
import { listLines } from "./cli/list.js";
import { makeVideo } from "./cli/make.js";
import { renderMascotSheet } from "./cli/mascot.js";
import { pageSummary } from "./cli/page.js";
import { showText } from "./cli/show.js";
import { setup } from "./cli/setup.js";
import { CATALOG_DIR } from "./paths.js";

const USAGE = `Usage: unfaced <command>

Commands:
  list <kind>                    List a catalog (style, script, hook, voice, captions, music, ending, duration)
  show <kind> [number]           Print a catalog entry's guide, or the whole catalog file with its rules
  docs [format]                  Print a file format (page, script, mascot, scenes, review, post, results)
  page <pageDir>                 Check a page profile and print it with every choice named
  make <videoDir>                Make the video in <videoDir> (script.md; page.yaml two folders up)
  check <videoDir>               Run the automatic checks on a made video; writes <videoDir>/check.json
  frames <videoDir> [--every 1s] Render review frames of a made video into <videoDir>/frames/
  cover <videoDir> [--at 1.5]    Render the cover (a frame without captions) to <videoDir>/cover.png
  mascot <pageDir>               Render the page's mascot reference sheet to brand/mascot/reference.png
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
    case "show": {
      const num = rest[1] === undefined ? undefined : Number(rest[1]);
      if (num !== undefined && !Number.isInteger(num)) throw new Error(`"${rest[1]}" is not a catalog number.\n\n${USAGE}`);
      console.log(showText(Catalog.load(CATALOG_DIR), need(rest[0], "the catalog to show"), num));
      return 0;
    }
    case "docs":
      console.log(docText(rest[0]));
      return 0;
    case "page":
      console.log((await pageSummary(need(rest[0], "the page folder"), Catalog.load(CATALOG_DIR))).join("\n"));
      return 0;
    case "make": {
      const { report } = await makeVideo(need(rest[0], "the video folder"));
      return report.pass ? 0 : 1;
    }
    case "cover": {
      const at = rest.indexOf("--at");
      const atSec = at >= 0 ? Number(need(rest[at + 1], "a time in seconds for --at")) : undefined;
      if (atSec !== undefined && !Number.isFinite(atSec)) throw new Error(`--at needs a time in seconds, such as 1.5`);
      console.log(await makeCover(need(rest[0], "the video folder"), atSec));
      return 0;
    }
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
    case "mascot":
      await renderMascotSheet(need(rest[0], "the page folder"));
      return 0;
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
