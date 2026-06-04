import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';

const PDF_ROW_LIMIT = 1000;

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month'); // 1-12

    let startDate: Date;
    let endDate: Date;
    let reportTitle = 'Laporan Semua Waktu';
    let periodLabel = 'All Time';

    if (yearStr && monthStr) {
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      reportTitle = `Laporan Keuangan`;
      periodLabel = format(startDate, 'MMMM yyyy', { locale: idLocale });
    } else {
      startDate = new Date(2000, 0, 1);
      endDate = new Date(2100, 0, 1);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.uid,
        deletedAt: null,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
        wallet: true,
      },
      orderBy: { transactionDate: 'desc' },
      take: PDF_ROW_LIMIT,
    });

    const income = transactions.filter(t => t.type === 'masuk').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'keluar').reduce((sum, t) => sum + t.amount, 0);
    const net = income - expense;
    const fmtCurrency = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

    // ─── Build PDF ───
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ── Header bar ──
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.rect(0, 0, pageWidth, 38, 'F');

    // Norden logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('NORDEN', margin, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Finance', margin + doc.getTextWidth('NORDEN') + 2, 16);

    // Right side header info
    doc.setFontSize(9);
    doc.setTextColor(220, 255, 240);
    doc.text(reportTitle, pageWidth - margin, 12, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(periodLabel, pageWidth - margin, 22, { align: 'right' });

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 240, 220);
    doc.text(`Dicetak: ${format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}`, pageWidth - margin, 30, { align: 'right' });

    y = 50;

    // ── Summary Cards ──
    const cardWidth = (contentWidth - 8) / 3; // 3 cards with 4mm gap between
    const cardHeight = 26;

    // Income card
    doc.setFillColor(240, 253, 244); // green-50
    doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(187, 247, 208); // green-200
    doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(22, 163, 74); // green-600
    doc.text('PEMASUKAN', margin + 5, y + 8);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtCurrency(income), margin + 5, y + 18);

    // Expense card
    const card2X = margin + cardWidth + 4;
    doc.setFillColor(254, 242, 242); // red-50
    doc.roundedRect(card2X, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(254, 202, 202); // red-200
    doc.roundedRect(card2X, y, cardWidth, cardHeight, 2, 2, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38); // red-600
    doc.text('PENGELUARAN', card2X + 5, y + 8);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtCurrency(expense), card2X + 5, y + 18);

    // Net cashflow card
    const card3X = card2X + cardWidth + 4;
    const netPositive = net >= 0;
    doc.setFillColor(netPositive ? 240 : 254, netPositive ? 253 : 242, netPositive ? 244 : 242);
    doc.roundedRect(card3X, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(netPositive ? 187 : 254, netPositive ? 247 : 202, netPositive ? 208 : 202);
    doc.roundedRect(card3X, y, cardWidth, cardHeight, 2, 2, 'S');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(netPositive ? 22 : 220, netPositive ? 163 : 38, netPositive ? 74 : 38);
    doc.text('NET CASHFLOW', card3X + 5, y + 8);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text((net >= 0 ? '+' : '') + fmtCurrency(net), card3X + 5, y + 18);

    y += cardHeight + 14;

    // ── Transaction Count ──
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Total ${transactions.length} transaksi`, margin, y);
    y += 8;

    // ── Transactions Table ──
    if (transactions.length > 0) {
      const tableData = transactions.map(t => {
        let amountText = fmtCurrency(t.amount);
        if (t.type === 'masuk') amountText = '+' + amountText;
        if (t.type === 'keluar') amountText = '-' + amountText;

        return [
          format(t.transactionDate, 'dd/MM/yy'),
          t.category?.name || '-',
          (t.note || '-').slice(0, 40),
          t.wallet?.name || '-',
          amountText,
        ];
      });

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Tanggal', 'Kategori', 'Catatan', 'Dompet', 'Nominal']],
        body: tableData,
        theme: 'plain',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [51, 65, 85],
          fontStyle: 'bold',
          fontSize: 8,
          cellPadding: 4,
          lineWidth: 0.3,
          lineColor: [226, 232, 240],
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [71, 85, 105],
          cellPadding: 3.5,
          lineWidth: 0.15,
          lineColor: [241, 245, 249],
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 32 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 28 },
          4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        didParseCell: function (data: CellHookData) {
          if (data.section === 'body' && data.column.index === 4) {
            const text = String(data.cell.raw);
            if (text.startsWith('+')) {
              data.cell.styles.textColor = [22, 163, 74]; // green
            } else if (text.startsWith('-')) {
              data.cell.styles.textColor = [220, 38, 38]; // red
            }
          }
        },
      });
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('Tidak ada transaksi pada periode ini.', pageWidth / 2, y + 20, { align: 'center' });
    }

    // ── Footer on every page ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Norden Finance — Laporan ini dibuat secara otomatis.', margin, pageHeight - 9);
      doc.text(`Halaman ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }

    // ── Output ──
    const pdfOutput = doc.output('arraybuffer');

    const fileName = yearStr && monthStr
      ? `Norden_Report_${yearStr}_${monthStr}.pdf`
      : `Norden_Report_All.pdf`;

    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('PDF Export error:', error);
    return NextResponse.json({ error: 'Gagal membuat PDF' }, { status: 500 });
  }
}
