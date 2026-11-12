import { ParseResult, TransactionType } from '../types';
import {
  METHOD_ALIASES,
  TYPE_KEYWORDS,
  CATEGORY_KEYWORDS,
  CATEGORY_DISPLAY_MAP,
  DEFAULT_METHOD,
  DEFAULT_CATEGORY,
  DEFAULT_TYPE,
} from './constants';

export const SLANG_NUMBERS: Record<string, number> = {
  goceng: 5_000,
  ceban: 10_000,
  goban: 50_000,
  cepek: 100_000,
  pekgo: 150_000,
  gopek: 500,
  seceng: 1_000,
  noceng: 2_000,
  noban: 20_000,
  sejeti: 1_000_000,
  sajuta: 1_000_000,
  selawe: 25_000,
  sewu: 1_000,
  sawidak: 60_000,
  setriliun: 1_000_000_000_000,
  semiliar: 1_000_000_000,
  semilyar: 1_000_000_000,
  sejuta: 1_000_000,
  seribu: 1_000,
  seratus: 100,
};

function maskDates(text: string): string {
  // Mask DD/MM/YYYY or DD-MM-YYYY
  let s = text.replace(/\b\d{1,2}[/\-]\d{1,2}[/\-]\d{4}\b/g, ' ');
  // Mask YYYY-MM-DD or YYYY/MM/DD
  s = s.replace(/\b\d{4}[/\-]\d{1,2}[/\-]\d{1,2}\b/g, ' ');
  // Mask DD month (e.g. 2 juni, 15 agustus)
  s = s.replace(
    /\b\d{1,2}\s+(?:jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|agu(?:stus)?|agt|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)\b/gi,
    ' '
  );
  return s;
}

function parseFormattedNumber(raw: string): number {
  if (raw.includes('.') && raw.includes(',')) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      // Indonesian style: 150.000,00
      const parts = raw.split(',');
      const intPart = parseInt(parts[0].replace(/\./g, ''), 10);
      const decPart = parseFloat('0.' + parts[1]);
      return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
    } else {
      // English style: 150,000.00
      const parts = raw.split('.');
      const intPart = parseInt(parts[0].replace(/,/g, ''), 10);
      const decPart = parseFloat('0.' + parts[1]);
      return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
    }
  }

  if (raw.includes(',')) {
    // Check if thousand separator: e.g. 1,500 or 150,000
    if (/^\d{1,3}(?:,\d{3})+$/.test(raw)) {
      return parseInt(raw.replace(/,/g, ''), 10);
    }
    // Else decimal comma: e.g. 150,5
    const parts = raw.split(',');
    const intPart = parseInt(parts[0], 10);
    const decPart = parseFloat('0.' + parts[1]);
    return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
  }

  if (raw.includes('.')) {
    // Check if thousand separator: e.g. 50.000 or 1.500.000
    if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
      return parseInt(raw.replace(/\./g, ''), 10);
    }
    // Else decimal dot: e.g. 150.5
    return Math.round(parseFloat(raw));
  }

  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Parses spelled-out Indonesian numbers (e.g. "dua puluh lima ribu", "tiga ratus ribu", "sejuta", "dua triliun")
 */
