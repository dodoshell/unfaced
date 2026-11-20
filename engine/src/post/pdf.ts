import { readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";

/** A PDF with one page per PNG, each page the PNG's size (pixels as points): LinkedIn shows it as a carousel. */
export async function writePdf(pngs: string[], out: string): Promise<void> {
  const pdf = await PDFDocument.create();
  for (const file of pngs) {
    const image = await pdf.embedPng(await readFile(file));
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  await writeFile(out, await pdf.save());
}
