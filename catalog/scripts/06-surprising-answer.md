# 06 Surprising answer

## Purpose

Ask a simple question that everyone thinks they can answer, then give the real answer, which is not what they expected. The viewer stays to find out if they were right.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Question | The question, asked plainly. One sentence. | 0–3 s |
| Obvious answer | The answer most people would give, said with confidence. | 3–7 s |
| Turn | "Actually..." The obvious answer is wrong, or only half right. | 7–10 s |
| Real answer | The surprising answer, in one clear sentence. | 10–16 s |
| Why | One or two facts that make the real answer make sense. | 16–26 s |
| Ending | The page's ending type (default: punchline). | 26–30 s |

For 15 s, drop the Obvious answer beat and keep Why to one fact. For 45–60 s, give Why three facts and add an example.

In `script.md` the Question is `## Hook`; the Obvious answer, Turn, Real answer and Why are paragraphs of `## Body` (one beat each); the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- The question must be answerable in one word or one short phrase. "Why is the sky blue?" works; "How does weather work?" does not.
- The real answer must be true and checkable. List the source in `sources`.
- Say the real answer before explaining it. Never make the viewer wait past 16 s.
- One idea per sentence. Sentences of 12 words or fewer read best as captions.
- Never mock the viewer for the obvious answer; everyone believed it.

## Example 1: What colour is a polar bear?

```markdown
---
title: What colour is a polar bear?
script_type: 6
hook: 1
ending: 5
sources: Smithsonian's National Zoo, "Polar bear" fact sheet
---

## Hook
What colour is a polar bear?
> visual: a polar bear on the ice, looking at the camera

## Body
White. Obviously.

Actually, not even close.
> visual: a big red cross over the white bear

A polar bear's skin is black, and its fur is see-through.
> visual: close-up of black skin under clear hairs

Each hair is a hollow, clear tube. It scatters sunlight, so the coat looks white. The black skin underneath soaks up heat.
> visual: sunlight bouncing inside a hollow hair

## Ending
So a polar bear is a black bear in a very clever coat.
```

## Example 2: How many hearts does an octopus have?

```markdown
---
title: How many hearts does an octopus have?
script_type: 6
hook: 1
ending: 5
sources: Monterey Bay Aquarium, "Giant Pacific octopus"
---

## Hook
How many hearts does an octopus have?
> visual: an octopus waving one arm

## Body
One, like every other animal.

Not this one.

An octopus has three hearts.
> visual: three hearts beating in a row

Two hearts pump blood through the gills. The third pumps it to the rest of the body. And that third heart stops beating when the octopus swims.
> visual: the third heart going still as the octopus swims

## Ending
That's why octopuses would rather crawl.
```
