import "../utils/env.js";
import { disconnectDatabase } from "../db/client.js";
import { generateFullStoryReel } from "../services/fullReelService.js";
import { renderStoryVideo } from "../services/videoRenderService.js";
import { generateStorySubtitles } from "../services/subtitleService.js";
import { generateStoryVoiceover } from "../services/voiceoverService.js";

function getArgValue(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const storyId = getArgValue("--story-id");
const step = getArgValue("--step") ?? "render";
const instruction = getArgValue("--instruction") ?? undefined;

if (!storyId) {
  throw new Error("Missing --story-id");
}

try {
  const result =
    step === "subtitles"
      ? await generateStorySubtitles(storyId)
      : step === "voiceover"
        ? await generateStoryVoiceover(storyId)
        : step === "full"
          ? await generateFullStoryReel(storyId, { instruction })
          : await renderStoryVideo(storyId);

  console.log(JSON.stringify(result, null, 2));
} finally {
  await disconnectDatabase();
}
