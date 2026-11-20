import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parse } from "yaml";
import { CLIP_CHOICES, clipProvider, IMAGE_CHOICES, imageProvider } from "../generate/providers.js";
import { VOICE_PROVIDERS, voiceProviderId } from "../voice/providers.js";
import { FORMAT_NAMES } from "../post/formats.js";
import type { FormatName } from "../post/types.js";
import { CHOICE_FIELDS, type Brand, type CatalogKind, type CatalogLike, type Choice, type ChoiceField, type Page } from "./types.js";

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
const providerFields: string[] = Object.keys(schema.properties.providers.properties);
const brandFields: string[] = Object.keys(schema.properties.brand.properties);
const fontRoles: string[] = Object.keys(schema.properties.brand.properties.fonts.properties);
const wordsFields: string[] = Object.keys(schema.properties.brand.properties.words.properties);
const styleFields: string[] = Object.keys(schema.properties.style.oneOf[1].properties);

// Prefixes of common API keys: OpenAI and Anthropic (sk-), ElevenLabs and Stripe (sk_), Google (AIza),
// xi- and Replicate (r8_); or one unbroken run of 40 or more letters and digits, as Pexels' keys are.
const KEY_LIKE = /^(sk[-_]|xi-|AIza|r8_)|^[A-Za-z0-9]{40,}$/;

export async function loadPage(dir: string, catalog: CatalogLike): Promise<Page> {
  const file = join(dir, "page.yaml");
  if (!existsSync(file)) throw new PageError("page.yaml", `page.yaml not found in ${dir}`);
  let raw: unknown;
  try {
    raw = parse(await readFile(file, "utf8"));
  } catch (e) {
    throw new PageError("page.yaml", `page.yaml is not valid YAML: ${e instanceof Error ? e.message : String(e)}`);
  }
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
  const providerData = data.providers;
  if (providerData && typeof providerData === "object" && !Array.isArray(providerData)) {
    for (const field of Object.keys(providerData)) {
      if (!providerFields.includes(field)) {
        const hint = closest(field, providerFields);
        throw new PageError(`providers.${field}`, `Unknown field "providers.${field}" in page.yaml${hint ? `. Did you mean "${hint}"?` : ""}`);
      }
    }
  }
  checkNested(data.brand, "brand", brandFields);
  const brandData = data.brand;
  if (brandData && typeof brandData === "object" && !Array.isArray(brandData)) {
    const { fonts, words } = brandData as Record<string, unknown>;
    checkNested(fonts, "brand.fonts", fontRoles);
    checkNested(words, "brand.words", wordsFields);
  }
  checkNested(data.style, "style", styleFields);
  if (!validate(data)) {
    const first = validate.errors![0]!;
    const field = first.instancePath.split("/")[1] || first.params.missingProperty || "page.yaml";
    throw new PageError(field, explain(field, data[field], catalog) ?? `Invalid "${field}" in page.yaml: ${first.message}`);
  }

  const choices: Page["choices"] = {};
  let postStyle: Choice | undefined;
  for (const field of CHOICE_FIELDS) {
    let choice = data[field] as Choice | { posts?: Choice; videos?: Choice } | undefined;
    if (choice === undefined) continue;
    if (field === "style" && isStyleObject(choice)) {
      // One look for posts and one for videos; either may be left out.
      postStyle = checkChoice("style", choice.posts, "style", catalog);
      choice = checkChoice("style", choice.videos, "style", catalog);
      if (choice === undefined) continue;
    } else {
      checkChoice(field, choice as Choice, field, catalog);
      if (field === "style") postStyle = choice as Choice;
    }
    choices[field] = choice as Choice;
  }
  const postType = checkChoice("post-type", data.post_type as Choice | undefined, "post_type", catalog);

  const providers = (data.providers ?? {}) as Partial<Page["providers"]>;
  if (providers.voice !== undefined && !(VOICE_PROVIDERS as readonly string[]).includes(providers.voice)) {
    throw new PageError("providers.voice", `Unknown voice provider "${providers.voice}" in page.yaml; choose one of: ${VOICE_PROVIDERS.join(", ")}`);
  }
  if (providers.images !== undefined && !imageProvider(providers.images)) {
    throw new PageError("providers.images", `Unknown image provider "${providers.images}" in page.yaml; choose one of: ${IMAGE_CHOICES}`);
  }
  if (providers.ai_clips !== undefined && !clipProvider(providers.ai_clips)) {
    throw new PageError("providers.ai_clips", `Unknown clip provider "${providers.ai_clips}" in page.yaml; choose one of: ${CLIP_CHOICES}`);
  }
  return {
    dir,
    name: data.name as string,
    language: data.language as string,
    niche: data.niche as string,
    choices,
    ...(postStyle !== undefined && { postStyle }),
    ...(postType !== undefined && { postType }),
    ...(data.formats !== undefined && { formats: data.formats as FormatName[] }),
    ...(data.brand !== undefined && { brand: data.brand as Brand }),
    duration: parseDuration(data.duration as number | string | undefined),
    palette: data.palette as string[] | undefined,
    font: data.font as string | undefined,
    mascot: data.mascot as string | undefined,
    providers: {
      voice: voiceProviderId(providers.voice ?? "free"),
      ai_clips: providers.ai_clips ?? "none",
      images: providers.images ?? "none",
    },
  };
}

