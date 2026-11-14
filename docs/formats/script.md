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
| `sources` | no | Where the facts come from: one line or a list. Put a source in quotes when it contains ": " (a colon and a space), or YAML reads it as a key. |
| `style`, `voice`, `captions`, `music` | no | This video's own choice from that catalog. It wins over the page's choice for this video only; `page.yaml` stays as it is. |

When the page leaves a choice open (a list such as `script: [2, 6, 9]`, or `auto`), the agent picks one for the video and writes it here, with the reason in its reply. A one-off change ("style 12 this time") goes here too. `unfaced make` prints a line for every choice that differs from the page. Without a choice here, a fixed number in the page is used, and a list or `auto` falls back to its first ready option.

## Sections

The three sections are required and come in this order.

- `## Hook`: one beat, the opening line.
- `## Body`: one beat per paragraph. Paragraphs are separated by a blank line; the lines of one paragraph are joined with a space.
- `## Ending`: one beat, the closing line.

Beats get the ids `hook`, `b1`, `b2`, … and `ending`.

A body paragraph with three or more lines starting with `- ` becomes a list scene. The items keep their own lines on screen and are read as "water, noise, closed doors.":

```markdown
Three things cats hate:
- water
- noise
- closed doors
```

The voice reads the paragraph in the order it is written, but a list scene shows every line that is not an item above the items. Keep one lead-in line first, and put anything that follows the list in a paragraph of its own. Keep a list to 7 items or fewer: past that the styles show the items small or cut them, and `make` warns. Split a longer list into two paragraphs.

## Visuals

A line starting with `> visual:` describes what should be on screen during that beat. It is never spoken. Put it inside the paragraph it belongs to; a `> visual:` paragraph on its own attaches to the beat before it.

A visual is a brief for a scene you write in the video's `scenes/` folder (`unfaced docs scenes`). The style's own scenes never draw it: they show the beat's text and the mascot. So write a scene for every visual you keep, or drop the note. The example scripts in `examples/` and `catalog/scripts/` keep their notes to show where a scene helps; made as they are, their videos show the style's own scenes.

## What the voice reads

The voice reads every beat in order. Emoji stay in the beat text (captions can show them) but are not read aloud. Write numbers the way they should be said when it matters ("3.8 centimetres", not "3.8cm").

Files may use Windows or Unix line endings, with or without a byte order mark.
