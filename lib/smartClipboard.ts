// Smart clipboard parser for Indonesian banking and e-wallet notifications

export interface ParsedBankText {
  success: boolean;
  amount: number | null;
  merchant: string | null;
  category: string;
  type: 'keluar' | 'masuk' | 'transfer';
  source?: string;
}

export function parseBankNotificationText(rawText: string): ParsedBankText {
  if (!rawText || !rawText.trim()) {
    return { success: false, amount: null, merchant: null, category: 'Lain-lain', type: 'keluar' };
  }

  const text = rawText.trim();
  let amount: number | null = null;
  let merchant: string | null = null;
  let type: 'keluar' | 'masuk' | 'transfer' = 'keluar';
  let category = 'Belanja';
  let source = 'Bank';

  // 1. Detect Amount
  // Matches: "Rp 50.000", "Rp. 50.000", "IDR 50,000", "Rp50000", "sebesar Rp 125.000,00"
  const amountRegex = /(?:Rp\.?|IDR|sebesar)\s*([\d.,]+)/i;
  const matchAmount = text.match(amountRegex);
  if (matchAmount && matchAmount[1]) {
    // Clean Indonesian/English formatted numbers: "150.000,50", "150,000.00", "150.000", "150000"
    // Strip decimal cents: 1 or 2 digits preceded by comma or dot at the end
    const withoutCents = matchAmount[1].replace(/[,.]\d{1,2}$/, '');
    const clean = withoutCents.replace(/[.,]/g, '');
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num > 0) {
      amount = num;
    }
  }

  // Fallback amount check: e.g. "50k", "50rb", "100ribu"
  if (!amount) {
    const shortAmountMatch = text.match(/(\d+)\s*(?:k|rb|ribu)\b/i);
    if (shortAmountMatch && shortAmountMatch[1]) {
      const num = parseInt(shortAmountMatch[1], 10) * 1000;
      if (!isNaN(num) && num > 0) {
        amount = num;
      }
    }
  }

  // 2. Detect Bank / Provider Source & Type
  if (/bca/i.test(text)) {
    source = 'BCA';
  } else if (/mandiri|livin/i.test(text)) {
    source = 'Mandiri';
  } else if (/bri|brimo/i.test(text)) {
    source = 'BRI';
  } else if (/bni/i.test(text)) {
    source = 'BNI';
  } else if (/gopay/i.test(text)) {
    source = 'GoPay';
  } else if (/ovo/i.test(text)) {
    source = 'OVO';
  } else if (/dana/i.test(text)) {
    source = 'DANA';
  } else if (/shopeepay/i.test(text)) {
    source = 'ShopeePay';
  } else if (/jago/i.test(text)) {
    source = 'Bank Jago';
  } else if (/jenius/i.test(text)) {
    source = 'Jenius';
  }

  // Detect Inflow (Pemasukan)
  if (/masuk|diterima|berhasil ditambahkan|kredit|cr\b|top up berhasil/i.test(text)) {
    type = 'masuk';
    category = 'Pemasukan';
  } else if (/transfer ke|transfer antar|kirim uang/i.test(text)) {
    type = 'transfer';
    category = 'Transfer';
  } else {
    type = 'keluar';
  }

  // 3. Detect Merchant or Recipient Name
  // e.g. "ke [Name]", "di [Merchant]", "merchant [Name]", "QRIS [Name]"
  const merchantMatch = text.match(/(?:ke|di|merchant|pembayaran qris|qris|pada)\s+([A-Za-z0-9\s&'-]{3,30})/i);
  if (merchantMatch && merchantMatch[1]) {
    merchant = merchantMatch[1].replace(/(?:pada|tanggal|sebesar|rp|berhasil).*/i, '').trim();
  }

  // Categorization heuristics based on merchant or keywords
  const lower = text.toLowerCase();
  if (/kopi|coffee|cafe|starbucks|kenangan|fore/i.test(lower)) {
    category = 'Kopi';
  } else if (/makan|restoran|resto|bakso|ayam|mie|soto|nasgor|warung|mcdonald|kfc|hokben/i.test(lower)) {
    category = 'Makan';
  } else if (/gojek|grab|maxim|indrive|toll|parkir|bensin|pertamina|shell/i.test(lower)) {
    category = 'Transport';
  } else if (/indomaret|alfamart|superindo|tokopedia|shopee|blibli/i.test(lower)) {
    category = 'Belanja';
  } else if (/listrik|pln|pdam|wifi|indihome|bpjs|pulsa|paket data/i.test(lower)) {
    category = 'Tagihan';
  } else if (/bioskop|cinema|netflix|spotify|youtube/i.test(lower)) {
    category = 'Hiburan';
  } else if (/apotek|dokter|rumah sakit|klinik/i.test(lower)) {
    category = 'Kesehatan';
  }

  return {
    success: amount !== null,
    amount,
    merchant,
    category,
    type,
    source,
  };
}
