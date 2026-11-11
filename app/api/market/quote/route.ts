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

const VALID_ASSET_CLASSES = new Set(['emas', 'saham', 'reksadana', 'kripto', 'properti', 'lainnya']);

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'api-market-quote'), 60, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawAssetClass = (searchParams.get('assetClass') || '').trim().toLowerCase();
    const symbol = (searchParams.get('symbol') || '').trim().slice(0, 30);
    const name = (searchParams.get('name') || '').trim().slice(0, 100);

    if (rawAssetClass && !VALID_ASSET_CLASSES.has(rawAssetClass)) {
      return NextResponse.json({ error: 'Kelas aset tidak valid' }, { status: 400 });
    }

    if (!rawAssetClass && !symbol && !name) {
      return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
    }

    const quote = await getLiveQuoteForAsset({
      assetClass: rawAssetClass,
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
