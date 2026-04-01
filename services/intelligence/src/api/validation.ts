import type {
  Alert,
  ApiResponse,
  Briefing,
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse,
  SourceArticle,
  StoryCluster,
  TickerSnapshot,
  WatchlistItem
} from '@situation-monitor/shared-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertApiMeta(value: unknown): void {
  if (!isRecord(value)) {
    throw new Error('meta must be an object');
  }

  if (typeof value.generatedAt !== 'string') {
    throw new Error('meta.generatedAt must be a string');
  }

  if (value.source !== 'mock' && value.source !== 'live') {
    throw new Error('meta.source must be "mock" or "live"');
  }
}

function assertApiEnvelope(value: unknown): asserts value is ApiResponse<unknown> {
  if (!isRecord(value)) {
    throw new Error('response must be an object');
  }

  if (!('data' in value)) {
    throw new Error('response.data is required');
  }

  if ('meta' in value && value.meta !== undefined) {
    assertApiMeta(value.meta);
  }
}

function assertSourceArticle(article: unknown): asserts article is SourceArticle {
  if (!isRecord(article)) {
    throw new Error('SourceArticle must be an object');
  }

  if (typeof article.id !== 'string' || typeof article.headline !== 'string') {
    throw new Error('SourceArticle.id and SourceArticle.headline are required strings');
  }

  if (!Array.isArray(article.tickers) || article.tickers.some((item) => typeof item !== 'string')) {
    throw new Error('SourceArticle.tickers must be string[]');
  }

  if ('provider' in article && article.provider !== undefined && article.provider !== 'newsapi' && article.provider !== 'mock') {
    throw new Error('SourceArticle.provider must be newsapi|mock');
  }

  if ('providerArticleId' in article && article.providerArticleId !== undefined && typeof article.providerArticleId !== 'string') {
    throw new Error('SourceArticle.providerArticleId must be string');
  }
}

function assertStoryCluster(cluster: unknown): asserts cluster is StoryCluster {
  if (!isRecord(cluster)) {
    throw new Error('StoryCluster must be an object');
  }

  if (typeof cluster.id !== 'string' || typeof cluster.title !== 'string' || typeof cluster.summary !== 'string') {
    throw new Error('StoryCluster.id/title/summary are required strings');
  }

  if (cluster.status !== 'active' && cluster.status !== 'stale' && cluster.status !== 'conflicting') {
    throw new Error('StoryCluster.status is invalid');
  }

  if (!Array.isArray(cluster.articles)) {
    throw new Error('StoryCluster.articles must be an array');
  }

  cluster.articles.forEach(assertSourceArticle);

  if ('relevanceScore' in cluster && cluster.relevanceScore !== undefined && typeof cluster.relevanceScore !== 'number') {
    throw new Error('StoryCluster.relevanceScore must be number');
  }

  if ('dedupeCount' in cluster && cluster.dedupeCount !== undefined && typeof cluster.dedupeCount !== 'number') {
    throw new Error('StoryCluster.dedupeCount must be number');
  }
}

function assertTickerSnapshot(snapshot: unknown): asserts snapshot is TickerSnapshot {
  if (!isRecord(snapshot)) {
    throw new Error('TickerSnapshot must be an object');
  }

  if (typeof snapshot.symbol !== 'string' || typeof snapshot.asOf !== 'string') {
    throw new Error('TickerSnapshot.symbol and asOf are required strings');
  }

  if (
    snapshot.status !== 'live' &&
    snapshot.status !== 'delayed' &&
    snapshot.status !== 'partial' &&
    snapshot.status !== 'unavailable'
  ) {
    throw new Error('TickerSnapshot.status must be live|delayed|partial|unavailable');
  }

  if ('provider' in snapshot && snapshot.provider !== undefined && snapshot.provider !== 'massive' && snapshot.provider !== 'mock') {
    throw new Error('TickerSnapshot.provider must be massive|mock');
  }

  if ('dataLagSeconds' in snapshot && snapshot.dataLagSeconds !== undefined && typeof snapshot.dataLagSeconds !== 'number') {
    throw new Error('TickerSnapshot.dataLagSeconds must be number');
  }
}

function assertWatchlistItem(item: unknown): asserts item is WatchlistItem {
  if (!isRecord(item)) {
    throw new Error('WatchlistItem must be an object');
  }

  if (typeof item.symbol !== 'string' || typeof item.name !== 'string') {
    throw new Error('WatchlistItem.symbol and name are required strings');
  }
}

function assertBriefing(data: unknown): asserts data is Briefing {
  if (!isRecord(data)) {
    throw new Error('Briefing must be an object');
  }

  if (typeof data.id !== 'string' || typeof data.summary !== 'string' || !Array.isArray(data.bullets)) {
    throw new Error('Briefing.id/summary/bullets are required');
  }

  if (data.status !== 'ready' && data.status !== 'unavailable' && data.status !== 'failed') {
    throw new Error('Briefing.status is invalid');
  }

  if ('generator' in data && data.generator !== undefined && data.generator !== 'llm' && data.generator !== 'template') {
    throw new Error('Briefing.generator must be llm|template');
  }

  if ('confidence' in data && data.confidence !== undefined && typeof data.confidence !== 'number') {
    throw new Error('Briefing.confidence must be number');
  }
}

function assertAlert(alert: unknown): asserts alert is Alert {
  if (!isRecord(alert)) {
    throw new Error('Alert must be an object');
  }

  if (typeof alert.id !== 'string' || typeof alert.title !== 'string' || typeof alert.isStale !== 'boolean') {
    throw new Error('Alert.id/title/isStale are required');
  }

  if (alert.level !== 'info' && alert.level !== 'warning' && alert.level !== 'critical') {
    throw new Error('Alert.level is invalid');
  }

  if ('triggerCode' in alert && alert.triggerCode !== undefined) {
    if (alert.triggerCode !== 'story_conflict' && alert.triggerCode !== 'price_move' && alert.triggerCode !== 'data_stale') {
      throw new Error('Alert.triggerCode is invalid');
    }
  }

  if ('expiresAt' in alert && alert.expiresAt !== undefined && typeof alert.expiresAt !== 'string') {
    throw new Error('Alert.expiresAt must be a string');
  }
}

export function assertBriefingResponse(value: unknown): asserts value is GetBriefingResponse {
  assertApiEnvelope(value);
  assertBriefing(value.data);
}

export function assertStoriesResponse(value: unknown): asserts value is GetStoriesResponse {
  assertApiEnvelope(value);

  if (!isRecord(value.data) || !Array.isArray(value.data.clusters)) {
    throw new Error('stories.data.clusters must be an array');
  }

  value.data.clusters.forEach(assertStoryCluster);
}

export function assertTickersResponse(value: unknown): asserts value is GetTickersResponse {
  assertApiEnvelope(value);

  if (!isRecord(value.data) || !Array.isArray(value.data.snapshots) || !Array.isArray(value.data.watchlist)) {
    throw new Error('tickers data must contain snapshots[] and watchlist[]');
  }

  value.data.snapshots.forEach(assertTickerSnapshot);
  value.data.watchlist.forEach(assertWatchlistItem);
}

export function assertAlertsResponse(value: unknown): asserts value is GetAlertsResponse {
  assertApiEnvelope(value);

  if (!isRecord(value.data) || !Array.isArray(value.data.alerts)) {
    throw new Error('alerts.data.alerts must be an array');
  }

  value.data.alerts.forEach(assertAlert);
}