function isStyleObject(value: unknown): value is { posts?: Choice; videos?: Choice } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Every number of a choice must be in the catalog; returns the choice unchanged. */
function checkChoice(kind: CatalogKind, choice: Choice | undefined, field: string, catalog: CatalogLike): Choice | undefined {
  if (choice === undefined) return undefined;
  const ids = catalog.ids(kind);
  const numbers = choice === "auto" ? [] : Array.isArray(choice) ? choice : [choice];
  for (const n of numbers) {
    if (!ids.includes(n)) {
      throw new PageError(field, `${field} ${n} does not exist; choose a number from ${ids[0]}–${ids[ids.length - 1]}, a list of them, or "auto"`);
    }
  }
  return choice;
}

/** An unknown key in a nested mapping (brand, brand.fonts, ...) is named in full, with the closest known one. */
function checkNested(value: unknown, path: string, known: string[]): void {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(value)) {
    if (!known.includes(key)) {
      const hint = closest(key, known);
      throw new PageError(`${path}.${key}`, `Unknown field "${path}.${key}" in page.yaml${hint ? `. Did you mean "${hint}"?` : `; ${path} takes: ${known.join(", ")}`}`);
    }
  }
}

/** What a field should look like, for the fields where the schema's own message would not say. */
function explain(field: string, value: unknown, catalog: CatalogLike): string | undefined {
  const got = ` (got ${JSON.stringify(value)})`;
  if ((CHOICE_FIELDS as readonly string[]).includes(field)) {
    const ids = catalog.ids(field as ChoiceField);
    const range = `${ids[0]}–${ids[ids.length - 1]}`;
    return `"${field}" must be a number from ${range}, a list of different numbers from ${range}, or "auto"${got}${field === "style" ? '; or { posts: …, videos: … } for two looks' : ""}`;
  }
  if (field === "post_type") {
    const ids = catalog.ids("post-type");
    const range = `${ids[0]}–${ids[ids.length - 1]}`;
    return `"post_type" must be a number from ${range}, a list of different numbers from ${range}, or "auto"${got}`;
  }
  if (field === "formats") return `"formats" must be a list of different names from: ${FORMAT_NAMES.join(", ")}${got}`;
  if (field === "duration") return `"duration" must be a number of seconds (5 or more) or a range such as 30-45${got}`;
  if (field === "language") return `"language" must be a language code such as en or it${got}`;
  if (field === "palette") return `"palette" must be a list of colours such as "#FF6B35"${got}`;
  return undefined;
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
