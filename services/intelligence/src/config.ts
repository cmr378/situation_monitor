export type IntelligenceMode = 'mock' | 'live';

export type IntelligenceConfig = {
  mode: IntelligenceMode;
  cacheTtlMs: number;
  providerTimeoutMs: number;
  fixedNowIso?: string;
  newsQuery: string;
  newsPageSize: number;
  watchlistSymbols: string[];
  newsApi: {
    baseUrl: string;
    apiKey?: string;
  };
  massive: {
    baseUrl: string;
    apiKey?: string;
  };
  llm: {
    baseUrl: string;
    model: string;
    apiKey?: string;
    timeoutMs: number;
  };
};

const DEFAULT_WATCHLIST = ['NVDA', 'MSFT', 'SPY'] as const;

function parseMode(value: string | undefined): IntelligenceMode {
  if (value === 'live') {
    return 'live';
  }

  return 'mock';
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseSymbols(value: string | undefined): string[] {
  if (!value) {
    return [...DEFAULT_WATCHLIST];
  }

  const symbols = value
    .split(',')
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return [...DEFAULT_WATCHLIST];
  }

  return [...new Set(symbols)];
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): IntelligenceConfig {
  const fixedNowIso = env.INTELLIGENCE_FIXED_NOW_ISO;
  const newsApiKey = env.NEWS_API_KEY;
  const massiveApiKey = env.MASSIVE_API_KEY ?? env.POLYGON_API_KEY;
  const llmApiKey = env.LLM_API_KEY ?? env.OPENAI_API_KEY;

  return {
    mode: parseMode(env.INTELLIGENCE_DATA_MODE),
    cacheTtlMs: parseNumber(env.INTELLIGENCE_CACHE_TTL_MS, 30_000),
    providerTimeoutMs: parseNumber(env.INTELLIGENCE_PROVIDER_TIMEOUT_MS, 6_000),
    ...(fixedNowIso ? { fixedNowIso } : {}),
    newsQuery: env.NEWS_API_QUERY ?? '(markets OR macro OR AI) AND (stocks OR inflation OR semiconductor)',
    newsPageSize: parseNumber(env.NEWS_API_PAGE_SIZE, 25),
    watchlistSymbols: parseSymbols(env.WATCHLIST_SYMBOLS),
    newsApi: {
      baseUrl: env.NEWS_API_BASE_URL ?? 'https://newsapi.org',
      ...(newsApiKey ? { apiKey: newsApiKey } : {})
    },
    massive: {
      baseUrl: env.MASSIVE_API_BASE_URL ?? 'https://api.massive.com',
      ...(massiveApiKey ? { apiKey: massiveApiKey } : {})
    },
    llm: {
      baseUrl: env.LLM_BASE_URL ?? 'https://api.openai.com/v1',
      model: env.LLM_MODEL ?? 'gpt-4.1-mini',
      ...(llmApiKey ? { apiKey: llmApiKey } : {}),
      timeoutMs: parseNumber(env.LLM_TIMEOUT_MS, 8_000)
    }
  };
}
