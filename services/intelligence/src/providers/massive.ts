import type { MassiveProvider, RawTickerQuote } from './types.js';
import { asNumber, asString, fetchJson, isRecord, parseTimestamp } from './utils.js';

export type MassiveSnapshotRecord = Record<string, unknown>;

function findSnapshotSymbol(record: MassiveSnapshotRecord): string | undefined {
  return asString(record.ticker) ?? asString(record.symbol);
}

export function mapMassiveRecordToQuote(symbol: string, record: MassiveSnapshotRecord, nowIso: string): RawTickerQuote {
  const day = isRecord(record.day) ? record.day : undefined;
  const min = isRecord(record.min) ? record.min : undefined;
  const lastTrade = isRecord(record.lastTrade) ? record.lastTrade : undefined;
  const lastQuote = isRecord(record.lastQuote) ? record.lastQuote : undefined;

  const asOf =
    parseTimestamp(record.updated) ??
    parseTimestamp(lastTrade?.t) ??
    parseTimestamp(lastQuote?.t) ??
    parseTimestamp(min?.t) ??
    nowIso;

  const price = asNumber(lastTrade?.p) ?? asNumber(day?.c) ?? asNumber(min?.c);
  const changePercent24h =
    asNumber(record.todaysChangePerc) ??
    asNumber(record.todaysChangePercent) ??
    asNumber(day?.changePercent) ??
    asNumber(day?.change_percent);
  const volume = asNumber(day?.v) ?? asNumber(record.volume);
  const marketCap = asNumber(record.marketCap) ?? asNumber(record.market_cap);

  let providerStatus: RawTickerQuote['providerStatus'] = 'live';
  let notes: string | undefined;

  if (price === undefined && changePercent24h === undefined) {
    providerStatus = 'unavailable';
    notes = 'Massive snapshot did not include price or change data.';
  } else if (price === undefined || volume === undefined) {
    providerStatus = 'partial';
    notes = 'Massive snapshot is partial; at least one core field is missing.';
  } else {
    const lagSeconds = Math.max(0, Math.round((Date.now() - Date.parse(asOf)) / 1000));
    if (lagSeconds > 120) {
      providerStatus = 'delayed';
      notes = `Massive snapshot appears delayed by ${lagSeconds} seconds.`;
    }
  }

  const mapped: RawTickerQuote = {
    symbol,
    asOf,
    providerStatus
  };

  if (price !== undefined) {
    mapped.price = price;
  }
  if (changePercent24h !== undefined) {
    mapped.changePercent24h = changePercent24h;
  }
  if (volume !== undefined) {
    mapped.volume = volume;
  }
  if (marketCap !== undefined) {
    mapped.marketCap = marketCap;
  }
  if (notes !== undefined) {
    mapped.notes = notes;
  }

  return mapped;
}

function extractTickerArray(payload: unknown): MassiveSnapshotRecord[] {
  if (!isRecord(payload)) {
    return [];
  }

  const tickers = payload.tickers;
  if (Array.isArray(tickers)) {
    return tickers.filter(isRecord);
  }

  const results = payload.results;
  if (Array.isArray(results)) {
    return results.filter(isRecord);
  }

  return [];
}

export class MassiveHttpProvider implements MassiveProvider {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeoutMs: number,
    private readonly nowProvider: () => string = () => new Date().toISOString()
  ) {}

  async fetchSnapshots(args: { symbols: string[] }): Promise<RawTickerQuote[]> {
    if (args.symbols.length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      tickers: args.symbols.join(','),
      apiKey: this.apiKey
    });

    const payload = await fetchJson({
      url: `${this.baseUrl.replace(/\/$/, '')}/v2/snapshot/locale/us/markets/stocks/tickers?${params.toString()}`,
      timeoutMs: this.timeoutMs
    });

    const nowIso = this.nowProvider();
    const tickerRecords = extractTickerArray(payload);
    const bySymbol = new Map<string, MassiveSnapshotRecord>();

    tickerRecords.forEach((record) => {
      const symbol = findSnapshotSymbol(record);
      if (symbol) {
        bySymbol.set(symbol.toUpperCase(), record);
      }
    });

    return args.symbols.map((symbol) => {
      const record = bySymbol.get(symbol.toUpperCase());
      if (!record) {
        return {
          symbol,
          asOf: nowIso,
          providerStatus: 'unavailable',
          notes: 'Massive did not return snapshot data for this symbol.'
        };
      }

      return mapMassiveRecordToQuote(symbol, record, nowIso);
    });
  }
}
