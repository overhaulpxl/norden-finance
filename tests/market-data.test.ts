import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getGoldPriceIdr, getUsdIdrRate, getLiveQuoteForAsset, getCryptoQuote } from '../lib/marketData';

describe('Market Data Engine', () => {
  it('fetches or falls back USD/IDR rate with realistic number', async () => {
    const rate = await getUsdIdrRate();
    assert.ok(typeof rate === 'number');
    assert.ok(rate >= 10000 && rate <= 30000);
  });

  it('fetches or falls back gold price with structured payload', async () => {
    const gold = await getGoldPriceIdr();
    assert.ok(typeof gold.pricePerGramIdr === 'number');
    assert.ok(gold.pricePerGramIdr > 500000);
    assert.ok(typeof gold.updatedAt === 'string');
    assert.ok(typeof gold.isFallback === 'boolean' || gold.isFallback === undefined);
    assert.equal(gold.priceType, 'buy');
  });

  it('returns valid quote payload with fallback indicator for gold asset', async () => {
    const quote = await getLiveQuoteForAsset({
      assetClass: 'emas',
      name: 'Emas Antam',
    });
    assert.ok(quote);
    assert.ok(quote.priceIdr > 500000);
    assert.equal(quote.symbol, 'EMAS');
    assert.equal(quote.priceType, 'buy');
    assert.ok(typeof quote.isFallback === 'boolean');
  });

  it('handles unknown or empty assets gracefully', async () => {
    const quote = await getLiveQuoteForAsset({
      assetClass: 'properti',
      name: '',
    });
    assert.equal(quote, null);
  });

  it('returns a realistic IDR quote for USDT (stablecoin)', async () => {
    const quote = await getCryptoQuote('USDT');
    assert.ok(quote, 'USDT quote should never be null');
    assert.equal(quote.symbol, 'USDT');
    assert.ok(quote.priceIdr >= 10000 && quote.priceIdr <= 30000);
    assert.ok(typeof quote.updatedAt === 'string');
  });

  it('returns a realistic IDR quote for USDC (stablecoin)', async () => {
    const quote = await getCryptoQuote('USDC');
    assert.ok(quote, 'USDC quote should never be null');
    assert.equal(quote.symbol, 'USDC');
    assert.ok(quote.priceIdr >= 10000 && quote.priceIdr <= 30000);
    assert.ok(typeof quote.updatedAt === 'string');
  });

  it('resolves stablecoin tickers embedded in compound asset names', async () => {
    const quote = await getCryptoQuote('USDT (Binance Flexible Earn)');
    assert.ok(quote, 'compound USDT name should resolve to USDT');
    assert.equal(quote.symbol, 'USDT');
    assert.ok(quote.priceIdr >= 10000 && quote.priceIdr <= 30000);
  });

  it('returns live IDR quote via getLiveQuoteForAsset for kripto class', async () => {
    const quote = await getLiveQuoteForAsset({
      assetClass: 'kripto',
      symbol: 'USDC',
      name: 'USDC (Binance Flexible Earn)',
    });
    assert.ok(quote);
    assert.ok(quote.priceIdr >= 10000 && quote.priceIdr <= 30000);
  });
});
