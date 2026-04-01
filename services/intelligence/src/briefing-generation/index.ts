import type { Alert, Briefing, StoryCluster, TickerSnapshot } from '@situation-monitor/shared-types';

import type { LlmProvider } from '../providers/types.js';

export type BriefingGenerationInputs = {
  clusters: StoryCluster[];
  alerts: Alert[];
  snapshots: TickerSnapshot[];
  generatedAt: string;
  llmProvider?: LlmProvider;
  llmModel: string;
  llmTimeoutMs: number;
};

function selectTopItems<T>(items: T[], count: number): T[] {
  return items.slice(0, count);
}

function buildTemplateBriefing(inputs: BriefingGenerationInputs): Briefing {
  const topClusters = selectTopItems(inputs.clusters, 2);
  const topAlerts = selectTopItems(inputs.alerts, 1);
  const topSnapshots = selectTopItems(inputs.snapshots, 2);

  if (topClusters.length === 0 && topAlerts.length === 0) {
    return {
      id: `briefing-${inputs.generatedAt}`,
      generatedAt: inputs.generatedAt,
      status: 'unavailable',
      headline: 'Briefing temporarily unavailable',
      summary: 'Not enough validated market/news inputs to generate a briefing.',
      bullets: [],
      relatedClusterIds: [],
      model: 'template-briefing-v1',
      generator: 'template',
      promptVersion: 'v1-template',
      fallbackMessage: 'Provider data is unavailable. Retry shortly.'
    };
  }

  const clusterBullet = topClusters[0]
    ? `${topClusters[0].title} (${topClusters[0].status}) remains the top story cluster.`
    : 'No high-confidence story clusters are currently available.';
  const alertBullet = topAlerts[0]
    ? `Highest-severity alert: ${topAlerts[0].title} [${topAlerts[0].level}].`
    : 'No active alerts were generated in this cycle.';
  const tickerBullet = topSnapshots[0]
    ? `${topSnapshots[0].symbol} status=${topSnapshots[0].status} change=${topSnapshots[0].changePercent24h ?? 'n/a'}%.`
    : 'Ticker snapshots are currently unavailable.';

  return {
    id: `briefing-${inputs.generatedAt}`,
    generatedAt: inputs.generatedAt,
    status: 'ready',
    headline: 'Market, AI, and macro signals summary',
    summary: 'Template briefing generated from normalized stories, ticker snapshots, and alert output.',
    bullets: [clusterBullet, alertBullet, tickerBullet],
    relatedClusterIds: topClusters.map((cluster) => cluster.id),
    model: 'template-briefing-v1',
    generator: 'template',
    confidence: 0.72,
    promptVersion: 'v1-template'
  };
}

export async function generateBriefing(inputs: BriefingGenerationInputs): Promise<Briefing> {
  const templateBriefing = buildTemplateBriefing(inputs);

  if (!inputs.llmProvider) {
    return templateBriefing;
  }

  const contextJson = JSON.stringify({
    generatedAt: inputs.generatedAt,
    clusters: selectTopItems(inputs.clusters, 3).map((cluster) => ({
      id: cluster.id,
      title: cluster.title,
      status: cluster.status,
      relevanceScore: cluster.relevanceScore,
      summary: cluster.summary
    })),
    alerts: selectTopItems(inputs.alerts, 3).map((alert) => ({
      title: alert.title,
      level: alert.level,
      category: alert.category,
      message: alert.message
    })),
    snapshots: selectTopItems(inputs.snapshots, 4).map((snapshot) => ({
      symbol: snapshot.symbol,
      status: snapshot.status,
      changePercent24h: snapshot.changePercent24h
    }))
  });

  try {
    const llmDraft = await inputs.llmProvider.generateBriefing({
      contextJson,
      model: inputs.llmModel,
      timeoutMs: inputs.llmTimeoutMs
    });

    const llmBriefing: Briefing = {
      id: `briefing-${inputs.generatedAt}`,
      generatedAt: inputs.generatedAt,
      status: 'ready',
      headline: llmDraft.headline,
      summary: llmDraft.summary,
      bullets: llmDraft.bullets,
      relatedClusterIds: selectTopItems(inputs.clusters, 2).map((cluster) => cluster.id),
      model: inputs.llmModel,
      generator: 'llm',
      promptVersion: 'v1-llm-json'
    };

    const confidence = llmDraft.confidence ?? templateBriefing.confidence;
    if (confidence !== undefined) {
      llmBriefing.confidence = confidence;
    }

    return llmBriefing;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown_llm_failure';
    return {
      ...templateBriefing,
      status: 'failed',
      model: inputs.llmModel,
      failureReason: `llm_generation_failed:${reason}`,
      fallbackMessage: 'LLM generation failed; deterministic template briefing was returned.',
      generator: 'template',
      promptVersion: 'v1-template'
    };
  }
}
