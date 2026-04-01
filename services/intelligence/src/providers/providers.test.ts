import assert from 'node:assert/strict';
import test from 'node:test';

import { mapMassivePrevAggregateToQuote, mapMassiveRecordToQuote } from './massive.js';
import { inferTickers, mapNewsApiArticleToRaw } from './newsapi.js';

test('inferTickers extracts uppercase ticker-like tokens', () => {
  const tickers = inferTickers('NVDA and AMD rally while THE market watches MSFT.');
  assert.ok(tickers.includes('NVDA'));
  assert.ok(tickers.includes('AMD'));
  assert.ok(!tickers.includes('THE'));
});

test('mapNewsApiArticleToRaw maps source fields and generates id', () => {
  const raw = mapNewsApiArticleToRaw({
    source: { name: 'MacroDesk' },
    title: 'NVDA rises after AI demand commentary',
    description: 'AMD also moved higher.',
    url: 'https://example.com/story',
    publishedAt: '2026-03-31T12:00:00.000Z'
  });

  assert.equal(raw.sourceName, 'MacroDesk');
  assert.equal(raw.url, 'https://example.com/story');
  assert.ok(Array.isArray(raw.tickers));
  assert.ok(raw.tickers.includes('NVDA'));
  assert.ok(raw.tickers.length > 0);
  assert.match(raw.id ?? '', /^newsapi-/);
});

test('mapMassiveRecordToQuote marks unavailable quote when core fields are absent', () => {
  const mapped = mapMassiveRecordToQuote(
    'NVDA',
    {
      ticker: 'NVDA',
      lastTrade: { t: Date.parse('2026-03-31T12:00:00.000Z') }
    },
    '2026-03-31T13:00:00.000Z'
  );

  assert.equal(mapped.symbol, 'NVDA');
  assert.equal(mapped.providerStatus, 'unavailable');
  assert.match(mapped.notes ?? '', /did not include price/i);
});

test('mapMassiveRecordToQuote marks partial when volume missing', () => {
  const mapped = mapMassiveRecordToQuote(
    'MSFT',
    {
      ticker: 'MSFT',
      day: { c: 420.5 },
      todaysChangePerc: 3.4,
      lastTrade: { t: Date.parse('2026-03-31T12:59:00.000Z') }
    },
    '2026-03-31T13:00:00.000Z'
  );

  assert.equal(mapped.providerStatus, 'partial');
  assert.equal(mapped.price, 420.5);
  assert.equal(mapped.changePercent24h, 3.4);
});

test('mapMassivePrevAggregateToQuote maps prev aggregate fallback payload', () => {
  const mapped = mapMassivePrevAggregateToQuote(
    'AAPL',
    {
      ticker: 'AAPL',
      results: [{ o: 247.91, c: 253.79, v: 49561842, t: 1774987200000 }]
    },
    '2026-03-31T13:00:00.000Z'
  );

  assert.equal(mapped.symbol, 'AAPL');
  assert.equal(mapped.providerStatus, 'live');
  assert.equal(mapped.price, 253.79);
  assert.equal(mapped.volume, 49561842);
  assert.ok(typeof mapped.changePercent24h === 'number');
  assert.match(mapped.notes ?? '', /fallback/i);
});
