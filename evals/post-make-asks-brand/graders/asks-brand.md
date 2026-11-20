---
type: llm
weight: 2
---

The user asked for a carousel for their web studio. The page (pages/studio-nord-plain/page.yaml) has no `brand` block: no handle, logo, tone or words to avoid. The post is for a business, so the brand has to be settled before the text is written.

PASS if the reply, before writing any slide text, asks for the account's handle, the logo file and the tone of voice (a short question each, in one message and not a long form), offers to decide for them if they say "you choose", and stops there.

FAIL if it writes the slides without asking, invents a handle, a logo or a tone and presents it as the user's, asks for sizes in pixels, asks the user to pick catalog numbers (post type, style) it should pick itself, or asks more than five questions.