export function parseIndonesianWords(str: string): number | null {
  const s = str.toLowerCase().trim();
  if (s === 'setriliun') return 1e12;
  if (s === 'semiliar' || s === 'semilyar') return 1e9;
  if (s === 'sejuta' || s === 'sejeti' || s === 'sajuta') return 1e6;
  if (s === 'seribu' || s === 'sewu') return 1_000;
  if (s === 'seratus') return 100;
  if (s === 'setengah triliun' || s === 'setengah trilliun') return 5e11;
  if (s === 'setengah miliar' || s === 'setengah milyar') return 5e8;
  if (s === 'setengah juta') return 500_000;

  const numMap: Record<string, number> = {
    satu: 1,
    se: 1,
    dua: 2,
    tiga: 3,
    empat: 4,
    lima: 5,
    enam: 6,
    tujuh: 7,
    delapan: 8,
    sembilan: 9,
    sepuluh: 10,
    sebelas: 11,
    duabelas: 12,
    tigabelas: 13,
    empatbelas: 14,
    limabelas: 15,
    enambelas: 16,
    tujuhbelas: 17,
    delapanbelas: 18,
    sembilanbelas: 19,
    seratus: 100,
    seribu: 1000,
    sejuta: 1e6,
    semiliar: 1e9,
    setriliun: 1e12,
  };

  const words = s.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let hasValidWord = false;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (numMap[w] !== undefined) {
      hasValidWord = true;
      if (numMap[w] >= 1000) {
        current = (current === 0 ? 1 : current) * numMap[w];
        total += current;
        current = 0;
      } else if (numMap[w] === 100) {
        current = (current === 0 ? 1 : current) * 100;
      } else {
        current += numMap[w];
      }
    } else if (w === 'belas') {
      current += 10;
      hasValidWord = true;
    } else if (w === 'puluh') {
      current *= 10;
      hasValidWord = true;
    } else if (w === 'ratus') {
      current = (current === 0 ? 1 : current) * 100;
      hasValidWord = true;
    } else if (w === 'ribu') {
      current = (current === 0 ? 1 : current) * 1_000;
      total += current;
      current = 0;
      hasValidWord = true;
    } else if (w === 'juta') {
      current = (current === 0 ? 1 : current) * 1_000_000;
      total += current;
      current = 0;
      hasValidWord = true;
    } else if (w === 'miliar' || w === 'milyar') {
      current = (current === 0 ? 1 : current) * 1_000_000_000;
      total += current;
      current = 0;
      hasValidWord = true;
    } else if (w === 'triliun' || w === 'trilliun') {
      current = (current === 0 ? 1 : current) * 1_000_000_000_000;
      total += current;
      current = 0;
      hasValidWord = true;
    } else {
      return null;
    }
  }

  total += current;
  return hasValidWord && total > 0 ? total : null;
}

/**
 * Extracts a single standalone amount without nested math
 */
