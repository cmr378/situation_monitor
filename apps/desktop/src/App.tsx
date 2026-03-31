import {
  alertsScenarios,
  briefingFailureResponse,
  briefingScenarios,
  endpointUnavailableFallback,
  storiesScenarios,
  tickersScenarios
} from '@situation-monitor/mock-data';

import { BriefingPanel } from './sections/briefing-panel/BriefingPanel.js';
import { StoryFeed } from './sections/story-feed/StoryFeed.js';
import { TickerWatchlistPanel } from './sections/ticker-watchlist-panel/TickerWatchlistPanel.js';
import { Timeline } from './sections/timeline/Timeline.js';
import { TopBar } from './sections/top-bar/TopBar.js';

export function App() {
  return (
    <div className="layout">
      <TopBar generatedAt={briefingScenarios.ready.meta?.generatedAt ?? 'n/a'} />

      <div className="grid">
        <StoryFeed
          title="Story Feed"
          response={storiesScenarios.default}
          emptyResponse={storiesScenarios.empty}
          staleResponse={storiesScenarios.stale}
        />

        <BriefingPanel
          title="Briefing"
          readyResponse={briefingScenarios.ready}
          unavailableResponse={briefingScenarios.unavailable}
          failedResponse={briefingFailureResponse}
          endpointFallbackMessage={endpointUnavailableFallback.data.message}
        />

        <TickerWatchlistPanel
          title="Ticker + Watchlist"
          response={tickersScenarios.default}
          partialResponse={tickersScenarios.partial}
          missingResponse={tickersScenarios.missingFields}
        />

        <Timeline title="Timeline / Alerts" response={alertsScenarios.default} emptyResponse={alertsScenarios.empty} />
      </div>
    </div>
  );
}
