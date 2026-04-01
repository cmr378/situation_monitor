import type { GetBriefingResponse } from '@situation-monitor/shared-types';

type BriefingPanelProps = {
  title: string;
  readyResponse: GetBriefingResponse;
  unavailableResponse: GetBriefingResponse;
  failedResponse: GetBriefingResponse;
  endpointFallbackMessage: string;
};

export function BriefingPanel({
  title,
  readyResponse,
  unavailableResponse,
  failedResponse,
  endpointFallbackMessage
}: BriefingPanelProps) {
  const briefing = readyResponse.data;

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="subtle">Model: {briefing.model}</p>

      <h3>{briefing.headline}</h3>
      <p>{briefing.summary}</p>

      <ul>
        {briefing.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <div className="meta-grid">
        <div>
          <span className="subtle">Unavailable fallback</span>
          <p>{unavailableResponse.data.fallbackMessage ?? 'n/a'}</p>
        </div>
        <div>
          <span className="subtle">Failure reason</span>
          <p>{failedResponse.data.failureReason ?? 'n/a'}</p>
        </div>
        <div>
          <span className="subtle">Endpoint fallback</span>
          <p>{endpointFallbackMessage}</p>
        </div>
      </div>
    </section>
  );
}
