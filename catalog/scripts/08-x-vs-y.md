# 08 X vs Y

## Purpose

Put two things side by side, compare them on the same points one round at a time, then name a winner. The viewer stays to see whether their side wins.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The matchup: both names, and what they compete on. | 0–3 s |
| Round 1 | The first point: both sides, and who wins it. | 3–10 s |
| Round 2 | The second point. | 10–16 s |
| Round 3 | The third point. If one round is close, put it here. | 16–22 s |
| Verdict | The winner, in one sentence. | 22–27 s |
| Ending | The page's ending type (default: comment question). | 27–30 s |

For 15 s, use one round and the verdict. For 45 s, use four rounds; for 60 s, five.

In `script.md` the Hook is `## Hook`; each round and then the verdict are paragraphs of `## Body` (one beat each); the Ending is `## Ending`. The verdict is the last body paragraph, so it is spoken even when the Ending is a question. See `docs/formats/script.md`.

## Rules

- Every round measures both sides on the same thing, in the same units. "4 kilobytes against 8 gigabytes" compares; "2,048 words against 8 gigabytes" doesn't.
- Name X before Y in every round, so the viewer always knows which number is whose.
- Every round ends by naming its winner ("Phone wins.", "Crocodile again.").
- The verdict is one sentence and names one winner. "It depends" is allowed only with the deciding condition in the same sentence.
- Be fair to the loser: if it wins a round, or wins at something the rounds don't measure, say so.
- Every number needs a source in `sources`.

## Example 1: Crocodile vs alligator

```markdown
---
title: Crocodile vs alligator
script_type: 8
hook: 12
ending: 5
sources: PBS Nature, "Alligator vs. Crocodile" (the differences)
---

## Hook
Crocodile or alligator: pick the scarier one in three seconds.
> visual: two reptile heads side by side, a timer counting down

## Body
Size. Saltwater crocodiles pass six metres. American alligators reach three to four and a half. Crocodile wins.
> visual: the two side by side against a measuring tape

Temper. Nile and saltwater crocodiles are far more aggressive. Alligators tend to avoid people. Crocodile again.
> visual: a crocodile lunging at the bank, an alligator sliding away

Range. Crocodiles live across the tropics, even in salt water. Alligators, mainly in the US and China. Crocodile sweeps it.
> visual: a world map lighting up where each one lives

The verdict: the crocodile is the one to fear.
> visual: a crown on the crocodile's head

## Ending
If it smiles with its mouth shut, back away. That's a crocodile.
```

## Example 2: African vs Asian elephant

```markdown
---
title: African vs Asian elephant
script_type: 8
hook: 1
ending: 3
sources: IFAW (ifaw.org), on the differences between African and Asian elephants
---

## Hook
African or Asian elephant: which one is the real giant?
> visual: two elephants walking towards each other

## Body
Weight. Even the lightest African savannah bulls, at four and a half tonnes, outweigh the average Asian bull, at three and a half. Africa wins.
> visual: both elephants on a giant scale, tipping to the African side

Ears. African ears are huge, shaped a bit like Africa. Asian ears are small and round. Africa again.
> visual: the two ears side by side, one with a map outline

Tusks. African elephants of both sexes grow big tusks. In Asian elephants, usually only the males' show. Africa takes it.
> visual: tusks appearing on each elephant in turn

The verdict: the African savannah elephant, Earth's largest land animal.
> visual: the African elephant raising its trunk

## Ending
African or Asian: which would you rather meet?
```
