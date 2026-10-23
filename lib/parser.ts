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

export function parseAmount(input: string): number {
  const text = maskDates(input);

  // 1. Million suffix (jt / juta): e.g. 1.5jt, 1,5jt, 2 juta, Rp 1,5jt
  const jtPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i;
  const jtMatch = text.match(jtPattern);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000_000);
    }
  }

  // 2. Thousand suffix (k / rb / ribu): e.g. 15k, 15rb, 25 ribu, 2,5k, 2.5k
  const kPattern = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)\b/i;
  const kMatch = text.match(kPattern);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    if (Number.isFinite(val) && val > 0) {
      return Math.round(val * 1_000);
    }
  }

  // 3. Explicit Rp / IDR prefix: e.g. Rp 50.000, Rp. 150.000,00, IDR 100.000,00
  const rpPattern = /\b(?:rp\.?|idr)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/i;
  const rpMatch = text.match(rpPattern);
  if (rpMatch) {
    const parsed = parseFormattedNumber(rpMatch[1]);
    if (parsed > 0) return parsed;
  }

  // 4. Standard Indonesian formatted with decimal cents: e.g. 100.000,00 or 150.000,50
  const idrDecimalPattern = /\b(\d{1,3}(?:\.\d{3})+),(\d{1,2})\b/;
  const idrDecMatch = text.match(idrDecimalPattern);
  if (idrDecMatch) {
    const intPart = parseInt(idrDecMatch[1].replace(/\./g, ''), 10);
    const decPart = parseFloat('0.' + idrDecMatch[2]);
    return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
  }

  // 5. Standard English formatted with decimal cents: e.g. 100,000.00
  const enDecimalPattern = /\b(\d{1,3}(?:,\d{3})+)\.(\d{1,2})\b/;
  const enDecMatch = text.match(enDecimalPattern);
  if (enDecMatch) {
    const intPart = parseInt(enDecMatch[1].replace(/,/g, ''), 10);
    const decPart = parseFloat('0.' + enDecMatch[2]);
    return Math.round(intPart + (Number.isFinite(decPart) ? decPart : 0));
  }

  // 6. Thousand-separated integers: e.g. 50.000, 150.000, 1.500.000 or 50,000, 1,500
  const thousandPattern = /\b(\d{1,3}(?:[.,]\d{3})+)\b/g;
  const thousandMatches = [...text.matchAll(thousandPattern)];
  if (thousandMatches.length > 0) {
    const val = parseInt(thousandMatches[0][1].replace(/[.,]/g, ''), 10);
    if (Number.isFinite(val) && val > 0) return val;
  }

  // 7. Plain integers: e.g. 50000
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

  if (/\b(tf|transfer)\b/i.test(lowerInput)) {
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
  note = note
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/gi, ' ')
    .replace(/(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:k|rb|ribu)\b/gi, ' ')
    .replace(/\b(?:rp\.?|idr)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\b/gi, ' ')
    .replace(/\b(\d{1,3}(?:\.\d{3})+),(\d{1,2})\b/g, ' ')
    .replace(/\b(\d{1,3}(?:,\d{3})+)\.(\d{1,2})\b/g, ' ')
    .replace(/\b(\d{1,3}(?:[.,]\d{3})+)\b/g, ' ')
    .replace(/\b\d+\b/g, ' ');

  if (type === 'transfer') {
    note = note
      .replace(/\b(?:transfer|tf)\b/gi, ' ')
      .replace(/\b(?:ke|to|dari|from|pakai)\b/gi, ' ');
  }

  const aliasList = Object.keys(METHOD_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliasList) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    note = note.replace(new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'gi'), ' ');
  }

  note = note.replace(/\s+/g, ' ').trim();
  if (type === 'transfer' && (!note || note === '-')) {
    note = transferToMethod && transferToMethod !== 'unknown'
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
