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

  it('normalizes PT Sumber Alfaria Trijaya to Alfamart and detects QRIS payment method', () => {
    const rawAlfamart = `
PT SUMBER ALFARIA TRIJAYA TBK
ALFAMART CIPETE 2
JL. CIPETE RAYA NO. 88
TGL: 12-11-2026 19:45
BEAR BRAND 189ML
1 * 10.500 10.500
AQUA 600ML
2 * 3.500 7.000
TOTAL BELANJA: 17.500
PEMBAYARAN: QRIS
BAYAR: 17.500
KEMBALIAN: 0
    `;

    const parsed = parseReceiptOcrText(rawAlfamart);
    assert.equal(parsed.amount, 17500);
    assert.ok(/alfamart/i.test(parsed.merchant));
    assert.equal(parsed.category, 'Belanja');
    assert.equal(parsed.method, 'qris');
    assert.equal(parsed.suggestedText, `17500 ${parsed.merchant} qris`);
    assert.ok(parsed.items.length >= 2);
  });

  it('correctly detects SPBU Pertamina and maps category to Bensin', () => {
    const rawSpbu = `
SPBU PERTAMINA 31.12345
JL. MT HARYONO KAV 10
PERTAMAX
LITER: 20.00
TOTAL: Rp 260.000
TUNAI: Rp 300.000
KEMBALIAN: Rp 40.000
TERIMA KASIH
    `;

    const parsed = parseReceiptOcrText(rawSpbu);
    assert.equal(parsed.amount, 260000);
    assert.equal(parsed.merchant, 'SPBU PERTAMINA 31.12345');
    assert.equal(parsed.category, 'Bensin');
    assert.equal(parsed.suggestedText, '260000 SPBU PERTAMINA 31.12345 cash');
  });
});
