import { cancelRender, continueRender, delayRender } from "remotion";

const loading = new Map<string, Promise<void>>();

/**
 * Loads a font face, trying again after a short wait: the render's own server can drop a
 * request when the machine is busy, and one dropped font would fail the whole render.
 */
export async function loadFace(family: string, source: string, descriptors: FontFaceDescriptors = {}): Promise<FontFace> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await new FontFace(family, source, descriptors).load();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((done) => setTimeout(done, attempt * 500));
    }
  }
}

/**
 * Loads a font file shipped with a style (import its .ttf/.woff2 for the URL) once per
 * render; frames wait until it is ready. Call it at the top level of the style's module.
 */
export function loadFont(family: string, url: string, descriptors: FontFaceDescriptors = {}): void {
  const key = `${family}\n${url}\n${JSON.stringify(descriptors)}`;
  if (loading.has(key)) return;
  const handle = delayRender(`Loading the ${family} font`);
  const format = /\.woff2(\?|$)/.test(url) ? "woff2" : /\.woff(\?|$)/.test(url) ? "woff" : /\.otf(\?|$)/.test(url) ? "opentype" : "truetype";
  loading.set(
    key,
    loadFace(family, `url(${url}) format("${format}")`, descriptors)
      .then((face) => {
        document.fonts.add(face);
        continueRender(handle);
      })
      .catch((err: unknown) => cancelRender(new Error(`Could not load the ${family} font: ${String(err)}`))),
  );
}
