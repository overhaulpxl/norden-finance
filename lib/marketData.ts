/**
 * Free, keyless market statistics engine for Norden Finance.
 * Integrates:
 * - Gold / Emas: api.gold-api.com (XAU/USD converted to IDR/gram) with Yahoo GC=F fallback
 * - Stocks / Saham: Yahoo Finance v8/finance/chart & v1/finance/search (IDX .JK and global stocks)
 * - Crypto / Kripto: Indodax public ticker & CoinGecko v3 public price
 * - FX: open.er-api.com USD/IDR live rate with Yahoo IDR=X fallback
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 6000;

/**
 * Live USD to IDR rate
 */
export async function getUsdIdrRate(): Promise<number> {
  const cacheKey = 'fx_usd_idr';
  const cached = getCached<number>(cacheKey, 60 * 60 * 1000); // 1 hour
  if (cached) return cached;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.IDR;
      if (typeof rate === 'number' && rate > 5000) {
        setCache(cacheKey, rate);
        return rate;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch open.er-api.com rate, trying Yahoo:', err);
  }

  // Fallback to Yahoo IDR=X
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/IDR=X?interval=1d&range=1d', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === 'number' && price > 5000) {
        setCache(cacheKey, price);
        return price;
      }
    }
  } catch (err) {
    console.warn('Failed Yahoo FX fallback:', err);
  }

  return 16500; // safe fallback
}

/**
 * Live Gold Price (IDR per gram)
 * Strictly utilizes retail market Buy Rate (Harga Beli), never Buyback rate (Harga Jual Kembali).
 * 1 Troy Ounce = 31.1034768 grams
 */
