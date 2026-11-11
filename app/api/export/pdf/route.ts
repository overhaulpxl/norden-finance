import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { getMonthlyReportData } from '../../../../lib/data/loaders';
import { generateMonthlyReportPdf } from '../../../../lib/pdf/monthlyReport';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../../lib/rateLimit';

export async function GET(req: Request) {
  try {
    await assertRateLimit(rateLimitKey(req, 'api-export-pdf'), 10, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month'); // 1-12

    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;

    if (yearStr !== null) {
      year = parseInt(yearStr, 10);
      if (Number.isNaN(year) || year < 1970 || year > 2100) {
        return NextResponse.json({ error: 'Parameter tahun tidak valid' }, { status: 400 });
      }
    }

    if (monthStr !== null) {
      month = parseInt(monthStr, 10);
      if (Number.isNaN(month) || month < 1 || month > 12) {
        return NextResponse.json({ error: 'Parameter bulan tidak valid (1-12)' }, { status: 400 });
      }
    }

    const reportData = await getMonthlyReportData(user.uid, month, year);
    const pdfBuffer = generateMonthlyReportPdf(reportData);

    const fileName = `Norden_Report_${reportData.year}_${reportData.month}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan dari IP ini.' }, { status: 400 });
    }
    console.error('PDF Export error:', error);
    return NextResponse.json({ error: 'Gagal membuat PDF' }, { status: 500 });
  }
}
