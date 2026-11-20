import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { logoAspect } from "../../engine/src/post/logoAspect.js";

const dir = mkdtempSync(join(tmpdir(), "unfaced logo "));
const file = (name: string, data: string | Buffer) => {
  const path = join(dir, name);
  writeFileSync(path, data);
  return path;
};

describe("logoAspect", () => {
  it("reads a PNG's width over height from its header", () => {
    expect(logoAspect(file("wide.png", PNG.sync.write(new PNG({ width: 400, height: 100 }))))).toBe(4);
    expect(logoAspect(file("square.png", PNG.sync.write(new PNG({ width: 64, height: 64 }))))).toBe(1);
  });

  it("reads an SVG's viewBox, else its width and height", () => {
    expect(logoAspect(file("a.svg", '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60"><rect/></svg>'))).toBe(5);
    expect(logoAspect(file("b.svg", "<svg width='120px' height=\"40\" xmlns='http://www.w3.org/2000/svg'></svg>"))).toBe(3);
    expect(logoAspect(file("c.svg", '<svg viewBox="0,0,50,50"></svg>'))).toBe(1);
  });

  it("gives undefined when it cannot tell", () => {
    expect(logoAspect(file("d.svg", '<svg width="100%" height="100%"></svg>'))).toBeUndefined();
    expect(logoAspect(file("e.png", "not a png"))).toBeUndefined();
    expect(logoAspect(join(dir, "missing.svg"))).toBeUndefined();
  });
});
