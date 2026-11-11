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

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'api-market-search'), 30, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const assetClass = searchParams.get('assetClass') || undefined;

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchMarketAssets(query, assetClass);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof RateLimitExceededError || err instanceof RateLimitIpError) {
      return rateLimitResponse(err);
    }
    console.error('Market search error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
