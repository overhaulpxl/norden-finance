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
      // Fallback to vector monogram if file not found
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

// ─── Helpers ───

function typeLabel(type: string): string {
  if (type === 'masuk') return 'Masuk';
  if (type === 'transfer') return 'Transfer';
  return 'Keluar';
}

function typePrefix(type: string): string {
  if (type === 'masuk') return '+ ';
  if (type === 'transfer') return '~ ';
  return '- ';
}

// ─── Drawing Primitives ───

export function drawWedge(doc: jsPDF, cx: number, cy: number, r: number, startDeg: number, endDeg: number, fill: [number, number, number]) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  for (let deg = startDeg; deg < endDeg; deg += 2) {
    const next = Math.min(deg + 2, endDeg);
    const r1 = (deg * Math.PI) / 180, r2 = (next * Math.PI) / 180;
    doc.triangle(cx, cy, cx + r * Math.cos(r1), cy + r * Math.sin(r1), cx + r * Math.cos(r2), cy + r * Math.sin(r2), 'F');
  }
}

export function drawSparkle(doc: jsPDF, cx: number, cy: number, rx: number, ry: number) {
  doc.setFillColor(17, 17, 17);
  doc.triangle(cx, cy - ry, cx - rx * 0.25, cy, cx + rx * 0.25, cy, 'F');
  doc.triangle(cx, cy + ry, cx - rx * 0.25, cy, cx + rx * 0.25, cy, 'F');
  doc.triangle(cx - rx, cy, cx, cy - ry * 0.25, cx, cy + ry * 0.25, 'F');
  doc.triangle(cx + rx, cy, cx, cy - ry * 0.25, cx, cy + ry * 0.25, 'F');
}

export function drawNeobrutalistCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: [number, number, number] = [255, 255, 255],
  shadowOffset: number = 1.2
) {
  // Shadow box
  doc.setFillColor(17, 17, 17);
  doc.rect(x + shadowOffset, y + shadowOffset, w, h, 'F');

  // Surface card
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, h, 'FD');
}

export function drawNordenLogo(doc: jsPDF, x: number, y: number, size: number) {
  doc.setFillColor(255, 224, 102);
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.45);
  doc.rect(x, y, size, size, 'FD');

  const cx = x + size / 2;
  const cy = y + size / 2;
  const s = size * 0.32;

  doc.setLineWidth(size * 0.08);
  doc.setDrawColor(17, 17, 17);
  doc.setLineCap('square');

  doc.line(cx - s, cy + s, cx - s, cy - s * 0.6);
  doc.line(cx - s, cy - s * 0.6, cx + s, cy + s);
  doc.line(cx + s, cy + s, cx + s, cy - s);

  const ah = size * 0.12;
  doc.line(cx + s - ah, cy - s + ah, cx + s, cy - s);
  doc.line(cx + s + ah, cy - s + ah, cx + s, cy - s);

  doc.setLineCap('butt');
}

// ─── Section Drawings ───

