import { readFile } from "node:fs/promises";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { loadBangladeshMapFeatures } from "./map/bdDistrictPaths";
import type { RenderStoryInput } from "./types";

function getArgValue(name: string) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

async function readInput() {
  const inputPath = getArgValue("--input");

  if (!inputPath) {
    throw new Error("Missing --input path");
  }

  return JSON.parse(await readFile(inputPath, "utf8")) as RenderStoryInput;
}

function subtitleDurationSeconds(input: RenderStoryInput) {
  const endMs = Math.max(0, ...input.subtitles.map((subtitle) => subtitle.endMs));
  return Math.max(8, endMs / 1000 + 1.5);
}

async function resolveDuration(input: RenderStoryInput) {
  if (!input.audioPublicPath) {
    return subtitleDurationSeconds(input);
  }

  try {
    const audioPath = path.join(input.publicDir, input.audioPublicPath);
    const audioDuration = await getAudioDurationInSeconds(audioPath);
    return Math.max(audioDuration + 0.5, subtitleDurationSeconds(input));
  } catch {
    return subtitleDurationSeconds(input);
  }
}

const input = await readInput();
const durationInSeconds = await resolveDuration(input);
const mapFeatures = await loadBangladeshMapFeatures();
const inputProps = {
  ...input,
  durationInSeconds,
  mapFeatures
};

const serveUrl = await bundle({
  entryPoint: input.entryPoint,
  publicDir: input.publicDir
});

const composition = await selectComposition({
  serveUrl,
  id: "Bangladesh24Reel",
  inputProps
});

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: input.outputPath,
  inputProps,
  overwrite: true,
  logLevel: "info",
  concurrency: "50%",
  chromiumOptions: {
    disableWebSecurity: true
  }
});

console.log(JSON.stringify({ outputPath: input.outputPath, durationInSeconds }, null, 2));
