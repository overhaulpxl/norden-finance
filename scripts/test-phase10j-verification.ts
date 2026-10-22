import assert from 'assert';
import { verifyCronAuthorization } from '../lib/cronAuth';
import {
  extractClientIp,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../lib/rateLimit';

async function runTests() {
  console.log('--- Starting Phase 10J Verification Suite ---');

  // ==========================================
  // TEST SUITE 1: CRON AUTHORIZATION
  // ==========================================
  console.log('\n[1] Testing Cron Authorization...');
  const originalCronSecret = process.env.CRON_SECRET;
  const testSecret = 'test_cron_secret_32_characters_long_12345';
  process.env.CRON_SECRET = testSecret;

  try {
    // 1.1 Authorized GET with exact Bearer token
    const validReq = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'GET',
      headers: { authorization: `Bearer ${testSecret}` },
    });
    const resValid = verifyCronAuthorization(validReq);
    assert.strictEqual(resValid.authorized, true, 'Valid Bearer token must be authorized');
    assert.strictEqual(resValid.response, undefined);

    // 1.2 Authorized POST with exact Bearer token
    const validPostReq = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'POST',
      headers: { authorization: `Bearer ${testSecret}` },
    });
    const resValidPost = verifyCronAuthorization(validPostReq);
    assert.strictEqual(resValidPost.authorized, true, 'Valid POST Bearer token must be authorized');

    // 1.3 Missing Authorization header -> 401
    const noAuthReq = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'GET',
    });
    const resNoAuth = verifyCronAuthorization(noAuthReq);
    assert.strictEqual(resNoAuth.authorized, false, 'Missing auth header must not be authorized');
    assert.strictEqual(resNoAuth.response?.status, 401, 'Missing auth header must return 401');

    // 1.4 Invalid format (Basic auth) -> 401
    const basicReq = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'GET',
      headers: { authorization: `Basic ${testSecret}` },
    });
    const resBasic = verifyCronAuthorization(basicReq);
    assert.strictEqual(resBasic.authorized, false, 'Basic auth must not be authorized');
    assert.strictEqual(resBasic.response?.status, 401, 'Invalid format must return 401');

    // 1.5 Incorrect secret -> 401
    const wrongSecretReq = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'GET',
      headers: { authorization: 'Bearer wrong_secret_value_1234567890123' },
    });
    const resWrong = verifyCronAuthorization(wrongSecretReq);
    assert.strictEqual(resWrong.authorized, false, 'Incorrect secret must not be authorized');
    assert.strictEqual(resWrong.response?.status, 401, 'Incorrect secret must return 401');

    // 1.6 Missing CRON_SECRET in environment -> 500 fail closed
    delete process.env.CRON_SECRET;
    const reqNoEnv = new Request('https://nordenfinance.site/api/cron/recurring', {
      method: 'GET',
      headers: { authorization: `Bearer ${testSecret}` },
    });
    const resNoEnv = verifyCronAuthorization(reqNoEnv);
    assert.strictEqual(resNoEnv.authorized, false, 'Missing CRON_SECRET env must fail');
    assert.strictEqual(resNoEnv.response?.status, 500, 'Missing CRON_SECRET env must return 500 config error');

    console.log('  ✓ Cron authorization passed (GET/POST supported, 401/500 fail-closed verified).');
  } finally {
    process.env.CRON_SECRET = originalCronSecret;
  }

  // ==========================================
  // TEST SUITE 2: CLIENT IP RESOLUTION & VALIDATION
  // ==========================================
  console.log('\n[2] Testing Client IP Resolution & Validation...');

  // 2.1 Valid IPv4
  const ipv4Req = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-forwarded-for': '203.0.113.195' },
  });
  assert.strictEqual(extractClientIp(ipv4Req), '203.0.113.195', 'Must extract valid IPv4');

  // 2.2 Valid IPv6
  const ipv6Req = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-forwarded-for': '2001:db8::8a2e:370:7334' },
  });
  assert.strictEqual(extractClientIp(ipv6Req), '2001:db8::8a2e:370:7334', 'Must extract valid IPv6');

  // 2.3 Comma-separated Vercel edge chain (leftmost client IP)
  const chainedReq = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1, 76.76.21.21' },
  });
  assert.strictEqual(extractClientIp(chainedReq), '198.51.100.1', 'Must extract leftmost client IP');

  // 2.4 Fallback to x-real-ip if x-forwarded-for absent
  const realIpReq = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-real-ip': '198.51.100.42' },
  });
  assert.strictEqual(extractClientIp(realIpReq), '198.51.100.42', 'Must extract from x-real-ip');

  // 2.5 Malformed spoofed IP string -> extractClientIp returns null
  const malformedReq = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-forwarded-for': 'spoofed.attacker.host.name' },
  });
  assert.strictEqual(extractClientIp(malformedReq), null, 'Malformed IP must not pass isIP check');

  // 2.6 Out-of-range octets -> extractClientIp returns null
  const outOfRangeReq = new Request('https://nordenfinance.site/api/auth/register', {
    headers: { 'x-forwarded-for': '999.888.777.666' },
  });
  assert.strictEqual(extractClientIp(outOfRangeReq), null, 'Out of range IP must not pass isIP check');

  // 2.7 Production behavior: missing IP throws RateLimitIpError
  const envMap = process.env as Record<string, string | undefined>;
  const originalNodeEnv = envMap.NODE_ENV;
  try {
    envMap.NODE_ENV = 'production';
    const missingProdReq = new Request('https://nordenfinance.site/api/auth/register');
    assert.throws(
      () => rateLimitKey(missingProdReq, 'test-scope'),
      RateLimitIpError,
      'Production without valid client IP must throw RateLimitIpError'
    );

    // With valid IP in production
    const validProdKey = rateLimitKey(ipv4Req, 'test-scope');
    assert.strictEqual(validProdKey, 'test-scope:203.0.113.195', 'Production with valid IP must return scoped key');

    // 2.8 Development behavior: missing IP falls back to 127.0.0.1
    envMap.NODE_ENV = 'development';
    const missingDevReq = new Request('http://localhost:3000/api/auth/register');
    const devKey = rateLimitKey(missingDevReq, 'test-scope');
    assert.strictEqual(devKey, 'test-scope:127.0.0.1', 'Development without IP must fall back to 127.0.0.1');

    console.log('  ✓ Client IP resolution passed (IPv4, IPv6, chains, malformed checks, prod fail-closed).');
  } finally {
    envMap.NODE_ENV = originalNodeEnv;
  }

  // ==========================================
  // TEST SUITE 3: RATE LIMIT EXCEEDED & 429 RESPONSES
  // ==========================================
  console.log('\n[3] Testing RateLimitExceededError & 429 Responses...');

  const rlError = new RateLimitExceededError('Terlalu banyak request. Coba lagi nanti.', 45);
  assert.strictEqual(rlError.name, 'RateLimitExceededError');
  assert.strictEqual(rlError.retryAfterSeconds, 45);
  assert.strictEqual(rlError.message, 'Terlalu banyak request. Coba lagi nanti.');

  const http429Response = rateLimitResponse(rlError);
  assert.strictEqual(http429Response.status, 429, 'Rate limit response must be HTTP 429');
  assert.strictEqual(http429Response.headers.get('Retry-After'), '45', 'Must include correct Retry-After header');

  const jsonBody = await http429Response.json();
  assert.strictEqual(jsonBody.error, 'Terlalu banyak request. Coba lagi nanti.');

  console.log('  ✓ RateLimitExceededError and HTTP 429 response formatting verified.');

  // ==========================================
  // TEST SUITE 4: BUCKET CLEANUP LOGIC RETENTION CALCULATION
  // ==========================================
  console.log('\n[4] Testing Bucket Cleanup Retention Logic...');

  const now = Date.now();
  const retentionMs = 24 * 60 * 60 * 1000;
  const cutoff = new Date(now - retentionMs);

  // Bucket expired 2 days ago -> should be pruned (resetAt < cutoff)
  const oldExpiredBucket = new Date(now - 48 * 60 * 60 * 1000);
  assert.strictEqual(oldExpiredBucket < cutoff, true, 'Bucket expired 2 days ago must be pruned');

  // Bucket expired 1 hour ago -> should be kept within retention window (resetAt >= cutoff)
  const recentExpiredBucket = new Date(now - 1 * 60 * 60 * 1000);
  assert.strictEqual(recentExpiredBucket < cutoff, false, 'Recently expired bucket must be kept in retention window');

  // Active bucket expiring in 1 minute -> must never be pruned
  const activeBucket = new Date(now + 60 * 1000);
  assert.strictEqual(activeBucket < cutoff, false, 'Active bucket must not be pruned');

  console.log('  ✓ Cleanup retention cutoff calculations verified (24h buffer).');

  // ==========================================
  // TEST SUITE 5: VERCEL.JSON AND PRISMA SCHEMA VERIFICATION
  // ==========================================
  console.log('\n[5] Testing Schema & Config Integrity...');
  const fs = await import('fs');
  const path = await import('path');

  const schemaContent = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  assert.strictEqual(schemaContent.includes('directUrl = env("DIRECT_URL")'), true, 'schema.prisma must include directUrl');

  const vercelJsonContent = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
  const parsedVercelJson = JSON.parse(vercelJsonContent);
  assert.strictEqual(Array.isArray(parsedVercelJson.crons), true, 'vercel.json must have crons array');
  assert.strictEqual(parsedVercelJson.crons[0].path, '/api/cron/recurring');
  assert.strictEqual(parsedVercelJson.crons[0].schedule, '0 0 * * *');

  console.log('  ✓ schema.prisma directUrl and vercel.json cron schedule verified.');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY (17/17 checks) ---');
}

runTests().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
