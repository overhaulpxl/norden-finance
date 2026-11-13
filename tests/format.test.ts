import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatShortDateTime, formatTanggal, formatCurrency } from '../lib/format';

describe('Format Utilities', () => {
  it('formats short date and time correctly', () => {
    const testDate = new Date(2026, 10, 13, 14, 30); // Nov 13, 2026 14:30
    const formattedId = formatShortDateTime(testDate, 'id');
    assert.match(formattedId, /13.*Nov.*•.*14:30/i);

    const formattedEn = formatShortDateTime(testDate, 'en');
    assert.match(formattedEn, /Nov.*13.*•.*14:30/i);
  });

  it('handles null, undefined, or invalid dates safely in formatShortDateTime', () => {
    assert.equal(formatShortDateTime(null), '-');
    assert.equal(formatShortDateTime(undefined), '-');
    assert.equal(formatShortDateTime('not-a-date'), '-');
  });

  it('formats currency with Indonesian rupiah formatting', () => {
    assert.equal(formatCurrency(10000), 'Rp 10.000');
    assert.equal(formatCurrency(0), 'Rp 0');
    assert.equal(formatCurrency(null), 'Rp 0');
  });

  it('formats full transaction date with formatTanggal', () => {
    const testDate = new Date(2026, 10, 13, 9, 15);
    const result = formatTanggal(testDate);
    assert.match(result, /13 Nov 2026, 09:15/);
    assert.equal(formatTanggal(null), '-');
  });
});
