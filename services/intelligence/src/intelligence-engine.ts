import {
  alertsScenarios,
  briefingScenarios,
  defaultWatchlist,
  storiesScenarios,
  tickersScenarios
} from '@situation-monitor/mock-data';
import type {
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse,
  WatchlistItem
} from '@situation-monitor/shared-types';

import type { IntelligenceConfig } from './config.js';
import { loadConfig } from './config.js';
import { generateBriefing } from './briefing-generation/index.js';
import { clusterStories } from './clustering/index.js';
import { ingestSignals } from './ingestion/index.js';
import { normalizeArticles, normalizeTickerSnapshots } from './normalization/index.js';
import { createProviderBundle, type ProviderBundle } from './providers/index.js';
import { buildAlerts, scoreClusters } from './scoring/index.js';

type Scenario = string | undefined;

type LiveState = {
  generatedAt: string;
  stories: GetStoriesResponse['data']['clusters'];
  snapshots: GetTickersResponse['data']['snapshots'];
  watchlist: WatchlistItem[];
  alerts: GetAlertsResponse['data']['alerts'];
  briefing: GetBriefingResponse['data'];
};

function selectStoriesScenario(scenario: Scenario): GetStoriesResponse {
  switch (scenario) {
    case 'empty':
      return storiesScenarios.empty;
    case 'duplicateSource':
      return storiesScenarios.duplicateSource;
    case 'conflicting':
      return storiesScenarios.conflicting;
    case 'stale':
      return storiesScenarios.stale;
    default:
      return storiesScenarios.default;
  }
}

function selectTickersScenario(scenario: Scenario): GetTickersResponse {
  switch (scenario) {
    case 'missingFields':
      return tickersScenarios.missingFields;
    case 'partial':
      return tickersScenarios.partial;
    default:
      return tickersScenarios.default;
  }
}

function selectAlertsScenario(scenario: Scenario): GetAlertsResponse {
  switch (scenario) {
    case 'empty':
      return alertsScenarios.empty;
    case 'stale':
      return alertsScenarios.stale;
    default:
      return alertsScenarios.default;
  }
}

function selectBriefingScenario(scenario: Scenario): GetBriefingResponse {
  switch (scenario) {
    case 'failed':
      return briefingScenarios.failed;
    case 'unavailable':
      return briefingScenarios.unavailable;
    default:
      return briefingScenarios.ready;
  }
}

function buildWatchlist(symbols: string[]): WatchlistItem[] {
  const bySymbol = new Map(defaultWatchlist.map((item) => [item.symbol.toUpperCase(), item]));

  return symbols.map((symbol) => {
    const existing = bySymbol.get(symbol.toUpperCase());
    if (existing) {
      return existing;
    }

    return {
      symbol,
      name: symbol,
      priority: 'low',
      thesis: 'User-configured watchlist symbol.'
    };
  });
}

export class IntelligenceEngine {
  private readonly config: IntelligenceConfig;

  private readonly providers: ProviderBundle;

  private cache?: {
    expiresAt: number;
    state: LiveState;
  };

  constructor(config: IntelligenceConfig = loadConfig(), providers: ProviderBundle = createProviderBundle(config)) {
    this.config = config;
    this.providers = providers;
  }

  async getStoriesResponse(scenario?: string): Promise<GetStoriesResponse> {
    if (scenario) {
      return selectStoriesScenario(scenario);
    }

    if (this.config.mode === 'mock') {
      return storiesScenarios.default;
    }

    const state = await this.getLiveState();
    return {
      data: { clusters: state.stories },
      meta: {
        generatedAt: state.generatedAt,
        source: 'live'
      }
    };
  }

  async getTickersResponse(scenario?: string): Promise<GetTickersResponse> {
    if (scenario) {
      return selectTickersScenario(scenario);
    }

    if (this.config.mode === 'mock') {
      return tickersScenarios.default;
    }

    const state = await this.getLiveState();
    return {
      data: {
        snapshots: state.snapshots,
        watchlist: state.watchlist
      },
      meta: {
        generatedAt: state.generatedAt,
        source: 'live'
      }
    };
  }

  async getAlertsResponse(scenario?: string): Promise<GetAlertsResponse> {
    if (scenario) {
      return selectAlertsScenario(scenario);
    }

    if (this.config.mode === 'mock') {
      return alertsScenarios.default;
    }

    const state = await this.getLiveState();
    return {
      data: {
        alerts: state.alerts
      },
      meta: {
        generatedAt: state.generatedAt,
        source: 'live'
      }
    };
  }

  async getBriefingResponse(scenario?: string): Promise<GetBriefingResponse> {
    if (scenario) {
      return selectBriefingScenario(scenario);
    }

    if (this.config.mode === 'mock') {
      return briefingScenarios.ready;
    }

    const state = await this.getLiveState();
    return {
      data: state.briefing,
      meta: {
        generatedAt: state.generatedAt,
        source: 'live'
      }
    };
  }

  private async getLiveState(): Promise<LiveState> {
    const nowMs = Date.now();
    if (this.cache && this.cache.expiresAt > nowMs) {
      return this.cache.state;
    }

    const generatedAt = this.config.fixedNowIso ?? new Date().toISOString();
    const watchlist = buildWatchlist(this.config.watchlistSymbols);

    const ingestion = await ingestSignals({
      newsProvider: this.providers.newsProvider,
      massiveProvider: this.providers.massiveProvider,
      newsQuery: this.config.newsQuery,
      newsPageSize: this.config.newsPageSize,
      symbols: watchlist.map((item) => item.symbol)
    });

    const normalizedArticles = normalizeArticles(ingestion.articles, generatedAt);
    const normalizedSnapshots = normalizeTickerSnapshots(ingestion.snapshots, generatedAt);
    const clusteredStories = clusterStories(normalizedArticles, generatedAt);
    const scoredStories = scoreClusters(clusteredStories, watchlist, generatedAt);

    const providerMessages = [
      ...ingestion.errors.map((error) => `${error.provider} provider error: ${error.message}`)
    ];

    if (!this.config.newsApi.apiKey) {
      providerMessages.push('NewsAPI key missing; using empty article feed fallback.');
    }
    if (!this.config.massive.apiKey) {
      providerMessages.push('Massive API key missing; returning unavailable ticker snapshots.');
    }

    const alerts = buildAlerts({
      clusters: scoredStories,
      snapshots: normalizedSnapshots,
      watchlist,
      providerMessages,
      nowIso: generatedAt
    });

    const briefingInputs: Parameters<typeof generateBriefing>[0] = {
      clusters: scoredStories,
      alerts,
      snapshots: normalizedSnapshots,
      generatedAt,
      llmModel: this.config.llm.model,
      llmTimeoutMs: this.config.llm.timeoutMs
    };
    if (this.providers.llmProvider) {
      briefingInputs.llmProvider = this.providers.llmProvider;
    }

    const briefing = await generateBriefing(briefingInputs);

    const state: LiveState = {
      generatedAt,
      stories: scoredStories,
      snapshots: normalizedSnapshots,
      watchlist,
      alerts,
      briefing
    };

    this.cache = {
      expiresAt: nowMs + this.config.cacheTtlMs,
      state
    };

    return state;
  }
}
