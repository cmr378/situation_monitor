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

      <p>Alerts: {response.data.alerts.length}</p>
      <p>Empty alerts state count: {emptyResponse.data.alerts.length}</p>

      <ul>
        {response.data.alerts.map((alert) => (
          <li key={alert.id}>
            <strong>{alert.title}</strong> [{alert.level}] {alert.isStale ? '(stale)' : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
