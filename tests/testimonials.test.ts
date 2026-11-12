import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicSafeFeedback, clampPublicRating } from '../lib/landingFallbacks';

test('Testimonials & Public Feedback Safety Filter', async (t) => {
  await t.test('allows natural user praise mentioning wallets, whatsapp habit, and investment categories', () => {
    const validMessages = [
      'Dulu paling malas mencatat pengeluaran karena aplikasinya ribet. Di Norden, saya tinggal chat WA sambil tiduran, laporannya rapi otomatis!',
      'Pencatatan kas titipan (escrow) untuk transaksi rekber game sangat krusial bagi MM. Norden memisahkan kas pribadi dan dana escrow dengan transparan.',
      'Saya bisa melihat total saldo DANA, GoPay, dan rekening bank BCA dalam satu layar tanpa perlu repot login m-banking satu-satu setiap sore.',
      'Fitur dompet, pos anggaran, dan pelacakan tabungan investasi bulanan sangat membantu.',
      'GOAT app!',
    ];

    for (const msg of validMessages) {
      assert.equal(isPublicSafeFeedback(msg), true, `Expected valid message to pass: "${msg}"`);
    }
  });

  await t.test('blocks spam, phone numbers, external URLs, and predatory keywords', () => {
    const invalidMessages = [
      'Hubungi kami di wa 081234567890 sekarang juga',
      'Cek link promo https://scam-site.com/free-money',
      'Daftar slot gacor deposit pulsa tanpa potongan',
      'Pinjol mudah cair tanpa ktp hubungi admin',
      'Join channel t.me/freecrypto sekarang',
      'a', // too short (< 2 chars)
    ];

    for (const msg of invalidMessages) {
      assert.equal(isPublicSafeFeedback(msg), false, `Expected spam message to be rejected: "${msg}"`);
    }
  });

  await t.test('clamps rating between 1 and 5', () => {
    assert.equal(clampPublicRating(0), 1);
    assert.equal(clampPublicRating(-5), 1);
    assert.equal(clampPublicRating(6), 5);
    assert.equal(clampPublicRating(10), 5);
    assert.equal(clampPublicRating(4), 4);
  });
});
