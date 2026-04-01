import type { MassiveProvider, NewsProvider, ProviderError, RawNewsArticle, RawTickerQuote } from '../providers/types.js';

export type IngestionInputs = {
  newsProvider: NewsProvider;
  massiveProvider: MassiveProvider;
  newsQuery: string;
  newsPageSize: number;
  symbols: string[];
};

export type IngestionResult = {
  articles: RawNewsArticle[];
  snapshots: RawTickerQuote[];
  errors: ProviderError[];
};

export async function ingestSignals(inputs: IngestionInputs): Promise<IngestionResult> {
  const [newsResult, tickerResult] = await Promise.allSettled([
    inputs.newsProvider.fetchArticles({ query: inputs.newsQuery, pageSize: inputs.newsPageSize }),
    inputs.massiveProvider.fetchSnapshots({ symbols: inputs.symbols })
  ]);

  const errors: ProviderError[] = [];

  const articles =
    newsResult.status === 'fulfilled'
      ? newsResult.value
      : (errors.push({ provider: 'newsapi', message: extractErrorMessage(newsResult.reason) }), []);

  const snapshots =
    tickerResult.status === 'fulfilled'
      ? tickerResult.value
      : (errors.push({ provider: 'massive', message: extractErrorMessage(tickerResult.reason) }), []);

  return {
    articles,
    snapshots,
    errors
  };
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown provider error';
}
