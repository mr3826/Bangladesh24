import type { QUEUE_PLATFORMS, STORY_CATEGORIES } from "../constants.js";

export type SourceLanguage = "bn" | "en";
export type StoryCategory = (typeof STORY_CATEGORIES)[number];
export type QueuePlatform = (typeof QUEUE_PLATFORMS)[number];

export interface NewsSourceConfig {
  name: string;
  slug: string;
  homepageUrl: string;
  feedUrl: string;
  language: SourceLanguage;
  priority: number;
  active: boolean;
}

export interface SourceSummary {
  id: string;
  name: string;
  slug: string;
  feedUrl: string;
  language: SourceLanguage;
  priority: number;
  active: boolean;
  lastFetchedAt: string | null;
}

export interface StoryScoreBreakdown {
  recency: number;
  sourcePriority: number;
  category: number;
  location: number;
  urgency: number;
  reason: string;
}

export interface AdminStory {
  id: string;
  title: string;
  summary: string | null;
  link: string;
  sourceName: string;
  publishedAt: string | null;
  district: string | null;
  division: string | null;
  isBangladeshLocal: boolean;
  category: StoryCategory;
  importanceScore: number;
  scoreBreakdown: StoryScoreBreakdown | null;
  status: string;
  scriptBangla: string | null;
  captionBangla: string | null;
  hashtags: string | null;
  subtitleSrtPath: string | null;
  subtitleVttPath: string | null;
  audioPath: string | null;
  videoPath: string | null;
  renderStatus: string | null;
}

export interface SourceIngestionResult {
  sourceSlug: string;
  sourceName: string;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  failed: boolean;
  error?: string;
}

export interface IngestionRunResult {
  startedAt: string;
  finishedAt: string;
  totalFetched: number;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
  results: SourceIngestionResult[];
}

export interface ScoringRunResult {
  scored: number;
  selected: number;
  queued: number;
}

export interface GeneratedStoryScript {
  scriptBangla: string;
  captionBangla: string;
  hashtags: string;
  generationProvider: "gemini" | "fallback";
  notes: string;
}

export interface GeneratedStoryScriptResult {
  story: AdminStory;
  generation: GeneratedStoryScript;
}

export interface StoryReviewUpdate {
  scriptBangla?: string;
  captionBangla?: string;
  hashtags?: string;
  status?: string;
}

export interface SubtitleCue {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface StoryMediaResult {
  story: AdminStory;
  files: {
    subtitleSrtPath?: string;
    subtitleVttPath?: string;
    audioPath?: string;
    videoPath?: string;
  };
}

export interface DashboardSummary {
  counts: {
    sources: number;
    stories: number;
    newStories: number;
    scoredStories: number;
    selectedStories: number;
    queuedStories: number;
  };
  sources: SourceSummary[];
  topStories: AdminStory[];
}
