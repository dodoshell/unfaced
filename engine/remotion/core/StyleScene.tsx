import type { SceneComponent } from "./videoScenes.js";
import { useVideo } from "./VideoContext.js";

/**
 * The style's own scene for a beat. A video's scene can draw it and add its visual around
 * it, keeping the style's text (the hook's words on the first frame, a list's items).
 */
export const StyleScene: SceneComponent = ({ scene, palette }) => {
  const { style } = useVideo();
  return <style.SceneView scene={scene} palette={palette} />;
};
