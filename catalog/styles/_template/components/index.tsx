import type { StyleKit } from "../../../../engine/remotion/styles/registry.js";
import style from "../style.json";
import { Background } from "./Background.js";
import { Fact } from "./Fact.js";
import { Figure } from "./Figure.js";
import { layout } from "./layout.js";
import { List } from "./List.js";
import { Outro } from "./Outro.js";
import { Title } from "./Title.js";

const views = { title: Title, fact: Fact, list: List, outro: Outro };

/** The template style. See ../README.md for how to turn a copy into a new style. */
export const template: StyleKit = {
  id: style.id,
  defaultPalette: style.defaultPalette,
  layout,
  Background,
  Figure,
  SceneView: ({ scene, palette }) => {
    const View = views[scene.kind];
    return <View scene={scene} palette={palette} />;
  },
};
