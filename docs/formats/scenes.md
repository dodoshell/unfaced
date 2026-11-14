# Scenes format

Every style draws a scene for each beat of a script on its own: a title for the hook, a fact or a list for each body beat, an outro for the ending. When a beat needs something the style's scenes don't show (a diagram, a comparison, the mascot doing something specific, an image from `inbox/`), the video can bring its own scene code for that beat. Everything else keeps the style's scene.

## Files

```text
videos/<video>/
├── scenes/
│   ├── index.tsx      the video's scenes, by beat id (required if the folder exists)
│   ├── *.tsx          any other components index.tsx imports
│   └── boxes.json     the text boxes those scenes draw, for the checks (needed when they draw text)
└── inbox/             images or clips to show; read with staticFile("inbox/<file>")
```

`unfaced make` finds `scenes/index.tsx`, bundles it with the engine and renders. `make`, `frames` and `cover` stop before anything else when the folder has no `index.tsx` or `boxes.json` is not valid. Beat ids are `hook`, `b1`, `b2`, … and `ending`, in the order of `script.md`.

## index.tsx

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Character, defineScenes, SAFE_ZONE, useMascot, useVideo, type SceneComponent } from "@unfaced/kit";

const TwoBowls: SceneComponent = ({ scene, palette }) => {
  const frame = useCurrentFrame(); // 0 at the start of this beat
  const mascot = useMascot();
  const slide = interpolate(frame, [0, 12], [-300, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 120 + slide, top: 520, width: 340, height: 340, borderRadius: 170, background: palette[1] }} />
      <div style={{ position: "absolute", left: 620 - slide, top: 520, width: 340, height: 340, borderRadius: 170, background: palette[2] }} />
      {mascot && <Character rig={mascot.rig} pose="thinking" x={540} y={1120} size={240} />}
    </AbsoluteFill>
  );
};

export default defineScenes({ b2: TwoBowls });
```

- Import `remotion` and `react` by name, and everything unfaced offers from `@unfaced/kit`.
- A scene gets `{ scene, palette }`: `scene.text` is the beat's text, `scene.words` its words with their times, `scene.durationInFrames` its length. `useCurrentFrame()` counts from the start of the beat.
- `useVideo()` gives the whole plan, the style and the palette; `useMascot()` gives the page's mascot or `undefined`.
- The style's background stays behind the scene, and the engine draws the captions on top of it.
- The engine draws the ending's sign (an arrow, a question bubble, a follow button) on top, in `END_MARK_BOX`, whatever scene the ending has, unless the style draws it in its own last scene (style 03, inside `<StyleScene>`); then an ending scene that skips `<StyleScene>` draws `<EndingMark>` itself. `drawsEndingMark(useVideo().plan.style)` tells which.

What `@unfaced/kit` offers:

| Export | Use |
|---|---|
| `defineScenes`, `SceneComponent` | Declare the scenes by beat id. |
| `StyleScene` | The style's own scene for this beat: draw `<StyleScene scene={scene} palette={palette} />` and add your visual around it to keep the style's text. |
| `useVideo`, `useMascot`, `VideoContext` | The plan, the style, the palette, the mascot. |
| `Character`, `rigFor`, `POSES`, `SPECIES`, `ACCESSORIES` | Draw the mascot or any other character in the style's painting: `<Character rig={rigFor("dog")} pose="run" x={540} y={1100} size={400} facing={-1} />`. `x`, `y` is where the feet touch the ground, `size` is about the height in pixels, `facing={-1}` turns it to the left. |
| `characterParts`, `FigureFrame`, `plainPart`, `smoothPath`, `polygonPath`, `mirrorParts`, `partBounds`, `shade`, `FIGURE_BOX` | Build a custom figure painter. |
| `FRAME`, `SAFE_ZONE`, `CAPTION_BOX`, `CAPTION_STYLES`, `captionStyle` | The 1080×1920 frame, the margins the platforms cover, and where each caption style draws. |
| `EndingMark`, `markColours`, `endingMark`, `endingPose`, `END_MARK_BOX`, `drawsEndingMark` | The ending's sign, for a scene that draws it itself: `<EndingMark kind={endingMark(plan.ending)!} box={END_MARK_BOX} {...markColours(palette)} />`. |

## Layout rules

- The frame is 1080×1920 at 30 fps. Keep text inside the safe zone: 220 px from the top, 380 px from the bottom, 60 px from the left, 140 px from the right (the platforms put buttons there).
- Keep text out of the caption box of the video's caption style: `captionStyle(useVideo().plan.captions).box`.
- The hook's words are on screen from its first frame: that frame is the preview on every platform, and the captions only start with the voice. A hook scene draws `<StyleScene>` (the style's title) and adds its visual around it, or draws the hook's words itself and declares their box.
- Change something on screen every 3–5 seconds.

## boxes.json

The automatic checks know where the style draws text, but not where a video's own scenes do. `scenes/boxes.json` tells them: for each beat with its own scene, every box the scene draws text in, in pixels. The checks then test those boxes for overlaps with each other and the captions, and for leaving the safe zone, instead of the style's boxes for that beat.

```json
{
  "b2": [
    { "id": "left label", "x": 120, "y": 880, "w": 340, "h": 90 },
    { "id": "right label", "x": 620, "y": 880, "w": 340, "h": 90 }
  ]
}
```

A beat with its own scene and no text needs no entry; an ending scene that draws `<EndingMark>` lists the sign's box too. Boxes for a beat the script does not have are never checked, so `make` warns about them. Without an entry the checks test the style's boxes for that beat, which is right when the scene draws `<StyleScene>`; when it draws `<StyleScene>` and text of its own, list both (the style's boxes are in the Layout table of `unfaced show style <n>`).

## inbox/

Images or clips made elsewhere (manual handoff, or another tool) go in `inbox/`. Show them with Remotion's `<Img src={staticFile("inbox/cat.png")} />` or `<OffthreadVideo src={staticFile("inbox/clip.mp4")} />`.

What a file must be:

| Kind | Files | Shape |
|---|---|---|
| image | `.png`, `.jpg`, `.jpeg`, `.webp` | 9:16 (portrait), at least 1080 wide |
| clip | `.mp4` | H.264, 9:16 |
| voice | `.wav`, `.mp3` | any length, with sound |

The render reads only these. Hidden files (starting with `.`), folders and other types are left out.

`inbox/voice.wav` or `inbox/voice.mp3` is the video's voice-over: `unfaced make` uses it instead of recording one (except for voice 08, text only), prepares it like a recorded voice and times its words with whisper. Record the approved script as written, so the captions match.

### inbox/PROMPTS.md

For manual handoff the agent writes what it needs into `inbox/PROMPTS.md`: one `## <file name>` heading per file, with the prompt under it (the beat it is for, the subject, the style and the mascot from its reference sheet, and "9:16 portrait"). The user makes the files with any service they have and drops them into `inbox/` under those names.

```markdown
# Prompts

## kneading.png
For beat b2. A ginger cat with a white chest kneading a fluffy blanket, side view, flat cartoon style with thick dark outlines and bright colours, plain cream background, 9:16 portrait.
```

`unfaced inbox <videoDir>` prints one line per file (`ok`, `problem` with what is wrong, `ignored`) and one `waiting` line per prompt whose file hasn't arrived, and exits 1 when a file can't be used as it is.
