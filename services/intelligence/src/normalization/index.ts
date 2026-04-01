import type { SourceArticle, TickerSnapshot } from '@situation-monitor/shared-types';

import type { RawNewsArticle, RawTickerQuote } from '../providers/types.js';

const POSITIVE_TERMS = ['beats', 'surge', 'rally', 'gain', 'growth', 'upgrade'];
const NEGATIVE_TERMS = ['miss', 'drop', 'decline', 'downgrade', 'concern', 'selloff'];

function pickSourceType(sourceName: string): SourceArticle['sourceType'] {
  const normalized = sourceName.toLowerCase();
  if (normalized.includes('wire')) {
    return 'wire';
  }
  if (normalized.includes('blog')) {
    return 'blog';
  }
  if (normalized.includes('social')) {
    return 'social';
  }
  if (normalized.includes('filing')) {
    return 'filing';
  }

  return 'news';
}

function inferSentiment(text: string): NonNullable<SourceArticle['sentiment']> {
  const normalized = text.toLowerCase();
  const positive = POSITIVE_TERMS.some((term) => normalized.includes(term));
  const negative = NEGATIVE_TERMS.some((term) => normalized.includes(term));

  if (positive && !negative) {
    return 'positive';
  }
  if (negative && !positive) {
    return 'negative';
  }
  return 'neutral';
}

function inferCredibility(sourceName: string, hasUrl: boolean): number {
  const normalized = sourceName.toLowerCase();
  let score = 0.55;

  if (normalized.includes('wire') || normalized.includes('reuters') || normalized.includes('bloomberg')) {
    score += 0.2;
  }

  if (normalized.includes('blog')) {
    score -= 0.1;
  }

  if (hasUrl) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function normalizeTickers(tickers: string[] | undefined): string[] {
  if (!Array.isArray(tickers)) {
    return [];
  }

  return [
    ...new Set(
      tickers
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => /^[A-Z]{1,5}$/.test(ticker))
    )
  ];
}

export function normalizeArticles(rawArticles: RawNewsArticle[], nowIso: string): SourceArticle[] {
  return rawArticles.map((article, index) => {
    const sourceName = article.sourceName?.trim() || 'NewsAPI';
    const headline = article.title?.trim() || `Unstructured source article ${index + 1}`;
    const publishedAt = article.publishedAt && !Number.isNaN(Date.parse(article.publishedAt)) ? article.publishedAt : nowIso;
    const summary = article.description?.trim() || article.content?.trim() || 'No summary available.';
    const url = article.url?.trim() || `https://newsapi.org/local-fallback/${index + 1}`;
    const tickers = normalizeTickers(article.tickers);
    const context = `${headline} ${summary}`;

    const normalized: SourceArticle = {
      id: article.id?.trim() || `newsapi-normalized-${index + 1}`,
      headline,
      sourceName,
      sourceType: pickSourceType(sourceName),
      url,
      publishedAt,
      summary,
      tickers,
      sentiment: inferSentiment(context),
      credibilityScore: inferCredibility(sourceName, Boolean(article.url)),
      provider: 'newsapi'
    };

    const providerArticleId = article.id?.trim();
    if (providerArticleId) {
      normalized.providerArticleId = providerArticleId;
    }

    return normalized;
  });
}

export function normalizeTickerSnapshots(rawSnapshots: RawTickerQuote[], nowIso: string): TickerSnapshot[] {
  return rawSnapshots.map((snapshot) => {
    const asOf = snapshot.asOf && !Number.isNaN(Date.parse(snapshot.asOf)) ? snapshot.asOf : nowIso;
    const lagSeconds = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(asOf)) / 1000));

    const hasPrice = typeof snapshot.price === 'number';
    const hasVolume = typeof snapshot.volume === 'number';
    const hasChange = typeof snapshot.changePercent24h === 'number';

    let status: TickerSnapshot['status'] = snapshot.providerStatus ?? 'live';
    if (status === 'live') {
      if (!hasPrice && !hasChange) {
        status = 'unavailable';
      } else if (!hasPrice || !hasVolume) {
        status = 'partial';
      } else if (lagSeconds > 120) {
        status = 'delayed';
      }
    }

    const normalized: TickerSnapshot = {
      symbol: snapshot.symbol.toUpperCase(),
      asOf,
      status,
      currency: 'USD',
      provider: 'massive',
      dataLagSeconds: lagSeconds
    };

    if (snapshot.price !== undefined) {
      normalized.price = snapshot.price;
    }
    if (snapshot.changePercent24h !== undefined) {
      normalized.changePercent24h = snapshot.changePercent24h;
    }
    if (snapshot.volume !== undefined) {
      normalized.volume = snapshot.volume;
    }
    if (snapshot.marketCap !== undefined) {
      normalized.marketCap = snapshot.marketCap;
    }
    if (snapshot.notes !== undefined) {
      normalized.notes = snapshot.notes;
    }

    return normalized;
  });
}
