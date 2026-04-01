import type { SourceArticle, StoryCluster } from '@situation-monitor/shared-types';

const DEDUPE_WINDOW_MINUTES = 90;
const STALE_THRESHOLD_HOURS = 6;

function normalizeHeadline(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function computeTimeBucket(iso: string): number {
  const millis = Date.parse(iso);
  if (Number.isNaN(millis)) {
    return 0;
  }

  return Math.floor(millis / (DEDUPE_WINDOW_MINUTES * 60 * 1000));
}

function dedupeKey(article: SourceArticle): string {
  const tickerKey = article.tickers.length > 0 ? [...article.tickers].sort().join(',') : 'none';
  return `${normalizeHeadline(article.headline)}|${tickerKey}|${computeTimeBucket(article.publishedAt)}`;
}

function deriveTopicTags(text: string): string[] {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();

  if (normalized.includes('ai') || normalized.includes('gpu')) {
    tags.add('ai');
  }
  if (normalized.includes('chip') || normalized.includes('semiconductor')) {
    tags.add('semiconductors');
  }
  if (normalized.includes('rate') || normalized.includes('fed') || normalized.includes('inflation')) {
    tags.add('macro');
  }
  if (normalized.includes('earnings') || normalized.includes('guidance')) {
    tags.add('earnings');
  }

  if (tags.size === 0) {
    tags.add('markets');
  }

  return [...tags];
}

function confidenceDelta(group: SourceArticle[]): number {
  const sorted = [...group]
    .map((article) => article.credibilityScore ?? 0.5)
    .sort((left, right) => right - left);

  if (sorted.length < 2) {
    return 1;
  }

  const first = sorted[0] ?? 0;
  const second = sorted[1] ?? 0;
  return Math.abs(first - second);
}

function determineStatus(group: SourceArticle[], latestUpdate: string, nowIso: string): StoryCluster['status'] {
  const sentiments = new Set(group.map((article) => article.sentiment ?? 'neutral'));
  if (sentiments.has('positive') && sentiments.has('negative') && confidenceDelta(group) <= 0.2) {
    return 'conflicting';
  }

  const staleThresholdMs = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  if (Date.parse(nowIso) - Date.parse(latestUpdate) > staleThresholdMs) {
    return 'stale';
  }

  return 'active';
}

function findPrimaryTicker(group: SourceArticle[]): string | undefined {
  const counts = new Map<string, number>();
  group.forEach((article) => {
    article.tickers.forEach((ticker) => {
      counts.set(ticker, (counts.get(ticker) ?? 0) + 1);
    });
  });

  let winner: string | undefined;
  let best = 0;
  counts.forEach((count, ticker) => {
    if (count > best) {
      winner = ticker;
      best = count;
    }
  });

  return winner;
}

function toClusterId(primaryTicker: string | undefined, sampleHeadline: string, index: number): string {
  const prefix = primaryTicker?.toLowerCase() ?? 'story';
  const slug = normalizeHeadline(sampleHeadline).split(' ').slice(0, 4).join('-');
  return `cluster-${prefix}-${slug || index + 1}`;
}

export function clusterStories(articles: SourceArticle[], nowIso: string): StoryCluster[] {
  const groups = new Map<string, SourceArticle[]>();

  articles.forEach((article) => {
    const key = dedupeKey(article);
    const current = groups.get(key);
    if (current) {
      current.push(article);
      return;
    }

    groups.set(key, [article]);
  });

  return [...groups.values()].map((group, index) => {
    const sorted = [...group].sort((left, right) => (right.credibilityScore ?? 0) - (left.credibilityScore ?? 0));
    const canonical = sorted[0];
    const latestUpdate = group
      .map((article) => article.publishedAt)
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
    const primaryTicker = findPrimaryTicker(group);
    const status = determineStatus(group, latestUpdate ?? nowIso, nowIso);

    const cluster: StoryCluster = {
      id: toClusterId(primaryTicker, canonical?.headline ?? 'story', index),
      title: canonical?.headline ?? `Story Cluster ${index + 1}`,
      summary: canonical?.summary ?? 'No summary available.',
      status,
      topicTags: deriveTopicTags(`${canonical?.headline ?? ''} ${canonical?.summary ?? ''}`),
      articles: sorted,
      lastUpdatedAt: latestUpdate ?? nowIso,
      dedupeCount: Math.max(group.length - 1, 0)
    };

    if (primaryTicker) {
      cluster.primaryTicker = primaryTicker;
    }
    if (status === 'conflicting') {
      cluster.conflictNote = 'Sentiment conflict detected across similarly credible sources.';
    }

    return cluster;
  });
}
