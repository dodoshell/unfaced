import type { StyleKit } from "../../../../engine/remotion/styles/registry.js";
import style from "../style.json";
import { Background } from "./Background.js";
import { Fact } from "./Fact.js";
import { Figure } from "./Figure.js";
import { layout } from "./layout.js";
import { List } from "./List.js";
import { Outro } from "./Outro.js";
import { OnTwos } from "./shared.js";
import { Title } from "./Title.js";

const views = { title: Title, fact: Fact, list: List, outro: Outro };

/** Style 08, vintage comic. See ../STYLE.md. */
export const vintageComic: StyleKit = {
  id: style.id,
  defaultPalette: style.defaultPalette,
  layout,
  Background,
  Figure,
  SceneView: ({ scene, palette }) => {
    const View = views[scene.kind];
    return (
      <OnTwos>
        <View scene={scene} palette={palette} />
      </OnTwos>
    );
  },
};
