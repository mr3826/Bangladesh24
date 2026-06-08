import { Prisma, StoryCategory, StoryStatus, type Source, type Story } from "@prisma/client";
import type { ScoringRunResult, StoryScoreBreakdown } from "@bangladesh24/shared";
import { prisma } from "../db/client.js";
import { mapStories } from "./storyMapper.js";

type StoryWithSource = Story & {
  source: Source;
};

const CATEGORY_WEIGHT: Record<StoryCategory, number> = {
  DISASTER: 24,
  WEATHER: 20,
  ACCIDENT: 18,
  ECONOMY: 16,
  PUBLIC_NOTICE: 16,
  NATIONAL: 14,
  POLITICS: 12,
  INTERNATIONAL: 8,
  SPORTS: 5,
  ENTERTAINMENT: 3,
  GENERAL: 8
};

const URGENCY_TERMS = [
  "alert",
  "warning",
  "dead",
  "killed",
  "injured",
  "fire",
  "flood",
  "cyclone",
  "strike",
  "shutdown",
  "crisis",
  "emergency",
  "price hike",
  "road blocked"
];

function recencyScore(publishedAt: Date | null) {
  if (!publishedAt) {
    return 8;
  }

  const ageHours = Math.max(0, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60));

  if (ageHours <= 6) return 25;
  if (ageHours <= 12) return 22;
  if (ageHours <= 24) return 18;
  if (ageHours <= 48) return 12;
  if (ageHours <= 72) return 8;

  return 3;
}

function urgencyScore(story: Story) {
  const text = `${story.title} ${story.summary ?? ""} ${story.content ?? ""}`.toLowerCase();
  const matches = URGENCY_TERMS.filter((term) => text.includes(term)).length;
  return Math.min(15, matches * 5);
}

function locationScore(story: Story) {
  if (story.district) {
    return 15;
  }

  if (story.division) {
    return 9;
  }

  return 4;
}

function createReason(story: Story, breakdown: Omit<StoryScoreBreakdown, "reason">) {
  const location = story.district ?? story.division ?? "Bangladesh";
  const strongestSignal = Object.entries(breakdown)
    .sort(([, first], [, second]) => second - first)
    .at(0)?.[0];

  return `${location} story scored highest on ${strongestSignal ?? "overall relevance"}.`;
}

function generateBanglaScript(story: StoryWithSource) {
  const location = story.district
    ? `${story.district} জেলায়`
    : story.division
      ? `${story.division} বিভাগে`
      : "বাংলাদেশে";
  const summary = story.summary ?? story.title;

  return [
    "গত ২৪ ঘণ্টায় বাংলাদেশে যা ঘটলো...",
    "",
    `আজকের গুরুত্বপূর্ণ আপডেট ${location}: ${story.title}`,
    summary,
    `এই তথ্য এসেছে ${story.source.name} থেকে।`,
    "আরও আপডেটের জন্য বাংলাদেশ24 ফলো করুন।"
  ].join("\n");
}

function generateCaption(story: StoryWithSource) {
  const locationTag = story.district ?? story.division ?? "Bangladesh";

  return [
    `আজকের গুরুত্বপূর্ণ আপডেট: ${story.title}`,
    "",
    `Source: ${story.source.name}`,
    story.link,
    "",
    `#Bangladesh24 #${locationTag.replace(/\s+/g, "")} #BangladeshNews #NewsUpdate`
  ].join("\n");
}

export function scoreStory(story: StoryWithSource) {
  const breakdownWithoutReason = {
    recency: recencyScore(story.publishedAt),
    sourcePriority: Math.min(20, story.source.priority * 2.5),
    category: CATEGORY_WEIGHT[story.category],
    location: locationScore(story),
    urgency: urgencyScore(story)
  };
  const breakdown: StoryScoreBreakdown = {
    ...breakdownWithoutReason,
    reason: createReason(story, breakdownWithoutReason)
  };
  const importanceScore = Math.min(
    100,
    Math.round(
      breakdown.recency +
        breakdown.sourcePriority +
        breakdown.category +
        breakdown.location +
        breakdown.urgency
    )
  );

  return {
    importanceScore,
    breakdown,
    scriptBangla: generateBanglaScript(story),
    captionBangla: generateCaption(story),
    hashtags: "#Bangladesh24 #BangladeshNews #BDNews #NewsUpdate"
  };
}

export async function scoreNewStories(limit = 50): Promise<ScoringRunResult> {
  const stories = await prisma.story.findMany({
    where: {
      status: {
        in: [StoryStatus.NEW, StoryStatus.SCORED]
      }
    },
    include: { source: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit
  });

  for (const story of stories) {
    const scoredStory = scoreStory(story);

    await prisma.story.update({
      where: { id: story.id },
      data: {
        importanceScore: scoredStory.importanceScore,
        scoreBreakdown: scoredStory.breakdown as unknown as Prisma.InputJsonObject,
        scriptBangla: scoredStory.scriptBangla,
        captionBangla: scoredStory.captionBangla,
        hashtags: scoredStory.hashtags,
        status: StoryStatus.SCORED
      }
    });
  }

  const selectedStories = await selectTopStories(5);

  return {
    scored: stories.length,
    selected: selectedStories.length,
    queued: 0
  };
}

export async function selectTopStories(limit = 5) {
  const stories = await prisma.story.findMany({
    where: {
      status: StoryStatus.SCORED
    },
    include: { source: true },
    orderBy: [{ importanceScore: "desc" }, { publishedAt: "desc" }],
    take: limit
  });

  await Promise.all(
    stories.map((story) =>
      prisma.story.update({
        where: { id: story.id },
        data: { status: StoryStatus.SELECTED }
      })
    )
  );

  return mapStories(stories);
}

export async function queueSelectedStories() {
  const selectedStories = await prisma.story.findMany({
    where: { status: StoryStatus.SELECTED },
    orderBy: [{ importanceScore: "desc" }, { publishedAt: "desc" }]
  });

  for (const story of selectedStories) {
    await prisma.postingQueue.upsert({
      where: { storyId: story.id },
      update: { status: "READY" },
      create: {
        storyId: story.id,
        platform: "manual",
        status: "READY"
      }
    });

    await prisma.story.update({
      where: { id: story.id },
      data: { status: StoryStatus.QUEUED }
    });
  }

  return selectedStories.length;
}

export async function getTopStories(limit = 10) {
  const stories = await prisma.story.findMany({
    include: { source: true },
    orderBy: [{ importanceScore: "desc" }, { publishedAt: "desc" }],
    take: limit
  });

  return mapStories(stories);
}
