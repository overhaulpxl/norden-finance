import { NextResponse } from 'next/server';
import {
  FALLBACK_PUBLIC_TESTIMONIALS,
  type PublicTestimonial,
} from '../../../../lib/landingFallbacks';
import { getPublicTestimonials } from '../../../../lib/publicTestimonials';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

function testimonialResponse(testimonials: PublicTestimonial[], source: 'database' | 'fallback') {
  return NextResponse.json(
    { testimonials, source },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  );
}

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'public-testimonials'), 60, 60_000);

    const publicTestimonials = await getPublicTestimonials();

    return testimonialResponse(
      publicTestimonials.length > 0 ? publicTestimonials : FALLBACK_PUBLIC_TESTIMONIALS,
      publicTestimonials.length > 0 ? 'database' : 'fallback',
    );
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to load public testimonials:', error);
    return testimonialResponse(FALLBACK_PUBLIC_TESTIMONIALS, 'fallback');
  }
}
