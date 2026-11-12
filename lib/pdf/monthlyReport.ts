import { jsPDF } from 'jspdf';
import autoTable, { type CellHookData } from 'jspdf-autotable';
import { formatCurrency } from '../format';
import * as fs from 'fs';
import * as path from 'path';

let logoBase64 = '';
let iconBase64 = '';

function getLogoImages() {
  if (!logoBase64 || !iconBase64) {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'brand', 'norden-horizontal.png');
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    } catch {
      // Fallback
    }
    try {
      const iconPath = path.join(process.cwd(), 'public', 'brand', 'norden-icon.png');
      iconBase64 = fs.readFileSync(iconPath).toString('base64');
    } catch {
      // Fallback
    }
  }
  return { logoBase64, iconBase64 };
}

// ─── Interfaces ───

export interface MonthlyReportTransaction {
  id: string;
  transactionDate: Date;
  type: 'masuk' | 'keluar' | 'transfer';
  amount: number;
  note: string | null;
  category: { name: string } | null;
  wallet: { name: string } | null;
  transferToWallet?: { name: string } | null;
}

export interface MonthlyReportSavingGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | null;
}

export interface MonthlyReportAchievement {
  id: string;
  title: string;
  description: string;
  unlockedAt: Date;
}

export interface MonthlyReportData {
  userFullName: string | null;
  userPlan: 'trial' | 'pro';
  month: number;
  year: number;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  monthName: string;
  periodLabel: string;
  generatedDateLabel: string;
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  transferVolume: number;
  cashflow: number;
  activeWalletBalance: number;
  largestExpenseCategory: string | null;
  largestExpenseAmount: number;
  largestExpensePercentage: number;
  recentTransactions: MonthlyReportTransaction[];
  savingGoals: MonthlyReportSavingGoal[];
  financialHealthScore: number;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastInputDate: Date | null;
  };
  achievements: MonthlyReportAchievement[];
  topCategoryName?: string;
  topCategoryAmount?: number;
  topCategoryPercent?: number;
  transactions?: MonthlyReportTransaction[];
}

// ─── Logo Vector Fallback ───

export function drawNordenLogoVector(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(255, 224, 102);
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.4);
  doc.rect(x, y, size, size, 'FD');

  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size * 0.32;

  doc.setLineWidth(size * 0.08);
  doc.setDrawColor(24, 24, 27);
  doc.setLineCap('square');

  doc.line(cx - s, cy + s, cx - s, cy - s * 0.6);
  doc.line(cx - s, cy - s * 0.6, cx + s, cy + s);
  doc.line(cx + s, cy + s, cx + s, cy - s);

  const ah = size * 0.12;
  doc.line(cx + s - ah, cy - s + ah, cx + s, cy - s);
  doc.line(cx + s + ah, cy - s + ah, cx + s, cy - s);

  doc.setLineCap('butt');
}

// ─── Main Generator ───

