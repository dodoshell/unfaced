import { Catalog } from "./catalog/catalog.js";
import { checkVideo, summaryLines } from "./cli/check.js";
import { defaultChecks, keyLines, runDoctor } from "./cli/doctor.js";
import { makeCover } from "./cli/cover.js";
import { renderDemos } from "./cli/demo.js";
import { docText } from "./cli/docs.js";
import { parseEvery, renderFrames } from "./cli/frames.js";
import { buildGallery } from "./gallery/gallery.js";
import { generateReport } from "./cli/generate.js";
import { inboxReport } from "./cli/inbox.js";
import { listLines } from "./cli/list.js";
import { defaultMakeDeps, makeVideo } from "./cli/make.js";
import { renderMascotSheet } from "./cli/mascot.js";
import { pageSummary } from "./cli/page.js";
import { renderHookReel } from "./cli/reel.js";
import { resultsReport } from "./cli/results.js";
import { showText } from "./cli/show.js";
import { setup } from "./cli/setup.js";
import { loadEnv, videoEnv } from "./env.js";
import { CATALOG_DIR } from "./paths.js";

const USAGE = `Usage: unfaced <command>

Commands:
  list <kind>                    List a catalog (style, script, hook, voice, captions, music, ending, duration, post-type)
  show <kind> [number]           Print a catalog entry's guide, or the whole catalog file with its rules
  docs [format]                  Print a file format (page, script, mascot, scenes, review, post, results)
  page <pageDir>                 Check a page profile and print it with every choice named
  make <videoDir>                Make the video in <videoDir> (script.md; page.yaml two folders up)
  check <videoDir>               Run the automatic checks on a made video; writes <videoDir>/check.json
  frames <videoDir> [--every 1s] Render review frames of a made video into <videoDir>/frames/
  cover <videoDir> [--at 1.5]    Render the cover (a frame without captions) to <videoDir>/cover.png
  inbox <videoDir>               Check the files handed off into <videoDir>/inbox/ and list the prompts still waiting for one
  generate <videoDir>            Make the images and clips inbox/PROMPTS.md asks for with the page's providers, then check the inbox
  results <pageDir>              Compare the numbers in <pageDir>/results.md by platform and by each choice the videos made
  mascot <pageDir>               Render the page's mascot reference sheet to brand/mascot/reference.png
  demo <style|all> [--out <dir>] [--frames]
                                 Render the style demo (the same dog scene in every style) to <dir>/NN-slug.mp4,
                                 or its key moments as PNGs with --frames (default dir: examples/styles);
                                 all also writes <dir>/all-styles.mp4 and docs/media/styles-grid.gif
  reel hooks [--out <file>]      Render the hook reel: every hook's first example, spoken, each in the next style
                                 (default file: examples/hooks/hook-reel.mp4)
  gallery [--out <dir>] [--no-stills]
                                 Build the catalog gallery, a static page with a poster of every style's demo
                                 (default dir: gallery/; --no-stills keeps the posters already there)
  doctor                         Check that everything the free pipeline needs is installed, and say which paid providers' keys are set
  setup                          Download the voice model, whisper and the render browser

Set UNFACED_DEBUG=1 to print where an error came from (its stack) along with its message.`;

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
      const video = need(rest[0], "the video folder");
      const { report } = await makeVideo(video, { ...defaultMakeDeps(), env: videoEnv(video) });
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
    case "demo": {
      const out = rest.indexOf("--out");
      await renderDemos(need(rest[0], "a style number or all"), { ...(out >= 0 ? { out: need(rest[out + 1], "a folder for --out") } : {}), frames: rest.includes("--frames") });
      return 0;
    }
    case "inbox": {
      const { lines, pass } = await inboxReport(need(rest[0], "the video folder"));
      console.log(lines.join("\n"));
      return pass ? 0 : 1;
    }
    case "generate": {
      const { lines, pass } = await generateReport(need(rest[0], "the video folder"));
      console.log(lines.join("\n"));
      return pass ? 0 : 1;
    }
    case "results": {
      const { lines, pass } = await resultsReport(need(rest[0], "the page folder"), Catalog.load(CATALOG_DIR));
      console.log(lines.join("\n"));
      return pass ? 0 : 1;
    }
    case "reel": {
      if (rest[0] !== "hooks") throw new Error(`reel makes the hook reel: "unfaced reel hooks".\n\n${USAGE}`);
      const out = rest.indexOf("--out");
      await renderHookReel(out >= 0 ? { out: need(rest[out + 1], "a file for --out") } : {});
      return 0;
    }
    case "gallery": {
      const out = rest.indexOf("--out");
      console.log(await buildGallery({ ...(out >= 0 ? { out: need(rest[out + 1], "a folder for --out") } : {}), stills: !rest.includes("--no-stills") }));
      return 0;
    }
    case "mascot":
      await renderMascotSheet(need(rest[0], "the page folder"));
      return 0;
    case "doctor": {
      const code = await runDoctor(defaultChecks());
      console.log(["", ...keyLines(loadEnv())].join("\n"));
      return code;
    }
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
  // The message is advice for the user; the stack is for whoever debugs unfaced itself.
  console.error(err instanceof Error ? (process.env.UNFACED_DEBUG && err.stack) || err.message : String(err));
  process.exitCode = 1;
}
