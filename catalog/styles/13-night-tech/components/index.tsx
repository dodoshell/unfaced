// Style 13 Night tech, for code inside this repository (demos, tests, other styles): its slides
// and the drawn visuals they are made of. A post's own slides (custom/index.tsx) do not import
// it: they get the style's colours as the `colours` prop, through @unfaced/kit's SlideComponent.
import { colours } from "./slides/tokens.js";
import { nightTechSlides } from "./slides/index.js";
import { Chip } from "./visuals/Chip.js";
import { Flow } from "./visuals/Flow.js";
import { Badge, Icon } from "./visuals/Icon.js";
import { Notification } from "./visuals/Notification.js";
import { Phone } from "./visuals/Phone.js";

export const nightTech = {
  id: 13,
  slides: nightTechSlides,
  /** The style's colours for a palette (ground, accent, secondary, highlight, ink, and the mixes muted, body, bad, line, surface). */
  colours,
  visuals: { Badge, Chip, Flow, Icon, Notification, Phone },
};