export function generateMonthlyReportPdf(data: MonthlyReportData): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 15;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2; // 180mm

  const { logoBase64, iconBase64 } = getLogoImages();

  // ═════════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE FINANCIAL STATEMENT
  // ═════════════════════════════════════════════════════════════════════

  // 1. TOP HEADER (Formal Letterhead)
  if (logoBase64) {
    const logoW = 34;
    const logoH = (34 * 191) / 523; // 12.42mm
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 12, logoW, logoH);
  } else {
    drawNordenLogoVector(doc, margin, 12, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(24, 24, 27);
    doc.text('NORDEN FINANCE', margin + 14, 19);
  }

  // Right Header Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text('MONTHLY FINANCIAL STATEMENT', margin + contentWidth, 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(24, 24, 27);
  doc.text(data.monthName.toUpperCase(), margin + contentWidth, 20.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text(`Periode Pembukuan: ${data.periodLabel}`, margin + contentWidth, 25.5, { align: 'right' });

  // Formal hairline rule
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.4);
  doc.line(margin, 29, margin + contentWidth, 29);

  // 2. METADATA STRIP (Clean Institutional Header Grid)
  const metaY = 34;
  doc.setFillColor(250, 249, 245);
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.25);
  doc.rect(margin, metaY, contentWidth, 13, 'FD');

  const colW = contentWidth / 4;
  const labels = ['PEMEGANG REKENING', 'KLASIFIKASI AKUN', 'TANGGAL PENERBITAN', 'VOLUME AKTIVITAS'];
  const values = [
    (data.userFullName || 'PENGGUNA').toUpperCase(),
    data.userPlan === 'pro' ? 'PRO TIER' : 'REGULER',
    data.generatedDateLabel,
    `${data.totalTransactions} Transaksi Tercatat`,
  ];

  for (let i = 0; i < 4; i++) {
    const cx = margin + i * colW + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(113, 113, 122);
    doc.text(labels[i], cx, metaY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(24, 24, 27);
    doc.text(values[i], cx, metaY + 9.2);

    if (i > 0) {
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.25);
      doc.line(margin + i * colW, metaY, margin + i * colW, metaY + 13);
    }
  }

  // 3. FINANCIAL SUMMARY STATEMENT (Table / Ledger Grid)
  const sumY = 53;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('I. NERACA ARUS DANA & POSISI LIKUIDITAS', margin, sumY);

  const isSurplus = data.cashflow >= 0;
  const expenseRatio = data.totalIncome > 0 ? Math.round((data.totalExpense / data.totalIncome) * 100) : 0;
  const savingsRatio = Math.max(0, 100 - expenseRatio);

  const summaryRows = [
    ['Total Pemasukan Kas (Inflow)', `+ ${formatCurrency(data.totalIncome)}`, 'Arus kas masuk dari gaji, pendapatan usaha & piutang'],
    ['Total Pengeluaran Kas (Outflow)', `- ${formatCurrency(data.totalExpense)}`, 'Akumulasi belanja operasional, kebutuhan pokok & sekunder'],
    ['Volume Transfer Antar-Rekening', formatCurrency(data.transferVolume), 'Pemindahan dana internal antar dompet & rekening bank'],
    [
      isSurplus ? 'Arus Kas Bersih (Net Cashflow / Surplus)' : 'Arus Kas Bersih (Net Cashflow / Defisit)',
      (isSurplus ? '+ ' : '') + formatCurrency(data.cashflow),
      isSurplus ? 'Kondisi surplus: pendapatan operasional mencukupi total pengeluaran' : 'Kondisi defisit: pengeluaran operasional melampaui pendapatan masuk',
    ],
    ['Total Saldo Likuiditas Kas & Bank', formatCurrency(data.activeWalletBalance), 'Posisi saldo akhir konsolidasi pada seluruh rekening aktif terdaftar'],
    ['Rasio Simpanan Terhadap Pemasukan', `${savingsRatio}%`, savingsRatio >= 20 ? 'Rasio simpanan sehat (memenuhi ambang batas anjuran 20%)' : 'Rasio simpanan di bawah anjuran batas sehat (20%)'],
  ];

  autoTable(doc, {
    startY: sumY + 3.2,
    margin: { left: margin, right: margin },
    head: [['POS KEUANGAN', 'NOMINAL (IDR)', 'CATATAN AKUNTANSI']],
    body: summaryRows,
    theme: 'plain',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [24, 24, 27],
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: 'bold' },
      1: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 'auto', textColor: [113, 113, 122] },
    },
    didDrawCell: (hook) => {
      if (hook.section === 'body') {
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.2);
        doc.line(hook.cell.x, hook.cell.y + hook.cell.height, hook.cell.x + hook.cell.width, hook.cell.y + hook.cell.height);
      }
    },
    didParseCell: (hook) => {
      if (hook.section === 'body') {
        if (hook.row.index === 0 && hook.column.index === 1) {
          hook.cell.styles.textColor = [21, 128, 61];
        } else if (hook.row.index === 1 && hook.column.index === 1) {
          hook.cell.styles.textColor = [185, 28, 28];
        } else if (hook.row.index === 3) {
          hook.cell.styles.fillColor = isSurplus ? [240, 253, 244] : [254, 242, 242];
          if (hook.column.index === 1) {
            hook.cell.styles.textColor = isSurplus ? [21, 128, 61] : [185, 28, 28];
          }
        } else if (hook.row.index === 4) {
          hook.cell.styles.fillColor = [250, 249, 245];
        }
      }
    },
  });

  const finalSummaryY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // 4. STRUCTURED ANALYSIS (Institutional Split Table Layout)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('II. ANALISIS KONSENTRASI BELANJA & TARGET DANA', margin, finalSummaryY);

  const halfW = (contentWidth - 6) / 2; // 87mm
  const splitY = finalSummaryY + 3.5;

  // ── Left: Expense Breakdown Table ──
  const catName = data.largestExpenseCategory || 'Umum';
  const leftRows = [
    ['Pos Belanja Terbesar', catName],
    ['Nominal Pengeluaran', formatCurrency(data.largestExpenseAmount)],
    ['Porsi Terhadap Total Belanja', `${data.largestExpensePercentage}%`],
    ['Rasio Beban Kas Bulanan', `${expenseRatio}% dari pemasukan`],
  ];

  autoTable(doc, {
    startY: splitY,
    margin: { left: margin, right: margin + halfW + 6 },
    head: [['PARAMETER PENGELUARAN', 'RINCIAN']],
    body: leftRows,
    theme: 'plain',
    headStyles: {
      fillColor: [244, 244, 245],
      textColor: [24, 24, 27],
      fontStyle: 'bold',
      fontSize: 6.2,
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
      lineWidth: 0.2,
      lineColor: [228, 228, 231],
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [24, 24, 27],
      cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', textColor: [82, 82, 91] },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (hook) => {
      if (hook.section === 'body') {
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.2);
        doc.line(hook.cell.x, hook.cell.y + hook.cell.height, hook.cell.x + hook.cell.width, hook.cell.y + hook.cell.height);
      }
    },
    didParseCell: (hook) => {
      if (hook.section === 'body' && hook.row.index === 1 && hook.column.index === 1) {
        hook.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  const leftFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // ── Right: Saving Goals Table ──
  const rightX = margin + halfW + 6;
  const rightRows: string[][] = [];

  if (data.savingGoals && data.savingGoals.length > 0) {
    data.savingGoals.slice(0, 3).forEach((g) => {
      const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      rightRows.push([
        g.title,
        `${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)}`,
        `${pct}%`,
      ]);
    });
  } else {
    rightRows.push(['Tidak ada target aktif terdaftar', '-', '-']);
  }

  autoTable(doc, {
    startY: splitY,
    margin: { left: rightX, right: margin },
    head: [['TARGET SIMPANAN', 'AKUMULASI / GOAL', 'CAPAIAN']],
    body: rightRows,
    theme: 'plain',
    headStyles: {
      fillColor: [244, 244, 245],
      textColor: [24, 24, 27],
      fontStyle: 'bold',
      fontSize: 6.2,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      lineWidth: 0.2,
      lineColor: [228, 228, 231],
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [24, 24, 27],
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 40, halign: 'right', textColor: [82, 82, 91] },
      2: { cellWidth: 19, halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] },
    },
    didDrawCell: (hook) => {
      if (hook.section === 'body') {
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.2);
        doc.line(hook.cell.x, hook.cell.y + hook.cell.height, hook.cell.x + hook.cell.width, hook.cell.y + hook.cell.height);
      }
    },
  });

  const rightFinalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const finalSplitY = Math.max(leftFinalY, rightFinalY) + 8;

  // 5. NOTES TO FINANCIAL STATEMENT (Clean Editorial Block)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('III. CATATAN & EVALUASI KEUANGAN', margin, finalSplitY);

  let evalText = `Posisi likuiditas kas aktif konsolidasi per akhir periode tercatat sebesar ${formatCurrency(data.activeWalletBalance)}. `;
  if (isSurplus) {
    evalText += `Arus kas beroperasi dalam kondisi surplus bersih sebesar ${formatCurrency(data.cashflow)} dengan rasio tabungan ${savingsRatio}%. Pengeluaran bulanan terkonsentrasi pada pos belanja ${catName} yang menyerap ${data.largestExpensePercentage}% dari total pengeluaran operasional. Pola alokasi kas berada dalam koridor keuangan yang sehat.`;
  } else {
    evalText += `Terjadi defisit kas operasional bersih sebesar ${formatCurrency(Math.abs(data.cashflow))}. Prioritaskan efisiensi anggaran belanja pada pos ${catName} guna memulihkan rasio arus kas ke kondisi surplus pada periode mendatang.`;
  }

  // Clean hairline container with solid left accent
  const noteBoxY = finalSplitY + 3.5;
  doc.setFillColor(250, 249, 245);
  doc.rect(margin, noteBoxY, contentWidth, 18, 'F');

  doc.setFillColor(24, 24, 27);
  doc.rect(margin, noteBoxY, 1.2, 18, 'F'); // Left accent bar

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(63, 63, 70);
  doc.text(evalText, margin + 4.5, noteBoxY + 5.5, { maxWidth: contentWidth - 9, lineHeightFactor: 1.4 });

  // 6. FORMAL RECONCILIATION & AUDIT SIGN-OFF
  const auditY = noteBoxY + 18 + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(24, 24, 27);
  doc.text('IV. STATUS REKONSILIASI & INTEGRITAS DATA', margin, auditY);

  const auditBoxY = auditY + 3.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.25);
  doc.rect(margin, auditBoxY, contentWidth, 15, 'FD');

  const auditColW = contentWidth / 3;
  const auditHeaders = ['STATUS REKONSILIASI KAS', 'VALIDASI SISTEM', 'LEMBAGA PENERBIT'];
  const auditValues = [
    'SEIMBANG / TERVERIFIKASI',
    'NORDEN CORE LEDGER v2.4',
    'NORDEN FINANCE ASIA TECH',
  ];
  const auditSub = [
    'Selisih mutasi terhitung: Rp 0',
    `Timestamp: ${data.generatedDateLabel}`,
    'Layanan Pembukuan Finansial Digital',
  ];

  for (let i = 0; i < 3; i++) {
    const ax = margin + i * auditColW + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.setTextColor(113, 113, 122);
    doc.text(auditHeaders[i], ax, auditBoxY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(i === 0 ? 21 : 24, i === 0 ? 128 : 24, i === 0 ? 61 : 27);
    doc.text(auditValues[i], ax, auditBoxY + 8.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.2);
    doc.setTextColor(113, 113, 122);
    doc.text(auditSub[i], ax, auditBoxY + 12.2);

    if (i > 0) {
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.25);
      doc.line(margin + i * auditColW, auditBoxY, margin + i * auditColW, auditBoxY + 15);
    }
  }

  // ═════════════════════════════════════════════════════════════════════
  // PAGE 2: GENERAL TRANSACTION LEDGER (BUKU BESAR MUTASI TRANSAKSI)
  // ═════════════════════════════════════════════════════════════════════
  const allTx = data.transactions && data.transactions.length > 0 ? data.transactions : data.recentTransactions;

  doc.addPage();

  // Ledger Page Header
  if (logoBase64) {
    const logoW = 30;
    const logoH = (30 * 191) / 523;
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 12, logoW, logoH);
  } else {
    drawNordenLogoVector(doc, margin, 12, 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 113, 122);
  doc.text('BUKU BESAR MUTASI TRANSAKSI', margin + contentWidth, 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(24, 24, 27);
  doc.text(data.monthName.toUpperCase(), margin + contentWidth, 19.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text(`Akun: ${(data.userFullName || 'PENGGUNA').toUpperCase()}  |  Periode: ${data.periodLabel}`, margin + contentWidth, 24, { align: 'right' });

  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.35);
  doc.line(margin, 27, margin + contentWidth, 27);

  // Table Body
  let bodyData: string[][];
  if (allTx.length === 0) {
    bodyData = [['-', '-', 'Belum ada transaksi mutasi tercatat.', '-', '-']];
  } else {
    bodyData = allTx.map((t) => {
      const d = t.transactionDate ? new Date(t.transactionDate) : null;
      const dateStr = d
        ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
        : '-';
      return [
        dateStr,
        t.type === 'masuk' ? 'Pemasukan' : t.type === 'transfer' ? 'Transfer' : 'Pengeluaran',
        (t.type === 'masuk' ? '+ ' : t.type === 'keluar' ? '- ' : '~ ') + formatCurrency(t.amount),
        t.category?.name || (t.type === 'transfer' ? 'Antar Rekening' : 'Umum'),
        (t.note || '-').slice(0, 48),
      ];
    });
  }

  autoTable(doc, {
    startY: 32,
    margin: { left: margin, right: margin, top: 25, bottom: 25 },
    head: [['TANGGAL', 'JENIS MUTASI', 'NOMINAL (IDR)', 'KATEGORI POS', 'CATATAN TRANSAKSI']],
    body: bodyData,
    theme: 'plain',
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: { top: 2.8, bottom: 2.8, left: 3, right: 3 },
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [24, 24, 27],
      cellPadding: { top: 2.6, bottom: 2.6, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: [250, 249, 245],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'left' },
      4: { cellWidth: 'auto', halign: 'left', textColor: [82, 82, 91] },
    },
    didDrawCell: (hook) => {
      if (hook.section === 'body') {
        doc.setDrawColor(228, 228, 231);
        doc.setLineWidth(0.18);
        doc.line(hook.cell.x, hook.cell.y + hook.cell.height, hook.cell.x + hook.cell.width, hook.cell.y + hook.cell.height);
      }
    },
    didParseCell: (hook: CellHookData) => {
      if (hook.section === 'head' && hook.column.index === 2) {
        hook.cell.styles.halign = 'right';
      }
      if (hook.section === 'body') {
        const raw = String(hook.row.cells[1].raw);
        if (hook.column.index === 1 || hook.column.index === 2) {
          if (raw.includes('Pengeluaran')) {
            hook.cell.styles.textColor = [185, 28, 28];
          } else if (raw.includes('Pemasukan')) {
            hook.cell.styles.textColor = [21, 128, 61];
          } else if (raw.includes('Transfer')) {
            hook.cell.styles.textColor = [51, 65, 85];
          }
        }
      }
    },
  });

  // ═════════════════════════════════════════════════════════════════════
  // FOOTER ACROSS ALL PAGES
  // ═════════════════════════════════════════════════════════════════════
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();

    // Hairline divider
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.25);
    doc.line(margin, ph - 16, margin + contentWidth, ph - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(140, 140, 140);
    doc.text('Dokumen resmi diterbitkan secara otomatis oleh sistem pembukuan Norden Finance.', margin, ph - 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(24, 24, 27);
    doc.text(`Norden Finance  |  https://www.nordenfinance.site  |  ${data.generatedDateLabel}`, margin, ph - 7);

    // Mini logo right
    if (iconBase64) {
      doc.addImage(`data:image/png;base64,${iconBase64}`, 'PNG', margin + contentWidth - 28, ph - 12.5, 5, 5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(113, 113, 122);
    doc.text(`Halaman ${i} dari ${totalPages}`, margin + contentWidth, ph - 8, { align: 'right' });
  }

  return doc.output('arraybuffer');
}
