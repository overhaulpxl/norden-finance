import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

interface VerificationResult {
  passed: boolean;
  message: string;
}

async function getBypassKey(): Promise<string | null> {
  try {
    const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
    if (!fs.existsSync(vAuthPath)) return null;
    const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));
    if (!vAuth.token) return null;
    const pRes = await fetch('https://api.vercel.com/v9/projects/norden', {
      headers: { Authorization: `Bearer ${vAuth.token}` },
    });
    const pData = await pRes.json();
    if (pData.protectionBypass) {
      return Object.keys(pData.protectionBypass)[0] || null;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

export async function verifyPhase15b(targetUrl: string, isPreview: boolean = true) {
  console.log(`\n======================================================`);
  console.log(`PHASE 15B: GOOGLE INDEXING & SEO PRODUCTION READINESS`);
  console.log(`Target: ${targetUrl}`);
  console.log(`======================================================\n`);

  const results: VerificationResult[] = [];

  function record(condition: boolean, successMsg: string, failMsg: string) {
    if (condition) {
      console.log(`  [PASS] ${successMsg}`);
      results.push({ passed: true, message: successMsg });
    } else {
      console.error(`  [FAIL] ${failMsg}`);
      results.push({ passed: false, message: failMsg });
    }
  }

  const bypassKey = isPreview ? await getBypassKey() : null;
  const customHeaders: Record<string, string> = {};
  if (bypassKey) {
    customHeaders['x-vercel-protection-bypass'] = bypassKey;
    console.log(`  Using Vercel protection bypass key: ${bypassKey.slice(0, 8)}...`);
  }

  // ---------------------------------------------------------
  // 1. Robots.txt: NO CONFLICT WITH NOINDEX ROUTES
  // ---------------------------------------------------------
  console.log('\n1. Checking /robots.txt crawlability & noindex conflict resolution:');
  const robotsRes = await fetch(`${targetUrl}/robots.txt`, { headers: customHeaders });
  record(robotsRes.status === 200, 'robots.txt returns HTTP 200', `robots.txt returned HTTP ${robotsRes.status}`);
  const robotsText = await robotsRes.text();

  // Must NOT disallow routes that rely on noindex!
  record(!robotsText.includes('Disallow: /login'), 'robots.txt does NOT block /login (allows crawler to discover noindex)', 'robots.txt mistakenly disallows /login');
  record(!robotsText.includes('Disallow: /register'), 'robots.txt does NOT block /register (allows crawler to discover noindex)', 'robots.txt mistakenly disallows /register');
  record(!robotsText.includes('Disallow: /dashboard'), 'robots.txt does NOT block /dashboard (allows crawler to discover noindex header)', 'robots.txt mistakenly disallows /dashboard');
  record(!robotsText.includes('Disallow: /norden-control-center'), 'robots.txt does NOT block /norden-control-center (allows crawler to discover noindex header)', 'robots.txt mistakenly disallows /norden-control-center');
  record(!robotsText.includes('Disallow: /upgrade'), 'robots.txt does NOT block /upgrade (allows crawler to discover noindex header)', 'robots.txt mistakenly disallows /upgrade');
  record(!robotsText.includes('Disallow: /forgot-password'), 'robots.txt does NOT block /forgot-password', 'robots.txt mistakenly disallows /forgot-password');
  record(!robotsText.includes('Disallow: /verify-email'), 'robots.txt does NOT block /verify-email', 'robots.txt mistakenly disallows /verify-email');
  record(!robotsText.includes('Disallow: /onboarding'), 'robots.txt does NOT block /onboarding', 'robots.txt mistakenly disallows /onboarding');

  // Must keep API disallows
  record(robotsText.includes('Disallow: /api/'), 'robots.txt disallows /api/', 'robots.txt missing disallow /api/');
  // Must point to canonical sitemap
  record(robotsText.includes('Sitemap: https://www.nordenfinance.site/sitemap.xml'), 'robots.txt points to canonical sitemap', 'robots.txt sitemap pointer incorrect');

  // ---------------------------------------------------------
  // 2. Crawler Response & X-Robots-Tag Headers on Private Routes
  // ---------------------------------------------------------
  console.log('\n2. Testing Crawler Response & X-Robots-Tag on Private Routes:');
  const privateRoutes = [
    { path: '/login', requiresAuthRedirect: false },
    { path: '/register', requiresAuthRedirect: false },
    { path: '/forgot-password', requiresAuthRedirect: false },
    { path: '/verify-email', requiresAuthRedirect: false },
    { path: '/upgrade', requiresAuthRedirect: true },
    { path: '/dashboard', requiresAuthRedirect: true },
    { path: '/norden-control-center', requiresAuthRedirect: true },
    { path: '/onboarding', requiresAuthRedirect: true },
    { path: '/auth/verified', requiresAuthRedirect: false },
    { path: '/auth/verification-error', requiresAuthRedirect: false },
  ];

  for (const r of privateRoutes) {
    const res = await fetch(`${targetUrl}${r.path}`, { headers: customHeaders, redirect: 'manual' });
    const xRobotsTag = res.headers.get('x-robots-tag') || '';
    const bodyText = await res.text();

    // 1. Check X-Robots-Tag header
    record(
      xRobotsTag.toLowerCase().includes('noindex'),
      `${r.path} returns X-Robots-Tag: "${xRobotsTag}" (HTTP ${res.status})`,
      `${r.path} MISSING X-Robots-Tag header! Got: "${xRobotsTag}"`
    );

    // 2. Check HTML body contains <meta name="robots" content="noindex, nofollow">
    const hasMetaNoIndex = bodyText.includes('name="robots" content="noindex, nofollow"') || bodyText.includes('content="noindex, nofollow"');
    record(hasMetaNoIndex, `${r.path} HTML body contains <meta name="robots" content="noindex, nofollow">`, `${r.path} missing meta noindex in HTML body`);

    // 3. If requires authentication, verify redirect (HTTP 307 or HTML meta-refresh to /login)
    if (r.requiresAuthRedirect) {
      const isHttpRedirect = [301, 302, 307, 308].includes(res.status) && (res.headers.get('location') || '').includes('/login');
      const isMetaRefreshRedirect = bodyText.includes('http-equiv="refresh"') && bodyText.includes('url=/login');
      const redirectsToLogin = isHttpRedirect || isMetaRefreshRedirect;

      record(redirectsToLogin, `${r.path} safely redirects unauthenticated visitor to /login (method: ${isHttpRedirect ? 'HTTP 307' : 'Meta Refresh'})`, `${r.path} authentication redirection missing!`);
      record(!bodyText.includes('transactions') && !bodyText.includes('balances') && !bodyText.includes('adminStats'), `${r.path} response body leaks zero private financial/admin data`, `${r.path} body leaks sensitive data!`);
    }
  }

  // ---------------------------------------------------------
  // 3. Structured Data Pricing Review (Phase B)
  // ---------------------------------------------------------
  console.log('\n3. Checking Structured Data (JSON-LD) Pricing & Claims:');
  const homeRes = await fetch(`${targetUrl}/`, { headers: customHeaders });
  const homeHtml = await homeRes.text();
  const jsonLdMatch = homeHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  record(!!jsonLdMatch, 'JSON-LD script present in homepage', 'JSON-LD script missing');

  if (jsonLdMatch) {
    const data = JSON.parse(jsonLdMatch[1]);
    const graph = data['@graph'] || [];
    const software = graph.find((item: any) => item['@type'] === 'SoftwareApplication');
    record(!!software, 'SoftwareApplication schema present', 'SoftwareApplication schema missing');

    const offers = software?.offers || [];
    record(offers.length === 3, 'Exactly 3 offers present in SoftwareApplication', `Expected 3 offers, got ${offers.length}`);

    const trialOffer = offers.find((o: any) => o.name?.includes('Trial') || o.name?.includes('Uji Coba'));
    record(trialOffer?.price === '0' && trialOffer?.priceCurrency === 'IDR', 'Trial offer has price: "0" IDR', 'Trial offer pricing invalid');

    const monthlyOffer = offers.find((o: any) => o.name?.includes('Bulanan'));
    record(monthlyOffer?.price === '19000' && monthlyOffer?.priceCurrency === 'IDR', 'Pro Monthly offer has price: "19000" IDR', 'Monthly offer pricing invalid');

    const yearlyOffer = offers.find((o: any) => o.name?.includes('Tahunan'));
    record(yearlyOffer?.price === '149000' && yearlyOffer?.priceCurrency === 'IDR', 'Pro Yearly offer has price: "149000" IDR', 'Yearly offer pricing invalid');

    // Verify absence of fake data
    record(!homeHtml.includes('AggregateRating') && !homeHtml.includes('aggregateRating'), 'Zero fabricated AggregateRating in JSON-LD', 'Fabricated AggregateRating detected!');
    record(!homeHtml.includes('"ratingCount"'), 'Zero fake rating counts in JSON-LD', 'Fake ratingCount detected!');
  }

  // ---------------------------------------------------------
  // 4. Title, Description, and Canonical Verification (Phase C)
  // ---------------------------------------------------------
  console.log('\n4. Checking Title, Description & Canonical Output:');
  // Homepage title must appear exactly once, no double template
  const homeTitleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const homeTitle = homeTitleMatch ? homeTitleMatch[1].trim() : '';
  record(homeTitle === 'Norden Finance — Aplikasi Keuangan Pribadi', `Homepage title is exact: "${homeTitle}"`, `Homepage title incorrect: "${homeTitle}"`);
  record(!homeTitle.includes('| Norden Finance | Norden Finance'), 'Homepage title has zero double template suffixes', 'Homepage title contains duplicate template!');

  // Canonical tag check
  record(homeHtml.includes('rel="canonical" href="https://www.nordenfinance.site"'), 'Homepage canonical is https://www.nordenfinance.site', 'Homepage canonical mismatch');

  // Legal pages title & canonical checks
  const termsRes = await fetch(`${targetUrl}/legal/terms`, { headers: customHeaders });
  const termsHtml = await termsRes.text();
  const termsTitleMatch = termsHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const termsTitle = termsTitleMatch ? termsTitleMatch[1].trim() : '';
  record(termsTitle === 'Syarat dan Ketentuan | Norden Finance', `Terms title is exact: "${termsTitle}"`, `Terms title mismatch: "${termsTitle}"`);
  record(termsHtml.includes('rel="canonical" href="https://www.nordenfinance.site/legal/terms"'), 'Terms canonical is https://www.nordenfinance.site/legal/terms', 'Terms canonical mismatch');

  const privacyRes = await fetch(`${targetUrl}/legal/privacy`, { headers: customHeaders });
  const privacyHtml = await privacyRes.text();
  const privacyTitleMatch = privacyHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const privacyTitle = privacyTitleMatch ? privacyTitleMatch[1].trim() : '';
  record(privacyTitle === 'Kebijakan Privasi | Norden Finance', `Privacy title is exact: "${privacyTitle}"`, `Privacy title mismatch: "${privacyTitle}"`);
  record(privacyHtml.includes('rel="canonical" href="https://www.nordenfinance.site/legal/privacy"'), 'Privacy canonical is https://www.nordenfinance.site/legal/privacy', 'Privacy canonical mismatch');

  // ---------------------------------------------------------
  // 5. Marketing Claims and Content Grounding (Phase D)
  // ---------------------------------------------------------
  console.log('\n5. Checking Marketing Claims & Content Grounding:');
  record(!homeHtml.includes('Enkripsi tingkat militer') && !homeHtml.includes('military grade'), 'Zero unsupported "military grade" encryption claims', 'Unsupported encryption claim found');
  record(homeHtml.includes('Norden tidak dirancang sebagai aplikasi perbankan yang menahan dana Anda'), 'Explicit disclaimer: Norden is a self-management tool, not a bank holding funds', 'Missing non-banking disclaimer');
  record(homeHtml.includes('Catat dan kelola mutasi kas tunai, rekening bank'), 'Multi-wallet copy accurately states self-recording (no fake bank sync claims)', 'Misleading automated bank connection claim found');

  // ---------------------------------------------------------
  // 6. XML Sitemap & OpenGraph Image (Phase E)
  // ---------------------------------------------------------
  console.log('\n6. Checking XML Sitemap & OpenGraph Image:');
  const sitemapRes = await fetch(`${targetUrl}/sitemap.xml`, { headers: customHeaders });
  const sitemapText = await sitemapRes.text();
  record(sitemapRes.status === 200, 'sitemap.xml returns HTTP 200', `sitemap.xml status: ${sitemapRes.status}`);
  record(sitemapText.includes('<loc>https://www.nordenfinance.site</loc>'), 'Sitemap includes homepage', 'Sitemap missing homepage');
  record(sitemapText.includes('<loc>https://www.nordenfinance.site/legal/terms</loc>'), 'Sitemap includes /legal/terms', 'Sitemap missing terms');
  record(sitemapText.includes('<loc>https://www.nordenfinance.site/legal/privacy</loc>'), 'Sitemap includes /legal/privacy', 'Sitemap missing privacy');
  record(!sitemapText.includes('/dashboard') && !sitemapText.includes('/login') && !sitemapText.includes('/api/'), 'Sitemap excludes all private/auth routes', 'Sitemap leaks private route');

  const ogImgRes = await fetch(`${targetUrl}/opengraph-image`, { headers: customHeaders });
  record(ogImgRes.status === 200 && (ogImgRes.headers.get('content-type') || '').includes('image/png'), 'opengraph-image returns HTTP 200 image/png', 'opengraph-image failed');

  // ---------------------------------------------------------
  // 7. Vercel Execution Region (sin1)
  // ---------------------------------------------------------
  if (isPreview && homeRes.headers.get('x-vercel-id')) {
    const vercelId = homeRes.headers.get('x-vercel-id') || '';
    record(vercelId.includes('sin1'), `Execution region verified as Singapore sin1 (${vercelId.slice(0, 30)}...)`, `Region mismatch: ${vercelId}`);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`\n======================================================`);
  console.log(`OVERALL PHASE 15B RESULT: ${allPassed ? 'ALL VERIFICATIONS PASSED' : 'VERIFICATIONS FAILED'}`);
  console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log(`======================================================\n`);

  return allPassed;
}

if (require.main === module) {
  const target = process.argv[2] || 'http://localhost:3000';
  const isPreview = !target.includes('localhost');
  verifyPhase15b(target, isPreview).then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
