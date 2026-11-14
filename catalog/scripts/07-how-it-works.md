# 07 How it works

## Purpose

Open up something the viewer uses every day and show what happens inside it, step by step, in the order it happens. Each step answers "and then what?", so the viewer stays until the result they know.

## Structure

| Beat | What happens | Target (30 s video) |
|---|---|---|
| Hook | The everyday thing, and the question or surprise about it. | 0–3 s |
| Step 1 | The first thing that happens inside when you use it. | 3–10 s |
| Step 2 | What that causes next. | 10–17 s |
| Step 3 | The step that gives the result you know: the heat, the cold, the tap. | 17–25 s |
| Ending | The page's ending type (default: punchline). | 25–30 s |

For 15 s, use two steps. For 45 s, use four; for 60 s, five, or four and one surprising side effect.

In `script.md` the Hook is `## Hook`, each step is one paragraph of `## Body` (the fact badge numbers them 1, 2, 3), and the Ending is `## Ending`. See `docs/formats/script.md`.

## Rules

- Explain one thing. Its steps run from what you do, through what happens inside, to what you get.
- Start each step with the part that acts ("A part called a magnetron...", "The compressor..."), so the viewer knows where to look.
- At most one technical word per step, explained in the same sentence.
- Steps go in the order they happen. If a step needs something a later step explains, reorder them.
- Say what physically happens (it moves, heats, squeezes), not what a part is "designed to" do.
- Keep each step to 20 words or fewer; split a longer one into two steps.

## Example 1: The microwave oven

```markdown
---
title: How a microwave heats your food
script_type: 7
hook: 1
ending: 5
sources: U.S. Food and Drug Administration, "Microwave Ovens"
---

## Hook
Why does a microwave heat the soup but not the bowl?
> visual: steaming soup in a cool glass bowl

## Body
A part called a magnetron makes microwaves, invisible waves close to radio waves.
> visual: a glowing tube sending out wavy lines

The waves bounce off the metal walls, and pass straight through glass, paper and plastic.
> visual: waves zig-zagging around the box and through the bowl

Food soaks them up. They make the water in it vibrate, and that vibration is heat.
> visual: water molecules in the soup jiggling and glowing

The heat starts in the outer layers. The middle only warms as that heat spreads inward.
> visual: a cut-away of the soup warming from the edge to the centre

## Ending
That's why leftovers come out lava outside and ice inside.
```

## Example 2: The fridge

```markdown
---
title: Your fridge doesn't make cold
script_type: 7
hook: 6
ending: 6
sources: iFixit, "How Refrigerators Work"
---

## Hook
Your fridge doesn't make anything cold.
> visual: an open fridge with a big question mark inside

## Body
A cold liquid called refrigerant runs through pipes inside. It soaks up your food's heat and turns into gas.
> visual: blue liquid in pipes turning to vapour

The compressor squeezes that gas, which makes it hotter than your kitchen.
> visual: a pump squeezing the gas until it glows red

Coils at the back or underneath pass that heat into your kitchen.
> visual: heat waves rising off the coils behind the fridge

A valve drops the pressure. The refrigerant turns cold again and flows back inside.
> visual: the red gas passing a valve and turning blue

## Ending
So your fridge doesn't make cold. It moves your food's heat into your kitchen.
```
