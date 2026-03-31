# API Contract (Mirrors `packages/shared-types`)

`packages/shared-types` is the canonical source of truth for runtime-facing contracts.
This document mirrors and explains those TypeScript definitions. If contract code changes, this document must be updated in the same PR.

## Standard Response Envelope

```ts
ApiResponse<T> = {
  data: T;
  meta?: {
    generatedAt: string;
    source: 'mock' | 'live';
  };
}
```

## Domain Objects

### `SourceArticle`
- `id: string`
- `headline: string`
- `sourceName: string`
- `sourceType: 'wire' | 'news' | 'blog' | 'social' | 'filing'`
- `url: string`
- `publishedAt: string` (ISO-8601)
- `summary?: string`
- `tickers: string[]`
- `sentiment?: 'positive' | 'neutral' | 'negative'`
- `credibilityScore?: number`

### `StoryCluster`
- `id: string`
- `title: string`
- `summary: string`
- `status: 'active' | 'stale' | 'conflicting'`
- `topicTags: string[]`
- `articles: SourceArticle[]`
- `primaryTicker?: string`
- `conflictNote?: string`
- `lastUpdatedAt: string`

### `TickerSnapshot`
- `symbol: string`
- `asOf: string`
- `status: 'live' | 'delayed' | 'partial' | 'unavailable'`
- `price?: number`
- `changePercent24h?: number`
- `volume?: number`
- `marketCap?: number`
- `currency?: string`
- `notes?: string`

### `Briefing`
- `id: string`
- `generatedAt: string`
- `status: 'ready' | 'unavailable' | 'failed'`
- `headline: string`
- `summary: string`
- `bullets: string[]`
- `relatedClusterIds: string[]`
- `model: string`
- `failureReason?: string`
- `fallbackMessage?: string`

### `WatchlistItem`
- `symbol: string`
- `name: string`
- `priority: 'high' | 'medium' | 'low'`
- `thesis?: string`
- `alertThreshold?: number`
- `lastReviewedAt?: string`

### `Alert`
- `id: string`
- `level: 'info' | 'warning' | 'critical'`
- `title: string`
- `message: string`
- `category: 'news' | 'market' | 'system'`
- `createdAt: string`
- `isStale: boolean`
- `acknowledged: boolean`
- `relatedSymbol?: string`

### `EndpointUnavailable` (mock fallback helper)
- `reason: 'endpoint_unavailable'`
- `message: string`
- `retryAfterSeconds?: number`

## Endpoint Shapes (Frozen for M0)

### `GET /briefing`
Type: `ApiResponse<Briefing>`

```json
{
  "data": {
    "id": "briefing-2026-03-31-am",
    "generatedAt": "2026-03-31T13:00:00.000Z",
    "status": "ready",
    "headline": "AI infrastructure and macro catalysts lead the morning setup",
    "summary": "Markets are balancing AI capex optimism against rate-cut uncertainty.",
    "bullets": [
      "Semiconductor guidance remains the primary risk-on signal",
      "Conflicting policy headlines are increasing intraday volatility"
    ],
    "relatedClusterIds": ["cluster-ai-capex", "cluster-fed-tone"],
    "model": "mock-briefing-v1"
  },
  "meta": {
    "generatedAt": "2026-03-31T13:00:00.000Z",
    "source": "mock"
  }
}
```

### `GET /stories`
Type: `ApiResponse<{ clusters: StoryCluster[] }>`

```json
{
  "data": {
    "clusters": [
      {
        "id": "cluster-ai-capex",
        "title": "AI infrastructure spending remains elevated",
        "summary": "Multiple sources report continued AI datacenter capex demand.",
        "status": "active",
        "topicTags": ["ai", "semiconductors"],
        "articles": [],
        "primaryTicker": "NVDA",
        "lastUpdatedAt": "2026-03-31T12:45:00.000Z"
      }
    ]
  },
  "meta": {
    "generatedAt": "2026-03-31T13:00:00.000Z",
    "source": "mock"
  }
}
```

### `GET /tickers`
Type: `ApiResponse<{ snapshots: TickerSnapshot[]; watchlist: WatchlistItem[] }>`

```json
{
  "data": {
    "snapshots": [
      {
        "symbol": "NVDA",
        "asOf": "2026-03-31T12:59:00.000Z",
        "status": "live",
        "price": 1012.5,
        "changePercent24h": 2.3,
        "volume": 38100211,
        "marketCap": 2480000000000,
        "currency": "USD"
      }
    ],
    "watchlist": [
      {
        "symbol": "NVDA",
        "name": "NVIDIA",
        "priority": "high",
        "thesis": "AI demand proxy"
      }
    ]
  },
  "meta": {
    "generatedAt": "2026-03-31T13:00:00.000Z",
    "source": "mock"
  }
}
```

### `GET /alerts`
Type: `ApiResponse<{ alerts: Alert[] }>`

```json
{
  "data": {
    "alerts": [
      {
        "id": "alert-fed-vol",
        "level": "warning",
        "title": "Policy headline conflict",
        "message": "Two major outlets disagree on policy timing; volatility risk elevated.",
        "category": "news",
        "createdAt": "2026-03-31T12:58:00.000Z",
        "isStale": false,
        "acknowledged": false
      }
    ]
  },
  "meta": {
    "generatedAt": "2026-03-31T13:00:00.000Z",
    "source": "mock"
  }
}
```
