// The sample posts `unfaced demo <style> --post` renders: an invented studio's carousel with one
// slide of each kind the style draws, and a second post with the cover's drawn visuals, so every
// style is shown with the same words. The image slide's photo is drawn here too (samplePhoto).
import { deflateSync } from "node:zlib";
import type { FormatName, SlideKind } from "./types.js";

/** The sample's slides by kind, in the order the post shows them. */
const SAMPLE: { kind: SlideKind; text: string }[] = [
  {
    kind: "cover",
    text: `## cover
# Your website should *work for you*
No templates, no guesswork. Here is how we build sites that bring in clients.`,
  },
  {
    kind: "point",
    text: `## point
# Speed is *a feature*
Every second a page takes to load costs you visitors. We build light sites that open fast on any phone, so people stay long enough to get in touch.`,
  },
  {
    kind: "list",
    text: `## list
# What every site *needs*
- Prices where people look for them
- Opening hours that are always right
- Photos of the real shop
- One short form to get in touch`,
  },
  {
    kind: "steps",
    text: `## steps
# How a *new site* is born
- First call | you
- Design | us
- Build | us
- Launch | together`,
  },
  {
    kind: "compare",
    text: `## compare
# Our way vs *the usual* way
- ✗ Templates everyone uses
- ✗ Weeks of waiting
- ✗ Hidden costs
- ✓ Made for your shop
- ✓ A proposal in two days
- ✓ One clear price`,
  },
  {
    kind: "stat",
    text: `## stat
# +38%
more enquiries in the first three months after launch`,
  },
  {
    kind: "quote",
    text: `## quote
# "They rebuilt our site in two weeks, and now the phone *rings every morning*."
Marta, owner of Casa Aurora bakery`,
  },
  {
    kind: "image",
    text: `## image {photo: inbox/photo.png}
# Where it *all started*
Our first client, a bakery on a quiet side street, now gets new customers from search every week.`,
  },
  {
    kind: "cta",
    text: `## cta
# Shall we talk about *yours*?
We reply within a working day, with no forms to fill.
[Write to us: link in bio]`,
  },
];

/** The cover's drawn visuals, one cover each. */
const VISUALS = `## cover {visual: chips}
# Your website should *work for you*
No templates, no guesswork.
- ✓ Fast on phones
- ✓ Made for you
- ✗ No templates
- ✓ Clear prices

## cover {visual: phone, screen: "New booking: Anna, Friday at 10:00"}
# Bookings that come *while you sleep*
Your site takes the requests, you take the work.

## cover {visual: notification, title: "New enquiry", text: "Hi! Do you also build online shops? We open in March."}
# The message you *have been waiting for*
A site that answers questions before people ask them.`;

export interface SampleOptions {
  /** The kinds the style draws; the sample keeps only those. */
  kinds: SlideKind[];
  formats: FormatName[];
  /** At most this many slides (1 for a single post). */
  count?: number;
}

const front = (style: number, formats: FormatName[], title: string) => ["---", `title: ${title}`, "post_type: 3", `format: [${formats.join(", ")}]`, "label: About", `style: ${style}`, "---"];

/** The sample post's slides.md for `style`, by Studio Nord (an invented brand); its image slide reads inbox/photo.png (samplePhoto). */
export function sampleSlides(style: number, opts: SampleOptions): string {
  const slides = SAMPLE.filter((s) => opts.kinds.includes(s.kind)).slice(0, opts.count ?? SAMPLE.length);
  if (slides.length === 0) throw new Error(`The sample post has no slide of the kinds style ${style} draws (${opts.kinds.join(", ")})`);
  return `${[...front(style, opts.formats, "What we do"), "", slides.map((s) => s.text).join("\n\n")].join("\n")}\n`;
}

/** The second sample post: three covers, one with each drawn visual (chips around a phone, a phone's screen, a notification). */
export function sampleVisuals(style: number, formats: FormatName[]): string {
  return `${[...front(style, formats, "Cover visuals"), "", VISUALS].join("\n")}\n`;
}

/**
 * The sample photo: a soft, out-of-focus shop window at dusk (warm lights on a deep teal), drawn
 * pixel by pixel so the demo needs no photo file in the repository. A 1080 × 1350 PNG.
 */
export function samplePhoto(width = 1080, height = 1350): Buffer {
  const lights = [
    [0.22, 0.3, 0.16, [255, 196, 120]],
    [0.68, 0.22, 0.12, [255, 170, 90]],
    [0.82, 0.55, 0.2, [255, 214, 150]],
    [0.4, 0.62, 0.1, [250, 150, 80]],
    [0.12, 0.78, 0.14, [120, 190, 255]],
    [0.58, 0.86, 0.18, [255, 186, 110]],
    [0.92, 0.12, 0.08, [140, 200, 255]],
  ] as const;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let seed = 7;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff - 0.5;
  };
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    const v = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      let r = 18 + 40 * v;
      let g = 34 + 30 * (1 - v);
      let b = 44 + 36 * (1 - v);
      for (const [cx, cy, rad, [lr, lg, lb]] of lights) {
        const d = Math.hypot((u - cx) * (width / height), v - cy) / rad;
        const k = Math.exp(-d * d * 2.2) * 0.9;
        r += lr * k;
        g += lg * k;
        b += lb * k;
      }
      const grain = noise() * 10;
      const i = row + 1 + x * 3;
      raw[i] = Math.max(0, Math.min(255, Math.round(r + grain)));
      raw[i + 1] = Math.max(0, Math.min(255, Math.round(g + grain)));
      raw[i + 2] = Math.max(0, Math.min(255, Math.round(b + grain)));
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = CRC[(crc ^ byte) & 255]! ^ (crc >>> 8);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, body.length + 4);
  return out;
}
