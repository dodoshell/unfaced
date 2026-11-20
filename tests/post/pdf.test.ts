import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { writePdf } from "../../engine/src/post/pdf.js";

function png(file: string, width: number, height: number, shade: number): string {
  const image = new PNG({ width, height });
  image.data.fill(shade);
  writeFileSync(file, PNG.sync.write(image));
  return file;
}

describe("writePdf", () => {
  it("puts each PNG on its own page at the slide's size", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unfaced pdf è "));
    const pngs = [1, 2, 3].map((n) => png(join(dir, `slide-0${n}.png`), 1080, 1350, n * 60));
    const out = join(dir, "post.pdf");
    await writePdf(pngs, out);

    const pdf = await PDFDocument.load(readFileSync(out));
    expect(pdf.getPageCount()).toBe(3);
    for (const page of pdf.getPages()) expect(page.getSize()).toEqual({ width: 1080, height: 1350 });
  });
});
