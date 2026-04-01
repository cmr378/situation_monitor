import type {
  Alert,
  ApiResponse,
  Briefing,
  EndpointUnavailable,
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse,
  SourceArticle,
  StoryCluster,
  TickerSnapshot,
  WatchlistItem
} from '@situation-monitor/shared-types';

import { FIXED_TIMESTAMPS } from './constants.js';

const baseMeta = {
  generatedAt: FIXED_TIMESTAMPS.generatedAt,
  source: 'mock' as const
};

const articleOne: SourceArticle = {
  id: 'article-ai-capex-wire',
  headline: 'Chip suppliers report continued AI infrastructure demand',
  sourceName: 'MarketWire',
  sourceType: 'wire',
  url: 'https://example.com/ai-capex-wire',
  publishedAt: FIXED_TIMESTAMPS.articlePublishedAt,
  summary: 'Supplier commentary points to sustained enterprise GPU demand.',
  tickers: ['NVDA', 'AMD'],
  sentiment: 'positive',
  credibilityScore: 0.89,
  provider: 'mock',
  providerArticleId: 'mock-article-ai-capex-wire'
};

const articleTwo: SourceArticle = {
  id: 'article-fed-tone-news',
  headline: 'Rate-cut expectations split after mixed policy commentary',
  sourceName: 'MacroDesk',
  sourceType: 'news',
  url: 'https://example.com/fed-tone-news',
  publishedAt: FIXED_TIMESTAMPS.articlePublishedAt,
  summary: 'Analysts diverge on timing of the next policy shift.',
  tickers: ['SPY', 'QQQ'],
  sentiment: 'neutral',
  credibilityScore: 0.82,
  provider: 'mock',
  providerArticleId: 'mock-article-fed-tone-news'
};

const malformedRawArticle: unknown = {
  id: null,
  headline: 42,
  source: 'unknown',
  publishedAt: 'not-a-date',
  tickers: null
};

export const normalizedMalformedArticleFallback: SourceArticle = {
  id: 'normalized-malformed-001',
  headline: 'Unstructured source content (fallback normalized)',
  sourceName: 'unknown-source',
  sourceType: 'news',
  url: 'https://example.com/fallback-normalized',
  publishedAt: FIXED_TIMESTAMPS.articlePublishedAt,
  summary: 'Malformed source data was normalized into a safe default article.',
  tickers: [],
  sentiment: 'neutral',
  credibilityScore: 0.2,
  provider: 'mock',
  providerArticleId: 'mock-normalized-malformed-001'
};

const activeCluster: StoryCluster = {
  id: 'cluster-ai-capex',
  title: 'AI infrastructure spending remains elevated',
  summary: 'Multiple sources report continued AI datacenter capex demand.',
  status: 'active',
  topicTags: ['ai', 'semiconductors'],
  articles: [articleOne],
  primaryTicker: 'NVDA',
  lastUpdatedAt: FIXED_TIMESTAMPS.recentStoryUpdate,
  relevanceScore: 0.91,
  dedupeCount: 0
};

const duplicateSourceCluster: StoryCluster = {
  id: 'cluster-duplicate-source',
  title: 'Duplicate source cluster example',
  summary: 'Two copies of effectively the same source article are present.',
  status: 'active',
  topicTags: ['dedupe', 'quality'],
  articles: [
    articleOne,
    {
      ...articleOne,
      id: 'article-ai-capex-wire-duplicate',
      url: 'https://example.com/ai-capex-wire-dup'
    }
  ],
  primaryTicker: 'NVDA',
  lastUpdatedAt: FIXED_TIMESTAMPS.recentStoryUpdate,
  relevanceScore: 0.74,
  dedupeCount: 1
};

