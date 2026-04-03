import type { GetBriefingResponse } from '@situation-monitor/shared-types';

type BriefingPanelProps = {
  title: string;
  readyResponse: GetBriefingResponse;
  unavailableResponse: GetBriefingResponse;
  failedResponse: GetBriefingResponse;
  sourceLabel: string;
  sourceDetail: string;
  isFallback: boolean;
};

export function BriefingPanel({
  title,
  readyResponse,
  unavailableResponse,
  failedResponse,
  sourceLabel,
  sourceDetail,
  isFallback
}: BriefingPanelProps) {
  const briefing = readyResponse.data;

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="subtle">Model: {briefing.model}</p>
      <p className={`subtle panel__status ${isFallback ? 'panel__status--fallback' : ''}`}>
        Source: {sourceLabel}
      </p>

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
          <span className="subtle">Request status</span>
          <p>{sourceDetail}</p>
        </div>
      </div>
    </section>
  );
}
