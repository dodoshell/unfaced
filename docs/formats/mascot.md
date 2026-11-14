# Mascot format

A page can have a recurring character that looks the same in every video. It lives in the page's `brand/mascot/` folder:

| File | Written by | What it holds |
|---|---|---|
| `mascot.json` | the agent (page-setup skill) | The character: a species preset with any part changed. Schema: `schema/mascot.schema.json`. |
| `mascot.md` | the agent | Name, look in words, personality, do and don't. Scripts and scenes follow it. |
| `reference.png` | `unfaced mascot <pageDir>` | The reference sheet: two large views and the ten poses, in the page's style. The reviewer compares frames against it. |

## mascot.json

```json
{
  "name": "Miso",
  "species": "cat",
  "colours": { "body": "#F28C28", "belly": "#FFE3C2", "accent": "#2EC4B6" },
  "accessories": ["glasses"]
}
```

| Field | Values |
|---|---|
| `name` | The character's name (required). |
| `species` | `cat`, `dog`, `fox`, `bear`, `bunny`, `bird`, `person`, `blob` (required). Each is a full preset; everything below only changes it. |
| `build` | `quadruped` (on four legs) or `biped` (upright). |
| `body` | `round`, `long`, `tall`. |
| `head` | `round`, `wide`, `tall`. |
| `ears` | `none`, `pointy`, `floppy`, `round`, `long`. |
| `tail` | `none`, `thin`, `fluffy`, `short`. |
| `hair` | `none`, `tuft`, `bob`, `spiky`. |
| `snout` | `none`, `short`, `long`, `beak`. |
| `pattern` | `none`, `spots`, `stripes`. |
| `colours` | `body`, `belly`, `accent`, `head`, `legs`, `hair`, `ink` as `#RRGGBB`; unset ones keep the preset's. |
| `accessories` | Any of `glasses`, `hat`, `scarf`, `bow`, `collar`. |

The poses every style can draw: `idle`, `walk`, `run`, `jump`, `point`, `talk`, `surprised`, `happy`, `sad`, `thinking`. The motion is the same in every style; only the painting changes.

## mascot.md

```markdown
# Miso

An orange tabby cat with round teal glasses and a cream belly. Small, round, always curious.

## Personality
Nerdy and a little smug; explains things as if they were obvious, then gets surprised by the twist.

## Do
- Show Miso reacting to the facts: thinking during the question, surprised at the answer.
- Keep Miso small and to one side when the scene has text.

## Don't
- Never give Miso a voice of its own; the narrator talks.
- No other glasses colour, no other cats dressed like Miso.
```

## How videos use it

- `unfaced make` puts the mascot into the plan; the style's scenes show it (in style 03: surprised on the title, talking, pointing or thinking on facts, reacting to the ending).
- A video's own scenes draw it with `useMascot()` and `<Character rig={mascot.rig} pose="happy" ... />` from `@unfaced/kit` (`unfaced docs scenes`).
- After changing `mascot.json` or the page's style, run `unfaced mascot <pageDir>` again and look at the new `reference.png`.
- With manual handoff or a paid image provider, the reference sheet is the anchor for prompts, so generated images stay on-model.
