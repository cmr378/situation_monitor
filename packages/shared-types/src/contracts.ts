export type DataSource = 'mock' | 'live';

export type ApiMeta = {
  generatedAt: string;
  source: DataSource;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface SourceArticle {
  id: string;
  headline: string;
  sourceName: string;
  sourceType: 'wire' | 'news' | 'blog' | 'social' | 'filing';
  url: string;
  publishedAt: string;
  summary?: string;
  tickers: string[];
  sentiment?: Sentiment;
  credibilityScore?: number;
  provider?: 'newsapi' | 'mock';
  providerArticleId?: string;
}

export interface StoryCluster {
  id: string;
  title: string;
  summary: string;
  status: 'active' | 'stale' | 'conflicting';
  topicTags: string[];
  articles: SourceArticle[];
  primaryTicker?: string;
  conflictNote?: string;
  lastUpdatedAt: string;
  relevanceScore?: number;
  dedupeCount?: number;
}

export interface TickerSnapshot {
  symbol: string;
  asOf: string;
  status: 'live' | 'delayed' | 'partial' | 'unavailable';
  price?: number;
  changePercent24h?: number;
  volume?: number;
  marketCap?: number;
  currency?: string;
  notes?: string;
  provider?: 'massive' | 'mock';
  dataLagSeconds?: number;
}

export interface Briefing {
  id: string;
  generatedAt: string;
  status: 'ready' | 'unavailable' | 'failed';
  headline: string;
  summary: string;
  bullets: string[];
  relatedClusterIds: string[];
  model: string;
  failureReason?: string;
  fallbackMessage?: string;
  generator?: 'llm' | 'template';
  confidence?: number;
  promptVersion?: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  priority: 'high' | 'medium' | 'low';
  thesis?: string;
  alertThreshold?: number;
  lastReviewedAt?: string;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  category: 'news' | 'market' | 'system';
  createdAt: string;
  isStale: boolean;
  acknowledged: boolean;
  relatedSymbol?: string;
  triggerCode?: 'story_conflict' | 'price_move' | 'data_stale';
  expiresAt?: string;
}

export interface EndpointUnavailable {
  reason: 'endpoint_unavailable';
  message: string;
  retryAfterSeconds?: number;
}
