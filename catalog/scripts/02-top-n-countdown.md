# 02 Top N countdown

## Purpose

Rank a few things on one measure and reveal them from the bottom up, so the viewer waits for number one. The hook promises that number one is the biggest surprise; every item before it raises the stakes.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | How many items there are, and a tease about number one. | 0–3 s |
| Number 3 | The lowest-ranked item: its name and the fact that ranks it. | 3–10 s |
| Number 2 | The next item, bigger or stranger. | 10–17 s |
| Number 1 | The item the hook promised, with its best detail. | 17–26 s |
| Ending | The page's ending type (default: punchline). | 26–30 s |

For 45 s, count down from five; for 60 s, from five with two sentences per item, or from seven. Under 30 s a countdown feels rushed: use did you know (09) instead.

In `script.md` the Hook is `## Hook`, each item is one paragraph of `## Body`, written from the lowest rank down to number one, and the Ending is `## Ending`. The fact badge counts down by itself (3, 2, 1), so the body holds the ranked items and nothing else: no intro paragraph, no recap. Keep each item a plain paragraph; three lines starting with `- ` would make it a list scene, which has no badge and breaks the count. See `docs/formats/script.md`.

## Rules

- Rank on one measurable thing (area, size, speed, age), named in the hook or the first item. Never "best" or "coolest".
- The order must match the source you list. If sources disagree on the order, pick another topic.
- A top N has exactly N body paragraphs, in countdown order.
- Start each item with its name. The badge shows the rank, so say a number only for the last item ("And number one: ...").
- Each item gets the fact that ranks it, plus at most one extra detail.
- Number one must pay off the hook. If it's the answer everyone expects, give it a detail they don't.

## Example 1: The biggest moons

```markdown
---
title: The three biggest moons in the solar system
script_type: 2
hook: 7
ending: 5
sources: NASA Science, "Callisto", "Titan", "Ganymede" and "Io"
---

## Hook
Three giant moons, and number one is bigger than a planet.
> visual: three moons lined up in silhouette

## Body
Callisto, around Jupiter: about 4,800 kilometres across. It's the most heavily cratered object in the solar system.
> visual: a grey moon covered edge to edge in craters

Titan, around Saturn: about 5,150 kilometres across, and the only moon with a thick atmosphere.
> visual: a hazy orange moon with dark lakes

And number one: Ganymede, around Jupiter: 5,268 kilometres across, bigger than the planet Mercury. It's also the only moon with its own magnetic field.
> visual: Ganymede next to a smaller Mercury

## Ending
And our Moon? It only comes fifth.
```

## Example 2: The smallest countries

```markdown
---
title: The three smallest countries on Earth
script_type: 2
hook: 12
ending: 4
sources:
  - WorldAtlas, "The Smallest Countries In The World"
  - Wikipedia, "Central Park" (843 acres, 3.41 square kilometres)
---

## Hook
Bet you can't name the three smallest countries on Earth.
> visual: a globe spinning fast, then stopping

## Body
Nauru, an island in the Pacific. The whole country covers about twenty-one square kilometres.
> visual: a tiny island alone in a blue ocean

Monaco, on the French coast. At about two square kilometres, it would fit inside New York's Central Park.
> visual: Monaco's outline dropped inside Central Park

And number one: Vatican City, inside Rome. It covers less than half a square kilometre, and fewer than a thousand people live there.
> visual: a wall around a few streets in the middle of a city

## Ending
In part two: the three countries with the fewest people.
```
