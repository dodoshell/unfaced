# 05 Story in 60 seconds

## Purpose

Tell one real event as a story with a beginning, a middle and an end: who and where, what changed, how it ended. The viewer stays because they want to know how it turns out.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The most dramatic moment, or the strangest fact, of the story. | 0–3 s |
| Setup | When, where and who, in one or two sentences. | 3–9 s |
| Turn | The moment everything changes. | 9–15 s |
| Climax | The peak: the biggest, fastest or worst moment. | 15–22 s |
| Resolution | How it ended, and what changed because of it. | 22–27 s |
| Ending | The page's ending type (default: punchline). | 27–30 s |

The type is at its best at 45–60 s: there, give the Turn and the Climax two beats each and add a beat of aftermath. At 15 s, keep only the Turn and the Resolution.

In `script.md` the Hook is `## Hook`; the Setup, Turn, Climax and Resolution are paragraphs of `## Body` (one beat each, in time order); the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- One real event. The Setup says its date and place.
- After the hook, every beat moves forward in time. Only the hook may jump ahead to the climax.
- One tense for the whole story. The present tense pulls the viewer in ("It's 1919. A tank bursts.").
- One main character or one main object. Leave out everyone the story doesn't need.
- Quote people only with words that are on record in a source you list. No invented dialogue.
- When sources disagree on a number, use the range they share ("several metres high", "more than 150"), not the most dramatic one.

## Example 1: The Great Molasses Flood

```markdown
---
title: The day Boston flooded with molasses
script_type: 5
hook: 13
ending: 5
sources: Mass Moments, "January 15, 1919" (the Great Molasses Flood)
---

## Hook
A wave of syrup is rolling down a Boston street.
> visual: a brown wave pouring between brick buildings

## Body
January 15, 1919, a mild day in Boston. By the harbour stands a giant tank of molasses.
> visual: a huge round tank beside the docks

Around midday, it bursts. Almost nine million litres of molasses pour out.
> visual: rivets popping as the tank splits open

A sticky wave several metres high floods the streets, faster than anyone can run. Twenty-one people die, and more than 150 are hurt.
> visual: people climbing lampposts as the wave passes below

A court blames the company, and Massachusetts and most other states pass laws to certify engineers.
> visual: an engineer's stamp landing on a blueprint

## Ending
Slow as molasses? Not that day.
```

## Example 2: The Post-it note

```markdown
---
title: The failed glue behind the Post-it note
script_type: 5
hook: 9
ending: 6
sources: MNopedia (Minnesota Historical Society), "Post-it Notes"
---

## Hook
Nobody talks about the failed glue behind Post-it notes.
> visual: a yellow sticky note on a computer screen

## Body
1968, at 3M in Minnesota. Spencer Silver tries to make a strong glue and gets a weak one that peels right off.
> visual: a test strip lifting off a sheet with no effort

For years, it's useless. Then his colleague Art Fry's bookmarks keep falling out of his hymn book at choir.
> visual: paper slips fluttering out of a hymn book

He coats them with the weak glue. They stay, and peel off clean.
> visual: a yellow bookmark stuck to a page, lifted and stuck again

In 1980, Post-it Notes go on sale across the US.
> visual: shop shelves filling with yellow pads

## Ending
That failed glue? It's holding the note on your screen.
```
