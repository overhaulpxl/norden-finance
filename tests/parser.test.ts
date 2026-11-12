import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, parseCategory, parseTransaction, parseType } from '../lib/parser';

describe('Transaction Natural Language Parser', () => {
  it('parses thousand suffixes (k, rb, ribu)', () => {
    assert.equal(parseAmount('kopi 15k'), 15000);
    assert.equal(parseAmount('makan 25rb'), 25000);
    assert.equal(parseAmount('bensin 50 ribu'), 50000);
    assert.equal(parseAmount('parkir 2,5k'), 2500);
  });

  it('parses million suffixes (jt, juta, m, mio)', () => {
    assert.equal(parseAmount('bonus 1.5jt'), 1500000);
    assert.equal(parseAmount('gaji 2 juta'), 2000000);
    assert.equal(parseAmount('investasi 5m'), 5000000);
    assert.equal(parseAmount('proyek 12m'), 12000000);
    assert.equal(parseAmount('dividen 2.5mio'), 2500000);
  });

  it('parses explicit Rp and IDR formats', () => {
    assert.equal(parseAmount('Rp 50.000'), 50000);
    assert.equal(parseAmount('IDR 150.000,00'), 150000);
    assert.equal(parseAmount('rp. 25000'), 25000);
  });

  it('correctly classifies transaction type', () => {
    assert.equal(parseType('pemasukan 3k bni', false), 'masuk');
    assert.equal(parseType('salary 10m', false), 'masuk');
    assert.equal(parseType('payroll 5m', false), 'masuk');
    assert.equal(parseType('income 500k', false), 'masuk');
    assert.equal(parseType('beli makan 25k', false), 'keluar');
    assert.equal(parseType('tf bca ke mandiri 50k', false), 'transfer');
  });

  it('parses category keywords including makanan', () => {
    assert.equal(parseCategory('makanan enak 35k', 'keluar'), 'Makanan');
    assert.equal(parseCategory('ayam geprek 20k', 'keluar'), 'Makanan');
    assert.equal(parseCategory('kopi susu 18k', 'keluar'), 'Makanan');
  });

  it('does not collide gojek with gopay wallet alias', () => {
    const result = parseTransaction('gojek 25k');
    assert.equal(result.amount, 25000);
    // method should default to cash or unknown, not gopay
    assert.notEqual(result.method, 'gopay');
    assert.ok(result.note?.includes('gojek'));
  });

  it('parses full transaction "pemasukan 3k bni"', () => {
    const result = parseTransaction('pemasukan 3k bni');
    assert.equal(result.type, 'masuk');
    assert.equal(result.amount, 3000);
    assert.equal(result.method, 'bni');
  });

  it('parses full transaction with million suffix "gaji 5m bca"', () => {
    const result = parseTransaction('gaji 5m bca');
    assert.equal(result.type, 'masuk');
    assert.equal(result.amount, 5000000);
    assert.equal(result.method, 'bca');
  });

  it('parses trillion suffixes (triliun, trilliun, t)', () => {
    assert.equal(parseAmount('investasi 1 trilliun bca'), 1000000000000);
    assert.equal(parseAmount('2.5 triliun'), 2500000000000);
    assert.equal(parseAmount('500t'), 500000000000000);
    assert.equal(parseAmount('setriliun'), 1000000000000);
    assert.equal(parseAmount('setengah triliun'), 500000000000);
  });

  it('parses billion suffixes (miliar, milyar, b, bio)', () => {
    assert.equal(parseAmount('modal 1 miliar'), 1000000000);
    assert.equal(parseAmount('pendanaan 2.5b'), 2500000000);
    assert.equal(parseAmount('omset 10 bio'), 10000000000);
    assert.equal(parseAmount('semiliar'), 1000000000);
    assert.equal(parseAmount('setengah miliar'), 500000000);
  });

  it('parses Indonesian slang and regional numbers', () => {
    assert.equal(parseAmount('kopi goceng'), 5000);
    assert.equal(parseAmount('makan ceban'), 10000);
    assert.equal(parseAmount('bensin goban'), 50000);
    assert.equal(parseAmount('baju cepek'), 100000);
    assert.equal(parseAmount('pekgo'), 150000);
    assert.equal(parseAmount('sejeti'), 1000000);
    assert.equal(parseAmount('selawe'), 25000);
    assert.equal(parseAmount('sewu'), 1000);
    assert.equal(parseAmount('sejuta'), 1000000);
    assert.equal(parseAmount('seratus ribu'), 100000);
    assert.equal(parseAmount('setengah juta'), 500000);
  });

  it('parses math operations: quantities, discounts, split bills, and surcharges', () => {
    // Quantity prefix
    assert.equal(parseAmount('kopi 2 x 25k'), 50000);
    assert.equal(parseAmount('snack 3 * 15rb'), 45000);
    assert.equal(parseAmount('roti 2 @ 20k'), 40000);

    // Quantity suffix
    assert.equal(parseAmount('kopi 25k x 3'), 75000);

    // Split bill
    assert.equal(parseAmount('makan 200k bagi 4'), 50000);
    assert.equal(parseAmount('nongkrong 150k split 3'), 50000);

    // Discount percentage
    assert.equal(parseAmount('sepatu 100k diskon 10%'), 90000);
    assert.equal(parseAmount('jaket 200k - 20%'), 160000);

    // Discount fixed amount
    assert.equal(parseAmount('baju 100k - diskon 20k'), 80000);
    assert.equal(parseAmount('belanja 150k - 30k'), 120000);

    // Surcharges & Ongkir
    assert.equal(parseAmount('sepatu 120k + ongkir 15k'), 135000);
    assert.equal(parseAmount('buku 50k + fee 5k'), 55000);
  });

  it('cleans notes accurately without leaking multipliers or promo tokens', () => {
    const r1 = parseTransaction('kopi 2 x 25k gopay');
    assert.equal(r1.amount, 50000);
    assert.equal(r1.method, 'gopay');
    assert.equal(r1.note, 'kopi');

    const r2 = parseTransaction('makan 200k bagi 4 cash');
    assert.equal(r2.amount, 50000);
    assert.equal(r2.method, 'cash');
    assert.equal(r2.note, 'makan');

    const r3 = parseTransaction('investasi 1 trilliun bca');
    assert.equal(r3.amount, 1000000000000);
    assert.equal(r3.method, 'bca');
    assert.equal(r3.category, 'Investasi');
    assert.equal(r3.note, 'investasi');

    const r4 = parseTransaction('sepatu 100k diskon 10% bca');
    assert.equal(r4.amount, 90000);
    assert.equal(r4.method, 'bca');
    assert.equal(r4.note, 'sepatu');
  });
});
