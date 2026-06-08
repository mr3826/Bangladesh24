import type { DashboardSummary } from "@bangladesh24/shared";

interface MetricStripProps {
  counts: DashboardSummary["counts"];
}

const METRICS: Array<{ key: keyof DashboardSummary["counts"]; label: string }> = [
  { key: "sources", label: "Sources" },
  { key: "stories", label: "Stories" },
  { key: "newStories", label: "New" },
  { key: "scoredStories", label: "Scored" },
  { key: "selectedStories", label: "Selected" },
  { key: "queuedStories", label: "Queued" }
];

export function MetricStrip({ counts }: MetricStripProps) {
  return (
    <section className="metric-strip" aria-label="Pipeline counts">
      {METRICS.map((metric) => (
        <div className="metric" key={metric.key}>
          <span>{metric.label}</span>
          <strong>{counts[metric.key]}</strong>
        </div>
      ))}
    </section>
  );
}