function parseBaseAmount(text: string): number {
  // 1. Trillion suffix (triliun / trilliun / trilun / trillion / t)
  const tPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:triliun|trilliun|trilun|trillion|t)\b/i;
  const tMatch = text.match(tPattern);
  if (tMatch) {
    const val = parseFloat(tMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000_000_000_000);
    }
  }

  // 2. Billion suffix (miliar / milyar / bio / billion / b)
  const bPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:miliar|milyar|bio|billion|b)\b/i;
  const bMatch = text.match(bPattern);
  if (bMatch) {
    const val = parseFloat(bMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000_000_000);
    }
  }

  // 3. Million suffix (jt / juta / mio / m / million)
  const jtPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta|mio|m)\b/i;
  const jtMatch = text.match(jtPattern);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000_000);
    }
  }

  // 4. Thousand suffix (k / rb / ribu / kilo / thousand)
  const kPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu|kilo|thousand)\b/i;
  const kMatch = text.match(kPattern);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000);
    }
  }

  // 5. Hundreds (ratus / ratusan)
  const rPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:ratus|ratusan)\b/i;
  const rMatch = text.match(rPattern);
  if (rMatch) {
    const val = parseFloat(rMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 100);
    }
  }

  // 6. Half amounts
  if (/\bsetengah\s+(?:triliun|trilliun)\b/i.test(text)) return 500_000_000_000;
  if (/\bsetengah\s+(?:miliar|milyar)\b/i.test(text)) return 500_000_000;
  if (/\bsetengah\s+juta\b/i.test(text)) return 500_000;

  // 7. Spelled Indonesian compound word numbers (e.g. "dua puluh lima ribu", "tiga ratus ribu", "seratus ribu")
  const wordsPattern = /\b(?:satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|duabelas|tigabelas|belas|puluh|ratus|ribu|juta|miliar|milyar|triliun|trilliun|seratus|seribu|sejuta|semiliar|setriliun)(?:\s+(?:satu|se|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|duabelas|tigabelas|belas|puluh|ratus|ribu|juta|miliar|milyar|triliun|trilliun|seratus|seribu|sejuta|semiliar|setriliun))+\b/gi;
  const wordMatches = text.match(wordsPattern);
  if (wordMatches) {
    for (const match of wordMatches) {
      const parsed = parseIndonesianWords(match);
      if (parsed && parsed > 0) return parsed;
    }
  }

  // 8. Slang & regional numbers (goceng, ceban, goban, cepek, pekgo, etc.)
  const sortedSlang = Object.entries(SLANG_NUMBERS).sort((a, b) => b[0].length - a[0].length);
  for (const [slang, val] of sortedSlang) {
    const regex = new RegExp(`\\b${slang}\\b`, 'i');
    if (regex.test(text)) {
      return val;
    }
  }

  // 9. Explicit Rp / IDR prefix: e.g. Rp 50.000, Rp. 150.000,00, IDR 100.000,00
  const rpPattern = /\b(?:rp\.?|idr)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/i;
  const rpMatch = text.match(rpPattern);
  if (rpMatch) {
    const parsed = parseFormattedNumber(rpMatch[1]);
    if (parsed > 0) return parsed;
  }

  // 10. Standard Indonesian formatted with decimal cents: e.g. 100.000,00 or 150.000,50
  const idrDecimalPattern = /\b(\d{1,3}(?:\.\d{3})+),(\d{1,2})\b/;
  const idrDecMatch = text.match(idrDecimalPattern);
  if (idrDecMatch) {
    const intPart = parseInt(idrDecMatch[1].replace(/\./g, ''), 10);
    const decPart = parseFloat('0.' + idrDecMatch[2]);
    return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
  }

  // 11. Standard English formatted with decimal cents: e.g. 100,000.00
  const enDecimalPattern = /\b(\d{1,3}(?:,\d{3})+)\.(\d{1,2})\b/;
  const enDecMatch = text.match(enDecimalPattern);
  if (enDecMatch) {
    const intPart = parseInt(enDecMatch[1].replace(/,/g, ''), 10);
    const decPart = parseFloat('0.' + enDecMatch[2]);
    return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
  }

  // 12. Thousand-separated integers: e.g. 50.000, 150.000, 1.500.000 or 50,000, 1,500
  const thousandPattern = /\b(\d{1,3}(?:[.,]\d{3})+)\b/g;
  const thousandMatches = [...text.matchAll(thousandPattern)];
  if (thousandMatches.length > 0) {
    const val = parseInt(thousandMatches[0][1].replace(/[.,]/g, ''), 10);
    if (Number.isFinite(val) && val > 0) return val;
  }

  // 13. Plain integers: e.g. 50000
  const plainPattern = /\b\d+\b/g;
  const plainMatches = [...text.matchAll(plainPattern)];
  if (plainMatches.length > 0) {
    const numbers = plainMatches
      .map((m) => parseInt(m[0], 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (numbers.length === 1) return numbers[0];
    if (numbers.length > 1) {
      const nonQty = numbers.filter((n) => n >= 100);
      return nonQty.length > 0 ? Math.max(...nonQty) : numbers[0];
    }
  }

  return 0;
}

export function parseAmount(input: string): number {
  const text = maskDates(input);

  // 1. Math: Split bill ("makan 200k bagi 4", "split 3")
  const splitMatch = text.match(/(.*?)\s*(?:bagi|split)\s*(\d+)\b/i);
  if (splitMatch) {
    const base = parseBaseAmount(splitMatch[1]);
    const divisor = parseInt(splitMatch[2], 10);
    if (base > 0 && divisor > 0) {
      return Math.round(base / divisor);
    }
  }

  // 2. Math: Quantity prefix ("2 x 25k", "3 * 15rb", "2 @ 20k")
  const qtyPrefixMatch = text.match(/\b(\d+)\s*(?:x|\*|@)\s*([0-9.,]+[a-z]*)\b/i);
  if (qtyPrefixMatch) {
    const qty = parseInt(qtyPrefixMatch[1], 10);
    const unitPrice = parseBaseAmount(qtyPrefixMatch[2]);
    if (qty > 0 && unitPrice > 0) {
      return qty * unitPrice;
    }
  }

  // 3. Math: Quantity suffix ("25k x 2", "50rb * 3")
  const qtySuffixMatch = text.match(/\b([0-9.,]+[a-z]*)\s*(?:x|\*)\s*(\d+)\b/i);
  if (qtySuffixMatch) {
    const unitPrice = parseBaseAmount(qtySuffixMatch[1]);
    const qty = parseInt(qtySuffixMatch[2], 10);
    if (qty > 0 && unitPrice > 0) {
      return qty * unitPrice;
    }
  }

  // 4. Math: Discount percentage ("100k diskon 10%", "100k - 10%")
  const discPctMatch = text.match(/(.*?)\s*(?:-|diskon|potongan)\s*(\d+)%/i);
  if (discPctMatch) {
    const base = parseBaseAmount(discPctMatch[1]);
    const pct = parseFloat(discPctMatch[2]);
    if (base > 0 && pct > 0 && pct <= 100) {
      return Math.round(base * (1 - pct / 100));
    }
  }

  // 5. Math: Discount fixed amount ("100k - diskon 20k", "100k - 20k")
  const discFixedMatch = text.match(/(.*?)\s*(?:-|diskon|potongan)\s*([0-9.,]+[a-z]*)\b/i);
  if (discFixedMatch) {
    const base = parseBaseAmount(discFixedMatch[1]);
    const disc = parseBaseAmount(discFixedMatch[2]);
    if (base > 0 && disc > 0 && base > disc) {
      return base - disc;
    }
  }

  // 6. Math: Addition / Shipping / Admin fee ("120k + ongkir 15k", "100k + fee 5k")
  const addMatch = text.match(/(.*?)\s*\+\s*(?:ongkir|fee|biaya|admin|tip)?\s*([0-9.,]+[a-z]*)\b/i);
  if (addMatch) {
    const base = parseBaseAmount(addMatch[1]);
    const extra = parseBaseAmount(addMatch[2]);
    if (base > 0 && extra > 0) {
      return base + extra;
    }
  }

  // Fallback to base single amount
  return parseBaseAmount(text);
}

export function parseTransferWallets(input: string): { from: string; to: string | null } {
  const lowerInput = ' ' + input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const aliases = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);

  let toMethod: string | null = null;
  let fromMethod: string | null = null;

  for (const alias of aliases) {
    const norm = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const toPattern = new RegExp(`\\s(?:ke|to)\\s+${norm}\\s`, 'i');
    if (toPattern.test(lowerInput)) {
      toMethod = METHOD_ALIASES[alias];
      break;
    }
  }

  for (const alias of aliases) {
    const norm = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const fromPattern = new RegExp(`\\s(?:dari|from|pakai)\\s+${norm}\\s`, 'i');
    if (fromPattern.test(lowerInput)) {
      fromMethod = METHOD_ALIASES[alias];
      break;
    }
  }

  if (!fromMethod) {
    const matches: Array<{ method: string; index: number }> = [];
    for (const alias of aliases) {
      const norm = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const idx = lowerInput.indexOf(` ${norm} `);
      if (idx >= 0) {
        const method = METHOD_ALIASES[alias];
        if (method !== toMethod && !matches.some((m) => m.method === method)) {
          matches.push({ method, index: idx });
        }
      }
    }
    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index);
      fromMethod = matches[0].method;
    }
  }

  if (!toMethod && fromMethod) {
    const matches: Array<{ method: string; index: number }> = [];
    for (const alias of aliases) {
      const norm = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const idx = lowerInput.indexOf(` ${norm} `);
      if (idx >= 0) {
        const method = METHOD_ALIASES[alias];
        if (method !== fromMethod && !matches.some((m) => m.method === method)) {
          matches.push({ method, index: idx });
        }
      }
    }
    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index);
      toMethod = matches[0].method;
    }
  }

  return { from: fromMethod || DEFAULT_METHOD, to: toMethod };
}

