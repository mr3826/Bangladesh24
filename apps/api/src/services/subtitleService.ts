import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Source, Story } from "@prisma/client";
import type { StoryMediaResult, SubtitleCue } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { workspacePath } from "../utils/workspace.js";
import { mapStory } from "./storyMapper.js";
import { analyzeBangladeshLocality } from "./textClassifier.js";

type StoryWithSource = Story & {
  source: Source;
};

function normalizeScript(script: string) {
  return script
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function splitLongCue(text: string, maxWords = 11) {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) {
    return [text];
  }

  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(" "));
  }

  return chunks;
}

function splitScriptIntoCueTexts(script: string) {
  const normalizedScript = normalizeScript(script);
  const initialSegments = normalizedScript
    .split(/\n+|(?<=[।.!?])\s+/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  return initialSegments.flatMap((segment) => splitLongCue(segment));
}

function estimateCueDurationMs(text: string) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.min(5200, Math.max(2200, wordCount * 520 + 600));
}

export function createSubtitleCues(script: string): SubtitleCue[] {
  const cueTexts = splitScriptIntoCueTexts(script);
  let cursorMs = 0;

  return cueTexts.map((text, index) => {
    const durationMs = estimateCueDurationMs(text);
    const cue: SubtitleCue = {
      index: index + 1,
      startMs: cursorMs,
      endMs: cursorMs + durationMs,
      text
    };
    cursorMs = cue.endMs + 120;
    return cue;
  });
}

function formatSrtTime(milliseconds: number) {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = Math.floor(milliseconds % 1000);

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0")
  ].join(":") + `,${String(millis).padStart(3, "0")}`;
}

function formatVttTime(milliseconds: number) {
  return formatSrtTime(milliseconds).replace(",", ".");
}

export function cuesToSrt(cues: SubtitleCue[]) {
  return `${cues
    .map((cue) => `${cue.index}\n${formatSrtTime(cue.startMs)} --> ${formatSrtTime(cue.endMs)}\n${cue.text}`)
    .join("\n\n")}\n`;
}

export function cuesToVtt(cues: SubtitleCue[]) {
  return `WEBVTT\n\n${cues
    .map((cue) => `${formatVttTime(cue.startMs)} --> ${formatVttTime(cue.endMs)}\n${cue.text}`)
    .join("\n\n")}\n`;
}

export async function generateStorySubtitles(storyId: string): Promise<StoryMediaResult> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { source: true }
  });

  if (!story) {
    throw new Error("Story not found");
  }

  const locality = analyzeBangladeshLocality(
    [story.title, story.summary, story.content, story.link].filter(Boolean).join(" ")
  );

  if (!story.isBangladeshLocal && !locality.isBangladeshLocal) {
    throw new Error(`Story is not Bangladesh-local: ${locality.reason}`);
  }

  if (!story.scriptBangla?.trim()) {
    throw new Error("Bangla script is required before subtitle generation");
  }

  const cues = createSubtitleCues(story.scriptBangla);
  const subtitlesDirectory = workspacePath("outputs", "subtitles");
  await mkdir(subtitlesDirectory, { recursive: true });

  const srtPath = path.join(subtitlesDirectory, `${story.id}.srt`);
  const vttPath = path.join(subtitlesDirectory, `${story.id}.vtt`);
  await Promise.all([writeFile(srtPath, cuesToSrt(cues), "utf8"), writeFile(vttPath, cuesToVtt(cues), "utf8")]);

  const updatedStory: StoryWithSource = await prisma.story.update({
    where: { id: story.id },
    data: {
      subtitleSrtPath: path.relative(workspacePath(), srtPath),
      subtitleVttPath: path.relative(workspacePath(), vttPath)
    },
    include: { source: true }
  });

  return {
    story: mapStory(updatedStory),
    files: {
      subtitleSrtPath: updatedStory.subtitleSrtPath ?? undefined,
      subtitleVttPath: updatedStory.subtitleVttPath ?? undefined
    }
  };
}
