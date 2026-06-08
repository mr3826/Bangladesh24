import { Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Bangladesh24ReelProps } from "../types";
import { BangladeshMapBackdrop } from "../components/BangladeshMapBackdrop";
import "./reel.css";

function fitHeadline(title: string) {
  if (title.length > 115) return 48;
  if (title.length > 85) return 56;
  return 66;
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "Latest update";
  }

  return new Date(value).toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function useActiveSubtitle(subtitles: Bangladesh24ReelProps["subtitles"]) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  return subtitles.find((subtitle) => currentMs >= subtitle.startMs && currentMs <= subtitle.endMs) ?? null;
}

export function Bangladesh24Reel(props: Bangladesh24ReelProps) {
  const frame = useCurrentFrame();
  const activeSubtitle = useActiveSubtitle(props.subtitles);
  const hookOpacity = interpolate(frame, [0, 20, 88, 110], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const storyOpacity = interpolate(frame, [88, 116], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const storyY = interpolate(frame, [88, 116], [36, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const subtitleOpacity = activeSubtitle ? 1 : 0;

  return (
    <div className="reel">
      {props.audioPublicPath ? <Audio src={staticFile(props.audioPublicPath)} /> : null}
      <BangladeshMapBackdrop target={props.mapTarget} mapFeatures={props.mapFeatures} />
      <div className="top-band">
        <div className="brand">
          <span>24</span>
          <strong>Bangladesh24</strong>
        </div>
        <div className="date">{formatPublishedAt(props.publishedAt)}</div>
      </div>
      <section className="intro-hook" style={{ opacity: hookOpacity }}>
        <span>বাংলাদেশের</span>
        <strong>LAST 24 HOURS</strong>
      </section>
      <main className="story-block" style={{ opacity: storyOpacity, transform: `translateY(${storyY}px)` }}>
        <div className="hook">আজ {props.location} নিয়ে আপডেট</div>
        <h1 style={{ fontSize: fitHeadline(props.title) }}>{props.title}</h1>
        <div className="location-chip">{props.location}</div>
      </main>
      <section className="source-panel">
        <span>Source</span>
        <strong>{props.sourceName}</strong>
      </section>
      <footer className="subtitle-area" style={{ opacity: subtitleOpacity }}>
        <p>{activeSubtitle?.text ?? ""}</p>
      </footer>
    </div>
  );
}
