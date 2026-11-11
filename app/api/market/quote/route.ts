import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getLiveQuoteForAsset } from '@/lib/marketData';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'api-market-quote'), 60, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assetClass = searchParams.get('assetClass') || '';
    const symbol = searchParams.get('symbol') || '';
    const name = searchParams.get('name') || '';

    if (!assetClass && !symbol && !name) {
      return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
    }

    const quote = await getLiveQuoteForAsset({
      assetClass,
      symbol,
      name,
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ quote });
  } catch (err) {
    if (err instanceof RateLimitExceededError || err instanceof RateLimitIpError) {
      return rateLimitResponse(err);
    }
    console.error('Market quote error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
