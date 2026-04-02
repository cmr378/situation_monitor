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
}

function assertStoryCluster(cluster: unknown): asserts cluster is StoryCluster {
  if (!isRecord(cluster)) {
    throw new Error('StoryCluster must be an object');
  }

  if (typeof cluster.id !== 'string' || typeof cluster.title !== 'string' || typeof cluster.summary !== 'string') {
    throw new Error('StoryCluster.id/title/summary are required strings');
  }

  if (!Array.isArray(cluster.articles)) {
    throw new Error('StoryCluster.articles must be an array');
  }

  cluster.articles.forEach(assertSourceArticle);
}

function assertTickerSnapshot(snapshot: unknown): asserts snapshot is TickerSnapshot {
  if (!isRecord(snapshot)) {
    throw new Error('TickerSnapshot must be an object');
  }

  if (typeof snapshot.symbol !== 'string' || typeof snapshot.asOf !== 'string') {
    throw new Error('TickerSnapshot.symbol and asOf are required strings');
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
}

function assertAlert(alert: unknown): asserts alert is Alert {
  if (!isRecord(alert)) {
    throw new Error('Alert must be an object');
  }

  if (typeof alert.id !== 'string' || typeof alert.title !== 'string' || typeof alert.isStale !== 'boolean') {
    throw new Error('Alert.id/title/isStale are required');
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
