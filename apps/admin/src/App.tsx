import { useState } from "react";
import { DashboardPage } from "./pages/DashboardPage.js";
import { StoryReviewPage } from "./pages/StoryReviewPage.js";

export function App() {
  const [view, setView] = useState<"dashboard" | "review">("dashboard");
  const [reviewStoryId, setReviewStoryId] = useState<string | null>(null);

  if (view === "review") {
    return (
      <StoryReviewPage
        initialStoryId={reviewStoryId}
        onBack={() => {
          setReviewStoryId(null);
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <DashboardPage
      onOpenReview={(storyId) => {
        setReviewStoryId(storyId ?? null);
        setView("review");
      }}
    />
  );
}
