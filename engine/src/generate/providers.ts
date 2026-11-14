// The image and clip providers a page can name in `providers.images` and `providers.ai_clips`.

/** The model behind `images: replicate`: https://replicate.com/black-forest-labs/flux-2-pro */
export const IMAGE_MODEL = "black-forest-labs/flux-2-pro";

/** Clip models on Replicate by short name, for `ai_clips: replicate:<name>`; plain `replicate` means the first. */
export const CLIP_MODELS: Record<string, string> = {
  kling: "kwaivgi/kling-v3-video", // https://replicate.com/kwaivgi/kling-v3-video
  veo: "google/veo-3.1-fast", // https://replicate.com/google/veo-3.1-fast
  seedance: "bytedance/seedance-2.0-fast", // https://replicate.com/bytedance/seedance-2.0-fast
};

/**
 * What a known model needs besides the prompt, "9:16" and, for images, the file format; any
 * other model gets only those. Clips are made silent: the video has its own voice and music.
 */
export const MODEL_INPUTS: Record<string, Record<string, unknown>> = {
  [IMAGE_MODEL]: { resolution: "2 MP" },
  "kwaivgi/kling-v3-video": { duration: 5, generate_audio: false },
  "google/veo-3.1-fast": { duration: 6, generate_audio: false }, // 4, 6 or 8 seconds
  "bytedance/seedance-2.0-fast": { duration: 5, generate_audio: false },
};

export type MediaProvider = { name: "none" } | { name: "pexels" } | { name: "replicate"; model: string };

const SLUG = /^[\w.-]+\/[\w.-]+$/;

export const IMAGE_CHOICES = "none, pexels, replicate, replicate:<owner>/<model>";
export const CLIP_CHOICES = `none, replicate, ${Object.keys(CLIP_MODELS).map((n) => `replicate:${n}`).join(", ")}, replicate:<owner>/<model>`;

/** The provider behind `providers.images`, or undefined for a name it doesn't know. */
export function imageProvider(choice: string): MediaProvider | undefined {
  if (choice === "none" || choice === "pexels") return { name: choice };
  return onReplicate(choice, IMAGE_MODEL, {});
}

/** The provider behind `providers.ai_clips`, or undefined for a name it doesn't know. */
export function clipProvider(choice: string): MediaProvider | undefined {
  if (choice === "none") return { name: "none" };
  return onReplicate(choice, Object.values(CLIP_MODELS)[0]!, CLIP_MODELS);
}

function onReplicate(choice: string, model: string, shortNames: Record<string, string>): MediaProvider | undefined {
  if (choice === "replicate") return { name: "replicate", model };
  if (!choice.startsWith("replicate:")) return undefined;
  const named = choice.slice("replicate:".length);
  const slug = shortNames[named] ?? (SLUG.test(named) ? named : undefined);
  return slug ? { name: "replicate", model: slug } : undefined;
}
