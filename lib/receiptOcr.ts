import { parseCategory } from './parser';
import { formatRupiahInput } from './format';

export interface ParsedReceipt {
  amount: number;
  merchant: string;
  category: string;
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

/**
 * Preprocess image on canvas with grayscale and contrast boost
 * specifically optimized for thermal paper and smartphone camera receipts.
 */
export async function preprocessReceiptImage(file: File | Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxDim = 1600;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
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

      // Grayscale & contrast enhancement
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Simple high-contrast stretching
        const contrast = gray > 140 ? 255 : Math.max(0, gray - 20);
        d[i] = contrast;
        d[i + 1] = contrast;
        d[i + 2] = contrast;
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
  const totalRegexes = [
    /\b(?:grand\s*total|total\s*akhir|total\s*bayar)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /\b(?:total|jumlah\s*bayar|tagihan|netto)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /\b(?:subtotal|sub\s*total)\b\s*[:=]?\s*(?:rp\.?\s*)?([0-9.,]+)/i,
    /(?:rp\.?\s*)([0-9]{1,3}(?:\.[0-9]{3})+)/i,
  ];

  for (const regex of totalRegexes) {
    const match = rawText.match(regex);
    if (match) {
      const numStr = match[1].replace(/[^0-9]/g, '');
      const parsed = parseInt(numStr, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 2. Merchant extraction from header lines
  let merchant = 'Struk Belanja';
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

  for (const line of lines.slice(0, 6)) {
    const cleanLine = line.replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
    if (cleanLine.length >= 3 && !ignorePatterns.some((p) => p.test(cleanLine))) {
      merchant = cleanLine;
      break;
    }
  }

  // 3. Date extraction
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

  // 4. Line item extraction heuristics (e.g. "1 Kopi Susu 18.000")
  const items: Array<{ id: string; name: string; qty: string; price: string }> = [];
  const itemLineRegex = /^(\d+)?\s*(.*?)\s+(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,9})$/i;

  for (const line of lines) {
    // Skip lines that look like totals, tax, changes, discounts
    if (
      /\b(?:total|subtotal|cash|tunai|kembali|kembalian|ppn|pajak|diskon|promo|change|tax)\b/i.test(
        line
      )
    ) {
      continue;
    }

    const itemMatch = line.match(itemLineRegex);
    if (itemMatch) {
      const rawQty = itemMatch[1] ? parseInt(itemMatch[1], 10) : 1;
      const itemName = itemMatch[2].trim();
      const rawPrice = itemMatch[3].replace(/[^0-9]/g, '');
      const parsedPrice = parseInt(rawPrice, 10);

      if (itemName.length >= 2 && parsedPrice > 0 && parsedPrice < amount) {
        items.push({
          id: Math.random().toString(),
          name: itemName,
          qty: String(rawQty || 1),
          price: formatRupiahInput(String(parsedPrice)),
        });
      }
    }
  }

  // If no individual line items were parsed, provide a single line item with total
  if (items.length === 0 && amount > 0) {
    items.push({
      id: Math.random().toString(),
      name: merchant,
      qty: '1',
      price: formatRupiahInput(String(amount)),
    });
  }

  const category = parseCategory(merchant + ' ' + rawText, 'keluar');
  const suggestedText = amount > 0 ? `${amount} ${merchant} cash` : '';

  return {
    amount,
    merchant,
    category,
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
  const Tesseract = await import('tesseract.js');

  const {
    data: { text },
  } = await Tesseract.recognize(canvas, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return parseReceiptOcrText(text);
}
