# 09 Did you know

## Purpose

Chain three to five related facts about one topic, each a little stranger than the last. The viewer keeps watching because every fact raises the bar.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The page's hook type, aimed at the topic. | 0–3 s |
| Fact 1 | The least surprising fact. It sets the topic. | 3–9 s |
| Fact 2 | Stranger than fact 1. | 9–15 s |
| Fact 3 | The strangest fact, saved for last. | 15–24 s |
| Ending | The page's ending type (default: punchline). | 24–30 s |

For 15 s, use two facts. For 45 s, use four; for 60 s, five. The strangest fact always comes last.

In `script.md` the Hook is `## Hook`, each fact is one paragraph of `## Body`, and the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- All facts are about one topic. A list of random facts loses the viewer.
- Each fact is one or two sentences and starts with its subject, not with "Did you know".
- Say "Did you know" at most once, in the hook.
- Every fact must be true and checkable. List the sources in `sources`.
- Order by surprise, not by importance.

## Example 1: Cats

```markdown
---
title: Three things you didn't know about cats
script_type: 9
hook: 1
ending: 5
sources:
  - Cornell Feline Health Center
  - Smithsonian Magazine
---

## Hook
What three secrets is your cat keeping from you?
> visual: a cat peeking out of a cardboard box

## Body
Cats sleep up to sixteen hours a day.
> visual: a cat asleep while a clock spins fast

Adult cats rarely meow at each other. They save meowing for humans.
> visual: two cats staring silently, then one meowing at a person

A cat's purr sits between 25 and 150 hertz. Vibrations in that range are being studied to help bones heal.
> visual: sound waves around a purring cat

## Ending
So your cat isn't lazy. It's a tiny healing machine on standby.
```

## Example 2: The Moon

```markdown
---
title: The Moon is weirder than you think
script_type: 9
hook: 9
ending: 5
sources: NASA Science, "Earth's Moon"
---

## Hook
You see it almost every night, and you've never noticed this.
> visual: a full moon over rooftops

## Body
The Moon always shows us the same face.
> visual: the Moon orbiting Earth with the same side always facing it

It is moving away from Earth by about 3.8 centimetres a year.
> visual: a ruler stretching between Earth and the Moon

Footprints left on the Moon in 1969 are still there. With no wind or rain, they could last millions of years.
> visual: a boot print in grey dust

## Ending
Up there, a boot print older than your parents will outlive us all.
```
