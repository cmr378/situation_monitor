import assert from 'node:assert/strict';
import test from 'node:test';

import type { SourceArticle, WatchlistItem } from '@situation-monitor/shared-types';

import { clusterStories } from './clustering/index.js';
import { buildAlerts, scoreClusters } from './scoring/index.js';

const nowIso = '2026-03-31T13:00:00.000Z';

function makeArticle(overrides: Partial<SourceArticle>): SourceArticle {
  const article: SourceArticle = {
    id: overrides.id ?? 'article-1',
    headline: overrides.headline ?? 'AI infrastructure demand remains strong',
    sourceName: overrides.sourceName ?? 'MarketWire',
    sourceType: overrides.sourceType ?? 'wire',
    url: overrides.url ?? 'https://example.com/a1',
    publishedAt: overrides.publishedAt ?? '2026-03-31T12:30:00.000Z',
    summary: overrides.summary ?? 'Baseline summary.',
    tickers: overrides.tickers ?? ['NVDA'],
    sentiment: overrides.sentiment ?? 'positive',
    credibilityScore: overrides.credibilityScore ?? 0.8,
    provider: overrides.provider ?? 'newsapi'
  };

  if (overrides.providerArticleId) {
    article.providerArticleId = overrides.providerArticleId;
  }

  return article;
}

test('clusterStories dedupes duplicate headlines within the same window', () => {
  const clusters = clusterStories(
    [
      makeArticle({ id: 'a1' }),
      makeArticle({ id: 'a2', url: 'https://example.com/a2' }),
      makeArticle({
        id: 'a3',
        headline: 'Rate-cut expectations split across analysts',
        tickers: ['SPY'],
        sentiment: 'negative',
        credibilityScore: 0.72
      })
    ],
    nowIso
  );

  assert.equal(clusters.length, 2);
  const dedupedCluster = clusters.find((cluster) => cluster.articles.length === 2);
  assert.ok(dedupedCluster);
  assert.equal(dedupedCluster.dedupeCount, 1);
});

test('scoreClusters orders clusters by deterministic relevance', () => {
  const watchlist: WatchlistItem[] = [
    { symbol: 'NVDA', name: 'NVIDIA', priority: 'high', thesis: 'AI demand' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', priority: 'medium' }
  ];

  const clusters = clusterStories(
    [
      makeArticle({ id: 'high', publishedAt: '2026-03-31T12:58:00.000Z', credibilityScore: 0.92 }),
      makeArticle({
        id: 'low',
        headline: 'Legacy macro note',
        publishedAt: '2026-03-30T03:00:00.000Z',
        tickers: ['SPY'],
        credibilityScore: 0.4
      })
    ],
    nowIso
  );

  const scored = scoreClusters(clusters, watchlist, nowIso);
  assert.ok(scored.length >= 2);
  const topScore = scored[0]?.relevanceScore ?? 0;
  const secondScore = scored[1]?.relevanceScore ?? 0;
  assert.ok(topScore >= secondScore);
});

test('buildAlerts emits conflict and price-move alerts', () => {
  const watchlist: WatchlistItem[] = [{ symbol: 'NVDA', name: 'NVIDIA', priority: 'high' }];
  const clusters = clusterStories(
    [
      makeArticle({
        id: 'pos',
        headline: 'Fed pivot likely this quarter',
        tickers: ['SPY'],
        sentiment: 'positive',
        credibilityScore: 0.82
      }),
      makeArticle({
        id: 'neg',
        headline: 'Fed pivot likely this quarter',
        tickers: ['SPY'],
        sentiment: 'negative',
        credibilityScore: 0.75
      })
    ],
    nowIso
  );

  const scored = scoreClusters(clusters, watchlist, nowIso);
  const alerts = buildAlerts({
    clusters: scored,
    snapshots: [
      {
        symbol: 'NVDA',
        asOf: nowIso,
        status: 'live',
        changePercent24h: 5.5,
        provider: 'massive'
      }
    ],
    watchlist,
    providerMessages: [],
    nowIso
  });

  assert.ok(alerts.some((alert) => alert.triggerCode === 'story_conflict'));
  assert.ok(alerts.some((alert) => alert.triggerCode === 'price_move'));
});