export async function getGoldPriceIdr(): Promise<{
  pricePerGramIdr: number;
  updatedAt: string;
  isFallback?: boolean;
  priceType: 'buy';
}> {
  const cacheKey = 'gold_price_idr';
  const cached = getCached<{ pricePerGramIdr: number; updatedAt: string; isFallback?: boolean; priceType: 'buy' }>(
    cacheKey,
    15 * 60 * 1000
  ); // 15 mins
  if (cached) return cached;

  const usdIdr = await getUsdIdrRate();

  try {
    const res = await fetch('https://api.gold-api.com/price/XAU', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 900 },
    });
    if (res.ok) {
      const data = await res.json();
      const xauUsd = data?.price;
      if (typeof xauUsd === 'number' && xauUsd > 100) {
        const pricePerGramUsd = xauUsd / 31.1034768;
        const pricePerGramIdr = Math.round(pricePerGramUsd * usdIdr);
        const result = {
          pricePerGramIdr,
          updatedAt: data?.updatedAt || new Date().toISOString(),
          isFallback: false,
          priceType: 'buy' as const,
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('api.gold-api.com failed, trying Yahoo GC=F:', err);
  }

  // Fallback: Yahoo Finance GC=F (Gold Futures)
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const xauUsd = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof xauUsd === 'number' && xauUsd > 100) {
        const pricePerGramIdr = Math.round((xauUsd / 31.1034768) * usdIdr);
        const result = {
          pricePerGramIdr,
          updatedAt: new Date().toISOString(),
          isFallback: false,
          priceType: 'buy' as const,
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Yahoo GC=F gold fallback failed:', err);
  }

  // Default fallback estimate
  return { pricePerGramIdr: 1500000, updatedAt: new Date().toISOString(), isFallback: true, priceType: 'buy' };
}

/**
 * Live Stock / Saham Quote
 */
export async function getStockQuote(tickerInput: string): Promise<{
  symbol: string;
  name: string;
  priceIdr: number;
  rawPrice: number;
  currency: string;
  changePercent?: number;
  updatedAt: string;
} | null> {
  const cleanTicker = tickerInput.trim().toUpperCase();
  if (!cleanTicker) return null;

  // If Indonesian stock without suffix (e.g. BBCA, BBRI), append .JK
  const candidateSymbols = [cleanTicker];
  if (!cleanTicker.includes('.')) {
    candidateSymbols.unshift(`${cleanTicker}.JK`);
  }

  const usdIdr = await getUsdIdrRate();

  for (const sym of candidateSymbols) {
    const cacheKey = `stock_${sym}`;
    const cached = getCached<{
      symbol: string;
      name: string;
      priceIdr: number;
      rawPrice: number;
      currency: string;
      changePercent?: number;
      updatedAt: string;
    }>(cacheKey, 5 * 60 * 1000); // 5 mins
    if (cached) return cached;

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        const regularMarketPrice = meta?.regularMarketPrice;

        if (typeof regularMarketPrice === 'number' && regularMarketPrice > 0) {
          const currency = meta?.currency || 'IDR';
          const shortName = meta?.shortName || sym;
          let priceIdr = regularMarketPrice;

          if (currency === 'USD') {
            priceIdr = Math.round(regularMarketPrice * usdIdr);
          } else if (currency === 'IDR') {
            priceIdr = Math.round(regularMarketPrice);
          }

          let changePercent: number | undefined;
          const prevClose = meta?.chartPreviousClose || meta?.previousClose;
          if (typeof prevClose === 'number' && prevClose > 0) {
            changePercent = Number((((regularMarketPrice - prevClose) / prevClose) * 100).toFixed(2));
          }

          const result = {
            symbol: sym,
            name: shortName,
            priceIdr,
            rawPrice: regularMarketPrice,
            currency,
            changePercent,
            updatedAt: new Date().toISOString(),
          };
          setCache(cacheKey, result);
          return result;
        }
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

/**
 * Live Crypto / Kripto Quote
 */
const CRYPTO_COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  BITCOIN: 'bitcoin',
  ETH: 'ethereum',
  ETHEREUM: 'ethereum',
  USDT: 'tether',
  TETHER: 'tether',
  SOL: 'solana',
  SOLANA: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  RIPPLE: 'ripple',
  DOGE: 'dogecoin',
  DOGECOIN: 'dogecoin',
  ADA: 'cardano',
  CARDANO: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  POL: 'matic-network',
  TRX: 'tron',
  LINK: 'chainlink',
  TON: 'the-open-network',
};

export async function getCryptoQuote(symbolInput: string): Promise<{
  symbol: string;
  name: string;
  priceIdr: number;
  changePercent?: number;
  updatedAt: string;
} | null> {
  const clean = symbolInput.trim().toUpperCase();
  if (!clean) return null;

  const cacheKey = `crypto_${clean}`;
  const cached = getCached<{
    symbol: string;
    name: string;
    priceIdr: number;
    changePercent?: number;
    updatedAt: string;
  }>(cacheKey, 3 * 60 * 1000); // 3 mins
  if (cached) return cached;

  // 1. Try Indodax API (Direct IDR price for Indonesian crypto pairs)
  try {
    const pair = `${clean.toLowerCase()}idr`;
    const res = await fetch(`https://indodax.com/api/ticker/${pair}`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const last = Number(data?.ticker?.last);
      if (!Number.isNaN(last) && last > 0) {
        const result = {
          symbol: clean,
          name: clean,
          priceIdr: last,
          updatedAt: new Date().toISOString(),
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch {
    // fallback to CoinGecko
  }

  // 2. Try CoinGecko simple price
  const cgId = CRYPTO_COINGECKO_MAP[clean] || clean.toLowerCase();
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(cgId)}&vs_currencies=idr&include_24hr_change=true`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.ok) {
      const data = await res.json();
      const entry = data?.[cgId];
      if (entry && typeof entry.idr === 'number') {
        const result = {
          symbol: clean,
          name: clean,
          priceIdr: Math.round(entry.idr),
          changePercent: typeof entry.idr_24h_change === 'number' ? Number(entry.idr_24h_change.toFixed(2)) : undefined,
          updatedAt: new Date().toISOString(),
        };
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('CoinGecko fetch failed:', err);
  }

  return null;
}

export interface ReksadanaFundItem {
  id: string;
  name: string;
  manager: string;
  type: string;
  currency: string;
  active: boolean;
  nav: number;
  nav_date: string;
}

/**
 * Free mutual fund database from reksadana.risanb.com (1,400+ active IDR funds)
 */
export async function getReksadanaFunds(): Promise<ReksadanaFundItem[]> {
  const cacheKey = 'reksadana_funds_all';
  const cached = getCached<ReksadanaFundItem[]>(cacheKey, 6 * 60 * 60 * 1000); // 6 hours
  if (cached) return cached;

  try {
    const res = await fetch('https://reksadana.risanb.com/api/funds.json', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: 21600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const idrFunds = (data as ReksadanaFundItem[]).filter(
          (f) => f && f.currency === 'IDR' && typeof f.nav === 'number' && f.nav > 0
        );
        setCache(cacheKey, idrFunds);
        return idrFunds;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch reksadana funds:', err);
  }
  return [];
}

export async function getReksadanaQuote(query: string): Promise<{
  symbol: string;
  name: string;
  priceIdr: number;
  navDate?: string;
  updatedAt: string;
} | null> {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  const funds = await getReksadanaFunds();
  if (!funds.length) return null;

  const fund = funds.find(f => f.id.toLowerCase() === clean || f.name.toLowerCase() === clean)
    || funds.find(f => f.name.toLowerCase().includes(clean) || f.id.toLowerCase().includes(clean));

  if (fund) {
    return {
      symbol: fund.id,
      name: fund.name,
      priceIdr: Math.round(fund.nav),
      navDate: fund.nav_date,
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

export async function getMarketBenchmarks(): Promise<{
  goldIdrPerGram: number;
  ihsg: number;
  usdIdr: number;
  btIdr: number;
  updatedAt: string;
}> {
  const cacheKey = 'market_benchmarks';
  const cached = getCached<{
    goldIdrPerGram: number;
    ihsg: number;
    usdIdr: number;
    btIdr: number;
    updatedAt: string;
  }>(cacheKey, 5 * 60 * 1000);
  if (cached) return cached;

  const [gold, usdIdr, btc] = await Promise.all([
    getGoldPriceIdr(),
    getUsdIdrRate(),
    getCryptoQuote('BTC'),
  ]);

  let ihsg = 7200;
  try {
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=1d', {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const val = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof val === 'number' && val > 1000) {
        ihsg = val;
      }
    }
  } catch {
    // fallback
  }

  const result = {
    goldIdrPerGram: gold.pricePerGramIdr,
    ihsg: Number(ihsg.toFixed(2)),
    usdIdr: Math.round(usdIdr),
    btIdr: btc?.priceIdr || 1450000000,
    updatedAt: new Date().toISOString(),
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Universal Quote Dispatcher for any portfolio asset
 */
export async function getLiveQuoteForAsset(asset: {
  assetClass: string;
  symbol?: string;
  name?: string;
}): Promise<{
  priceIdr: number;
  symbol?: string;
  source: string;
  updatedAt: string;
  isFallback?: boolean;
  priceType?: 'buy' | 'market';
} | null> {
  const { assetClass, symbol, name = '' } = asset;
  const safeName = name.toLowerCase();
  const query = symbol?.trim() || name.trim();

  if (!query && !assetClass) return null;

  if (assetClass === 'emas' || safeName.includes('emas') || safeName.includes('gold') || query.toUpperCase() === 'XAU') {
    const gold = await getGoldPriceIdr();
    return {
      priceIdr: gold.pricePerGramIdr,
      symbol: 'EMAS',
      source: gold.isFallback ? 'Estimasi (Fallback)' : 'api.gold-api.com',
      priceType: 'buy',
      updatedAt: gold.updatedAt,
      isFallback: gold.isFallback ?? false,
    };
  }

  if (assetClass === 'kripto') {
    const crypto = await getCryptoQuote(query);
    if (crypto) {
      return {
        priceIdr: crypto.priceIdr,
        symbol: crypto.symbol,
        source: 'Indodax / CoinGecko',
        updatedAt: crypto.updatedAt,
        isFallback: false,
      };
    }
  }

  if (assetClass === 'saham') {
    const stock = await getStockQuote(query);
    if (stock) {
      return {
        priceIdr: stock.priceIdr,
        symbol: stock.symbol,
        source: 'Yahoo Finance',
        updatedAt: stock.updatedAt,
        isFallback: false,
      };
    }
  }

  // If reksadana or others, check if fund / stock / crypto matches
  if (assetClass === 'reksadana') {
    const fund = await getReksadanaQuote(query);
    if (fund) {
      return {
        priceIdr: fund.priceIdr,
        symbol: fund.symbol,
        source: 'reksadana.risanb.com',
        updatedAt: fund.updatedAt,
        isFallback: false,
      };
    }
    // Fallback: check stock / market feed
    const stock = await getStockQuote(query);
    if (stock) {
      return {
        priceIdr: stock.priceIdr,
        symbol: stock.symbol,
        source: 'Market Feed',
        updatedAt: stock.updatedAt,
        isFallback: false,
      };
    }
  }

  return null;
}

/**
 * Search Assets for auto-suggest in Portfolio Manager
 */
export async function searchMarketAssets(query: string, assetClass?: string): Promise<Array<{
  symbol: string;
  name: string;
  assetClass: string;
  priceEstimate?: number;
}>> {
  const cleanQ = query.trim();
  if (!cleanQ || cleanQ.length < 2) return [];

  const results: Array<{
    symbol: string;
    name: string;
    assetClass: string;
    priceEstimate?: number;
  }> = [];

  // Emas suggestion
  if (cleanQ.toLowerCase().includes('emas') || cleanQ.toLowerCase().includes('gold') || cleanQ.toUpperCase() === 'XAU') {
    const gold = await getGoldPriceIdr();
    results.push({
      symbol: 'EMAS',
      name: 'Emas Murni (per Gram)',
      assetClass: 'emas',
      priceEstimate: gold.pricePerGramIdr,
    });
  }

  // Crypto candidates
  if (!assetClass || assetClass === 'kripto' || assetClass === 'all') {
    const upper = cleanQ.toUpperCase();
    for (const [sym, cgId] of Object.entries(CRYPTO_COINGECKO_MAP)) {
      if (sym.includes(upper) || cgId.includes(cleanQ.toLowerCase())) {
        if (!results.some((r) => r.symbol === sym)) {
          results.push({
            symbol: sym,
            name: `${sym} (${cgId.charAt(0).toUpperCase() + cgId.slice(1)})`,
            assetClass: 'kripto',
          });
        }
      }
      if (results.length >= 8) break;
    }
  }

  // Stock search via Yahoo Finance
  if (!assetClass || assetClass === 'saham' || assetClass === 'all') {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQ)}&quotesCount=6&newsCount=0`;
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (res.ok) {
        const data = await res.json();
        const quotes = data?.quotes || [];
        for (const q of quotes) {
          if (q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF')) {
            results.push({
              symbol: q.symbol,
              name: q.shortname || q.longname || q.symbol,
              assetClass: 'saham',
            });
          }
        }
      }
    } catch {
      // Ignore search error
    }
  }

  // Mutual funds search via reksadana.risanb.com
  if (!assetClass || assetClass === 'reksadana' || assetClass === 'all') {
    try {
      const funds = await getReksadanaFunds();
      const lower = cleanQ.toLowerCase();
      const matches = funds.filter(f => f.name.toLowerCase().includes(lower) || f.id.toLowerCase().includes(lower)).slice(0, 6);
      for (const m of matches) {
        results.push({
          symbol: m.id,
          name: `${m.name} (${m.type})`,
          assetClass: 'reksadana',
          priceEstimate: Math.round(m.nav),
        });
      }
    } catch {
      // Ignore search error
    }
  }

  return results.slice(0, 10);
}
