---
type: llm
weight: 2
---

The user gave their own text for an About us carousel (five sentences: "We build websites for shop owners who have no time to waste." "Every project starts with a free call, never a long form." "You get a fixed price before we write a single line." "Most shops are online in three weeks." "Tell us what you sell and we do the rest.") and asked for their words to be used exactly, only split into slides.

PASS if the reply shows the slides with the user's sentences unchanged (same words, order and punctuation), says which slide, if any, does not fit a kind's limits or carries a claim to check (for example "most shops are online in three weeks" is the user's own claim) without silently changing it, and asks the user to approve or change before the slides are made.

FAIL if any of the five sentences was reworded, shortened, reordered or dropped; if the reply adds claims, figures or customers the user did not give; if it says the slides were rendered; or if it does not ask for approval.
