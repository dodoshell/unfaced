# 01 Build it

## Purpose

Build one thing in front of the viewer, starting with the version anyone would try first and fixing it step by step until it becomes the real thing. Each step solves the problem the last one left, so the viewer stays to see it finished.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The finished thing, or the challenge of building it. | 0–3 s |
| Step 1 | The naive version: the obvious way to build it, and why it fails. | 3–10 s |
| Step 2 | The first fix, and the new problem it brings. | 10–17 s |
| Step 3 | The last fix. Now it's the real thing. | 17–25 s |
| Ending | The page's ending type (default: callback to the hook). | 25–30 s |

For 15 s, drop the naive version and use two steps. For 45 s, use four steps; for 60 s, five or six. The real thing always comes in the last step.

In `script.md` the Hook is `## Hook`, each step is one paragraph of `## Body` (the fact badge numbers them 1, 2, 3), and the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- Step 1 is the version a beginner would try, and it fails for a reason the viewer can picture: it snaps, melts, sags or falls over.
- Every later step fixes a problem the step before it left: name the problem, then the fix. A step that fixes nothing gets cut.
- Keep the steps in the order they really happen, or happened in history. The badge counts them, so the voice never says "step two".
- One thing is built from start to finish. Never switch to a different object halfway.
- Each step names one problem and one fix, in one or two sentences.
- Every claim about materials, dates or physics must be true. List the sources in `sources`.

## Example 1: Glass

```markdown
---
title: How sand becomes glass
script_type: 1
hook: 10
ending: 5
sources:
  - Glenn K. Lockwood, "Glass compositions"
  - Wikipedia, "Soda–lime glass"
---

## Hook
This window started as a pile of sand.
> visual: a sunny window, then a rewind to a heap of pale sand

## Body
Melt pure sand, and you need over 1,700 degrees Celsius. Even then, it's too thick to shape.
> visual: a thermometer bursting over a crucible of sand

Add soda ash, and the sand melts far more easily. But now the glass dissolves in water.
> visual: a glass cup slumping into a puddle in the rain

Add lime, and the glass stops dissolving. That's soda-lime glass, about ninety percent of all glass made today.
> visual: a bottle, a jar and a window lined up

## Ending
Your phone's screen is glass too. You're staring at sand right now.
```

## Example 2: The bicycle

```markdown
---
title: The first bicycle had no pedals
script_type: 1
hook: 6
ending: 3
sources: IEEE Spectrum, "It Took the Bicycle 200 Years to Find Its Way in the World"
---

## Hook
The first bicycle had no pedals.
> visual: a wooden two-wheeler with no pedals

## Body
In 1817, Karl Drais built a running machine: you sat on it and kicked the ground.
> visual: a man in a top hat kicking along on a wooden bike

In the 1860s, pedals arrived on the front wheel: one turn of the pedals, one turn of the wheel.
> visual: pedals spinning on a front axle

So the front wheel grew huge: the penny-farthing. Fast, but falls were dangerous.
> visual: a rider tipping forward off a giant front wheel

In 1885, the Rover fixed it: equal wheels, and a chain so small wheels could go fast.
> visual: a chain turning a small back wheel

## Ending
Which would you ride: the running machine or the penny-farthing?
```