export function drawHeader(doc: jsPDF, data: MonthlyReportData) {
  const { logoBase64 } = getLogoImages();

  if (logoBase64) {
    const logoW = 32;
    const logoH = (32 * 191) / 523; // exactly 11.69mm (523:191 ratio)
    doc.addImage(logoBase64, 'PNG', 15, 11, logoW, logoH);
  } else {
    drawNordenLogo(doc, 15, 11, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(17, 17, 17);
    doc.text('NORDEN', 28.5, 17.5);
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('FINANCE', 28.5, 21.5);
  }

  // Right Header Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('MONTHLY FINANCIAL STATEMENT', 195, 15, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(17, 17, 17);
  doc.text(data.monthName, 195, 21.5, { align: 'right' });

  // Accent line
  const monthWidth = doc.getTextWidth(data.monthName);
  doc.setFillColor(255, 224, 102);
  doc.rect(195 - monthWidth, 23.5, monthWidth, 1.2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Periode: ${data.periodLabel}`, 195, 28, { align: 'right' });

  if (data.userFullName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`Pemegang Akun: ${data.userFullName.toUpperCase()}`, 15, 28);
  }
}

export function drawHeroSummaryCard(doc: jsPDF, data: MonthlyReportData, y: number = 32) {
  const H = 34;

  drawNeobrutalistCard(doc, 15, y, 180, H, [255, 224, 102]);

  // Brutalist sharp badge
  doc.setFillColor(17, 17, 17);
  doc.rect(21, y + 4.5, 34, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(255, 224, 102);
  doc.text('RINGKASAN EKSEKUTIF', 38, y + 7.7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 17, 17);
  doc.text('Arus Kas & Likuiditas Bulanan', 59, y + 7.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Performa konsolidasi mutasi dan likuiditas dana untuk bulan ini.', 21, y + 12.5);

  // 5 Columns
  const W = 36;
  const centers = [33, 69, 105, 141, 177];
  const labels = ['TRANSAKSI', 'TOTAL MASUK', 'TOTAL KELUAR', 'VOLUME TRANSFER', 'ARUS KAS BERSIH'];
  const values = [
    `${data.totalTransactions}`,
    formatCurrency(data.totalIncome),
    formatCurrency(data.totalExpense),
    formatCurrency(data.transferVolume),
    formatCurrency(data.cashflow),
  ];

  const colors: [number, number, number][] = [
    [17, 17, 17],
    [21, 128, 61],
    [185, 28, 28],
    [29, 78, 216],
    data.cashflow >= 0 ? [21, 128, 61] : [185, 28, 28],
  ];

  // Column Dividers
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.35);
  for (let i = 1; i <= 4; i++) {
    doc.line(15 + W * i, y + 16, 15 + W * i, y + 31);
  }

  for (let i = 0; i < 5; i++) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text(labels[i], centers[i], y + 19, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(i === 0 ? 11 : 8.5);
    doc.setTextColor(colors[i][0], colors[i][1], colors[i][2]);
    doc.text(values[i], centers[i], y + 26.5, { align: 'center' });
  }
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFillColor(255, 224, 102);
  doc.rect(15, y, 1.8, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 17, 17);
  doc.text(title.toUpperCase(), 19, y + 3.4);
}

export function drawBalanceSummary(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 23;
  const gap = 6;
  const cardW = 87;

  // Card 1 — Saldo Dompet Aktif
  drawNeobrutalistCard(doc, 15, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL SALDO DOMPET AKTIF', 21, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(17, 17, 17);
  doc.text(formatCurrency(data.activeWalletBalance), 21, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(115, 115, 115);
  doc.text('Konsolidasi saldo di seluruh rekening & e-wallet aktif', 21, y + 19);

  // Card 2 — Total Perputaran Dana (Gross Turnover - removes duplicate cashflow card)
  const grossTurnover = data.totalIncome + data.totalExpense + data.transferVolume;

  drawNeobrutalistCard(doc, 15 + cardW + gap, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('TOTAL PERPUTARAN DANA (GROSS TURNOVER)', 114, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(17, 17, 17);
  doc.text(formatCurrency(grossTurnover), 114, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`Akumulasi mutasi masuk, keluar, dan transfer selama ${data.monthName}`, 114, y + 19);
}

export function drawExpenseSection(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 26;
  const gap = 6;
  const cardW = 87;

  // Left Card — Expense breakdown
  drawNeobrutalistCard(doc, 15, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('KATEGORI PENGELUARAN TERBESAR', 21, y + 6);

  if (data.totalExpense === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Belum ada data pengeluaran tercatat bulan ini.', 21, y + 14);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(140, 140, 140);
    doc.text('Catat belanja harian untuk memetakan alokasi biaya.', 21, y + 19);
  } else {
    const cx = 32, cy = y + 16, r = 8;
    drawWedge(doc, cx, cy, r, 0, 360, [243, 244, 246]);
    drawWedge(doc, cx, cy, r, -90, -90 + data.largestExpensePercentage * 3.6, [255, 224, 102]);
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r * 0.55, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(17, 17, 17);
    doc.text(`${data.largestExpensePercentage}%`, cx, cy + 2, { align: 'center' });

    // Legend
    const lx = 46;
    doc.setFillColor(255, 224, 102);
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.35);
    doc.rect(lx, y + 11, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(17, 17, 17);
    const catName = data.largestExpenseCategory || '-';
    doc.text(catName.length > 14 ? catName.slice(0, 12) + '..' : catName, lx + 4.5, y + 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(185, 28, 28);
    doc.text(formatCurrency(data.largestExpenseAmount), 96, y + 13.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Porsi terhadap total belanja', lx, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(17, 17, 17);
    doc.text(`${data.largestExpensePercentage}%`, 96, y + 20, { align: 'right' });
  }

  // Right Card — Cashflow & Savings Ratio
  drawNeobrutalistCard(doc, 15 + cardW + gap, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('ANALISIS ALUR KAS & RASIO TABUNGAN', 114, y + 6);

  if (data.totalIncome === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Belum ada pendapatan tercatat bulan ini.', 114, y + 14);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    doc.setTextColor(140, 140, 140);
    doc.text('Input gaji/pemasukan untuk memantau rasio menabung.', 114, y + 19);
  } else {
    const expenseRatio = Math.round((data.totalExpense / data.totalIncome) * 100);
    const savingsRatio = 100 - expenseRatio;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(115, 115, 115);
    doc.text('RASIO BELANJA', 114, y + 12);
    doc.text('RASIO MENABUNG', 155, y + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(expenseRatio > 80 ? 185 : 17, expenseRatio > 80 ? 28 : 17, expenseRatio > 80 ? 28 : 17);
    doc.text(`${expenseRatio}%`, 114, y + 17.5);

    doc.setTextColor(savingsRatio >= 20 ? 21 : 17, savingsRatio >= 20 ? 128 : 17, savingsRatio >= 20 ? 61 : 17);
    doc.text(`${savingsRatio}%`, 155, y + 17.5);

    let advice = '';
    if (savingsRatio >= 20) advice = 'Kondisi sehat! Anda berhasil menyisihkan >= 20% pendapatan.';
    else if (savingsRatio > 0) advice = 'Cukup sehat. Kurangi belanja non-primer agar rasio naik.';
    else advice = 'Peringatan: Belanja melebihi pemasukan (defisit)!';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(70, 70, 70);
    doc.text(advice, 114, y + 22, { maxWidth: 78 });
  }
}

export function drawGoalsAndHealth(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 25;
  const gap = 6;
  const cardW = 87;

  // Left Card — Score Card
  drawNeobrutalistCard(doc, 15, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('SKOR KESEHATAN FINANSIAL', 21, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 17, 17);
  doc.text(`${data.financialHealthScore}`, 21, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('/ 100', 21 + doc.getTextWidth(`${data.financialHealthScore}`) + 2, y + 15);

  let statusText = 'Perlu Perhatian';
  let statusBg: [number, number, number] = [254, 242, 242];
  let statusBorder: [number, number, number] = [185, 28, 28];
  if (data.financialHealthScore >= 80) {
    statusText = 'Sangat Sehat';
    statusBg = [240, 253, 244];
    statusBorder = [21, 128, 61];
  } else if (data.financialHealthScore >= 50) {
    statusText = 'Cukup Sehat';
    statusBg = [255, 251, 235];
    statusBorder = [217, 119, 6];
  }

  const tw = doc.getTextWidth(statusText);
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.setDrawColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.setLineWidth(0.35);
  doc.rect(21, y + 18, tw + 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(statusBorder[0], statusBorder[1], statusBorder[2]);
  doc.text(statusText, 23, y + 20.8);

  // Right Card — Saving Goals
  drawNeobrutalistCard(doc, 15 + cardW + gap, y, cardW, H, [255, 255, 255]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('TARGET TABUNGAN AKTIF', 114, y + 6);

  if (data.savingGoals.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text('Belum ada target tabungan aktif.', 114, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Tambahkan target di tab Target & Utang untuk memantau progres.', 114, y + 19, { maxWidth: 75 });
  } else {
    const goals = data.savingGoals.slice(0, 2);
    goals.forEach((goal, idx) => {
      const gy = y + 12 + idx * 7.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(17, 17, 17);
      const title = goal.title.length > 20 ? goal.title.slice(0, 18) + '..' : goal.title;
      doc.text(title, 114, gy);

      const barW = 46;
      const barH = 2.2;
      const barX = 114;
      const barY = gy + 1.2;

      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(17, 17, 17);
      doc.setLineWidth(0.3);
      doc.rect(barX, barY, barW, barH, 'FD');

      const pct = goal.targetAmount > 0 ? Math.min(1, goal.currentAmount / goal.targetAmount) : 0;
      if (pct > 0) {
        doc.setFillColor(255, 224, 102);
        doc.rect(barX, barY, barW * pct, barH, 'FD');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`${Math.round(pct * 100)}%`, barX + barW + 2, barY + 1.8);
    });
  }
}

export function drawRecentTransactionsTable(doc: jsPDF, data: MonthlyReportData, y: number, transactions: MonthlyReportTransaction[] = data.recentTransactions) {
  let body: string[][];

  if (transactions.length === 0) {
    body = [['-', '-', 'Belum ada transaksi mutasi bulan ini.', '-', '-']];
  } else {
    body = transactions.map(t => {
      const d = t.transactionDate ? new Date(t.transactionDate) : null;
      const dateStr = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '-';
      return [
        dateStr,
        typePrefix(t.type) + typeLabel(t.type),
        formatCurrency(t.amount),
        t.category?.name || (t.type === 'transfer' ? 'Transfer' : 'Umum'),
        (t.note || '-').slice(0, 45),
      ];
    });
  }

  autoTable(doc, {
    startY: y,
    margin: { left: 15, right: 15, bottom: 26, top: 34 },
    head: [['TANGGAL', 'TIPE', 'JUMLAH', 'KATEGORI', 'CATATAN']],
    body,
    theme: 'grid',
    didDrawPage: (hookData) => {
      if (hookData.pageNumber > 2) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(`Lanjutan Buku Besar Transaksi — ${data.periodLabel}`, 15, 24);
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.25);
        doc.line(15, 27, 195, 27);
      }
    },
    headStyles: {
      fillColor: [255, 224, 102],
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 6,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineWidth: 0.35,
      lineColor: [17, 17, 17],
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [17, 17, 17],
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineWidth: 0.35,
      lineColor: [17, 17, 17],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 26 },
      4: { cellWidth: 'auto' },
    },
    didParseCell(hook: CellHookData) {
      if (hook.section === 'body') {
        if (transactions.length === 0) {
          if (hook.column.index === 2) {
            hook.cell.styles.halign = 'center';
            hook.cell.styles.fontStyle = 'italic';
            hook.cell.styles.textColor = [140, 140, 140];
          }
          return;
        }

        const raw = String(hook.row.cells[1].raw);
        if (hook.column.index === 1 || hook.column.index === 2) {
          if (raw.includes('Keluar')) hook.cell.styles.textColor = [185, 28, 28];
          else if (raw.includes('Masuk')) hook.cell.styles.textColor = [21, 128, 61];
          else if (raw.includes('Transfer')) hook.cell.styles.textColor = [29, 78, 216];
        }
      }
    },
  });
}

export function drawPerformanceAndInsights(doc: jsPDF, data: MonthlyReportData, y: number) {
  const H = 20;
  const gap = 6;
  const cardW = 87;

  const streakText = data.streak.currentStreak > 0
    ? `${data.streak.currentStreak} hari aktif berturut-turut (terbaik ${data.streak.longestStreak} hari).`
    : 'Belum ada streak pencatatan bulan ini.';
  const achievementText = data.achievements.length > 0
    ? data.achievements.slice(0, 2).map((a) => a.title).join(', ')
    : 'Belum ada lencana baru.';

  // Left Card: Streak & Achievement
  drawNeobrutalistCard(doc, 15, y, cardW, H, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('STREAK & LENCANA PENCAPAIAN', 21, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(17, 17, 17);
  doc.text(`[STREAK] ${streakText}`, 21, y + 11, { maxWidth: 78 });
  doc.text(`[PENCAPAIAN] ${achievementText}`, 21, y + 16, { maxWidth: 78 });

  // Right Card: Financial Motivation
  drawNeobrutalistCard(doc, 15 + cardW + gap, y, cardW, H, [255, 251, 235]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(17, 17, 17);
  doc.text('INSIGHT & DISIPLIN KEUANGAN', 114, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(60, 60, 60);
  doc.text('Konsistensi mencatat pos transaksi harian dan memisahkan alokasi tabungan adalah fondasi arus kas yang sehat dan tahan krisis.', 114, y + 11, { maxWidth: 78 });
}

export function drawFooter(doc: jsPDF, data: MonthlyReportData) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();

    // Divider
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.25);
    doc.line(15, ph - 20, 195, ph - 20);

    // Generated label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(140, 140, 140);
    doc.text('Generated via Norden Finance', 15, ph - 15.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text(data.generatedDateLabel, 15, ph - 11.5);

    // Brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(17, 17, 17);
    doc.text('Norden Finance', 15, ph - 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(120, 120, 120);
    doc.text('• https://www.nordenfinance.site', 38, ph - 6.5);

    // Mini icon logo
    const lx = 188, ly = ph - 14;
    const { iconBase64 } = getLogoImages();
    if (iconBase64) {
      doc.addImage(iconBase64, 'PNG', lx, ly, 6, 6);
    } else {
      drawNordenLogo(doc, lx, ly, 6);
    }

    // Pagination
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${total}`, 195, ph - 6.5, { align: 'right' });
  }
}

