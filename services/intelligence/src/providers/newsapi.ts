import type { NewsProvider, RawNewsArticle } from './types.js';
import { fetchJson, isRecord } from './utils.js';

export type NewsApiArticle = {
  source?: { name?: string };
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  content?: string;
};

export function inferTickers(text: string): string[] {
  const matches = text.toUpperCase().match(/\b[A-Z]{1,5}\b/g) ?? [];
  const ignored = new Set([
    'THE',
    'WITH',
    'FROM',
    'THIS',
    'THAT',
    'MARKET',
    'PRICE',
    'AND',
    'AFTER',
    'RISES',
    'WHILE',
    'STOCK',
    'STOCKS',
    'NEWS',
    'TODAY',
    'WEEK'
  ]);
  const candidates = matches.filter((item) => !ignored.has(item));
  return [...new Set(candidates)].slice(0, 3);
}

export function mapNewsApiArticleToRaw(article: NewsApiArticle): RawNewsArticle {
  const sourceName = article.source?.name;
  const title = article.title;
  const description = article.description;
  const url = article.url;
  const publishedAt = article.publishedAt;
  const content = article.content;
  const context = [title, description, content].filter(Boolean).join(' ');
  const idBasis = url ?? `${sourceName ?? 'newsapi'}-${title ?? 'article'}`;

  const mapped: RawNewsArticle = {
    id: `newsapi-${Buffer.from(idBasis).toString('base64url').slice(0, 20)}`,
    tickers: inferTickers(context)
  };

  if (sourceName !== undefined) {
    mapped.sourceName = sourceName;
  }
  if (title !== undefined) {
    mapped.title = title;
  }
  if (description !== undefined) {
    mapped.description = description;
  }
  if (url !== undefined) {
    mapped.url = url;
  }
  if (publishedAt !== undefined) {
    mapped.publishedAt = publishedAt;
  }
  if (content !== undefined) {
    mapped.content = content;
  }

  return mapped;
}

export class NewsApiHttpProvider implements NewsProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number
  ) {}

  async fetchArticles(args: { query: string; pageSize: number }): Promise<RawNewsArticle[]> {
    const params = new URLSearchParams({
      q: args.query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: String(args.pageSize)
    });

    const payload = await fetchJson({
      url: `${this.baseUrl.replace(/\/$/, '')}/v2/everything?${params.toString()}`,
      headers: {
        'X-Api-Key': this.apiKey
      },
      timeoutMs: this.timeoutMs
    });

    if (!isRecord(payload) || payload.status !== 'ok' || !Array.isArray(payload.articles)) {
      throw new Error('Unexpected NewsAPI response shape');
    }

    return payload.articles.map((article) => mapNewsApiArticleToRaw(article as NewsApiArticle));
  }
}
