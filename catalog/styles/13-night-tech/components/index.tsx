// Style 13 Night tech, for a post's own code: its slides and the drawn visuals they are made of.
// A custom slide (custom/index.tsx) can import these to draw in the style:
//   import { nightTech } from "<path to catalog>/styles/13-night-tech/components/index.js";
//   const { Phone, Chip, Icon } = nightTech.visuals;
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
