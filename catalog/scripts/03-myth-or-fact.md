# 03 Myth or fact

## Purpose

Take something lots of people believe, give a clear verdict (myth or fact), then prove it. The viewer stays to find out whether they have been believing a myth.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The page's hook type, aimed at the belief. | 0–3 s |
| Belief | The belief in the words people use. Skip it when the hook already says it. | 3–6 s |
| Verdict | "Myth.", "Fact." or "Half true.", then the truth in one sentence. | 6–11 s |
| Proof | One or two facts that settle it: a measurement, an experiment, a record. | 11–21 s |
| Origin | For a myth, why people believe it; for a fact, why it sounds false. | 21–26 s |
| Ending | The page's ending type (default: punchline). | 26–30 s |

For 15 s, put the belief in the hook, keep the Verdict and one Proof, and drop the Origin. For 45 s, give the Proof two beats; for 60 s, test two related beliefs in a row (Verdict and Proof for each).

In `script.md` the Hook is `## Hook`; the Belief, Verdict, Proof and Origin are paragraphs of `## Body` (one beat each); the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- The belief must be one people really hold or repeat. Say it the way they say it.
- The Verdict beat starts with its verdict word ("Myth.", "Fact." or "Half true.") and comes before 11 s. Never leave it open.
- The proof is something measured, tested or recorded, with its source in `sources`. "Experts say" is not proof.
- A myth gets its origin; a fact gets the reason it sounds made up. Skip neither at 30 s or more.
- Never mock the viewer for believing it.
- Health and safety beliefs need a source a doctor would accept (a health agency, a review paper). Without one, choose another belief.

## Example 1: Lightning never strikes twice

```markdown
---
title: Does lightning strike the same place twice?
script_type: 3
hook: 15
ending: 3
sources: National Weather Service, "Lightning myths"
---

## Hook
Lightning never strikes the same place twice? Wrong.
> visual: a lightning bolt hitting a lone tree on a hill

## Body
Myth. Lightning often hits the same spot again and again.
> visual: a big red MYTH stamp

The Empire State Building is hit about 23 times a year.
> visual: lightning striking a skyscraper's tip, a counter ticking up

Tall, pointy, lonely things get hit most, and they never move out of the way. The old saying is about luck, not weather.
> visual: a lightning rod on a church spire, glowing

## Ending
What's the closest lightning has ever come to you?
```

## Example 2: Wombats poop cubes

```markdown
---
title: Do wombats really poop cubes?
script_type: 3
hook: 12
ending: 5
sources:
  - Phys.org, "How wombats cube their poo" (2021)
  - Improbable Research, "Ig Nobel Prize Winners" (2019, Physics)
---

## Hook
Myth or fact: wombats poop cubes. You have three seconds.
> visual: a wombat next to a big question mark, a timer counting down

## Body
Fact. Wombats really do leave cube-shaped droppings.
> visual: a neat row of little brown cubes on a rock

The cubes form inside the gut, where stiff and stretchy bands in the intestine wall press corners into the drying poop.
> visual: a cut-away tube squeezing a soft shape into a cube

It sounds like a joke, and the study did win an Ig Nobel Prize in 2019: the prize for science that makes people laugh, then think.
> visual: a tiny trophy shaped like a cube

## Ending
And on a rock, a cube stays put. A ball would roll away.
```
