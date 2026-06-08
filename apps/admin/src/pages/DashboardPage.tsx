import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary, IngestionRunResult, ScoringRunResult } from "@bangladesh24/shared";
import { CheckCircle2, Database, DownloadCloud, ListChecks, RefreshCw, SquarePen, Wand2 } from "lucide-react";
import { MetricStrip } from "../components/MetricStrip.js";
import { SourceList } from "../components/SourceList.js";
import { StoryTable } from "../components/StoryTable.js";
import {
  getDashboardSummary,
  queueSelectedStories,
  runIngestion,
  scoreStories,
  seedSources
} from "../services/api.js";

type ActionName = "seed" | "ingest" | "score" | "queue" | "refresh";

interface DashboardPageProps {
  onOpenReview: (storyId?: string) => void;
}

function createEmptySummary(): DashboardSummary {
  return {
    counts: {
      sources: 0,
      stories: 0,
      newStories: 0,
      scoredStories: 0,
      selectedStories: 0,
      queuedStories: 0
    },
    sources: [],
    topStories: []
  };
}

export function DashboardPage({ onOpenReview }: DashboardPageProps) {
  const [summary, setSummary] = useState<DashboardSummary>(createEmptySummary);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string>("Ready");
  const [activeAction, setActiveAction] = useState<ActionName | null>(null);

  const refresh = useCallback(async () => {
    setActiveAction("refresh");
    setError(null);

    try {
      setSummary(await getDashboardSummary());
      setLastRun(`Refreshed ${new Date().toLocaleTimeString()}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Refresh failed");
    } finally {
      setActiveAction(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(action: ActionName) {
    setActiveAction(action);
    setError(null);

    try {
      if (action === "seed") {
        const sources = await seedSources();
        setLastRun(`Seeded ${sources.length} sources`);
      }

      if (action === "ingest") {
        const result: IngestionRunResult = await runIngestion();
        setLastRun(`Ingested ${result.totalCreated} new, ${result.totalUpdated} updated`);
      }

      if (action === "score") {
        const result: ScoringRunResult = await scoreStories();
        setLastRun(`Scored ${result.scored}, selected ${result.selected}`);
      }

      if (action === "queue") {
        const result = await queueSelectedStories();
        setLastRun(`Queued ${result.queued} stories`);
      }

      await refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Action failed");
    } finally {
      setActiveAction(null);
    }
  }

  const isBusy = activeAction !== null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand-mark">B24</span>
          <h1>Bangladesh24 Admin</h1>
        </div>
        <span className="run-state">{lastRun}</span>
      </header>

      <section className="toolbar" aria-label="Pipeline actions">
        <button type="button" title="Seed sources" disabled={isBusy} onClick={() => void runAction("seed")}>
          <Database size={18} aria-hidden="true" />
          Seed
        </button>
        <button type="button" title="Run ingestion" disabled={isBusy} onClick={() => void runAction("ingest")}>
          <DownloadCloud size={18} aria-hidden="true" />
          Ingest
        </button>
        <button type="button" title="Score stories" disabled={isBusy} onClick={() => void runAction("score")}>
          <Wand2 size={18} aria-hidden="true" />
          Score
        </button>
        <button type="button" title="Queue selected stories" disabled={isBusy} onClick={() => void runAction("queue")}>
          <ListChecks size={18} aria-hidden="true" />
          Queue
        </button>
        <button type="button" title="Review selected stories" disabled={isBusy} onClick={() => onOpenReview()}>
          <SquarePen size={18} aria-hidden="true" />
          Review
        </button>
        <button type="button" title="Refresh" disabled={isBusy} onClick={() => void refresh()}>
          <RefreshCw size={18} aria-hidden="true" />
          Refresh
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {activeAction ? (
        <div className="busy-banner">
          <CheckCircle2 size={18} aria-hidden="true" />
          Running {activeAction}
        </div>
      ) : null}

      <MetricStrip counts={summary.counts} />

      <div className="content-grid">
        <StoryTable stories={summary.topStories} onReviewStory={(storyId) => onOpenReview(storyId)} />
        <SourceList sources={summary.sources} />
      </div>
    </main>
  );
}
