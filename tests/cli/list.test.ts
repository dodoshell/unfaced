import { describe, expect, it } from "vitest";
import { Catalog } from "../../engine/src/catalog/catalog.js";
import { listLines } from "../../engine/src/cli/list.js";
import { CATALOG_DIR } from "../../engine/src/paths.js";
import { catalogWithNightTech } from "../page/catalogWithNightTech.js";

describe("listLines", () => {
  it("shows (videos) for the video styles, which have no posts field, and (posts) for Night tech, which makes posts only", () => {
    const lines = listLines(Catalog.load(CATALOG_DIR), "style");
    expect(lines).toHaveLength(13);
    for (const line of lines.slice(0, 12)) expect(line).toMatch(/ \(videos\)$/);
    expect(lines[12]).toMatch(/^13 {2}Night tech — .* \(posts\)$/);
  });

  it("shows what each style makes: posts, both or nothing yet", () => {
    const lines = listLines(catalogWithNightTech("ready"), "style");
    expect(lines.at(-1)).toMatch(/^13 {2}Night tech — .* \(posts\)$/);
    expect(listLines(catalogWithNightTech("planned"), "style").at(-1)).toMatch(/ \(planned\)$/);
  });

  it("shows (videos, posts) when both are ready", () => {
    const catalog = catalogWithNightTech("ready");
    catalog.get("style", 13).status = "ready";
    expect(listLines(catalog, "style").at(-1)).toMatch(/ \(videos, posts\)$/);
  });

  it("leaves the other kinds as they were", () => {
    for (const line of listLines(Catalog.load(CATALOG_DIR), "script")) expect(line).not.toMatch(/\((videos|posts)/);
  });
});
