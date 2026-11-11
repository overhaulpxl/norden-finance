import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  signShortcutToken,
  parseShortcutToken,
} from '../lib/shortcutToken';
import {
  generatePinResetTokens,
  verifyPinResetToken,
} from '../lib/pinResetToken';

describe('Security Tokens', () => {
  const originalSecret = process.env.SHORTCUT_TOKEN_SECRET;

  before(() => {
    process.env.SHORTCUT_TOKEN_SECRET = 'test-secret-key-that-is-at-least-32-chars-long';
  });

  after(() => {
    process.env.SHORTCUT_TOKEN_SECRET = originalSecret;
  });

  describe('Shortcut Token', () => {
    it('signs and parses a valid shortcut token', () => {
      const token = signShortcutToken('user_123', 2);
      const parsed = parseShortcutToken(token);
      assert.ok(parsed);
      assert.equal(parsed?.userId, 'user_123');
      assert.equal(parsed?.version, 2);
      assert.ok(parsed?.exp && parsed.exp > Date.now());
    });

    it('rejects tampered signature', () => {
      const token = signShortcutToken('user_123', 1);
      const [payload, sig] = token.split('.');
      const tampered = `${payload}.${sig.slice(0, -4)}xxxx`;
      const parsed = parseShortcutToken(tampered);
      assert.equal(parsed, null);
    });

    it('rejects expired token', () => {
      // Negative TTL so it is already expired
      const expiredToken = signShortcutToken('user_123', 1, -1000);
      const parsed = parseShortcutToken(expiredToken);
      assert.equal(parsed, null);
    });

    it('rejects malformed token strings', () => {
      assert.equal(parseShortcutToken(''), null);
      assert.equal(parseShortcutToken('not-a-token'), null);
      assert.equal(parseShortcutToken('a.b.c'), null);
    });
  });

  describe('PIN Reset Token', () => {
    it('generates and verifies magic link reset token', () => {
      const { magicToken } = generatePinResetTokens('user_abc');
      const verified = verifyPinResetToken(magicToken, 'user_abc');
      assert.equal(verified.valid, true);
    });

    it('rejects magic link token for wrong user', () => {
      const { magicToken } = generatePinResetTokens('user_abc');
      const verified = verifyPinResetToken(magicToken, 'different_user');
      assert.equal(verified.valid, false);
    });

    it('rejects tampered magic link token', () => {
      const { magicToken } = generatePinResetTokens('user_abc');
      const tampered = magicToken.slice(0, -5) + 'abcde';
      const verified = verifyPinResetToken(tampered, 'user_abc');
      assert.equal(verified.valid, false);
    });

    it('generates OTP session and verifies matching code', () => {
      const { sessionToken, code } = generatePinResetTokens('user_otp');
      assert.equal(code.length, 6);
      const verified = verifyPinResetToken(sessionToken, 'user_otp', code);
      assert.equal(verified.valid, true);
    });

    it('rejects wrong OTP code with valid session', () => {
      const { sessionToken, code } = generatePinResetTokens('user_otp');
      const wrongCode = code === '123456' ? '654321' : '123456';
      const verified = verifyPinResetToken(sessionToken, 'user_otp', wrongCode);
      assert.equal(verified.valid, false);
    });
  });
});
