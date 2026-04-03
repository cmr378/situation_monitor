import {
  alertsScenarios,
  briefingScenarios,
  endpointUnavailableFallback,
  storiesScenarios,
  tickersScenarios
} from '@situation-monitor/mock-data';
import type {
  GetAlertsResponse,
  GetBriefingResponse,
  GetStoriesResponse,
  GetTickersResponse
} from '@situation-monitor/shared-types';
import { useEffect, useMemo, useState } from 'react';

import { createIntelligenceClient } from './intelligence-client.js';

type DashboardResponse = GetBriefingResponse | GetStoriesResponse | GetTickersResponse | GetAlertsResponse;

type PanelState<T extends DashboardResponse> = {
  response: T;
  status: {
    label: string;
    detail: string;
    isFallback: boolean;
  };
};

export type DashboardDataState = {
  alerts: PanelState<GetAlertsResponse>;
  baseUrl: string;
  briefing: PanelState<GetBriefingResponse>;
  fallbackCount: number;
  generatedAt: string;
  isRefreshing: boolean;
  overallSourceLabel: string;
  refreshLabel: string;
  stories: PanelState<GetStoriesResponse>;
  tickers: PanelState<GetTickersResponse>;
};

const REFRESH_INTERVAL_MS = 30_000;
const SERVICE_SUCCESS_DETAIL = 'Loaded from intelligence service.';
const WAITING_DETAIL = 'Waiting for the first service response.';

function getGeneratedAt(response: DashboardResponse): string | undefined {
  return response.meta?.generatedAt;
}

function getServiceLabel(response: DashboardResponse): string {
  return response.meta?.source === 'live' ? 'Live service' : 'Mock service';
}

function buildFallbackState<T extends DashboardResponse>(response: T, detail: string): PanelState<T> {
  return {
    response,
    status: {
      label: 'Mock fallback',
      detail,
      isFallback: true
    }
  };
}

function buildServiceState<T extends DashboardResponse>(response: T): PanelState<T> {
  return {
    response,
    status: {
      label: getServiceLabel(response),
      detail: SERVICE_SUCCESS_DETAIL,
      isFallback: false
    }
  };
}

function toErrorDetail(path: string, error: unknown): string {
  const message = error instanceof Error ? error.message : endpointUnavailableFallback.data.message;
  return `${path} unavailable. ${message}`;
}

function resolvePanelState<T extends DashboardResponse>(
  result: PromiseSettledResult<T>,
  fallbackResponse: T,
  path: string
): PanelState<T> {
  if (result.status === 'fulfilled') {
    return buildServiceState(result.value);
  }

  return buildFallbackState(fallbackResponse, toErrorDetail(path, result.reason));
}

function getOverallSourceLabel(panels: Array<PanelState<DashboardResponse>>): string {
  const fallbackCount = panels.filter((panel) => panel.status.isFallback).length;

  if (fallbackCount === panels.length) {
    return 'Mock fallback';
  }

  const serviceLabels = new Set(panels.filter((panel) => !panel.status.isFallback).map((panel) => panel.status.label));

  if (fallbackCount > 0 || serviceLabels.size > 1) {
    return 'Mixed';
  }

  return serviceLabels.values().next().value ?? 'Mock fallback';
}

function buildDashboardState(
  baseUrl: string,
  panels: {
    alerts: PanelState<GetAlertsResponse>;
    briefing: PanelState<GetBriefingResponse>;
    stories: PanelState<GetStoriesResponse>;
    tickers: PanelState<GetTickersResponse>;
  },
  isRefreshing: boolean
): DashboardDataState {
  const orderedPanels: Array<PanelState<DashboardResponse>> = [panels.briefing, panels.stories, panels.tickers, panels.alerts];
  const generatedAt =
    orderedPanels.map((panel) => getGeneratedAt(panel.response)).find((value) => typeof value === 'string') ?? 'n/a';

  return {
    ...panels,
    baseUrl,
    fallbackCount: orderedPanels.filter((panel) => panel.status.isFallback).length,
    generatedAt,
    isRefreshing,
    overallSourceLabel: getOverallSourceLabel(orderedPanels),
    refreshLabel: isRefreshing ? 'Refresh: syncing' : `Refresh: ${REFRESH_INTERVAL_MS / 1000}s`
  };
}

function buildInitialState(baseUrl: string): DashboardDataState {
  return buildDashboardState(
    baseUrl,
    {
      alerts: buildFallbackState(alertsScenarios.default, WAITING_DETAIL),
      briefing: buildFallbackState(briefingScenarios.ready, WAITING_DETAIL),
      stories: buildFallbackState(storiesScenarios.default, WAITING_DETAIL),
      tickers: buildFallbackState(tickersScenarios.default, WAITING_DETAIL)
    },
    true
  );
}

export function useDashboardData(): DashboardDataState {
  const client = useMemo(() => createIntelligenceClient(), []);
  const [state, setState] = useState<DashboardDataState>(() => buildInitialState(client.baseUrl));

  useEffect(() => {
    let isActive = true;
    let isRefreshing = false;

    async function refreshData() {
      if (isRefreshing) {
        return;
      }

      isRefreshing = true;
      setState((previous) => ({
        ...previous,
        isRefreshing: true,
        refreshLabel: 'Refresh: syncing'
      }));

      const [briefing, stories, tickers, alerts] = await Promise.allSettled([
        client.getBriefing(),
        client.getStories(),
        client.getTickers(),
        client.getAlerts()
      ]);

      if (!isActive) {
        return;
      }

      setState(
        buildDashboardState(
          client.baseUrl,
          {
            alerts: resolvePanelState(alerts, alertsScenarios.default, '/alerts'),
            briefing: resolvePanelState(briefing, briefingScenarios.ready, '/briefing'),
            stories: resolvePanelState(stories, storiesScenarios.default, '/stories'),
            tickers: resolvePanelState(tickers, tickersScenarios.default, '/tickers')
          },
          false
        )
      );

      isRefreshing = false;
    }

    void refreshData();
    const intervalId = window.setInterval(() => {
      void refreshData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [client]);

  return state;
}
