import { cancelRender, continueRender, delayRender } from "remotion";
import fredokaUrl from "../fonts/Fredoka.ttf";
import { loadFace } from "./loadFont.js";

/** The caption font, shipped with the engine so renders work offline (OFL, see LICENSES/). */
export const CAPTION_FONT = "Fredoka";

let loading: Promise<void> | undefined;

/** Loads the shipped fonts once; rendering waits until they are ready. */
export function loadFonts(): void {
  if (loading) return;
  const handle = delayRender("Loading fonts");
  loading = loadFace(CAPTION_FONT, `url(${fredokaUrl}) format("truetype")`, { weight: "300 700" })
    .then((loaded) => {
      document.fonts.add(loaded);
      continueRender(handle);
    })
    .catch((err: unknown) => cancelRender(new Error(`Could not load the ${CAPTION_FONT} font: ${String(err)}`)));
}