export function parseMethod(input: string): string {
  const lowerInput = ' ' + input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const aliases = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);
  let bestMatch: { method: string; index: number; length: number } | null = null;

  for (const alias of aliases) {
    const normalizedAlias = alias.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const index = lowerInput.indexOf(` ${normalizedAlias} `);
    if (index >= 0) {
      if (!bestMatch || index < bestMatch.index || (index === bestMatch.index && normalizedAlias.length > bestMatch.length)) {
        bestMatch = { method: METHOD_ALIASES[alias], index, length: normalizedAlias.length };
      }
    }
  }

  return bestMatch?.method || DEFAULT_METHOD;
}

export function parseTransferToMethod(input: string, fromMethod: string): string | null {
  const transfer = parseTransferWallets(input);
  if (transfer.to) return transfer.to;
  return transfer.from !== fromMethod ? transfer.from : null;
}

export function parseType(input: string, isBalanceUpdate: boolean): TransactionType {
  if (isBalanceUpdate) return 'masuk';

  const lowerInput = input.toLowerCase();

  // Transfer verbs and phrasing patterns
  if (
    /\b(tf|transfer|pindah|pindahin|oper|kirim|move)\b/i.test(lowerInput) ||
    /\b(?:dari|from)\s+.+\s+(?:ke|to)\b/i.test(lowerInput)
  ) {
    return 'transfer';
  }

  for (const word of TYPE_KEYWORDS.masuk) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerInput)) return 'masuk';
  }
  for (const word of TYPE_KEYWORDS.keluar) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(lowerInput)) return 'keluar';
  }

  return DEFAULT_TYPE;
}

