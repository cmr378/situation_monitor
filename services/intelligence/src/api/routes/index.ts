import {
  alertsScenarios,
  briefingScenarios,
  storiesScenarios,
  tickersScenarios
} from '@situation-monitor/mock-data';
import type {
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse
} from '@situation-monitor/shared-types';
import type { FastifyInstance } from 'fastify';

import {
  assertAlertsResponse,
  assertBriefingResponse,
  assertStoriesResponse,
  assertTickersResponse
} from '../validation.js';

type QueryWithScenario = { scenario?: string };

function selectBriefing(scenario?: string): GetBriefingResponse {
  switch (scenario) {
    case 'failed':
      return briefingScenarios.failed;
    case 'unavailable':
      return briefingScenarios.unavailable;
    default:
      return briefingScenarios.ready;
  }
}

function selectStories(scenario?: string): GetStoriesResponse {
  switch (scenario) {
    case 'empty':
      return storiesScenarios.empty;
    case 'duplicateSource':
      return storiesScenarios.duplicateSource;
    case 'conflicting':
      return storiesScenarios.conflicting;
    case 'stale':
      return storiesScenarios.stale;
    default:
      return storiesScenarios.default;
  }
}

function selectTickers(scenario?: string): GetTickersResponse {
  switch (scenario) {
    case 'missingFields':
      return tickersScenarios.missingFields;
    case 'partial':
      return tickersScenarios.partial;
    default:
      return tickersScenarios.default;
  }
}

function selectAlerts(scenario?: string): GetAlertsResponse {
  switch (scenario) {
    case 'empty':
      return alertsScenarios.empty;
    case 'stale':
      return alertsScenarios.stale;
    default:
      return alertsScenarios.default;
  }
}

export function registerRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: QueryWithScenario }>('/briefing', async (request) => {
    const payload = selectBriefing(request.query.scenario);
    assertBriefingResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/stories', async (request) => {
    const payload = selectStories(request.query.scenario);
    assertStoriesResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/tickers', async (request) => {
    const payload = selectTickers(request.query.scenario);
    assertTickersResponse(payload);
    return payload;
  });

  app.get<{ Querystring: QueryWithScenario }>('/alerts', async (request) => {
    const payload = selectAlerts(request.query.scenario);
    assertAlertsResponse(payload);
    return payload;
  });
}
