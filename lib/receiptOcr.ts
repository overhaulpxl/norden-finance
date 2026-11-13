import { parseCategory } from './parser';
import { formatRupiahInput } from './format';

export interface ParsedReceipt {
  amount: number;
  merchant: string;
  category: string;
  method?: string;
  date: string;
  items: Array<{
    id: string;
    name: string;
    qty: string;
    price: string;
  }>;
  suggestedText: string;
  rawText: string;
}

const INDONESIAN_MERCHANTS: Array<{ pattern: RegExp; name: string; category: string }> = [
  { pattern: /indomar(?:et|co)|indomart/i, name: 'Indomaret', category: 'Belanja' },
  { pattern: /alfamar(?:t|co)|sumber\s*alfaria/i, name: 'Alfamart', category: 'Belanja' },
  { pattern: /alfamidi|midi\s*utama/i, name: 'Alfamidi', category: 'Belanja' },
  { pattern: /super\s*indo|lion\s*superindo/i, name: 'Superindo', category: 'Belanja' },
  { pattern: /hypermart|matahari\s*putra/i, name: 'Hypermart', category: 'Belanja' },
  { pattern: /transmart|carrefour/i, name: 'Transmart', category: 'Belanja' },
  { pattern: /lawson/i, name: 'Lawson', category: 'Makanan' },
  { pattern: /family\s*mart/i, name: 'FamilyMart', category: 'Makanan' },
  { pattern: /starbucks|sari\s*coffee/i, name: 'Starbucks', category: 'Makanan' },
  { pattern: /kopi\s*kenangan/i, name: 'Kopi Kenangan', category: 'Makanan' },
  { pattern: /point\s*coffee/i, name: 'Point Coffee', category: 'Makanan' },
  { pattern: /fore\s*coffee/i, name: 'Fore Coffee', category: 'Makanan' },
  { pattern: /janji\s*jiwa/i, name: 'Janji Jiwa', category: 'Makanan' },
  { pattern: /mixue/i, name: 'Mixue', category: 'Makanan' },
  { pattern: /chatime/i, name: 'Chatime', category: 'Makanan' },
  { pattern: /solaria/i, name: 'Solaria', category: 'Makanan' },
  { pattern: /kfc|fast\s*food\s*indonesia/i, name: 'KFC', category: 'Makanan' },
  { pattern: /mcdonald|mcd|rekso\s*nasional/i, name: "McDonald's", category: 'Makanan' },
  { pattern: /hokben|hoka\s*hoka\s*bento/i, name: 'HokBen', category: 'Makanan' },
  { pattern: /j\.?co|jco/i, name: 'J.CO Donuts', category: 'Makanan' },
  { pattern: /pertamina|spbu/i, name: 'SPBU Pertamina', category: 'Bensin' },
  { pattern: /shell/i, name: 'SPBU Shell', category: 'Bensin' },
  { pattern: /guardian/i, name: 'Guardian', category: 'Kesehatan' },
  { pattern: /watsons/i, name: 'Watsons', category: 'Kesehatan' },
  { pattern: /century/i, name: 'Century Healthcare', category: 'Kesehatan' },
  { pattern: /kimia\s*farma/i, name: 'Kimia Farma', category: 'Kesehatan' },
];

/**
 * Preprocess image on canvas with adaptive contrast & thermal binarization
 * specifically optimized for faint print, wrinkled thermal paper, and camera shadows.
 */
export async function preprocessReceiptImage(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');

      // Maintain crisp resolution for small receipt characters (min width 1000px)
      let w = img.width;
      let h = img.height;
      const minWidth = 1000;

      if (w < minWidth && h > w) {
        const scale = minWidth / w;
        w = minWidth;
        h = Math.round(h * scale);
      } else if (w > 1800 || h > 2400) {
        const ratio = Math.min(1800 / w, 2400 / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Calculate luminance and range
      let min = 255;
      let max = 0;
      const grays = new Float32Array(w * h);

      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        grays[p] = gray;
        if (gray < min) min = gray;
        if (gray > max) max = gray;
      }

      const range = max - min || 1;

      // Sigmoid-style contrast enhancement:
      // Dark text is pushed deeper to black, faint paper background is pushed to clean white
      for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        const g = grays[p];
        const norm = (g - min) / range;
        let enhanced: number;

        if (norm < 0.45) {
          enhanced = norm * 0.5 * 255;
        } else if (norm > 0.7) {
          enhanced = 255;
        } else {
          enhanced = ((norm - 0.45) / 0.25) * 255;
        }

        const finalVal = Math.max(0, Math.min(255, Math.round(enhanced)));
        d[i] = finalVal;
        d[i + 1] = finalVal;
        d[i + 2] = finalVal;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load receipt image into canvas'));
    };

    img.src = url;
  });
}