export function parseCategory(input: string, type: TransactionType): string {
  if (type === 'transfer') return 'Transfer';

  const lowerInput = input.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(lowerInput)) {
        return CATEGORY_DISPLAY_MAP[category] || category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
  }

  return type === 'masuk' ? 'Gaji' : DEFAULT_CATEGORY;
}

export function parseDate(input: string): string {
  const lowerInput = input.toLowerCase();
  const now = new Date();

  // 1. Check relative date "kemarin"
  if (/\bkemarin\b/i.test(lowerInput)) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    return yesterday.toISOString();
  }

  // 2. Check explicit date format (e.g. DD/MM/YYYY or DD-MM-YYYY)
  const explicitPattern = /\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\b/;
  const explicitMatch = input.match(explicitPattern);
  if (explicitMatch) {
    const day = parseInt(explicitMatch[1], 10);
    const month = parseInt(explicitMatch[2], 10) - 1; // 0-indexed
    const year = parseInt(explicitMatch[3], 10);
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1970 && year <= 2100) {
      const targetDate = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(targetDate.getTime())) {
        return targetDate.toISOString();
      }
    }
  }

  // 3. Check "DD month" pattern (e.g. "2 juni" or "02 juni")
  const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
  const wordPattern = /\b(\d{1,2})\s+([a-zA-Z]{3,9})\b/;
  const wordMatch = input.match(wordPattern);
  if (wordMatch) {
    const day = parseInt(wordMatch[1], 10);
    let monthStr = wordMatch[2].toLowerCase().substring(0, 3);
    if (monthStr === 'agt') monthStr = 'agu';
    const monthIndex = months.indexOf(monthStr);
    if (monthIndex !== -1 && day >= 1 && day <= 31) {
      const year = now.getFullYear();
      const targetDate = new Date(year, monthIndex, day, 12, 0, 0);
      if (!isNaN(targetDate.getTime())) {
        return targetDate.toISOString();
      }
    }
  }

  // Default to today
  return now.toISOString();
}

