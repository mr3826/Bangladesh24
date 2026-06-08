import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMapTarget } from "@bangladesh24/shared";
import type { RenderStoryInput } from "./types";

const rendererRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(rendererRoot, "..", "..");
const inputPath = path.join(workspaceRoot, "outputs", "render-sample-input.json");

await mkdir(path.dirname(inputPath), { recursive: true });
await writeFile(
  inputPath,
  JSON.stringify(
    {
      storyId: "sample",
      title: "আজ দেশের কয়েকটি জেলায় গুরুত্বপূর্ণ আবহাওয়া সতর্কতা",
      summary: "বাংলাদেশ24 রেন্ডার টেমপ্লেটের নমুনা ভিডিও।",
      sourceName: "Bangladesh24",
      location: "Dhaka",
      mapTarget: getMapTarget("Dhaka", "Dhaka"),
      publishedAt: new Date().toISOString(),
      audioPublicPath: null,
      durationInSeconds: 18,
      subtitles: [
        { index: 1, startMs: 0, endMs: 3500, text: "গত ২৪ ঘণ্টায় বাংলাদেশে যা ঘটলো..." },
        { index: 2, startMs: 3620, endMs: 7600, text: "আজ কয়েকটি জেলায় আবহাওয়া সতর্কতা জারি হয়েছে।" },
        { index: 3, startMs: 7720, endMs: 11800, text: "বিস্তারিত জানতে বাংলাদেশ24 ফলো করুন।" }
      ],
      outputPath: path.join(workspaceRoot, "outputs", "videos", "sample.mp4"),
      publicDir: path.join(workspaceRoot, "outputs"),
      entryPoint: path.join(rendererRoot, "src", "index.ts")
    } satisfies RenderStoryInput,
    null,
    2
  ),
  "utf8"
);

process.argv.push("--input", inputPath);
await import("./renderStory");
