import type { Source, Story } from "@prisma/client";
import type { AdminStory, StoryScoreBreakdown } from "@bangladesh24/shared";

type StoryWithSource = Story & {
  source: Source;
};

export function mapStory(story: StoryWithSource): AdminStory {
  return {
    id: story.id,
    title: story.title,
    summary: story.summary,
    link: story.link,
    sourceName: story.source.name,
    publishedAt: story.publishedAt?.toISOString() ?? null,
    district: story.district,
    division: story.division,
    category: story.category,
    importanceScore: story.importanceScore,
    scoreBreakdown: story.scoreBreakdown as StoryScoreBreakdown | null,
    status: story.status,
    scriptBangla: story.scriptBangla,
    captionBangla: story.captionBangla,
    hashtags: story.hashtags
  };
}

export function mapStories(stories: StoryWithSource[]) {
  return stories.map(mapStory);
}
