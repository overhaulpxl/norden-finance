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
});
