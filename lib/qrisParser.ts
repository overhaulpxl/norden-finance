export interface QrisParsed {
  isQris: boolean;
  amount: number;
  merchantName: string;
  merchantCity: string;
  category: string;
  currency: string;
  mcc: string;
}

/**
 * Standard EMVCo TLV Parser for Indonesian QRIS payloads
 */
export function parseQrisTlv(payload: string): Record<string, string> {
  const tags: Record<string, string> = {};
  let i = 0;
  const str = payload.trim();

  // Find start of EMVCo payload '000201' if padded with URL or prefix
  const startIndex = str.indexOf('000201');
  if (startIndex === -1) return tags;

  i = startIndex;
  while (i + 4 <= str.length) {
    const tag = str.substring(i, i + 2);
    const lengthStr = str.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);
    if (Number.isNaN(length) || length < 0 || i + 4 + length > str.length) {
      break;
    }
    const value = str.substring(i + 4, i + 4 + length);
    tags[tag] = value;
    i += 4 + length;
  }

  return tags;
}

/**
 * Parses raw QRIS string into transaction details
 */
export function parseQrisPayload(input: string): QrisParsed | null {
  if (!input || !input.includes('000201')) {
    return null;
  }

  const tags = parseQrisTlv(input);
  if (tags['00'] !== '01') {
    return null;
  }

  // Tag 54: Transaction Amount
  let amount = 0;
  if (tags['54']) {
    const parsed = parseFloat(tags['54']);
    if (Number.isFinite(parsed) && parsed > 0) {
      amount = Math.round(parsed);
    }
  }

  // Tag 59: Merchant Name
  const merchantName = (tags['59'] || 'QRIS Merchant').trim();

  // Tag 60: Merchant City
  const merchantCity = (tags['60'] || '').trim();

  // Tag 52: Merchant Category Code (MCC)
  const mcc = tags['52'] || '';

  // Tag 53: Currency (360 is IDR)
  const currency = tags['53'] === '360' ? 'IDR' : tags['53'] || 'IDR';

  // Category mapping from MCC or Merchant Name
  let category = 'Belanja';
  const foodMccs = ['5812', '5814', '5462', '5499'];
  const transportMccs = ['4121', '5541', '5542', '4111'];
  const healthMccs = ['8011', '8021', '8099', '5912'];

  if (foodMccs.includes(mcc)) {
    category = 'Makanan';
  } else if (transportMccs.includes(mcc)) {
    category = 'Transportasi';
  } else if (healthMccs.includes(mcc)) {
    category = 'Kesehatan';
  } else {
    category = 'Belanja';
  }

  return {
    isQris: true,
    amount,
    merchantName,
    merchantCity,
    category,
    currency,
    mcc,
  };
}
