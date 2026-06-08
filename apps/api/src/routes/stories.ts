import { Router } from "express";
import { StoryStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { mapStories } from "../services/storyMapper.js";
import {
  getTopStories,
  queueSelectedStories,
  scoreNewStories,
  selectTopStories,
  syncBangladeshLocalFlags
} from "../services/scoringService.js";
import { generateStoryScript } from "../services/scriptGenerationService.js";
import { generateStorySubtitles } from "../services/subtitleService.js";
import { renderStoryVideo } from "../services/videoRenderService.js";
import { generateStoryVoiceover } from "../services/voiceoverService.js";

export const storiesRouter = Router();

const VALID_STATUSES = new Set(Object.values(StoryStatus));

function parseStoryStatus(value: unknown) {
  return typeof value === "string" && VALID_STATUSES.has(value as StoryStatus)
    ? (value as StoryStatus)
    : undefined;
}

storiesRouter.get("/", async (request, response, next) => {
  try {
    const limit = Number(request.query.limit ?? 50);
    const status = parseStoryStatus(request.query.status);
    const stories = await prisma.story.findMany({
      where: {
        isBangladeshLocal: true,
        ...(status ? { status } : {})
      },
      include: { source: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: Number.isFinite(limit) ? limit : 50
    });

    response.json(mapStories(stories));
  } catch (error) {
    next(error);
  }
});

storiesRouter.get("/top", async (request, response, next) => {
  try {
    const limit = Number(request.query.limit ?? 10);
    response.json(await getTopStories(Number.isFinite(limit) ? limit : 10));
  } catch (error) {
    next(error);
  }
});

storiesRouter.get("/review", async (request, response, next) => {
  try {
    const limit = Number(request.query.limit ?? 30);
    const stories = await prisma.story.findMany({
      where: {
        isBangladeshLocal: true,
        status: {
          in: [StoryStatus.SCORED, StoryStatus.SELECTED, StoryStatus.QUEUED]
        }
      },
      include: { source: true },
      orderBy: [{ importanceScore: "desc" }, { publishedAt: "desc" }],
      take: Number.isFinite(limit) ? limit : 30
    });

    response.json(mapStories(stories));
  } catch (error) {
    next(error);
  }
});

storiesRouter.get("/:id", async (request, response, next) => {
  try {
    const story = await prisma.story.findUnique({
      where: { id: request.params.id },
      include: { source: true }
    });

    if (!story) {
      response.status(404).json({ error: "Story not found" });
      return;
    }

    if (!story.isBangladeshLocal) {
      response.status(404).json({ error: "Story is not Bangladesh-local" });
      return;
    }

    response.json(mapStories([story])[0]);
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/score", async (request, response, next) => {
  try {
    const limit = Number(request.body?.limit ?? 50);
    response.json(await scoreNewStories(Number.isFinite(limit) ? limit : 50));
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/select-top", async (request, response, next) => {
  try {
    const limit = Number(request.body?.limit ?? 5);
    response.json(await selectTopStories(Number.isFinite(limit) ? limit : 5));
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/queue-selected", async (_request, response, next) => {
  try {
    const queued = await queueSelectedStories();
    response.json({ queued });
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/sync-locality", async (_request, response, next) => {
  try {
    response.json(await syncBangladeshLocalFlags());
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:id/generate-script", async (request, response, next) => {
  try {
    response.json(await generateStoryScript(request.params.id, request.body?.instruction));
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:id/generate-subtitles", async (request, response, next) => {
  try {
    response.json(await generateStorySubtitles(request.params.id));
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:id/generate-voiceover", async (request, response, next) => {
  try {
    response.json(await generateStoryVoiceover(request.params.id));
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:id/render-video", async (request, response, next) => {
  try {
    response.json(await renderStoryVideo(request.params.id));
  } catch (error) {
    next(error);
  }
});

storiesRouter.patch("/:id/review", async (request, response, next) => {
  try {
    const existingStory = await prisma.story.findUnique({
      where: { id: request.params.id }
    });

    if (!existingStory?.isBangladeshLocal) {
      response.status(400).json({ error: "Only Bangladesh-local stories can be reviewed" });
      return;
    }

    const status = parseStoryStatus(request.body?.status);
    const story = await prisma.story.update({
      where: { id: request.params.id },
      data: {
        scriptBangla:
          typeof request.body?.scriptBangla === "string" ? request.body.scriptBangla.trim() : undefined,
        captionBangla:
          typeof request.body?.captionBangla === "string" ? request.body.captionBangla.trim() : undefined,
        hashtags: typeof request.body?.hashtags === "string" ? request.body.hashtags.trim() : undefined,
        status
      },
      include: { source: true }
    });

    response.json(mapStories([story])[0]);
  } catch (error) {
    next(error);
  }
});

storiesRouter.post("/:id/queue", async (request, response, next) => {
  try {
    const existingStory = await prisma.story.findUnique({
      where: { id: request.params.id }
    });

    if (!existingStory?.isBangladeshLocal) {
      response.status(400).json({ error: "Only Bangladesh-local stories can be queued" });
      return;
    }

    const story = await prisma.story.update({
      where: { id: request.params.id },
      data: { status: StoryStatus.QUEUED }
    });

    await prisma.postingQueue.upsert({
      where: { storyId: story.id },
      update: { status: "READY", platform: "manual" },
      create: {
        storyId: story.id,
        platform: "manual",
        status: "READY"
      }
    });

    const queuedStory = await prisma.story.findUniqueOrThrow({
      where: { id: story.id },
      include: { source: true }
    });

    response.json(mapStories([queuedStory])[0]);
  } catch (error) {
    next(error);
  }
});
