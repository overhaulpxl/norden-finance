import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getPublicAppUrl, DEFAULT_PUBLIC_APP_URL } from '../lib/appUrl';

describe('Canonical App URL Resolution', () => {
  it('defaults to canonical custom domain', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    assert.strictEqual(getPublicAppUrl(), DEFAULT_PUBLIC_APP_URL);
    assert.strictEqual(getPublicAppUrl(), 'https://www.nordenfinance.site');

    if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('normalizes trailing slashes', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.nordenfinance.site///';

    assert.strictEqual(getPublicAppUrl(), 'https://www.nordenfinance.site');

    if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('canonicalizes vercel.app default domain to custom domain', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://nordenfinance.vercel.app';

    assert.strictEqual(getPublicAppUrl(), 'https://www.nordenfinance.site');

    if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('canonicalizes apex domain to www canonical domain', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://nordenfinance.site';

    assert.strictEqual(getPublicAppUrl(), 'https://www.nordenfinance.site');

    if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it('preserves local development URLs', () => {
    const original = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000/';

    assert.strictEqual(getPublicAppUrl(), 'http://localhost:3000');

    if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
  });
});
