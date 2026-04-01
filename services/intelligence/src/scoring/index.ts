import type { Alert, StoryCluster, TickerSnapshot, WatchlistItem } from '@situation-monitor/shared-types';

const ALERT_STALE_WINDOW_MS = 4 * 60 * 60 * 1000;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function watchlistPriority(symbol: string | undefined, watchlistBySymbol: Map<string, WatchlistItem>): number {
  if (!symbol) {
    return 0;
  }

  const item = watchlistBySymbol.get(symbol.toUpperCase());
  if (!item) {
    return 0;
  }

  if (item.priority === 'high') {
    return 1;
  }
  if (item.priority === 'medium') {
    return 0.5;
  }
  return 0.25;
}

export function scoreClusters(
  clusters: StoryCluster[],
  watchlist: WatchlistItem[],
  nowIso: string
): StoryCluster[] {
  const watchlistBySymbol = new Map(watchlist.map((item) => [item.symbol.toUpperCase(), item]));
  const nowMs = Date.parse(nowIso);

  return [...clusters]
    .map((cluster) => {
      const lastUpdatedMs = Date.parse(cluster.lastUpdatedAt);
      const ageHours = Number.isNaN(lastUpdatedMs) ? 24 : Math.max(0, (nowMs - lastUpdatedMs) / 3_600_000);
      const recencyScore = clamp(1 - ageHours / 24);
      const credibility =
        cluster.articles.length === 0
          ? 0.4
          : cluster.articles.reduce((sum, article) => sum + (article.credibilityScore ?? 0.5), 0) /
            cluster.articles.length;
      const priorityBoost = watchlistPriority(cluster.primaryTicker, watchlistBySymbol);
      const conflictBoost = cluster.status === 'conflicting' ? 0.15 : 0;
      const dedupeBoost = Math.min((cluster.dedupeCount ?? 0) * 0.05, 0.2);

      const relevanceScore = clamp(recencyScore * 0.4 + credibility * 0.3 + priorityBoost * 0.2 + conflictBoost + dedupeBoost);

      return {
        ...cluster,
        relevanceScore: Number(relevanceScore.toFixed(3))
      };
    })
    .sort((left, right) => (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0));
}

function alertPriority(level: Alert['level']): number {
  if (level === 'critical') {
    return 3;
  }
  if (level === 'warning') {
    return 2;
  }
  return 1;
}

function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * 60 * 60 * 1000).toISOString();
}

export function buildAlerts(args: {
  clusters: StoryCluster[];
  snapshots: TickerSnapshot[];
  watchlist: WatchlistItem[];
  providerMessages: string[];
  nowIso: string;
}): Alert[] {
  const watchlistBySymbol = new Map(args.watchlist.map((item) => [item.symbol.toUpperCase(), item]));
  const alerts: Alert[] = [];

  args.clusters.forEach((cluster) => {
    if (cluster.status === 'conflicting') {
      const conflictAlert: Alert = {
        id: `alert-story-conflict-${cluster.id}`,
        level: 'warning',
        title: `Narrative conflict: ${cluster.title}`,
        message: cluster.conflictNote ?? 'Conflicting sources detected in the same cluster.',
        category: 'news',
        createdAt: args.nowIso,
        isStale: false,
        acknowledged: false,
        triggerCode: 'story_conflict',
        expiresAt: addHours(args.nowIso, 4)
      };
      if (cluster.primaryTicker) {
        conflictAlert.relatedSymbol = cluster.primaryTicker;
      }
      alerts.push(conflictAlert);
    }

    if (cluster.status === 'stale') {
      const staleAlert: Alert = {
        id: `alert-data-stale-${cluster.id}`,
        level: 'info',
        title: `Stale story cluster: ${cluster.title}`,
        message: 'This cluster has not been refreshed within the stale threshold.',
        category: 'system',
        createdAt: args.nowIso,
        isStale: false,
        acknowledged: false,
        triggerCode: 'data_stale',
        expiresAt: addHours(args.nowIso, 4)
      };
      if (cluster.primaryTicker) {
        staleAlert.relatedSymbol = cluster.primaryTicker;
      }
      alerts.push(staleAlert);
    }
  });

  args.snapshots.forEach((snapshot) => {
    const magnitude = Math.abs(snapshot.changePercent24h ?? 0);
    if (magnitude < 3) {
      return;
    }

    const watchlistItem = watchlistBySymbol.get(snapshot.symbol.toUpperCase());
    const isHighPriority = watchlistItem?.priority === 'high';
    const level: Alert['level'] = magnitude >= 5 && isHighPriority ? 'critical' : 'warning';

    alerts.push({
      id: `alert-price-move-${snapshot.symbol.toLowerCase()}`,
      level,
      title: `${snapshot.symbol} moved ${magnitude.toFixed(2)}%`,
      message: `${snapshot.symbol} shows a ${magnitude.toFixed(2)}% 24h move from Massive snapshot data.`,
      category: 'market',
      createdAt: args.nowIso,
      isStale: false,
      acknowledged: false,
      relatedSymbol: snapshot.symbol,
      triggerCode: 'price_move',
      expiresAt: addHours(args.nowIso, 4)
    });
  });

  args.providerMessages.forEach((message, index) => {
    alerts.push({
      id: `alert-provider-${index + 1}`,
      level: 'warning',
      title: 'Provider degradation detected',
      message,
      category: 'system',
      createdAt: args.nowIso,
      isStale: false,
      acknowledged: false,
      triggerCode: 'data_stale',
      expiresAt: addHours(args.nowIso, 4)
    });
  });

  const staleCutoff = Date.parse(args.nowIso) - ALERT_STALE_WINDOW_MS;

  return alerts
    .map((alert) => ({
      ...alert,
      isStale: Date.parse(alert.createdAt) < staleCutoff
    }))
    .sort((left, right) => {
      const levelDelta = alertPriority(right.level) - alertPriority(left.level);
      if (levelDelta !== 0) {
        return levelDelta;
      }
      return Date.parse(right.createdAt) - Date.parse(left.createdAt);
    });
}
