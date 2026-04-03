import type { GetAlertsResponse } from '@situation-monitor/shared-types';

type TimelineProps = {
  title: string;
  response: GetAlertsResponse;
  emptyResponse: GetAlertsResponse;
  sourceLabel: string;
  sourceDetail: string;
  isFallback: boolean;
};

export function Timeline({ title, response, emptyResponse, sourceLabel, sourceDetail, isFallback }: TimelineProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="subtle">Alert stream with stale-state behavior</p>
      <p className={`subtle panel__status ${isFallback ? 'panel__status--fallback' : ''}`}>
        Source: {sourceLabel}
      </p>

      <div className="meta-grid">
        <div>
          <span className="subtle">Alerts</span>
          <p>{response.data.alerts.length}</p>
        </div>
        <div>
          <span className="subtle">Empty state count</span>
          <p>{emptyResponse.data.alerts.length}</p>
        </div>
        <div>
          <span className="subtle">Request status</span>
          <p>{sourceDetail}</p>
        </div>
      </div>

      <ul>
        {response.data.alerts.map((alert) => (
          <li key={alert.id}>
            <strong>{alert.title}</strong>
            <p className="subtle">
              [{alert.level}] [{alert.category}] {alert.isStale ? '(stale)' : '(fresh)'}
            </p>
            <p>{alert.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