// ─── Main Generator ───

export function generateMonthlyReportPdf(data: MonthlyReportData): ArrayBuffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const allTx = data.transactions && data.transactions.length > 0 ? data.transactions : data.recentTransactions;
  const isCompactMode = allTx.length <= 4;

  // 1. Header & Hero
  drawHeader(doc, data);
  drawHeroSummaryCard(doc, data, 32);

  // 2. Saldo & Arus Kas
  drawSectionTitle(doc, 'Kondisi Kas & Likuiditas Dana', 70);
  drawBalanceSummary(doc, data, 76);

  // 3. Pengeluaran & Rasio
  drawSectionTitle(doc, 'Pengeluaran & Rasio Tabungan', 103);
  drawExpenseSection(doc, data, 109);

  // 4. Target & Skor Kesehatan
  drawSectionTitle(doc, 'Target & Skor Kesehatan Finansial', 139);
  drawGoalsAndHealth(doc, data, 145);

  if (isCompactMode) {
    // ─── SINGLE PAGE SMART FIT MODE (<= 5 Transaksi) ───
    drawSectionTitle(doc, 'Mutasi Transaksi Bulan Ini', 174);
    drawRecentTransactionsTable(doc, data, 180, allTx);

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 205;
    const insightY = Math.max(finalY + 5, 208);

    drawSectionTitle(doc, 'Performa & Insight Finansial', insightY);
    drawPerformanceAndInsights(doc, data, insightY + 6);

    drawFooter(doc, data);
  } else {
    // ─── MULTI PAGE EXECUTIVE MODE (> 5 Transaksi) ───
    // Page 1 Finishes with Performance & Insights
    drawSectionTitle(doc, 'Performa & Insight Finansial', 174);
    drawPerformanceAndInsights(doc, data, 180);

    // Page 2+: Dedicated Full Transaction Ledger
    doc.addPage();
    drawHeader(doc, data);

    drawSectionTitle(doc, 'Buku Besar Lengkap Mutasi Transaksi', 36);
    drawRecentTransactionsTable(doc, data, 43, allTx);

    drawFooter(doc, data);
  }

  return doc.output('arraybuffer');
}
