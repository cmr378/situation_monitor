export type ProviderError = {
  provider: 'newsapi' | 'massive';
  message: string;
};

export type RawNewsArticle = {
  id?: string;
  sourceName?: string;
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  content?: string;
  tickers?: string[];
};

export type RawTickerQuote = {
  symbol: string;
  asOf?: string;
  price?: number;
  changePercent24h?: number;
  volume?: number;
  marketCap?: number;
  notes?: string;
  providerStatus?: 'live' | 'delayed' | 'partial' | 'unavailable';
};

export interface NewsProvider {
  fetchArticles(args: { query: string; pageSize: number }): Promise<RawNewsArticle[]>;
}

export interface MassiveProvider {
  fetchSnapshots(args: { symbols: string[] }): Promise<RawTickerQuote[]>;
}

export type LlmBriefingDraft = {
  headline: string;
  summary: string;
  bullets: string[];
  confidence?: number;
};

export interface LlmProvider {
  generateBriefing(args: {
    contextJson: string;
    model: string;
    timeoutMs: number;
  }): Promise<LlmBriefingDraft>;
}
