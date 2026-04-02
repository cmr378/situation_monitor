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
      <p className="subtle">Market snapshots + conviction watchlist</p>

      <div className="meta-grid">
        <div>
          <span className="subtle">Watchlist</span>
          <p>{response.data.watchlist.length}</p>
        </div>
        <div>
          <span className="subtle">Primary status</span>
          <p>{response.data.snapshots[0]?.status ?? 'none'}</p>
        </div>
        <div>
          <span className="subtle">Partial status</span>
          <p>{partialResponse.data.snapshots[0]?.status ?? 'none'}</p>
        </div>
        <div>
          <span className="subtle">Missing-field note</span>
          <p>{missingResponse.data.snapshots[0]?.notes ?? 'n/a'}</p>
        </div>
      </div>

      <ul>
        {response.data.snapshots.map((snapshot) => (
          <li key={snapshot.symbol}>
            <strong>{snapshot.symbol}</strong> {snapshot.price ? `$${snapshot.price.toFixed(2)}` : 'n/a'} (
            {snapshot.changePercent24h ?? 0}%)
          </li>
        ))}
      </ul>

      <ul>
        {response.data.watchlist.map((item) => (
          <li key={item.symbol}>
            <strong>{item.symbol}</strong> [{item.priority}] {item.thesis ?? 'no thesis yet'}
          </li>
        ))}
      </ul>
    </section>
  );
}
