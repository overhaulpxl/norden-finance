/**
 * Statement parser for Indonesian banks & generic CSV formats.
 * Supports BCA, Mandiri, GoPay, and Generic CSV/TSV.
 */

export interface ParsedStatementRow {
  id: string;
  date: Date;
  dateStr: string;
  type: 'masuk' | 'keluar' | 'transfer';
  amount: number;
  description: string;
  category: string;
  isDuplicate?: boolean;
}

export interface StatementParseResult {
  detectedBank: 'BCA' | 'Mandiri' | 'GoPay' | 'Generic';
  rows: ParsedStatementRow[];
  totalIncome: number;
  totalExpense: number;
  error?: string;
}

function parseIndonesianAmount(raw: string): number {
  if (!raw) return 0;
  // Clean currency symbols, spaces, quotes
  let cleaned = raw.replace(/[Rp\s"']/gi, '').trim();

  // If format is 1.500.000,00 (Indonesian standard)
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Could be 1500.50 (US standard) or 1.500.000
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Multiple dots -> thousand separators (1.500.000)
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts[1]?.length === 3) {
      // Single dot with 3 digits -> likely thousand separator (500.000)
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    // 500000,00 or 1,500,000
    const parts = cleaned.split(',');
    if (parts.length > 2 || parts[1]?.length === 3) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  }

  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : Math.abs(num);
}

function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/['"]/g, '');

  // Formats: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }

  // Format: YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }

  // Format: DD/MM (current year)
  const dmMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (dmMatch) {
    const [, d, m] = dmMatch;
    return new Date(new Date().getFullYear(), parseInt(m, 10) - 1, parseInt(d, 10));
  }

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function guessCategory(desc: string, type: 'masuk' | 'keluar' | 'transfer'): string {
  const lower = desc.toLowerCase();
  if (type === 'transfer') return 'Transfer';
  if (type === 'masuk') {
    if (lower.includes('gaji') || lower.includes('payroll') || lower.includes('salary')) return 'Gaji';
    if (lower.includes('bunga') || lower.includes('interest')) return 'Investasi';
    if (lower.includes('patungan') || lower.includes('split')) return 'Patungan';
    return 'Pemasukan Lain';
  }

  if (lower.includes('kopi') || lower.includes('cafe') || lower.includes('resto') || lower.includes('makan') || lower.includes('food') || lower.includes('bakso')) return 'Makanan & Minuman';
  if (lower.includes('grab') || lower.includes('gojek') || lower.includes('ojol') || lower.includes('bensin') || lower.includes('spbu') || lower.includes('pertamina') || lower.includes('toll')) return 'Transportasi';
  if (lower.includes('pln') || lower.includes('listrik') || lower.includes('wifi') || lower.includes('indihome') || lower.includes('pdam') || lower.includes('pulsa') || lower.includes('telkomsel')) return 'Tagihan & Utilitas';
  if (lower.includes('tokopedia') || lower.includes('shopee') || lower.includes('blibli') || lower.includes('tiktok') || lower.includes('lazada')) return 'Belanja Online';
  if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('youtube') || lower.includes('disney')) return 'Langganan';
  return 'Pengeluaran Umum';
}

export function parseStatementCSV(csvContent: string): StatementParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { detectedBank: 'Generic', rows: [], totalIncome: 0, totalExpense: 0, error: 'File atau data teks CSV kosong' };
  }

  // Detect delimiter (, or ; or \t)
  const firstFew = lines.slice(0, 5).join('\n');
  const commaCount = (firstFew.match(/,/g) || []).length;
  const semiCount = (firstFew.match(/;/g) || []).length;
  const tabCount = (firstFew.match(/\t/g) || []).length;

  let delimiter = ',';
  if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
  else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

  // Bank Detection
  const lowerHeader = lines.slice(0, 10).join(' ').toLowerCase();
  let detectedBank: 'BCA' | 'Mandiri' | 'GoPay' | 'Generic' = 'Generic';

  if (lowerHeader.includes('bca') || lowerHeader.includes('tgl posting') || lowerHeader.includes('cabang') || (lowerHeader.includes('keterangan') && lowerHeader.includes('db/cr'))) {
    detectedBank = 'BCA';
  } else if (lowerHeader.includes('mandiri') || lowerHeader.includes('livin') || lowerHeader.includes('rekening koran')) {
    detectedBank = 'Mandiri';
  } else if (lowerHeader.includes('gopay') || lowerHeader.includes('gojek') || lowerHeader.includes('order id')) {
    detectedBank = 'GoPay';
  }

  const rows: ParsedStatementRow[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Split line respecting double quotes
    const regex = new RegExp(`(?:${delimiter}|^)(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
    const cols: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      cols.push((match[1] !== undefined ? match[1] : match[2] || '').trim());
    }

    if (cols.length < 3) continue;

    // Check if line looks like header (e.g. contains words like 'tanggal', 'date', 'keterangan')
    const combinedCols = cols.join(' ').toLowerCase();
    if (combinedCols.includes('tanggal') || combinedCols.includes('date') || combinedCols.includes('deskripsi') || combinedCols.includes('description')) {
      continue;
    }

    let parsedDate: Date | null = null;
    let description = '';
    let amount = 0;
    let type: 'masuk' | 'keluar' | 'transfer' = 'keluar';

    if (detectedBank === 'BCA') {
      // Typical BCA CSV: Tanggal, Keterangan, Cabang, Jumlah, Saldo (or Tanggal, Keterangan, DB/CR, Jumlah)
      parsedDate = parseDate(cols[0]);
      description = cols[1] || '';

      const lastCol = cols[cols.length - 1]?.toUpperCase() || '';
      const secondLastCol = cols[cols.length - 2]?.toUpperCase() || '';

      const isCr = lastCol.includes('CR') || secondLastCol.includes('CR') || description.toUpperCase().includes('CR');
      const isDb = lastCol.includes('DB') || secondLastCol.includes('DB') || description.toUpperCase().includes('DB');

      // Find amount in columns
      for (let c = 2; c < cols.length; c++) {
        const testAmt = parseIndonesianAmount(cols[c]);
        if (testAmt > 0 && !amount) {
          amount = testAmt;
        }
      }

      if (isCr) type = 'masuk';
      else if (isDb) type = 'keluar';
      else type = description.toLowerCase().includes('trsf') ? 'transfer' : 'keluar';
    } else if (detectedBank === 'Mandiri') {
      parsedDate = parseDate(cols[0]);
      description = cols[1] || '';
      const typeStr = (cols[2] || '').toUpperCase();
      amount = parseIndonesianAmount(cols[3] || cols[2]);

      if (typeStr.includes('CR') || typeStr.includes('KREDIT') || typeStr.includes('MASUK')) {
        type = 'masuk';
      } else {
        type = 'keluar';
      }
    } else {
      // Generic: Date, Description, Amount, Type (optional)
      parsedDate = parseDate(cols[0]);
      description = cols[1] || '';
      amount = parseIndonesianAmount(cols[2]);

      const typeCol = (cols[3] || '').toLowerCase();
      if (typeCol.includes('masuk') || typeCol.includes('in') || typeCol.includes('cr')) {
        type = 'masuk';
      } else if (typeCol.includes('transfer') || typeCol.includes('tf')) {
        type = 'transfer';
      } else {
        type = 'keluar';
      }
    }

    if (parsedDate && amount > 0) {
      if (type === 'masuk') totalIncome += amount;
      else if (type === 'keluar') totalExpense += amount;

      const dateStr = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
      rows.push({
        id: `stmt-${i}-${Date.now()}`,
        date: parsedDate,
        dateStr,
        type,
        amount,
        description: description.slice(0, 100),
        category: guessCategory(description, type),
      });
    }
  }

  return {
    detectedBank,
    rows,
    totalIncome,
    totalExpense,
  };
}
