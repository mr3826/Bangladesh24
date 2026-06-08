import type { MapTarget, SubtitleCue } from "@bangladesh24/shared";

export interface MapFeaturePath {
  key: string;
  districtName: string;
  divisionName: string;
  path: string;
}

export interface Bangladesh24ReelProps extends Record<string, unknown> {
  storyId: string;
  title: string;
  summary: string | null;
  sourceName: string;
  location: string;
  mapTarget: MapTarget;
  mapFeatures?: MapFeaturePath[];
  publishedAt: string | null;
  audioPublicPath: string | null;
  durationInSeconds: number;
  subtitles: SubtitleCue[];
}

export interface RenderStoryInput extends Bangladesh24ReelProps {
  outputPath: string;
  publicDir: string;
  entryPoint: string;
}
