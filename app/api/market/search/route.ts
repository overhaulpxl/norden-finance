import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { searchMarketAssets } from '@/lib/marketData';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '@/lib/rateLimit';

const VALID_ASSET_CLASSES = new Set(['emas', 'saham', 'reksadana', 'kripto', 'properti', 'lainnya']);

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'api-market-search'), 30, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const rawAssetClass = (searchParams.get('assetClass') || '').trim().toLowerCase();

    if (rawAssetClass && !VALID_ASSET_CLASSES.has(rawAssetClass)) {
      return NextResponse.json({ error: 'Kelas aset tidak valid' }, { status: 400 });
    }

    const cleanQuery = query.trim().slice(0, 100);
    if (!cleanQuery) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchMarketAssets(cleanQuery, rawAssetClass || undefined);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof RateLimitExceededError || err instanceof RateLimitIpError) {
      return rateLimitResponse(err);
    }
    console.error('Market search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
