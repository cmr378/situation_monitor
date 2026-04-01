import type { IntelligenceConfig } from '../config.js';
import { OpenAiCompatibleLlmProvider } from './llm.js';
import { MassiveHttpProvider } from './massive.js';
import { NewsApiHttpProvider } from './newsapi.js';
import type { LlmProvider, MassiveProvider, NewsProvider } from './types.js';

class EmptyNewsProvider implements NewsProvider {
  async fetchArticles(_: { query: string; pageSize: number }): Promise<[]> {
    return [];
  }
}

class EmptyMassiveProvider implements MassiveProvider {
  async fetchSnapshots(args: { symbols: string[] }) {
    return args.symbols.map((symbol) => ({
      symbol,
      providerStatus: 'unavailable' as const,
      notes: 'Massive API key missing in live mode.',
      asOf: new Date().toISOString()
    }));
  }
}

export type ProviderBundle = {
  newsProvider: NewsProvider;
  massiveProvider: MassiveProvider;
  llmProvider?: LlmProvider;
};

export function createProviderBundle(config: IntelligenceConfig): ProviderBundle {
  const newsProvider =
    config.newsApi.apiKey === undefined
      ? new EmptyNewsProvider()
      : new NewsApiHttpProvider(config.newsApi.baseUrl, config.newsApi.apiKey, config.providerTimeoutMs);

  const massiveProvider =
    config.massive.apiKey === undefined
      ? new EmptyMassiveProvider()
      : new MassiveHttpProvider(config.massive.baseUrl, config.massive.apiKey, config.providerTimeoutMs);

  const llmProvider =
    config.llm.apiKey === undefined ? undefined : new OpenAiCompatibleLlmProvider(config.llm.baseUrl, config.llm.apiKey);

  const bundle: ProviderBundle = {
    newsProvider,
    massiveProvider
  };

  if (llmProvider) {
    bundle.llmProvider = llmProvider;
  }

  return bundle;
}
