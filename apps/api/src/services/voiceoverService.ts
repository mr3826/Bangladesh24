import { mkdir } from "node:fs/promises";
import path from "node:path";
import { EdgeTTS } from "node-edge-tts";
import type { Source, Story } from "@prisma/client";
import type { StoryMediaResult } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { workspacePath } from "../utils/workspace.js";
import { mapStory } from "./storyMapper.js";
import { analyzeBangladeshLocality } from "./textClassifier.js";

type StoryWithSource = Story & {
  source: Source;
};

function cleanVoiceoverText(script: string) {
  return script
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export async function generateStoryVoiceover(storyId: string): Promise<StoryMediaResult> {
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
    throw new Error("Bangla script is required before voiceover generation");
  }

  const audioDirectory = workspacePath("outputs", "audio");
  await mkdir(audioDirectory, { recursive: true });
  const audioPath = path.join(audioDirectory, `${story.id}.mp3`);

  const tts = new EdgeTTS({
    voice: process.env.EDGE_TTS_VOICE ?? "bn-BD-NabanitaNeural",
    lang: process.env.EDGE_TTS_LANG ?? "bn-BD",
    outputFormat: process.env.EDGE_TTS_OUTPUT_FORMAT ?? "audio-24khz-96kbitrate-mono-mp3",
    rate: process.env.EDGE_TTS_RATE ?? "default",
    pitch: process.env.EDGE_TTS_PITCH ?? "default",
    volume: process.env.EDGE_TTS_VOLUME ?? "default",
    timeout: Number(process.env.EDGE_TTS_TIMEOUT_MS ?? 30000)
  });

  await tts.ttsPromise(cleanVoiceoverText(story.scriptBangla), audioPath);

  const updatedStory: StoryWithSource = await prisma.story.update({
    where: { id: story.id },
    data: {
      audioPath: path.relative(workspacePath(), audioPath)
    },
    include: { source: true }
  });

  return {
    story: mapStory(updatedStory),
    files: {
      audioPath: updatedStory.audioPath ?? undefined
    }
  };
}
