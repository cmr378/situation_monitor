import type {
  Alert,
  ApiResponse,
  Briefing,
  StoryCluster,
  TickerSnapshot,
  WatchlistItem
} from './contracts.js';

export type BriefingPayload = Briefing;
export type StoriesPayload = { clusters: StoryCluster[] };
export type TickersPayload = { snapshots: TickerSnapshot[]; watchlist: WatchlistItem[] };
export type AlertsPayload = { alerts: Alert[] };

export type GetBriefingResponse = ApiResponse<BriefingPayload>;
export type GetStoriesResponse = ApiResponse<StoriesPayload>;
export type GetTickersResponse = ApiResponse<TickersPayload>;
export type GetAlertsResponse = ApiResponse<AlertsPayload>;
