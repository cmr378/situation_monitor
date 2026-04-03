import type { GetStoriesResponse } from '@situation-monitor/shared-types';

type StoryFeedProps = {
  title: string;
  response: GetStoriesResponse;
  emptyResponse: GetStoriesResponse;
  staleResponse: GetStoriesResponse;
  sourceLabel: string;
  sourceDetail: string;
  isFallback: boolean;
};

export function StoryFeed({
  title,
  response,
  emptyResponse,
  staleResponse,
  sourceLabel,
  sourceDetail,
  isFallback
}: StoryFeedProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="subtle">Cluster intelligence and dedupe overview</p>
      <p className={`subtle panel__status ${isFallback ? 'panel__status--fallback' : ''}`}>
        Source: {sourceLabel}
      </p>

      <div className="meta-grid">
        <div>
          <span className="subtle">Default clusters</span>
          <p>{response.data.clusters.length}</p>
        </div>
        <div>
          <span className="subtle">Empty state</span>
          <p>{emptyResponse.data.clusters.length}</p>
        </div>
        <div>
          <span className="subtle">Stale sample</span>
          <p>{staleResponse.data.clusters[0]?.title ?? 'none'}</p>
        </div>
        <div>
          <span className="subtle">Request status</span>
          <p>{sourceDetail}</p>
        </div>
      </div>

      <ul>
        {response.data.clusters.map((cluster) => (
          <li key={cluster.id}>
            <strong>{cluster.title}</strong>
            <p className="subtle">
              {cluster.status} | {cluster.primaryTicker ?? 'no primary ticker'}
            </p>
            <p>{cluster.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
