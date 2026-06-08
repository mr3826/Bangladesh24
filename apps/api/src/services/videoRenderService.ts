import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Source, Story } from "@prisma/client";
import { getMapTarget } from "@bangladesh24/shared";
import type { StoryMediaResult } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { workspacePath } from "../utils/workspace.js";
import { mapStory } from "./storyMapper.js";
import { createSubtitleCues, generateStorySubtitles } from "./subtitleService.js";
import { analyzeBangladeshLocality } from "./textClassifier.js";
import { generateStoryVoiceover } from "./voiceoverService.js";

type StoryWithSource = Story & {
  source: Source;
};

function absoluteWorkspacePath(relativeOrAbsolutePath: string | null) {
  if (!relativeOrAbsolutePath) {
    return null;
  }

  return path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : workspacePath(relativeOrAbsolutePath);
}

function toPublicOutputPath(relativePath: string | null) {
  if (!relativePath) {
    return null;
  }

  const normalizedPath = relativePath.replace(/\\/g, "/");
  return normalizedPath.startsWith("outputs/") ? normalizedPath.slice("outputs/".length) : normalizedPath;
}

async function getStory(storyId: string) {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { source: true }
  });

  if (!story) {
    throw new Error("Story not found");
  }

  return story;
}

async function ensureSubtitles(story: StoryWithSource) {
  const srtPath = absoluteWorkspacePath(story.subtitleSrtPath);
  const vttPath = absoluteWorkspacePath(story.subtitleVttPath);

  if (srtPath && vttPath && existsSync(srtPath) && existsSync(vttPath)) {
    return story;
  }

  await generateStorySubtitles(story.id);
  return getStory(story.id);
}

async function ensureVoiceover(story: StoryWithSource) {
  const audioPath = absoluteWorkspacePath(story.audioPath);

  if (audioPath && existsSync(audioPath)) {
    return story;
  }

  await generateStoryVoiceover(story.id);
  return getStory(story.id);
}

function runRenderer(inputPath: string) {
  const command = process.platform === "win32" ? "cmd.exe" : "npm";
  const args =
    process.platform === "win32"
      ? ["/c", "npm", "run", "render:story", "-w", "@bangladesh24/renderer", "--", "--input", inputPath]
      : ["run", "render:story", "-w", "@bangladesh24/renderer", "--", "--input", inputPath];
  const childEnv = Object.fromEntries(
    Object.entries(process.env).filter(([key, value]) => value !== undefined && !key.startsWith("="))
  ) as NodeJS.ProcessEnv;
  const child = spawn(command, args, {
    cwd: workspacePath(),
    env: childEnv
  });
  let stdout = "";
  let stderr = "";

  child.stdout.on("data", (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  child.stderr.on("data", (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  return new Promise<void>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Renderer exited with ${code}\n${stdout}\n${stderr}`));
    });
  });
}

export async function renderStoryVideo(storyId: string): Promise<StoryMediaResult> {
  let story = await getStory(storyId);

  if (!story.scriptBangla?.trim()) {
    throw new Error("Bangla script is required before video rendering");
  }
  const locality = analyzeBangladeshLocality(
    [story.title, story.summary, story.content, story.link].filter(Boolean).join(" ")
  );

  if (!story.isBangladeshLocal && !locality.isBangladeshLocal) {
    throw new Error(`Story is not Bangladesh-local: ${locality.reason}`);
  }
  const scriptBangla = story.scriptBangla.trim();

  await prisma.story.update({
    where: { id: story.id },
    data: { renderStatus: "rendering" }
  });

  try {
    story = await ensureSubtitles(story);
    story = await ensureVoiceover(story);

    const videosDirectory = workspacePath("outputs", "videos");
    const renderInputsDirectory = workspacePath("outputs", "render-inputs");
    await Promise.all([
      mkdir(videosDirectory, { recursive: true }),
      mkdir(renderInputsDirectory, { recursive: true })
    ]);

    const outputPath = path.join(videosDirectory, `${story.id}.mp4`);
    const inputPath = path.join(renderInputsDirectory, `${story.id}.json`);
    const subtitles = createSubtitleCues(scriptBangla);
    const mapTarget = getMapTarget(story.district, story.division);

    await writeFile(
      inputPath,
      JSON.stringify(
        {
          storyId: story.id,
          title: story.title,
          summary: story.summary,
          sourceName: story.source.name,
          location: story.district ?? story.division ?? "Bangladesh",
          mapTarget,
          publishedAt: story.publishedAt?.toISOString() ?? null,
          audioPublicPath: toPublicOutputPath(story.audioPath),
          durationInSeconds: Math.max(8, Math.max(...subtitles.map((subtitle) => subtitle.endMs)) / 1000 + 1.5),
          subtitles,
          outputPath,
          publicDir: workspacePath("outputs"),
          entryPoint: workspacePath("apps", "renderer", "src", "index.ts")
        },
        null,
        2
      ),
      "utf8"
    );

    await runRenderer(inputPath);

    const updatedStory = await prisma.story.update({
      where: { id: story.id },
      data: {
        videoPath: path.relative(workspacePath(), outputPath),
        renderStatus: "ready"
      },
      include: { source: true }
    });

    return {
      story: mapStory(updatedStory),
      files: {
        subtitleSrtPath: updatedStory.subtitleSrtPath ?? undefined,
        subtitleVttPath: updatedStory.subtitleVttPath ?? undefined,
        audioPath: updatedStory.audioPath ?? undefined,
        videoPath: updatedStory.videoPath ?? undefined
      }
    };
  } catch (error) {
    await prisma.story.update({
      where: { id: story.id },
      data: { renderStatus: "failed" }
    });
    throw error;
  }
}
