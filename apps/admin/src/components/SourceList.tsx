import type { SourceSummary } from "@bangladesh24/shared";

interface SourceListProps {
  sources: SourceSummary[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <section className="panel source-panel" aria-labelledby="sources-heading">
      <div className="panel-heading">
        <h2 id="sources-heading">Sources</h2>
      </div>
      <div className="source-list">
        {sources.map((source) => (
          <article className="source-row" key={source.id}>
            <div>
              <strong>{source.name}</strong>
              <span>{source.slug}</span>
            </div>
            <div className="source-meta">
              <span className={source.active ? "pill active" : "pill"}>{source.active ? "Active" : "Off"}</span>
              <span>P{source.priority}</span>
              <span>{source.lastFetchedAt ? new Date(source.lastFetchedAt).toLocaleString() : "Never"}</span>
            </div>
          </article>
        ))}
        {sources.length === 0 ? <p className="empty-text">No sources seeded.</p> : null}
      </div>
    </section>
  );
}
