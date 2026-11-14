import { cancelRender, continueRender, delayRender } from "remotion";

const loading = new Map<string, Promise<void>>();

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
    new FontFace(family, `url(${url}) format("${format}")`, descriptors)
      .load()
      .then((face) => {
        document.fonts.add(face);
        continueRender(handle);
      })
      .catch((err: unknown) => cancelRender(new Error(`Could not load the ${family} font: ${String(err)}`))),
  );
}
