import assert from 'assert';

interface VerificationResult {
  passed: boolean;
  message: string;
}

export async function verifySeoDeployment(targetUrl: string, isPreview: boolean = true) {
  console.log(`\n======================================================`);
  console.log(`VERIFYING SEO DEPLOYMENT: ${targetUrl}`);
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

  // 1. Robots.txt
  console.log('1. Checking /robots.txt:');
  const robotsRes = await fetch(`${targetUrl}/robots.txt`);
  record(robotsRes.status === 200, 'robots.txt returns HTTP 200', `robots.txt returned HTTP ${robotsRes.status}`);
  const robotsText = await robotsRes.text();
  record(robotsText.includes('Disallow: /dashboard'), 'robots.txt disallows /dashboard', 'robots.txt missing disallow /dashboard');
  record(robotsText.includes('Disallow: /norden-control-center'), 'robots.txt disallows /norden-control-center', 'robots.txt missing disallow /norden-control-center');
  record(robotsText.includes('Disallow: /upgrade'), 'robots.txt disallows /upgrade', 'robots.txt missing disallow /upgrade');
  record(robotsText.includes('Disallow: /login'), 'robots.txt disallows /login', 'robots.txt missing disallow /login');
  record(robotsText.includes('Disallow: /register'), 'robots.txt disallows /register', 'robots.txt missing disallow /register');
  record(robotsText.includes('Disallow: /api/'), 'robots.txt disallows /api/', 'robots.txt missing disallow /api/');
  record(robotsText.includes('Allow: /legal/terms'), 'robots.txt allows /legal/terms', 'robots.txt missing allow /legal/terms');
  record(robotsText.includes('Sitemap: https://www.nordenfinance.site/sitemap.xml'), 'robots.txt points to canonical sitemap', 'robots.txt sitemap pointer incorrect or missing');
  record(!robotsText.includes(targetUrl.replace('https://', '')), 'robots.txt does not leak preview hostname', 'robots.txt contains preview hostname');

  // 2. Sitemap.xml
  console.log('\n2. Checking /sitemap.xml:');
  const sitemapRes = await fetch(`${targetUrl}/sitemap.xml`);
  record(sitemapRes.status === 200, 'sitemap.xml returns HTTP 200', `sitemap.xml returned HTTP ${sitemapRes.status}`);
  const sitemapText = await sitemapRes.text();
  record(sitemapText.includes('<loc>https://www.nordenfinance.site</loc>') || sitemapText.includes('<loc>https://www.nordenfinance.site/</loc>'), 'sitemap.xml includes canonical homepage', 'sitemap.xml missing canonical homepage');
  record(sitemapText.includes('<loc>https://www.nordenfinance.site/legal/terms</loc>'), 'sitemap.xml includes /legal/terms', 'sitemap.xml missing /legal/terms');
  record(sitemapText.includes('<loc>https://www.nordenfinance.site/legal/privacy</loc>'), 'sitemap.xml includes /legal/privacy', 'sitemap.xml missing /legal/privacy');
  record(!sitemapText.includes('/dashboard'), 'sitemap.xml excludes /dashboard', 'sitemap.xml mistakenly includes /dashboard');
  record(!sitemapText.includes('/norden-control-center'), 'sitemap.xml excludes /norden-control-center', 'sitemap.xml mistakenly includes /norden-control-center');
  record(!sitemapText.includes('/upgrade'), 'sitemap.xml excludes /upgrade', 'sitemap.xml mistakenly includes /upgrade');
  record(!sitemapText.includes('vercel.app'), 'sitemap.xml contains no vercel.app preview URLs', 'sitemap.xml leaks vercel.app URL');

  // 3. Open Graph Image
  console.log('\n3. Checking /opengraph-image:');
  const ogImgRes = await fetch(`${targetUrl}/opengraph-image`);
  record(ogImgRes.status === 200, '/opengraph-image returns HTTP 200', `/opengraph-image returned HTTP ${ogImgRes.status}`);
  const ogContentType = ogImgRes.headers.get('content-type') || '';
  record(ogContentType.includes('image/png'), `/opengraph-image Content-Type is image/png (${ogContentType})`, `/opengraph-image invalid Content-Type: ${ogContentType}`);

  // 4. Homepage HTML & Metadata
  console.log('\n4. Checking Homepage HTML & Metadata:');
  const homeRes = await fetch(`${targetUrl}/`);
  record(homeRes.status === 200, 'Homepage returns HTTP 200', `Homepage returned HTTP ${homeRes.status}`);
  const homeHtml = await homeRes.text();

  record(homeHtml.includes('lang="id"'), 'HTML has lang="id"', 'HTML missing lang="id"');
  record(homeHtml.includes('<title>Norden Finance — Aplikasi Keuangan Pribadi</title>'), 'Title is "Norden Finance — Aplikasi Keuangan Pribadi"', 'Title mismatch or missing');
  record(homeHtml.includes('name="description" content="Kelola keuangan pribadi lebih teratur dengan Norden Finance.'), 'Meta description correctly configured', 'Meta description missing or incorrect');
  record(homeHtml.includes('rel="canonical" href="https://www.nordenfinance.site"'), 'Canonical URL points to https://www.nordenfinance.site', 'Canonical URL missing or incorrect');
  record(homeHtml.includes('property="og:title" content="Norden Finance — Aplikasi Keuangan Pribadi"'), 'OG title correctly configured', 'OG title missing or incorrect');
  record(homeHtml.includes('property="og:description" content="Kelola keuangan pribadi lebih teratur dengan Norden Finance.'), 'OG description correctly configured', 'OG description missing or incorrect');
  record(homeHtml.includes('property="og:url" content="https://www.nordenfinance.site"'), 'OG URL points to canonical https://www.nordenfinance.site', 'OG URL missing or incorrect');
  record(homeHtml.includes('property="og:locale" content="id_ID"'), 'OG locale is id_ID', 'OG locale missing or incorrect');
  record(homeHtml.includes('name="twitter:card" content="summary_large_image"'), 'Twitter card is summary_large_image', 'Twitter card missing or incorrect');

  // 5. JSON-LD Structured Data
  console.log('\n5. Checking JSON-LD Structured Data:');
  const jsonLdMatch = homeHtml.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  record(!!jsonLdMatch, 'JSON-LD script tag present', 'JSON-LD script tag not found');
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      record(data['@context'] === 'https://schema.org', 'Schema @context is https://schema.org', 'Schema context invalid');
      const graph = data['@graph'] || [];
      const org = graph.find((item: any) => item['@type'] === 'Organization');
      record(org?.name === 'Norden Finance' && org?.url === 'https://www.nordenfinance.site', 'Organization schema valid', 'Organization schema invalid');
      const website = graph.find((item: any) => item['@type'] === 'WebSite');
      record(website?.name === 'Norden Finance' && website?.inLanguage === 'id-ID', 'WebSite schema valid', 'WebSite schema invalid');
      const software = graph.find((item: any) => item['@type'] === 'SoftwareApplication');
      record(software?.applicationCategory === 'FinanceApplication' && software?.offers?.length === 3, 'SoftwareApplication schema with 3 real offers valid', 'SoftwareApplication schema invalid');
    } catch (e: any) {
      record(false, '', `JSON-LD failed to parse JSON: ${e.message}`);
    }
  }

  // 6. Homepage Semantics & Headings
  console.log('\n6. Checking Homepage Headings:');
  const h1Match = homeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';
  record(h1Text.includes('Kelola Keuangan Pribadi Lebih Teratur dengan Norden'), `H1 contains target keyword: "${h1Text}"`, `H1 text unexpected: "${h1Text}"`);

  // 7. Legal Pages Metadata
  console.log('\n7. Checking Legal Pages:');
  const termsRes = await fetch(`${targetUrl}/legal/terms`);
  const termsHtml = await termsRes.text();
  record(termsHtml.includes('<title>Syarat dan Ketentuan | Norden Finance</title>'), '/legal/terms has title "Syarat dan Ketentuan | Norden Finance"', '/legal/terms title mismatch');
  record(termsHtml.includes('rel="canonical" href="https://www.nordenfinance.site/legal/terms"'), '/legal/terms canonical is canonical https://www.nordenfinance.site/legal/terms', '/legal/terms canonical mismatch');

  const privacyRes = await fetch(`${targetUrl}/legal/privacy`);
  const privacyHtml = await privacyRes.text();
  record(privacyHtml.includes('<title>Kebijakan Privasi | Norden Finance</title>'), '/legal/privacy has title "Kebijakan Privasi | Norden Finance"', '/legal/privacy title mismatch');
  record(privacyHtml.includes('rel="canonical" href="https://www.nordenfinance.site/legal/privacy"'), '/legal/privacy canonical is canonical https://www.nordenfinance.site/legal/privacy', '/legal/privacy canonical mismatch');

  // 8. Private Routes Robots Meta
  console.log('\n8. Checking Private Routes Indexing Controls (noindex, nofollow):');
  const privateRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
    '/upgrade',
    '/dashboard',
    '/norden-control-center',
    '/onboarding',
    '/auth/verification-error',
  ];

  for (const route of privateRoutes) {
    const res = await fetch(`${targetUrl}${route}`, { redirect: 'manual' });
    const text = await res.text();
    // Either redirected (307/302) or rendered HTML with noindex
    const hasNoIndex = text.includes('content="noindex, nofollow"') || text.includes('content="noindex,nofollow"') || res.status === 307 || res.status === 302;
    record(hasNoIndex, `${route} protected from indexing (status: ${res.status}, noindex: ${text.includes('noindex')})`, `${route} missing noindex directive! Status: ${res.status}`);
  }

  // 9. Region Check if Preview
  if (isPreview && homeRes.headers.get('x-vercel-id')) {
    const vercelId = homeRes.headers.get('x-vercel-id') || '';
    record(vercelId.includes('sin1'), `Vercel function execution region is sin1 (${vercelId})`, `Vercel region is not sin1: ${vercelId}`);
  }

  const allPassed = results.every(r => r.passed);
  console.log(`\n======================================================`);
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL VERIFICATIONS PASSED' : 'SOME VERIFICATIONS FAILED'}`);
  console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log(`======================================================\n`);

  return allPassed;
}

if (require.main === module) {
  const target = process.argv[2] || 'http://localhost:3000';
  const isPreview = !target.includes('localhost');
  verifySeoDeployment(target, isPreview).then(passed => {
    process.exit(passed ? 0 : 1);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
