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
  return (
    <section className="panel">
      <h2>{title}</h2>

      <p>{readyResponse.data.summary}</p>
      <p>Unavailable fallback: {unavailableResponse.data.fallbackMessage ?? 'n/a'}</p>
      <p>Failure reason: {failedResponse.data.failureReason ?? 'n/a'}</p>
      <p>Endpoint fallback message: {endpointFallbackMessage}</p>
    </section>
  );
}
