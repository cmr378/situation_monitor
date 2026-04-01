import type { GetAlertsResponse } from '@situation-monitor/shared-types';

type TimelineProps = {
  title: string;
  response: GetAlertsResponse;
  emptyResponse: GetAlertsResponse;
};

export function Timeline({ title, response, emptyResponse }: TimelineProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="subtle">Alert stream with stale-state behavior</p>

      <div className="meta-grid">
        <div>
          <span className="subtle">Alerts</span>
          <p>{response.data.alerts.length}</p>
        </div>
        <div>
          <span className="subtle">Empty state count</span>
          <p>{emptyResponse.data.alerts.length}</p>
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