export function parseTransaction(input: string): ParseResult {
  const trimmed = input.trim();
  const lowerInput = trimmed.toLowerCase();

  const isBalanceUpdate =
    /^(?:set\s+)?saldo\b/i.test(lowerInput) && !/^(?:isi|topup|top\s*up)\s+saldo\b/i.test(lowerInput);

  const amount = parseAmount(trimmed);

  if (isBalanceUpdate) {
    const method = parseMethod(trimmed);
    return {
      isBalanceUpdate: true,
      amount,
      method,
      transferToMethod: null,
      rawInput: input,
      transactionDate: new Date().toISOString(),
      tags: [],
      note: '',
      type: 'masuk',
      category: '',
    };
  }

  const type = parseType(trimmed, false);
  const category = parseCategory(trimmed, type);
  const transactionDate = parseDate(trimmed);

  let method = DEFAULT_METHOD;
  let transferToMethod: string | null = null;

  if (type === 'transfer') {
    const transferWallets = parseTransferWallets(trimmed);
    method = transferWallets.from;
    transferToMethod = transferWallets.to;
  } else {
    method = parseMethod(trimmed);
  }

  // Extract hashtags
  const tagPattern = /#[\w]+/g;
  const tagsMatch = trimmed.match(tagPattern);
  const tags = tagsMatch ? tagsMatch.map((t) => t.replace('#', '').toLowerCase()) : [];

  // Extract clean note
  let note = trimmed;
  note = note.replace(tagPattern, ' ');
  note = note
    .replace(/\bkemarin\b/gi, ' ')
    .replace(/\bhari\s+ini\b/gi, ' ')
    .replace(/\b\d{1,2}[/\-]\d{1,2}[/\-]\d{4}\b/g, ' ')
    .replace(/\b\d{4}[/\-]\d{1,2}[/\-]\d{1,2}\b/g, ' ')
    .replace(
      /\b\d{1,2}\s+(?:jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|jun(?:i)?|jul(?:i)?|agu(?:stus)?|agt|sep(?:tember)?|okt(?:ober)?|nov(?:ember)?|des(?:ember)?)\b/gi,
      ' '
    );

  // Remove math operators and modifiers
  note = note
    .replace(/(?:bagi|split)\s*\d+\b/gi, ' ')
    .replace(/\b\d+\s*(?:x|\*|@)\s*/gi, ' ')
    .replace(/\s*(?:x|\*)\s*\d+\b/gi, ' ')
    .replace(/(?:-|diskon|potongan)\s*\d+%/gi, ' ')
    .replace(/(?:-|diskon|potongan)\s*/gi, ' ')
    .replace(/\+\s*(?:ongkir|fee|biaya|admin|tip)?\s*/gi, ' ');

  // Remove numbers with suffixes
  note = note
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:triliun|trilliun|trilun|trillion|t)\b/gi, ' ')
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:miliar|milyar|bio|billion|b)\b/gi, ' ')
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta|mio|m)\b/gi, ' ')
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu|kilo|thousand)\b/gi, ' ')
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:ratus|ratusan)\b/gi, ' ')
    .replace(/\b(?:rp\.?|idr)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/gi, ' ')
    .replace(/\b(\d{1,3}(?:\.\d{3})+),(\d{1,2})\b/g, ' ')
    .replace(/\b(\d{1,3}(?:,\d{3})+)\.(\d{1,2})\b/g, ' ')
    .replace(/\b(\d{1,3}(?:[.,]\d{3})+)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ');

  // Remove half words and slang numbers
  note = note
    .replace(/\bsetengah\s+(?:triliun|trilliun|miliar|milyar|juta)\b/gi, ' ')
    .replace(
      /\b(?:goceng|ceban|goban|cepek|pekgo|gopek|seceng|noceng|noban|sejeti|sajuta|selawe|sewu|sawidak|setriliun|semiliar|semilyar|sejuta|seribu|seratus)\b/gi,
      ' '
    );

  if (type === 'transfer') {
    note = note
      .replace(/\b(?:transfer|tf|pindah|pindahin|oper|kirim|move)\b/gi, ' ')
      .replace(/\b(?:ke|to|dari|from|pakai)\b/gi, ' ');
  }

  const aliasList = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliasList) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    note = note.replace(new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'gi'), ' ');
  }

  note = note.replace(/\s+/g, ' ').trim();
  if (type === 'transfer' && (!note || note === '-')) {
    note =
      transferToMethod && transferToMethod !== 'unknown'
        ? `Transfer ke ${transferToMethod.toUpperCase()}`
        : 'Transfer';
  } else if (!note) {
    note = '-';
  }

  return {
    isBalanceUpdate: false,
    type,
    category,
    amount,
    method,
    transferToMethod,
    note,
    tags,
    rawInput: input,
    transactionDate,
  };
}
