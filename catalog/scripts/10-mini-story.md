# 10 Mini story

## Purpose

Tell a short made-up story with one character, one problem and a twist at the end. When the page has a mascot, it stars, so viewers come back for the character as well as the story.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The character in a strange moment, or the page's hook aimed at the story. | 0–3 s |
| Character | Who they are and what they want. | 3–8 s |
| Problem | What stands in the way. Plant here the clue the twist will need. | 8–14 s |
| Attempt | What they try. It fails, or seems to work. | 14–21 s |
| Twist | The reveal that makes the viewer see the story differently. | 21–27 s |
| Ending | The page's ending type (default: punchline). | 27–30 s |

For 15 s, merge the Character and the Problem into one beat and drop the Attempt. For 45–60 s, give the character two or three attempts that fail in different ways before the twist.

In `script.md` the Hook is `## Hook`; the Character, Problem, Attempt and Twist are paragraphs of `## Body` (one beat each); the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- One main character. If the page has a mascot, it is the main character, named in the first body beat and true to its `mascot.md` (look, personality, do and don't).
- The narrator tells the story. A mascot whose `mascot.md` says it never talks gets no lines of dialogue.
- The twist is fair: its clue (an object, a habit, a time) appears in an earlier beat, so a second viewing makes sense.
- The twist is the last body beat. Never hint at it in the hook.
- Show what the character does, not what they feel: "She hides behind the sofa all night", not "she is determined".
- Present tense and short sentences, so each beat is one picture.
- Fiction needs no `sources`, but any real fact inside the story (what an animal eats, how a machine works) must still be true.
- Never explain the twist in the ending. Let a punchline or a loop land it.

## Example 1: Miso and the empty bowl

```markdown
---
title: Who keeps emptying Miso's bowl?
script_type: 10
hook: 1
ending: 1
---

## Hook
Who keeps emptying Miso's food bowl every night?
> visual: Miso, an orange cat in teal glasses, staring at an empty bowl

## Body
Miso is the cleverest cat she knows. She also wakes at three every morning, for no reason.
> visual: Miso's eyes snapping open in the dark, a clock at 3:00

Every night her bowl is full. Every morning it's empty. Someone is stealing.
> visual: a full bowl at night, an empty bowl at sunrise, Miso thinking

So tonight she hides behind the sofa and watches. Midnight. One. Two. Nothing moves.
> visual: Miso peeking over the sofa, the clock hands spinning

At three, an orange paw reaches into the bowl. Hers. She eats every bite and goes back to sleep.
> visual: Miso sleepwalking to the bowl, then curling up, full

## Ending
In the morning, she stares at the empty bowl and asks herself:
```

## Example 2: The robot vacuum

```markdown
---
title: The robot vacuum and the crumb thief
script_type: 10
hook: 13
ending: 5
---

## Hook
2 a.m. The robot vacuum finally catches the crumb thief.
> visual: a robot vacuum's headlight sweeping a dark living room

## Body
Dot is a robot vacuum. Every night it cleans the flat, rolling past Biscuit, the old dog by the sofa.
> visual: a small round robot gliding past a sleeping dog

Every morning, one crumb is back under the sofa. Dot cleans it. Next morning, it's back.
> visual: a single crumb appearing under the sofa, day after day

So tonight Dot stays switched on, lights off, waiting by the sofa.
> visual: the robot parked in the dark, one small light blinking

At 2 a.m., a nose nudges a crumb under the sofa. It's Biscuit. A clean floor means Dot stops visiting.
> visual: the dog nudging a crumb, then wagging as the robot rolls over

## Ending
Dot never cleans that crumb again.
```
