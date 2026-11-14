import { createContext, useContext } from "react";
import type { VideoPlan } from "../../src/plan/types.js";
import type { StyleKit } from "../styles/registry.js";

/** What every component inside a video can reach: the plan, its style and its palette. */
export interface VideoContextValue {
  plan: VideoPlan;
  style: StyleKit;
  palette: string[];
}

export const VideoContext = createContext<VideoContextValue | undefined>(undefined);

/** The video being rendered; throws outside one. */
export function useVideo(): VideoContextValue {
  const value = useContext(VideoContext);
  if (!value) throw new Error("useVideo() is only available inside an unfaced video");
  return value;
}
