import type {
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse
} from '@situation-monitor/shared-types';

const DEFAULT_INTELLIGENCE_BASE_URL = 'http://127.0.0.1:4000';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

export function getIntelligenceBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_INTELLIGENCE_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  return DEFAULT_INTELLIGENCE_BASE_URL;
}

async function requestJson<T>(baseUrl: string, path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function createIntelligenceClient(baseUrl = getIntelligenceBaseUrl()) {
  return {
    baseUrl,
    getBriefing(): Promise<GetBriefingResponse> {
      return requestJson<GetBriefingResponse>(baseUrl, '/briefing');
    },
    getStories(): Promise<GetStoriesResponse> {
      return requestJson<GetStoriesResponse>(baseUrl, '/stories');
    },
    getTickers(): Promise<GetTickersResponse> {
      return requestJson<GetTickersResponse>(baseUrl, '/tickers');
    },
    getAlerts(): Promise<GetAlertsResponse> {
      return requestJson<GetAlertsResponse>(baseUrl, '/alerts');
    }
  };
}
