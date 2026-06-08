import { Router } from "express";
import type { DashboardSummary } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { listSources } from "../services/sourceService.js";
import { getTopStories } from "../services/scoringService.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_request, response, next) => {
  try {
    const [
      sources,
      stories,
      newStories,
      scoredStories,
      selectedStories,
      queuedStories,
      sourceSummaries,
      topStories
    ] = await Promise.all([
      prisma.source.count({ where: { active: true } }),
      prisma.story.count({ where: { isBangladeshLocal: true, status: { not: "ARCHIVED" } } }),
      prisma.story.count({ where: { status: "NEW", isBangladeshLocal: true } }),
      prisma.story.count({ where: { status: "SCORED", isBangladeshLocal: true } }),
      prisma.story.count({ where: { status: "SELECTED", isBangladeshLocal: true } }),
      prisma.postingQueue.count({ where: { status: "READY", story: { isBangladeshLocal: true } } }),
      listSources(),
      getTopStories(8)
    ]);

    const summary: DashboardSummary = {
      counts: {
        sources,
        stories,
        newStories,
        scoredStories,
        selectedStories,
        queuedStories
      },
      sources: sourceSummaries,
      topStories
    };

    response.json(summary);
  } catch (error) {
    next(error);
  }
});
