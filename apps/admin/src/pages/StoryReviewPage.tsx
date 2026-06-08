import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminStory } from "@bangladesh24/shared";
import { ArrowLeft, Captions, ExternalLink, ListChecks, Mic2, RefreshCw, Save, Video, Wand2 } from "lucide-react";
import {
  generateStoryScript,
  generateStorySubtitles,
  generateStoryVoiceover,
  getReviewStories,
  getStory,
  queueStory,
  renderStoryVideo,
  updateStoryReview
} from "../services/api.js";

interface StoryReviewPageProps {
  initialStoryId: string | null;
  onBack: () => void;
}

interface ReviewForm {
  scriptBangla: string;
  captionBangla: string;
  hashtags: string;
  instruction: string;
}

function createEmptyForm(): ReviewForm {
  return {
    scriptBangla: "",
    captionBangla: "",
    hashtags: "",
    instruction: ""
  };
}

function formFromStory(story: AdminStory): ReviewForm {
  return {
    scriptBangla: story.scriptBangla ?? "",
    captionBangla: story.captionBangla ?? "",
    hashtags: story.hashtags ?? "",
    instruction: ""
  };
}

export function StoryReviewPage({ initialStoryId, onBack }: StoryReviewPageProps) {
  const [stories, setStories] = useState<AdminStory[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialStoryId);
  const [selectedStory, setSelectedStory] = useState<AdminStory | null>(null);
  const [form, setForm] = useState<ReviewForm>(createEmptyForm);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("Ready");

  const selectedLocation = useMemo(() => {
    if (!selectedStory) {
      return "BD";
    }

    return selectedStory.district ?? selectedStory.division ?? "BD";
  }, [selectedStory]);

  const loadStories = useCallback(async () => {
    setBusyAction("refresh");
    setError(null);

    try {
      const reviewStories = await getReviewStories();
      setStories(reviewStories);
      setSelectedId((currentSelectedId) => currentSelectedId ?? reviewStories[0]?.id ?? null);
      setNotice(`Loaded ${reviewStories.length} review stories`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load review stories");
    } finally {
      setBusyAction(null);
    }
  }, []);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedStory(null);
      setForm(createEmptyForm());
      return;
    }

    let active = true;
    setBusyAction("load");
    setError(null);

    getStory(selectedId)
      .then((story) => {
        if (!active) {
          return;
        }

        setSelectedStory(story);
        setForm(formFromStory(story));
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Could not load story");
        }
      })
      .finally(() => {
        if (active) {
          setBusyAction(null);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  async function saveReview() {
    if (!selectedStory) {
      return;
    }

    setBusyAction("save");
    setError(null);

    try {
      const updatedStory = await updateStoryReview(selectedStory.id, {
        scriptBangla: form.scriptBangla,
        captionBangla: form.captionBangla,
        hashtags: form.hashtags,
        status: selectedStory.status === "QUEUED" ? "QUEUED" : "SELECTED"
      });
      setSelectedStory(updatedStory);
      setForm(formFromStory(updatedStory));
      setStories((currentStories) =>
        currentStories.map((story) => (story.id === updatedStory.id ? updatedStory : story))
      );
      setNotice("Saved review");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Save failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function regenerateScript() {
    if (!selectedStory) {
      return;
    }

    setBusyAction("generate");
    setError(null);

    try {
      const result = await generateStoryScript(selectedStory.id, form.instruction);
      setSelectedStory(result.story);
      setForm({
        ...formFromStory(result.story),
        instruction: form.instruction
      });
      setStories((currentStories) =>
        currentStories.map((story) => (story.id === result.story.id ? result.story : story))
      );
      setNotice(`${result.generation.generationProvider}: ${result.generation.notes}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Gemini generation failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function approveQueue() {
    if (!selectedStory) {
      return;
    }

    setBusyAction("queue");
    setError(null);

    try {
      const updatedStory = await queueStory(selectedStory.id);
      setSelectedStory(updatedStory);
      setStories((currentStories) =>
        currentStories.map((story) => (story.id === updatedStory.id ? updatedStory : story))
      );
      setNotice("Queued for manual upload");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Queue failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function runMediaStep(step: "subtitles" | "voiceover" | "video") {
    if (!selectedStory) {
      return;
    }

    setBusyAction(step);
    setError(null);

    try {
      const result =
        step === "subtitles"
          ? await generateStorySubtitles(selectedStory.id)
          : step === "voiceover"
            ? await generateStoryVoiceover(selectedStory.id)
            : await renderStoryVideo(selectedStory.id);

      setSelectedStory(result.story);
      setStories((currentStories) =>
        currentStories.map((story) => (story.id === result.story.id ? result.story : story))
      );
      setNotice(`${step} ready`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : `${step} failed`);
    } finally {
      setBusyAction(null);
    }
  }

  const isBusy = busyAction !== null;

  return (
    <main className="app-shell review-shell">
      <header className="topbar">
        <div>
          <button className="icon-button" type="button" title="Back" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span className="brand-mark">B24</span>
          <h1>Story Review</h1>
        </div>
        <span className="run-state">{notice}</span>
      </header>

      <section className="toolbar" aria-label="Review actions">
        <button type="button" title="Refresh stories" disabled={isBusy} onClick={() => void loadStories()}>
          <RefreshCw size={18} aria-hidden="true" />
          Refresh
        </button>
        <button type="button" title="Generate Bangla script" disabled={isBusy || !selectedStory} onClick={() => void regenerateScript()}>
          <Wand2 size={18} aria-hidden="true" />
          Generate
        </button>
        <button type="button" title="Save review" disabled={isBusy || !selectedStory} onClick={() => void saveReview()}>
          <Save size={18} aria-hidden="true" />
          Save
        </button>
        <button type="button" title="Generate subtitles" disabled={isBusy || !selectedStory} onClick={() => void runMediaStep("subtitles")}>
          <Captions size={18} aria-hidden="true" />
          Subtitles
        </button>
        <button type="button" title="Generate voiceover" disabled={isBusy || !selectedStory} onClick={() => void runMediaStep("voiceover")}>
          <Mic2 size={18} aria-hidden="true" />
          Voiceover
        </button>
        <button type="button" title="Render video" disabled={isBusy || !selectedStory} onClick={() => void runMediaStep("video")}>
          <Video size={18} aria-hidden="true" />
          Render
        </button>
        <button type="button" title="Queue story" disabled={isBusy || !selectedStory} onClick={() => void approveQueue()}>
          <ListChecks size={18} aria-hidden="true" />
          Queue
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {busyAction ? <div className="busy-banner">Running {busyAction}</div> : null}

      <div className="review-grid">
        <section className="panel review-list-panel" aria-labelledby="review-list-heading">
          <div className="panel-heading">
            <h2 id="review-list-heading">Candidates</h2>
          </div>
          <div className="review-list">
            {stories.map((story) => (
              <button
                className={story.id === selectedId ? "review-story active" : "review-story"}
                key={story.id}
                type="button"
                onClick={() => setSelectedId(story.id)}
              >
                <strong>{Math.round(story.importanceScore)} · {story.title}</strong>
                <span>{story.sourceName} · {story.district ?? story.division ?? "BD"} · {story.status}</span>
              </button>
            ))}
            {stories.length === 0 ? <p className="empty-text">No scored or selected stories yet.</p> : null}
          </div>
        </section>

        <section className="panel editor-panel" aria-labelledby="editor-heading">
          <div className="panel-heading editor-heading">
            <h2 id="editor-heading">{selectedStory ? selectedStory.title : "Select a story"}</h2>
            {selectedStory ? (
              <a className="source-link" href={selectedStory.link} target="_blank" rel="noreferrer">
                <ExternalLink size={16} aria-hidden="true" />
                Source
              </a>
            ) : null}
          </div>

          {selectedStory ? (
            <div className="editor-body">
              <div className="story-meta-strip">
                <span className="status-pill">{selectedStory.status}</span>
                <span>{selectedStory.sourceName}</span>
                <span>{selectedLocation}</span>
                <span>{selectedStory.category}</span>
              </div>

              <p className="review-summary">{selectedStory.summary ?? selectedStory.title}</p>

              <div className="media-files" aria-label="Generated files">
                <span>{selectedStory.subtitleSrtPath ? `SRT: ${selectedStory.subtitleSrtPath}` : "SRT pending"}</span>
                <span>{selectedStory.subtitleVttPath ? `VTT: ${selectedStory.subtitleVttPath}` : "VTT pending"}</span>
                <span>{selectedStory.audioPath ? `Audio: ${selectedStory.audioPath}` : "Audio pending"}</span>
                <span>{selectedStory.videoPath ? `Video: ${selectedStory.videoPath}` : "Video pending"}</span>
                <span>{selectedStory.renderStatus ? `Render: ${selectedStory.renderStatus}` : "Render not started"}</span>
              </div>

              <label className="field">
                <span>Extra instruction</span>
                <input
                  value={form.instruction}
                  onChange={(event) => setForm((current) => ({ ...current, instruction: event.target.value }))}
                  placeholder="Example: make it more urgent but still factual"
                />
              </label>

              <label className="field">
                <span>Bangla script</span>
                <textarea
                  className="script-textarea"
                  value={form.scriptBangla}
                  onChange={(event) => setForm((current) => ({ ...current, scriptBangla: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Caption</span>
                <textarea
                  value={form.captionBangla}
                  onChange={(event) => setForm((current) => ({ ...current, captionBangla: event.target.value }))}
                />
              </label>

              <label className="field">
                <span>Hashtags</span>
                <input
                  value={form.hashtags}
                  onChange={(event) => setForm((current) => ({ ...current, hashtags: event.target.value }))}
                />
              </label>
            </div>
          ) : (
            <p className="empty-text">Select a story to review.</p>
          )}
        </section>
      </div>
    </main>
  );
}
