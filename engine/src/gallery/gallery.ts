import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DOG_DEMO_ID } from "../../remotion/compositionId.js";
import { CATCH_FRAME } from "../../remotion/demo/demoMotion.js";
import { stylesWithLayout } from "../../remotion/styles/layouts.js";
import { Catalog } from "../catalog/catalog.js";
import { type HookExample, hookExamples } from "../cli/reel.js";
import { CATALOG_KINDS, type CatalogKind } from "../page/types.js";
import { CATALOG_DIR, LIBRARY_ROOT } from "../paths.js";
import { closeRenders, type RenderJob, renderStillOf } from "../render/renderVideo.js";

/** A style's poster is the dog demo at the catch. */
export const POSTER_FRAME = CATCH_FRAME;
/** Posters at a quarter size: 270×480. */
const POSTER_SCALE = 0.25;

const SECTIONS: Record<CatalogKind, { title: string; unit: [string, string] }> = {
  style: { title: "Visual styles", unit: ["style", "styles"] },
  script: { title: "Script types", unit: ["script type", "script types"] },
  hook: { title: "Hooks", unit: ["hook", "hooks"] },
  voice: { title: "Voices", unit: ["voice", "voices"] },
  captions: { title: "Captions", unit: ["caption style", "caption styles"] },
  music: { title: "Music moods", unit: ["music mood", "music moods"] },
  ending: { title: "Endings", unit: ["ending", "endings"] },
  duration: { title: "Durations", unit: ["duration", "durations"] },
  "post-type": { title: "Post types", unit: ["post type", "post types"] },
};

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const pad = (n: number) => String(n).padStart(2, "0");

const STYLE = `
:root { --bg: #FBF8F3; --card: #FFFFFF; --ink: #1B1B3A; --muted: #5C5C78; --line: #E6E0D6; --accent: #FF6B35; --soft: #F3EEE6; }
@media (prefers-color-scheme: dark) { :root { --bg: #14141F; --card: #1E1E2C; --ink: #F2EFEA; --muted: #A6A3B8; --line: #2E2E40; --accent: #FF8A5C; --soft: #262636; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
header, main, footer { max-width: 1120px; margin: 0 auto; padding: 0 16px; }
header { padding-top: 48px; }
h1 { font-size: 40px; margin: 0; letter-spacing: -0.02em; }
header p { color: var(--muted); margin: 8px 0 0; max-width: 640px; }
nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 8px; }
nav a { color: var(--ink); text-decoration: none; background: var(--soft); border-radius: 999px; padding: 6px 14px; font-size: 14px; }
nav a:hover { background: var(--line); }
section { margin-top: 48px; }
h2 { font-size: 24px; margin: 0 0 16px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 16px; }
.card.planned { opacity: 0.6; }
.card img, .card .noposter { display: block; width: 100%; height: auto; aspect-ratio: 9 / 16; border-radius: 10px; margin-bottom: 12px; background: var(--soft); object-fit: cover; }
.card .noposter { display: grid; place-items: center; color: var(--muted); font-size: 14px; }
h3 { font-size: 17px; margin: 0; }
.status { display: inline-block; margin-top: 4px; font-size: 12px; color: var(--accent); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
.card p { margin: 8px 0 0; }
.good { color: var(--muted); font-size: 14px; }
q { font-style: italic; }
.niche { color: var(--muted); font-size: 13px; }
footer { color: var(--muted); font-size: 14px; padding-top: 48px; padding-bottom: 48px; }
`;

/**
 * The gallery: one static page with every catalog entry, numbered as page.yaml uses them,
 * each style with its poster (media/NN-slug.png) when there is one.
 */
