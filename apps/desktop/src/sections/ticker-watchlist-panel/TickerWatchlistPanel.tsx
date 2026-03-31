import type { GetTickersResponse } from '@situation-monitor/shared-types';

type TickerWatchlistPanelProps = {
  title: string;
  response: GetTickersResponse;
  partialResponse: GetTickersResponse;
  missingResponse: GetTickersResponse;
};

export function TickerWatchlistPanel({ title, response, partialResponse, missingResponse }: TickerWatchlistPanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>

      <p>Watchlist items: {response.data.watchlist.length}</p>
      <p>Primary snapshot status: {response.data.snapshots[0]?.status ?? 'none'}</p>
      <p>Partial snapshot status: {partialResponse.data.snapshots[0]?.status ?? 'none'}</p>
      <p>Missing-field snapshot note: {missingResponse.data.snapshots[0]?.notes ?? 'n/a'}</p>
    </section>
  );
}
