import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptOcrText } from '../lib/receiptOcr';

describe('Receipt OCR Parser (Tesseract Offline Engine)', () => {
  it('extracts merchant, total, date, and line items from Indomaret thermal receipt', () => {
    const rawReceipt = `
INDOMARET KEMANG
JL. KEMANG RAYA NO. 12 JAKARTA
08/11/2026 14:30
1 TEH BOTOL 250ML 5.000
1 ROTI COKLAT 12.000
SUBTOTAL 17.000
PPN 1.700
TOTAL 18.700
CASH 20.000
KEMBALIAN 1.300
TERIMA KASIH ATAS KUNJUNGAN ANDA
    `;

    const parsed = parseReceiptOcrText(rawReceipt);
    assert.equal(parsed.amount, 18700);
    assert.equal(parsed.merchant, 'INDOMARET KEMANG');
    assert.equal(parsed.category, 'Belanja');
    assert.ok(parsed.items.length >= 1);
    assert.equal(parsed.suggestedText, '18700 INDOMARET KEMANG cash');
  });

  it('extracts grand total and restaurant category from restaurant bill', () => {
    const rawBill = `
SOLARIA GRAND INDONESIA
FAKTUR: 98124
10-11-2026
NASI GORENG SPECIAL 45.000
ES TEH MANIS 10.000
SUBTOTAL 55.000
SERVICE CHARGE 2.750
PB1 10% 5.775
GRAND TOTAL 63.525
CARD 63.525
    `;

    const parsed = parseReceiptOcrText(rawBill);
    assert.equal(parsed.amount, 63525);
    assert.equal(parsed.merchant, 'SOLARIA GRAND INDONESIA');
    assert.equal(parsed.category, 'Makanan');
    assert.equal(parsed.suggestedText, '63525 SOLARIA GRAND INDONESIA cash');
  });

  it('handles receipt with simple TOTAL keyword and fallback category', () => {
    const rawSimple = `
KOPI KENANGAN
TOTAL: Rp 28.000
TUNAI: Rp 50.000
    `;

    const parsed = parseReceiptOcrText(rawSimple);
    assert.equal(parsed.amount, 28000);
    assert.equal(parsed.merchant, 'KOPI KENANGAN');
    assert.equal(parsed.category, 'Makanan');
    assert.equal(parsed.suggestedText, '28000 KOPI KENANGAN cash');
  });
});