const conflictingSourceCluster: StoryCluster = {
  id: 'cluster-conflicting-policy',
  title: 'Policy timeline narratives conflict',
  summary: 'Trusted outlets disagree on the near-term policy timeline.',
  status: 'conflicting',
  topicTags: ['macro', 'rates'],
  articles: [
    articleTwo,
    {
      id: 'article-fed-tone-blog-counter',
      headline: 'No near-term policy shift expected, say contrarian analysts',
      sourceName: 'PolicyBlog',
      sourceType: 'blog',
      url: 'https://example.com/fed-tone-counter',
      publishedAt: FIXED_TIMESTAMPS.articlePublishedAt,
      summary: 'Contrarian take argues cuts are less likely this quarter.',
      tickers: ['SPY'],
      sentiment: 'negative',
      credibilityScore: 0.58,
      provider: 'mock',
      providerArticleId: 'mock-article-fed-tone-blog-counter'
    }
  ],
  primaryTicker: 'SPY',
  conflictNote: 'Conflicting guidance across mainstream and independent sources.',
  lastUpdatedAt: FIXED_TIMESTAMPS.recentStoryUpdate,
  relevanceScore: 0.86,
  dedupeCount: 0
};

const staleCluster: StoryCluster = {
  ...activeCluster,
  id: 'cluster-stale-ai',
  title: 'Older AI cluster awaiting refresh',
  status: 'stale',
  summary: 'This cluster is intentionally stale for UI state handling.',
  lastUpdatedAt: FIXED_TIMESTAMPS.staleStoryUpdate
};

export const defaultWatchlist: WatchlistItem[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA',
    priority: 'high',
    thesis: 'AI demand proxy',
    alertThreshold: 1000,
    lastReviewedAt: FIXED_TIMESTAMPS.generatedAt
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft',
    priority: 'medium',
    thesis: 'Cloud + AI platform leverage'
  }
];

const liveSnapshot: TickerSnapshot = {
  symbol: 'NVDA',
  asOf: FIXED_TIMESTAMPS.marketAsOf,
  status: 'live',
  price: 1012.5,
  changePercent24h: 2.3,
  volume: 38100211,
  marketCap: 2480000000000,
  currency: 'USD',
  provider: 'mock',
  dataLagSeconds: 30
};

const missingFieldsSnapshot: TickerSnapshot = {
  symbol: 'MSFT',
  asOf: FIXED_TIMESTAMPS.marketAsOf,
  status: 'delayed',
  price: 427.1,
  currency: 'USD',
  notes: 'Missing volume and marketCap from upstream feed.',
  provider: 'mock',
  dataLagSeconds: 180
};

const partialSnapshot: TickerSnapshot = {
  symbol: 'TSLA',
  asOf: FIXED_TIMESTAMPS.marketAsOf,
  status: 'partial',
  changePercent24h: -1.4,
  notes: 'Price unavailable; partial quote only.',
  provider: 'mock',
  dataLagSeconds: 240
};

const staleAlert: Alert = {
  id: 'alert-stale-volatility',
  level: 'warning',
  title: 'Volatility warning (stale)',
  message: 'This alert is stale and should be visually downgraded.',
  category: 'market',
  createdAt: FIXED_TIMESTAMPS.staleAlertAt,
  isStale: true,
  acknowledged: false,
  relatedSymbol: 'SPY',
  triggerCode: 'data_stale',
  expiresAt: '2026-03-30T14:15:00.000Z'
};

const activeAlert: Alert = {
  id: 'alert-fed-vol',
  level: 'warning',
  title: 'Policy headline conflict',
  message: 'Two major outlets disagree on policy timing; volatility risk elevated.',
  category: 'news',
  createdAt: FIXED_TIMESTAMPS.alertAt,
  isStale: false,
  acknowledged: false,
  triggerCode: 'story_conflict',
  expiresAt: '2026-03-31T16:58:00.000Z'
};

export const briefingReadyResponse: GetBriefingResponse = {
  data: {
    id: 'briefing-2026-03-31-am',
    generatedAt: FIXED_TIMESTAMPS.generatedAt,
    status: 'ready',
    headline: 'AI infrastructure and macro catalysts lead the morning setup',
    summary: 'Markets are balancing AI capex optimism against rate-cut uncertainty.',
    bullets: [
      'Semiconductor guidance remains the primary risk-on signal.',
      'Conflicting policy headlines are increasing intraday volatility.'
    ],
    relatedClusterIds: [activeCluster.id, conflictingSourceCluster.id],
    model: 'mock-briefing-v1',
    generator: 'template',
    confidence: 0.84,
    promptVersion: 'v1-template'
  },
  meta: baseMeta
};

