import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import { rigFor } from "../../remotion/core/character/rig.js";
import type { Rig } from "../../remotion/core/character/types.js";
import { LIBRARY_ROOT } from "../paths.js";
import type { Mascot } from "../plan/types.js";
import { PageError } from "./loadPage.js";

const schema = JSON.parse(readFileSync(join(LIBRARY_ROOT, "schema", "mascot.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

/** Where a page keeps its mascot. */
export const mascotDir = (pageDir: string) => join(pageDir, "brand", "mascot");

/** The page's mascot from brand/mascot/mascot.json, or undefined when the page has none. */
export function loadMascot(pageDir: string): Mascot | undefined {
  const file = join(mascotDir(pageDir), "mascot.json");
  if (!existsSync(file)) return undefined;
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new PageError("mascot", `brand/mascot/mascot.json is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!validate(data)) {
    const err = validate.errors![0]!;
    const where = err.instancePath.replace(/^\//, "").replace(/\//g, ".") || "mascot";
    const allowed = (err.params as { allowedValues?: unknown[] }).allowedValues;
    const detail = allowed ? `must be one of ${allowed.join(", ")}` : err.message;
    throw new PageError("mascot", `brand/mascot/mascot.json: ${where} ${detail}`);
  }
  const { name, species, $schema: _schema, ...overrides } = data as { name: string; species: Rig["species"]; $schema?: string } & Partial<Rig>;
  return { name, rig: rigFor(species, overrides) };
}
