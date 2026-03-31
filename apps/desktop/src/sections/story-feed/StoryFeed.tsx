import type { GetStoriesResponse } from '@situation-monitor/shared-types';

type StoryFeedProps = {
  title: string;
  response: GetStoriesResponse;
  emptyResponse: GetStoriesResponse;
  staleResponse: GetStoriesResponse;
};

export function StoryFeed({ title, response, emptyResponse, staleResponse }: StoryFeedProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>

      <p>Default clusters: {response.data.clusters.length}</p>
      <p>Empty state clusters: {emptyResponse.data.clusters.length}</p>
      <p>Stale state example: {staleResponse.data.clusters[0]?.title ?? 'none'}</p>

      <ul>
        {response.data.clusters.map((cluster) => (
          <li key={cluster.id}>
            <strong>{cluster.title}</strong> ({cluster.status})
          </li>
        ))}
      </ul>
    </section>
  );
}
