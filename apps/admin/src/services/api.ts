import type {
  AdminStory,
  DashboardSummary,
  GeneratedStoryScriptResult,
  IngestionRunResult,
  ScoringRunResult,
  SourceSummary,
  StoryMediaResult,
  StoryReviewUpdate
} from "@bangladesh24/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDashboardSummary() {
  return requestJson<DashboardSummary>("/dashboard/summary");
}

export function seedSources() {
  return requestJson<SourceSummary[]>("/sources/seed", {
    method: "POST"
  });
}

export function runIngestion() {
  return requestJson<IngestionRunResult>("/ingestion/run", {
    method: "POST"
  });
}

export function scoreStories(limit = 50) {
  return requestJson<ScoringRunResult>("/stories/score", {
    method: "POST",
    body: JSON.stringify({ limit })
  });
}

export function queueSelectedStories() {
  return requestJson<{ queued: number }>("/stories/queue-selected", {
    method: "POST"
  });
}

export function getReviewStories() {
  return requestJson<AdminStory[]>("/stories/review?limit=40");
}

export function getStory(storyId: string) {
  return requestJson<AdminStory>(`/stories/${storyId}`);
}

export function generateStoryScript(storyId: string, instruction?: string) {
  return requestJson<GeneratedStoryScriptResult>(`/stories/${storyId}/generate-script`, {
    method: "POST",
    body: JSON.stringify({ instruction })
  });
}

export function updateStoryReview(storyId: string, update: StoryReviewUpdate) {
  return requestJson<AdminStory>(`/stories/${storyId}/review`, {
    method: "PATCH",
    body: JSON.stringify(update)
  });
}

export function queueStory(storyId: string) {
  return requestJson<AdminStory>(`/stories/${storyId}/queue`, {
    method: "POST"
  });
}

export function generateStorySubtitles(storyId: string) {
  return requestJson<StoryMediaResult>(`/stories/${storyId}/generate-subtitles`, {
    method: "POST"
  });
}

export function generateStoryVoiceover(storyId: string) {
  return requestJson<StoryMediaResult>(`/stories/${storyId}/generate-voiceover`, {
    method: "POST"
  });
}

export function renderStoryVideo(storyId: string) {
  return requestJson<StoryMediaResult>(`/stories/${storyId}/render-video`, {
    method: "POST"
  });
}
