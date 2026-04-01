import assert from 'node:assert/strict';
import test from 'node:test';

import type { Alert, StoryCluster, TickerSnapshot } from '@situation-monitor/shared-types';

import { generateBriefing } from './index.js';

const clusters: StoryCluster[] = [
  {
    id: 'cluster-ai',
    title: 'AI demand remains elevated',
    summary: 'Semiconductor spending guidance remains strong.',
    status: 'active',
    topicTags: ['ai'],
    articles: [],
    primaryTicker: 'NVDA',
    lastUpdatedAt: '2026-03-31T12:55:00.000Z',
    relevanceScore: 0.91,
    dedupeCount: 0
  }
];

const alerts: Alert[] = [
  {
    id: 'alert-1',
    level: 'warning',
    title: 'Policy conflict',
    message: 'Conflicting policy commentary from two major outlets.',
    category: 'news',
    createdAt: '2026-03-31T12:58:00.000Z',
    isStale: false,
    acknowledged: false,
    triggerCode: 'story_conflict',
    expiresAt: '2026-03-31T16:58:00.000Z'
  }
];

const snapshots: TickerSnapshot[] = [
  {
    symbol: 'NVDA',
    asOf: '2026-03-31T12:59:00.000Z',
    status: 'live',
    changePercent24h: 2.1,
    provider: 'massive'
  }
];

test('generateBriefing returns template-ready briefing without llm provider', async () => {
  const briefing = await generateBriefing({
    clusters,
    alerts,
    snapshots,
    generatedAt: '2026-03-31T13:00:00.000Z',
    llmModel: 'gpt-4.1-mini',
    llmTimeoutMs: 5000
  });

  assert.equal(briefing.status, 'ready');
  assert.equal(briefing.generator, 'template');
  assert.ok(briefing.bullets.length >= 1);
});

test('generateBriefing uses llm response when valid JSON schema is returned', async () => {
  const briefing = await generateBriefing({
    clusters,
    alerts,
    snapshots,
    generatedAt: '2026-03-31T13:00:00.000Z',
    llmModel: 'gpt-4.1-mini',
    llmTimeoutMs: 5000,
    llmProvider: {
      async generateBriefing() {
        return {
          headline: 'LLM headline',
          summary: 'LLM summary',
          bullets: ['B1', 'B2'],
          confidence: 0.81
        };
      }
    }
  });

  assert.equal(briefing.status, 'ready');
  assert.equal(briefing.generator, 'llm');
  assert.equal(briefing.headline, 'LLM headline');
});

test('generateBriefing falls back on llm failure with failed status', async () => {
  const briefing = await generateBriefing({
    clusters,
    alerts,
    snapshots,
    generatedAt: '2026-03-31T13:00:00.000Z',
    llmModel: 'gpt-4.1-mini',
    llmTimeoutMs: 5000,
    llmProvider: {
      async generateBriefing() {
        throw new Error('schema mismatch');
      }
    }
  });

  assert.equal(briefing.status, 'failed');
  assert.equal(briefing.generator, 'template');
  assert.match(briefing.failureReason ?? '', /llm_generation_failed/);
});