export function galleryHtml(catalog: Pick<Catalog, "list">, hooks: HookExample[], posters: Set<string>): string {
  const counts = CATALOG_KINDS.map((kind) => {
    const n = catalog.list(kind).length;
    return `${n} ${SECTIONS[kind].unit[n === 1 ? 0 : 1]}`;
  });
  const sections = CATALOG_KINDS.map((kind) => {
    const cards = catalog.list(kind).map((entry) => {
      const label = `${pad(entry.num)} ${entry.name}`;
      const poster = `${pad(entry.num)}-${entry.slug}.png`;
      const hook = kind === "hook" ? hooks.find((h) => h.num === entry.num) : undefined;
      return [
        `<article class="card${entry.status === "planned" ? " planned" : ""}" id="${kind}-${pad(entry.num)}">`,
        kind === "style" ? (posters.has(poster) ? `<img src="media/${poster}" alt="The dog demo in ${escape(label)}" width="270" height="480" loading="lazy">` : `<div class="noposter">no demo yet</div>`) : "",
        `<h3>${escape(label)}</h3>`,
        entry.status === "planned" ? `<span class="status">coming soon</span>` : "",
        `<p>${escape(entry.summary)}</p>`,
        hook ? `<p class="example"><q>${escape(hook.text)}</q> <span class="niche">${escape(hook.niche)}</span></p>` : "",
        entry.goodFor.length ? `<p class="good">Good for: ${entry.goodFor.map(escape).join(", ")}</p>` : "",
        `</article>`,
      ]
        .filter(Boolean)
        .join("\n");
    });
    return `<section id="${kind}">\n<h2>${SECTIONS[kind].title}</h2>\n<div class="grid">\n${cards.join("\n")}\n</div>\n</section>`;
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>unfaced catalog</title>
<style>${STYLE}</style>
</head>
<body>
<header>
<h1>unfaced catalog</h1>
<p>Everything a page can be made of, numbered the way <code>page.yaml</code> uses it: ${escape(counts.join(" · "))}. Every style shows the same dog, the same jump, the same catch.</p>
<nav>${CATALOG_KINDS.map((kind) => `<a href="#${kind}">${SECTIONS[kind].title}</a>`).join("")}</nav>
</header>
<main>
${sections.join("\n")}
</main>
<footer>Built from catalog/catalog.json by <code>unfaced gallery</code>.</footer>
</body>
</html>
`;
}

export interface GalleryDeps {
  catalog: Catalog;
  renderStill(job: RenderJob & { frame: number; scale?: number }): Promise<void>;
  log(msg: string): void;
}

const defaultDeps = (): GalleryDeps => ({ catalog: Catalog.load(CATALOG_DIR), renderStill: renderStillOf, log: (m) => console.error(m) });

/**
 * `unfaced gallery`: renders a poster for every style with components into `<out>/media/`
 * (unless `stills` is false), then writes `<out>/index.html`. Returns the page's path.
 */
export async function buildGallery(options: { out?: string; stills?: boolean } = {}, deps: GalleryDeps = defaultDeps()): Promise<string> {
  const out = options.out ?? join(LIBRARY_ROOT, "gallery");
  const media = join(out, "media");
  try {
    if (options.stills !== false) {
      for (const style of stylesWithLayout()) {
        const outPath = join(media, `${pad(style)}-${deps.catalog.get("style", style).slug}.png`);
        await deps.renderStill({ id: DOG_DEMO_ID, inputProps: { style }, outPath, frame: POSTER_FRAME, scale: POSTER_SCALE });
        deps.log(`Poster: ${outPath}`);
      }
    }
  } finally {
    await closeRenders();
  }
  const posters = new Set(existsSync(media) ? readdirSync(media).filter((f) => f.endsWith(".png")) : []);
  const hooks = hookExamples(readFileSync(join(CATALOG_DIR, "hooks.md"), "utf8"));
  mkdirSync(out, { recursive: true });
  const page = join(out, "index.html");
  writeFileSync(page, galleryHtml(deps.catalog, hooks, posters));
  deps.log(`Gallery: ${page}`);
  return page;
}
