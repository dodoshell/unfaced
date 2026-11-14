# script.md format

Every video folder has a `script.md`: what the narrator says, split into beats, with an optional note on what is on screen for each beat. The engine reads it with `parseScript` (`engine/src/script/parseScript.ts`).

## Example

```markdown
---
title: Why do cats purr?
script_type: 6
hook: 1
ending: 5
sources:
  - Cornell Feline Health Center
---

## Hook
Why do cats purr?
> visual: a cat on a sofa, eyes half closed

## Body
Most people think purring means a happy cat.

But cats also purr when they are hurt.
> visual: a vet holding a cat

## Ending
Purring might be how cats heal themselves.
```

## Front matter

| Field | Required | Meaning |
|---|---|---|
| `title` | yes | The video's working title. |
| `script_type` | yes | Number from the script catalog (`unfaced list script`). |
| `hook` | yes | Number from the hook catalog. |
| `ending` | yes | Number from the ending catalog. |
| `sources` | no | Where the facts come from: one line or a list. |

## Sections

The three sections are required and come in this order.

- `## Hook`: one beat, the opening line.
- `## Body`: one beat per paragraph. Paragraphs are separated by a blank line; the lines of one paragraph are joined with a space.
- `## Ending`: one beat, the closing line.

Beats get the ids `hook`, `b1`, `b2`, … and `ending`.

## Visuals

A line starting with `> visual:` describes what should be on screen during that beat. It is never spoken. Put it inside the paragraph it belongs to; a `> visual:` paragraph on its own attaches to the beat before it.

## What the voice reads

The voice reads every beat in order. Emoji stay in the beat text (captions can show them) but are not read aloud. Write numbers the way they should be said when it matters ("3.8 centimetres", not "3.8cm").

Files may use Windows or Unix line endings, with or without a byte order mark.
