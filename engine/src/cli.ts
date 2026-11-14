import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Catalog } from "./catalog/catalog.js";
import { listLines } from "./cli/list.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const USAGE = `Usage: unfaced <command>

Commands:
  list <kind>   List a catalog (style, script, hook, voice, captions, music, ending, duration)`;

function main(args: string[]): number {
  const [command, ...rest] = args;
  switch (command) {
    case "list": {
      const catalog = Catalog.load(join(repoRoot, "catalog"));
      console.log(listLines(catalog, rest[0] ?? "").join("\n"));
      return 0;
    }
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
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
}