/**
 * Parse raw OCR text into structured receipt financial data
 */
export function parseReceiptOcrText(rawText: string): ParsedReceipt {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Total Amount extraction
  let amount = 0;
  const primaryTotalRegexes = [
    /\b(?:grand\s*total|total\s*akhir|total\s*bayar|tot\.?\s*bayar|total\s*harga|total\s*belanja|total\s*pembelian)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /\b(?:total|jumlah\s*bayar|tagihan|netto)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /\b(?:subtotal|sub\s*total)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
  ];

  // Scan lines from bottom upwards (totals are typically near the end of receipt)
  for (const regex of primaryTotalRegexes) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/\b(?:kembali|kembalian|change|diskon|potongan|hemat|ppn|pajak|pb1)\b/i.test(line)) {
        continue;
      }
      const match = line.match(regex);
      if (match) {
        const numStr = match[1].replace(/[^0-9]/g, '');
        const parsed = parseInt(numStr, 10);
        if (Number.isFinite(parsed) && parsed > 0 && parsed <= 500_000_000) {
          amount = parsed;
          break;
        }
      }
    }
    if (amount > 0) break;
  }

  // Fallback 1: check cash/tunai/qris/debit lines if no explicit total line
  if (amount === 0) {
    const paymentRegex = /\b(?:cash|tunai|debit|qris|bca|mandiri)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/\b(?:kembali|kembalian|change)\b/i.test(line)) continue;
      const match = line.match(paymentRegex);
      if (match) {
        const numStr = match[1].replace(/[^0-9]/g, '');
        const parsed = parseInt(numStr, 10);
        if (Number.isFinite(parsed) && parsed > 0 && parsed <= 500_000_000) {
          amount = parsed;
          break;
        }
      }
    }
  }

  // Fallback 2: largest thousand-separated number
  if (amount === 0) {
    const fallbackMatches = rawText.match(/\b\d{1,3}(?:[.,]\d{3})+\b/g);
    if (fallbackMatches && fallbackMatches.length > 0) {
      const parsedNumbers = fallbackMatches
        .map((m) => parseInt(m.replace(/[.,]/g, ''), 10))
        .filter((n) => Number.isFinite(n) && n >= 1000 && n <= 100_000_000);
      if (parsedNumbers.length > 0) {
        amount = Math.max(...parsedNumbers);
      }
    }
  }

  // 2. Merchant & Brand extraction
  let merchant = 'Struk Belanja';
  let detectedCategory = '';

  const ignorePatterns = [
    /struk/i,
    /receipt/i,
    /faktur/i,
    /selamat/i,
    /welcome/i,
    /terima\s*kasih/i,
    /^\d+$/,
    /^[0-9/\-:\s]+$/,
    /jl\./i,
    /jalan/i,
    /telp/i,
    /npwp/i,
    /kasir/i,
    /pos/i,
  ];

  // Try matching against known Indonesian retail chains first
  for (const line of lines.slice(0, 8)) {
    for (const chain of INDONESIAN_MERCHANTS) {
      if (chain.pattern.test(line)) {
        const clean = line.replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
        if (!/pt\s+/i.test(clean) && clean.length <= 40) {
          merchant = clean;
        } else {
          const outletLine = lines.slice(0, 8).find((l) => !/pt\s+/i.test(l) && chain.pattern.test(l));
          merchant = outletLine ? outletLine.replace(/[^a-zA-Z0-9\s&.-]/g, '').trim() : chain.name;
        }
        detectedCategory = chain.category;
        break;
      }
    }
    if (detectedCategory) break;
  }

  // Fallback to top header lines if not a known chain
  if (!detectedCategory) {
    for (const line of lines.slice(0, 6)) {
      const cleanLine = line.replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
      if (cleanLine.length >= 3 && !ignorePatterns.some((p) => p.test(cleanLine))) {
        merchant = cleanLine;
        break;
      }
    }
  }

  // 3. Payment Method detection
  let method = 'cash';
  if (/\bqris\b/i.test(rawText)) {
    method = 'qris';
  } else if (/\bgopay\b/i.test(rawText)) {
    method = 'gopay';
  } else if (/\b(?:shopeepay|spay)\b/i.test(rawText)) {
    method = 'shopeepay';
  } else if (/\bdana\b/i.test(rawText)) {
    method = 'dana';
  } else if (/\bovo\b/i.test(rawText)) {
    method = 'ovo';
  }

  // 4. Date extraction
  let date = new Date().toISOString();
  const dateMatch = rawText.match(/\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const year = parseInt(dateMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 2000 && year <= 2100) {
      date = new Date(year, month, day, 12, 0, 0).toISOString();
    }
  }

  // 5. Line item extraction heuristics (supports single-line and 2-line receipt items)
  const items: Array<{ id: string; name: string; qty: string; price: string }> = [];
  const singleLineRegex = /^(\d+)?\s*(.*?)\s+(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,9})$/i;
  const qtyPriceLineRegex =
    /^(\d+)\s*(?:x|\*|pcs)\s*(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)\s+(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      /\b(?:total|subtotal|cash|tunai|kembali|kembalian|ppn|pajak|pb1|diskon|promo|change|tax|card|debit|qris|terima\s*kasih)\b/i.test(
        line
      )
    ) {
      continue;
    }

    // 2-line format (line 1: Item name, line 2: 2 x 10.000 20.000)
    const twoLineMatch = line.match(qtyPriceLineRegex);
    if (twoLineMatch && i > 0) {
      const prevLine = lines[i - 1].replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
      const rawQty = parseInt(twoLineMatch[1], 10) || 1;
      const rawPrice = twoLineMatch[3].replace(/[^0-9]/g, '');
      const parsedPrice = parseInt(rawPrice, 10);

      if (prevLine.length >= 2 && parsedPrice > 0 && (amount === 0 || parsedPrice <= amount)) {
        items.push({
          id: Math.random().toString(),
          name: prevLine,
          qty: String(rawQty),
          price: formatRupiahInput(String(parsedPrice)),
        });
        continue;
      }
    }

    // Single-line format e.g. "1 TEH BOTOL 250ML 5.000"
    const singleMatch = line.match(singleLineRegex);
    if (singleMatch) {
      const rawQty = singleMatch[1] ? parseInt(singleMatch[1], 10) : 1;
      const itemName = singleMatch[2].trim();
      const rawPrice = singleMatch[3].replace(/[^0-9]/g, '');
      const parsedPrice = parseInt(rawPrice, 10);

      if (itemName.length >= 2 && parsedPrice > 0 && (amount === 0 || parsedPrice < amount)) {
        items.push({
          id: Math.random().toString(),
          name: itemName,
          qty: String(rawQty || 1),
          price: formatRupiahInput(String(parsedPrice)),
        });
      }
    }
  }

  // Provide fallback line item if none parsed
  if (items.length === 0 && amount > 0) {
    items.push({
      id: Math.random().toString(),
      name: merchant,
      qty: '1',
      price: formatRupiahInput(String(amount)),
    });
  }

  let category = detectedCategory || parseCategory(merchant, 'keluar');
  if (category === 'Lain-lain' || !category) {
    category = parseCategory(merchant + ' ' + rawText, 'keluar');
  }
  if (!category || category === 'Lain-lain') {
    category = 'Belanja';
  }

  const suggestedText = amount > 0 ? `${amount} ${merchant} ${method}` : '';

  return {
    amount,
    merchant,
    category,
    method,
    date,
    items,
    suggestedText,
    rawText,
  };
}

/**
 * 100% Offline client-side OCR scan using Tesseract.js with canvas pre-processing
 */
export async function scanReceiptOffline(
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<ParsedReceipt> {
  const canvas = await preprocessReceiptImage(file);
  try {
    const Tesseract = await import('tesseract.js');

    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const text = result?.data?.text;
    if (text && text.trim().length > 0) {
      return parseReceiptOcrText(text);
    }
  } catch (err) {
    console.warn('Tesseract offline engine error:', err);
  }

  // Graceful fallback if OCR engine fails or yields empty text
  const fallbackName =
    file instanceof File ? file.name.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ') : 'Struk Belanja';
  return parseReceiptOcrText(fallbackName);
}
