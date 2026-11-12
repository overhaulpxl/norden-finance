import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAmount,
  parseCategory,
  parseTransaction,
  parseType,
  parseMultipleTransactions,
} from '../lib/parser';
import { parseQrisPayload } from '../lib/qrisParser';

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

  it('parses Indonesian QRIS EMVCo TLV payloads', () => {
    const sampleQris =
      '00020101021226400014ID.LINKAJA.WWW01189360001101234567895204581253033605405450005802ID5913KOPI KENANGAN6007JAKARTA6304ABCD';
    const qris = parseQrisPayload(sampleQris);
    assert.ok(qris);
    assert.equal(qris.isQris, true);
    assert.equal(qris.amount, 45000);
    assert.equal(qris.merchantName, 'KOPI KENANGAN');
    assert.equal(qris.merchantCity, 'JAKARTA');
    assert.equal(qris.category, 'Makanan');

    const tx = parseTransaction(sampleQris);
    assert.equal(tx.amount, 45000);
    assert.equal(tx.method, 'qris');
    assert.equal(tx.category, 'Makanan');
    assert.equal(tx.note, 'KOPI KENANGAN (JAKARTA)');
    assert.ok(tx.tags?.includes('qris'));
  });

  it('parses compound discounts and capped discounts', () => {
    // Compound 20% + 10% on 100k -> 72,000
    assert.equal(parseAmount('baju 100k diskon 20% + 10%'), 72000);
    assert.equal(parseAmount('jaket 200k - 50% + 20%'), 80000);

    // Capped 50% max 20k on 100k -> 80,000 (discount capped at 20k)
    assert.equal(parseAmount('sepatu 100k diskon 50% max 20k'), 80000);
    // Capped 30% maks 30rb on 200k -> 170,000 (discount is 60k capped to 30k)
    assert.equal(parseAmount('tas 200k diskon 30% maks 30rb'), 170000);
  });

  it('parses restaurant tax and service charge combinations', () => {
    // sushi 200k + sc 5% + pb1 10% -> 200,000 * 1.05 * 1.10 = 231,000
    assert.equal(parseAmount('sushi 200k + sc 5% + pb1 10%'), 231000);
    // makan 100k + pb1 10% -> 110,000
    assert.equal(parseAmount('makan 100k + pb1 10%'), 110000);
    // laptop 10jt + ppn 11% -> 11,100,000
    assert.equal(parseAmount('laptop 10jt + ppn 11%'), 11100000);
  });

  it('parses fuel volume, stock lots, gold weight, and forex currencies', () => {
    // Fuel
    assert.equal(parseAmount('pertalite 10 liter'), 100000);
    assert.equal(parseAmount('pertamax 15L'), 194250);
    assert.equal(parseAmount('solar 20 liter'), 136000);

    // Stock lots
    assert.equal(parseAmount('beli bbca 5 lot harga 9800'), 4900000);
    assert.equal(parseAmount('beli bbri 10 lot @ 4600 fee 0.15%'), 4606900);
    assert.equal(parseAmount('dividen bbca 250 per lembar 10 lot'), 250000);

    // Gold
    assert.equal(parseAmount('beli emas antam 2 gram'), 2700000);

    // Forex
    assert.equal(parseAmount('5 usd'), 81000);
    assert.equal(parseAmount('10 sgd'), 121000);
    assert.equal(parseAmount('100 eur'), 1750000);
    assert.equal(parseAmount('1000 jpy'), 105000);
  });

  it('parses zakat and tax formulas accurately', () => {
    // Zakat Fitrah
    assert.equal(parseAmount('zakat fitrah 45k 4 jiwa'), 180000);
    // Zakat Maal (2.5%)
    assert.equal(parseAmount('zakat maal 100jt'), 2500000);
    // UMKM Tax (0.5% pph final)
    assert.equal(parseAmount('omset 50jt pph umkm'), 250000);
    // PPH21 TER gross-to-net estimation
    assert.equal(parseAmount('gaji kotor 10jt pph21 ter'), 9400000);
  });

  it('parses ATM cash withdrawals as transfers from bank to cash', () => {
    const tx1 = parseTransaction('tarik tunai 500k bca');
    assert.equal(tx1.type, 'transfer');
    assert.equal(tx1.method, 'bca');
    assert.equal(tx1.transferToMethod, 'cash');
    assert.equal(tx1.amount, 500000);

    const tx2 = parseTransaction('ambil uang 1jt mandiri');
    assert.equal(tx2.type, 'transfer');
    assert.equal(tx2.method, 'mandiri');
    assert.equal(tx2.transferToMethod, 'cash');
    assert.equal(tx2.amount, 1000000);
  });

  it('parses and splits multi-intent transaction inputs', () => {
    // Semicolon delimiter
    const multiSemi = parseMultipleTransactions('kopi 25k bca; makan 50k gopay; bensin 30k cash');
    assert.equal(multiSemi.length, 3);
    assert.equal(multiSemi[0].amount, 25000);
    assert.equal(multiSemi[0].method, 'bca');
    assert.equal(multiSemi[1].amount, 50000);
    assert.equal(multiSemi[1].method, 'gopay');
    assert.equal(multiSemi[2].amount, 30000);
    assert.equal(multiSemi[2].method, 'cash');

    // Newline delimiter
    const multiNewline = parseMultipleTransactions('kopi 25k bca\nmakan 50k cash');
    assert.equal(multiNewline.length, 2);
    assert.equal(multiNewline[0].amount, 25000);
    assert.equal(multiNewline[1].amount, 50000);

    // Natural 'dan' delimiter
    const multiDan = parseMultipleTransactions('kopi 20k bca dan roti 15k cash');
    assert.equal(multiDan.length, 2);
    assert.equal(multiDan[0].amount, 20000);
    assert.equal(multiDan[0].method, 'bca');
    assert.equal(multiDan[1].amount, 15000);
    assert.equal(multiDan[1].method, 'cash');
  });

  it('cleans Jaksel and modern slang fillers without corrupting notes', () => {
    const tx1 = parseTransaction('literally kopi 35k worth it bgt gopay');
    assert.equal(tx1.amount, 35000);
    assert.equal(tx1.method, 'gopay');
    assert.equal(tx1.note, 'kopi bgt');

    const tx2 = parseTransaction('jujurly healing ke bali 500k bca');
    assert.equal(tx2.amount, 500000);
    assert.equal(tx2.method, 'bca');
    assert.equal(tx2.note, 'ke bali');
  });

  it('auto-tags investments, reimbursements, and zakat', () => {
    const tx1 = parseTransaction('talangan makan siang 150k bca');
    assert.ok(tx1.tags?.includes('reimburse'));

    const tx2 = parseTransaction('beli bbca 5 lot harga 9800 bca');
    assert.ok(tx2.tags?.includes('investasi'));

    const tx3 = parseTransaction('zakat maal 2jt bsi');
    assert.ok(tx3.tags?.includes('zakat'));
  });
});
