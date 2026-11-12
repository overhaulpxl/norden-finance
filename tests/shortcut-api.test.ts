import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../app/api/shortcut/route';

describe('Shortcut API Endpoint Security (/api/shortcut)', () => {
  it('rejects GET requests with 405 Method Not Allowed', async () => {
    const res = await GET();
    assert.equal(res.status, 405);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  it('strictly rejects token passed via URL query parameter with 400 Bad Request', async () => {
    const req = new Request('http://localhost:3000/api/shortcut?token=leaked_secret_token_123', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text: 'kopi 25k' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /URL query parameter/i);
    assert.match(body.error, /Authorization: Bearer/i);
  });

  it('rejects invalid or forged Bearer token with 401 Unauthorized', async () => {
    const req = new Request('http://localhost:3000/api/shortcut', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer fake_invalid_token_xyz',
      },
      body: JSON.stringify({ text: 'kopi 25k' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 401);

    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Token shortcut tidak valid/i);
  });
});
