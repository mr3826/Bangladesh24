import type { ComponentType } from "react";
import { Composition } from "remotion";
import { Bangladesh24Reel } from "./templates/Bangladesh24Reel";
import type { Bangladesh24ReelProps } from "./types";

const defaultProps: Bangladesh24ReelProps = {
  storyId: "sample",
  title: "গত ২৪ ঘণ্টায় বাংলাদেশে যা ঘটলো",
  summary: "বাংলাদেশ24 এর স্থানীয় এমভিপি রেন্ডার টেমপ্লেট।",
  sourceName: "Bangladesh24",
  location: "Bangladesh",
  mapTarget: {
    name: "Bangladesh",
    type: "country",
    latitude: 23.75,
    longitude: 90.35,
    x: 510,
    y: 790
  },
  publishedAt: null,
  audioPublicPath: null,
  durationInSeconds: 36,
  subtitles: [
    {
      index: 1,
      startMs: 0,
      endMs: 3000,
      text: "গত ২৪ ঘণ্টায় বাংলাদেশে যা ঘটলো..."
    }
  ]
};

export function Root() {
  return (
    <Composition
      id="Bangladesh24Reel"
      component={Bangladesh24Reel as ComponentType<Record<string, unknown>>}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1080}
      defaultProps={defaultProps as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const reelProps = props as unknown as Bangladesh24ReelProps;
        return {
          durationInFrames: Math.max(240, Math.ceil((reelProps.durationInSeconds ?? 36) * 30))
        };
      }}
    />
  );
}