export const briefingUnavailableFallbackResponse: GetBriefingResponse = {
  data: {
    id: 'briefing-2026-03-31-am-unavailable',
    generatedAt: FIXED_TIMESTAMPS.generatedAt,
    status: 'unavailable',
    headline: 'Briefing temporarily unavailable',
    summary: 'Automated briefing is unavailable; showing safe fallback content.',
    bullets: [],
    relatedClusterIds: [],
    model: 'mock-briefing-v1',
    generator: 'template',
    promptVersion: 'v1-template',
    fallbackMessage: 'Please retry in a few minutes.'
  },
  meta: baseMeta
};

export const briefingFailureResponse: GetBriefingResponse = {
  data: {
    id: 'briefing-2026-03-31-am-failed',
    generatedAt: FIXED_TIMESTAMPS.generatedAt,
    status: 'failed',
    headline: 'Briefing generation failed',
    summary: 'Briefing generation failed due to incomplete upstream context.',
    bullets: [],
    relatedClusterIds: [],
    model: 'mock-briefing-v1',
    generator: 'template',
    promptVersion: 'v1-template',
    failureReason: 'upstream_context_timeout',
    fallbackMessage: 'Fallback narrative unavailable. Use story feed directly.'
  },
  meta: baseMeta
};

export const storiesPrimaryResponse: GetStoriesResponse = {
  data: {
    clusters: [activeCluster, conflictingSourceCluster]
  },
  meta: baseMeta
};

export const storiesEmptyResponse: GetStoriesResponse = {
  data: {
    clusters: []
  },
  meta: baseMeta
};

export const storiesDuplicateSourceResponse: GetStoriesResponse = {
  data: {
    clusters: [duplicateSourceCluster]
  },
  meta: baseMeta
};

export const storiesConflictingResponse: GetStoriesResponse = {
  data: {
    clusters: [conflictingSourceCluster]
  },
  meta: baseMeta
};

export const storiesStaleResponse: GetStoriesResponse = {
  data: {
    clusters: [staleCluster]
  },
  meta: baseMeta
};

export const tickersPrimaryResponse: GetTickersResponse = {
  data: {
    snapshots: [liveSnapshot],
    watchlist: defaultWatchlist
  },
  meta: baseMeta
};

export const tickersMissingFieldsResponse: GetTickersResponse = {
  data: {
    snapshots: [missingFieldsSnapshot],
    watchlist: defaultWatchlist
  },
  meta: baseMeta
};

export const tickersPartialResponse: GetTickersResponse = {
  data: {
    snapshots: [partialSnapshot],
    watchlist: defaultWatchlist
  },
  meta: baseMeta
};

export const alertsPrimaryResponse: GetAlertsResponse = {
  data: {
    alerts: [activeAlert, staleAlert]
  },
  meta: baseMeta
};

export const alertsStaleResponse: GetAlertsResponse = {
  data: {
    alerts: [staleAlert]
  },
  meta: baseMeta
};

export const alertsEmptyResponse: GetAlertsResponse = {
  data: {
    alerts: []
  },
  meta: baseMeta
};

export const endpointUnavailableFallback: ApiResponse<EndpointUnavailable> = {
  data: {
    reason: 'endpoint_unavailable',
    message: 'Requested endpoint is currently unavailable in local mock mode.',
    retryAfterSeconds: 30
  },
  meta: baseMeta
};

export const malformedSourceNormalizationFixture = {
  raw: malformedRawArticle,
  normalized: normalizedMalformedArticleFallback
};

export const briefingScenarios = {
  ready: briefingReadyResponse,
  unavailable: briefingUnavailableFallbackResponse,
  failed: briefingFailureResponse
} as const;

export const storiesScenarios = {
  default: storiesPrimaryResponse,
  empty: storiesEmptyResponse,
  duplicateSource: storiesDuplicateSourceResponse,
  conflicting: storiesConflictingResponse,
  stale: storiesStaleResponse
} as const;

export const tickersScenarios = {
  default: tickersPrimaryResponse,
  missingFields: tickersMissingFieldsResponse,
  partial: tickersPartialResponse
} as const;

export const alertsScenarios = {
  default: alertsPrimaryResponse,
  stale: alertsStaleResponse,
  empty: alertsEmptyResponse
} as const;

export const endpointFallbackScenarios = {
  unavailable: endpointUnavailableFallback
} as const;

export const normalizationScenarios = {
  malformedSourceNormalized: malformedSourceNormalizationFixture
} as const;
