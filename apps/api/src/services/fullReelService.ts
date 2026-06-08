import type { FullReelResult } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { generateStoryScript } from "./scriptGenerationService.js";
import { generateStorySubtitles } from "./subtitleService.js";
import { renderStoryVideo } from "./videoRenderService.js";
import { generateStoryVoiceover } from "./voiceoverService.js";

export async function generateFullStoryReel(
  storyId: string,
  options: { instruction?: string; regenerateScript?: boolean } = {}
): Promise<FullReelResult> {
  const story = await prisma.story.findUnique({
    where: { id: storyId }
  });

  if (!story) {
    throw new Error("Story not found");
  }

  const shouldGenerateScript = options.regenerateScript || !story.scriptBangla?.trim();
  const scriptResult = shouldGenerateScript
    ? await generateStoryScript(storyId, options.instruction)
    : null;

  await generateStorySubtitles(storyId);
  await generateStoryVoiceover(storyId);
  const mediaResult = await renderStoryVideo(storyId);

  return {
    ...mediaResult,
    generation: scriptResult?.generation
  };
}
