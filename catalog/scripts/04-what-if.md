# 04 What if

## Purpose

Change one thing about the world and follow it to its consequences, from the first second to the far future. The scenario is imaginary; everything that follows from it is real science, so the viewer learns something while imagining.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The scenario: "What if...", or the page's hook aimed at it. | 0–3 s |
| First | What happens at once, and the real rule behind it. | 3–10 s |
| Next | What happens later, or further away. | 10–17 s |
| Last | The biggest or strangest consequence. | 17–25 s |
| Ending | The page's ending type (default: cliffhanger). | 25–30 s |

For 15 s, keep the First and Last consequences. For 45 s, add a fourth consequence; for 60 s, five, or four and a beat that sets the scenario's rules first ("Say the tunnel has no air").

In `script.md` the Hook is `## Hook`, each consequence is one paragraph of `## Body`, and the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- Change one thing only. Everything else keeps the real laws of physics, biology and history.
- Each consequence comes from a real rule the voice names or shows ("light takes eight minutes to get here"). A consequence with no real rule behind it is fiction: cut it.
- Order the consequences in time (seconds, months, ages) or in size (a room, a city, a planet), and never step back down.
- Say once, in the hook, that the scenario is imaginary ("What if", "POV", "Imagine"). After that, tell it straight, in the present or with "would".
- If the scenario only works by ignoring something (air, heat), say so in one short sentence.
- `sources` lists the science behind the consequences, not the scenario.

## Example 1: The Earth stops spinning

```markdown
---
title: What if the Earth stopped spinning?
script_type: 4
hook: 1
ending: 2
sources:
  - Astronomy, "What would happen if Earth stopped spinning?"
  - WorldAtlas, "What if Earth stopped spinning?"
---

## Hook
What would happen if the Earth suddenly stopped spinning?
> visual: the Earth freezing mid-turn

## Body
The ground would stop, but the air wouldn't. At the equator, it would keep rushing east at about 1,670 kilometres an hour.
> visual: trees and houses swept sideways by a wall of wind

Then the Sun would crawl across the sky. Daylight would last about six months, then night would last six months.
> visual: the Sun frozen above one half of the planet

And the oceans would slowly slide toward the poles, leaving one giant continent around the middle of the Earth.
> visual: water draining off the equator into two polar oceans

## Ending
Next: which countries would end up under the new oceans.
```

## Example 2: A tunnel through the Earth

```markdown
---
title: What if you jumped into a tunnel through the Earth?
script_type: 4
hook: 8
ending: 5
sources: Klotz (2015), "The Gravity Tunnel in a Non-Uniform Earth", American Journal of Physics
---

## Hook
POV: you just jumped into a tunnel straight through the Earth.
> visual: a figure dropping into a hole that runs through a cut-away Earth

## Body
Pretend there's no air and no heat. You fall faster and faster, and you feel weightless the whole way.
> visual: the figure floating calmly as the tunnel walls blur past

At the centre of the Earth, you're at top speed. Then gravity starts pulling you back, and you slow down.
> visual: a speedometer peaking at the centre, then dropping

About 38 minutes after you jumped, you rise out of the other side and stop, right at the edge.
> visual: the figure popping up from a hole on the far side of the planet

## Ending
Grab on. Otherwise you'll fall back and do it again, forever.
```
