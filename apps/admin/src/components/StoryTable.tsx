import type { AdminStory } from "@bangladesh24/shared";

interface StoryTableProps {
  stories: AdminStory[];
  onReviewStory?: (storyId: string) => void;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString();
}

export function StoryTable({ stories, onReviewStory }: StoryTableProps) {
  return (
    <section className="panel story-panel" aria-labelledby="stories-heading">
      <div className="panel-heading">
        <h2 id="stories-heading">Top Stories</h2>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Score</th>
              <th scope="col">Story</th>
              <th scope="col">Source</th>
              <th scope="col">Location</th>
              <th scope="col">Status</th>
              <th scope="col">Published</th>
              {onReviewStory ? <th scope="col">Review</th> : null}
            </tr>
          </thead>
          <tbody>
            {stories.map((story) => (
              <tr key={story.id}>
                <td>
                  <strong className="score">{Math.round(story.importanceScore)}</strong>
                </td>
                <td className="story-title-cell">
                  <a href={story.link} target="_blank" rel="noreferrer">
                    {story.title}
                  </a>
                  {story.summary ? <span>{story.summary}</span> : null}
                </td>
                <td>{story.sourceName}</td>
                <td>{story.district ?? story.division ?? "BD"}</td>
                <td>
                  <span className="status-pill">{story.status}</span>
                </td>
                <td>{formatDate(story.publishedAt)}</td>
                {onReviewStory ? (
                  <td>
                    <button className="compact-button" type="button" onClick={() => onReviewStory(story.id)}>
                      Open
                    </button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {stories.length === 0 ? <p className="empty-text">No stories yet.</p> : null}
      </div>
    </section>
  );
}
