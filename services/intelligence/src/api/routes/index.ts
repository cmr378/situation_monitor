import type { FastifyInstance } from 'fastify';

import { IntelligenceEngine } from '../../intelligence-engine.js';
import {
  assertAlertsResponse,
  assertBriefingResponse,
  assertStoriesResponse,
  assertTickersResponse
} from '../validation.js';

type QueryWithScenario = { scenario?: string };

export function registerRoutes(app: FastifyInstance): void {
  const intelligenceEngine = new IntelligenceEngine();

  app.get<{ Querystring: QueryWithScenario }>('/briefing', async (request) => {
    const payload = await intelligenceEngine.getBriefingResponse(request.query.scenario);
    assertBriefingResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/stories', async (request) => {
    const payload = await intelligenceEngine.getStoriesResponse(request.query.scenario);
    assertStoriesResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/tickers', async (request) => {
    const payload = await intelligenceEngine.getTickersResponse(request.query.scenario);
    assertTickersResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/alerts', async (request) => {
    const payload = await intelligenceEngine.getAlertsResponse(request.query.scenario);
    assertAlertsResponse(payload);
    return payload;
  });
}
