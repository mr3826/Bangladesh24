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
      prisma.story.count(),
      prisma.story.count({ where: { status: "NEW" } }),
      prisma.story.count({ where: { status: "SCORED" } }),
      prisma.story.count({ where: { status: "SELECTED" } }),
      prisma.postingQueue.count({ where: { status: "READY" } }),
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
