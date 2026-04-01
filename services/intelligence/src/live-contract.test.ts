import assert from 'node:assert/strict';
import test from 'node:test';

import type { IntelligenceConfig } from './config.js';
import { assertAlertsResponse, assertBriefingResponse, assertStoriesResponse, assertTickersResponse } from './api/validation.js';
import { IntelligenceEngine } from './intelligence-engine.js';

const liveConfig: IntelligenceConfig = {
  mode: 'live',
  cacheTtlMs: 30_000,
  providerTimeoutMs: 2_000,
  fixedNowIso: '2026-03-31T13:00:00.000Z',
  newsQuery: 'ai macro markets',
  newsPageSize: 20,
  watchlistSymbols: ['NVDA', 'SPY'],
  newsApi: {
    baseUrl: 'https://newsapi.org',
    apiKey: 'test-key'
  },
  massive: {
    baseUrl: 'https://api.massive.com',
    apiKey: 'test-key'
  },
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    apiKey: 'test-key',
    timeoutMs: 5_000
  }
};

test('live mode returns contract-valid responses with mocked providers', async () => {
  const engine = new IntelligenceEngine(liveConfig, {
    newsProvider: {
      async fetchArticles() {
        return [
          {
            id: 'n1',
            sourceName: 'MacroDesk',
            title: 'NVDA rises on AI demand narrative',
            description: 'AI capex commentary remains constructive.',
            url: 'https://example.com/n1',
            publishedAt: '2026-03-31T12:30:00.000Z',
            tickers: ['NVDA']
          },
          {
            id: 'n2',
            sourceName: 'MacroDesk',
            title: 'Fed timeline remains contested',
            description: 'Conflicting takes emerge on policy timing.',
            url: 'https://example.com/n2',
            publishedAt: '2026-03-31T12:15:00.000Z',
            tickers: ['SPY']
          }
        ];
      }
    },
    massiveProvider: {
      async fetchSnapshots() {
        return [
          {
            symbol: 'NVDA',
            asOf: '2026-03-31T12:59:00.000Z',
            price: 1001.2,
            changePercent24h: 5.2,
            volume: 28_000_000,
            marketCap: 2_300_000_000_000,
            providerStatus: 'live'
          },
          {
            symbol: 'SPY',
            asOf: '2026-03-31T12:58:00.000Z',
            changePercent24h: 1.2,
            providerStatus: 'partial'
          }
        ];
      }
    },
    llmProvider: {
      async generateBriefing() {
        return {
          headline: 'LLM generated briefing headline',
          summary: 'LLM generated summary from mocked providers.',
          bullets: ['Bullet one', 'Bullet two'],
          confidence: 0.79
        };
      }
    }
  });

  const [stories, tickers, alerts, briefing] = await Promise.all([
    engine.getStoriesResponse(),
    engine.getTickersResponse(),
    engine.getAlertsResponse(),
    engine.getBriefingResponse()
  ]);

  assertStoriesResponse(stories);
  assertTickersResponse(tickers);
  assertAlertsResponse(alerts);
  assertBriefingResponse(briefing);

  assert.equal(stories.meta?.source, 'live');
  assert.equal(tickers.meta?.source, 'live');
  assert.equal(alerts.meta?.source, 'live');
  assert.equal(briefing.meta?.source, 'live');
  assert.ok(tickers.data.snapshots.some((snapshot) => snapshot.provider === 'massive'));
});
