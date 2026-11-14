import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import { CHOICE_FIELDS, type CatalogLike, type Choice, type Page } from "./types.js";

export class PageError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "PageError";
  }
}

const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "schema", "page.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const knownFields: string[] = Object.keys(schema.properties);

// Prefixes of common API keys (OpenAI, ElevenLabs, Google).
const KEY_LIKE = /^(sk-|xi-|AIza)/;

export async function loadPage(dir: string, catalog: CatalogLike): Promise<Page> {
  const file = join(dir, "page.yaml");
  if (!existsSync(file)) throw new PageError("page.yaml", `page.yaml not found in ${dir}`);
  const raw: unknown = parse(await readFile(file, "utf8"));
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new PageError("page.yaml", "page.yaml must be a mapping of fields");
  }
  const data = raw as Record<string, unknown>;

  if (containsKeyLike(data)) {
    throw new PageError("providers", "API keys must not be stored in page.yaml; use .env");
  }
  for (const field of Object.keys(data)) {
    if (!knownFields.includes(field)) {
      const hint = closest(field, knownFields);
      throw new PageError(field, `Unknown field "${field}" in page.yaml${hint ? `. Did you mean "${hint}"?` : ""}`);
    }
  }
  if (!validate(data)) {
    const first = validate.errors![0]!;
    const field = first.instancePath.split("/")[1] || first.params.missingProperty || "page.yaml";
    throw new PageError(field, `Invalid "${field}" in page.yaml: ${first.message}`);
  }

  const choices: Page["choices"] = {};
  for (const field of CHOICE_FIELDS) {
    const choice = data[field] as Choice | undefined;
    if (choice === undefined) continue;
    const ids = catalog.ids(field);
    const numbers = choice === "auto" ? [] : Array.isArray(choice) ? choice : [choice];
    for (const n of numbers) {
      if (!ids.includes(n)) {
        throw new PageError(field, `${field} ${n} does not exist; choose a number from ${ids[0]}–${ids[ids.length - 1]}, a list of them, or "auto"`);
      }
    }
    choices[field] = choice;
  }

  const providers = (data.providers ?? {}) as Partial<Page["providers"]>;
  return {
    dir,
    name: data.name as string,
    language: data.language as string,
    niche: data.niche as string,
    choices,
    duration: parseDuration(data.duration as number | string | undefined),
    palette: data.palette as string[] | undefined,
    font: data.font as string | undefined,
    mascot: data.mascot as string | undefined,
    providers: {
      voice: providers.voice ?? "free",
      ai_clips: providers.ai_clips ?? "none",
      images: providers.images ?? "none",
    },
  };
}

function parseDuration(value: number | string | undefined): Page["duration"] {
  if (value === undefined) return undefined;
  if (typeof value === "number") return { minSec: value, maxSec: value };
  const [min, max] = value.split("-").map((s) => Number(s.trim())) as [number, number];
  if (min > max) throw new PageError("duration", `duration ${value}: the first number must not be larger than the second`);
  return { minSec: min, maxSec: max };
}

function containsKeyLike(value: unknown): boolean {
  if (typeof value === "string") return KEY_LIKE.test(value.trim());
  if (Array.isArray(value)) return value.some(containsKeyLike);
  if (value && typeof value === "object") return Object.values(value).some(containsKeyLike);
  return false;
}

function closest(word: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestDistance = 3;
  for (const c of candidates) {
    const d = levenshtein(word, c);
    if (d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return best;
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length]!;
}
