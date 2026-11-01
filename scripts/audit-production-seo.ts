import assert from 'assert';

const prodHost = 'https://www.nordenfinance.site';
const apexHost = 'https://nordenfinance.site';

async function auditProductionSeo() {
  console.log('=== PHASE 15A: PRODUCTION SEO AUDIT ===\n');

  // 1. Apex to www redirect check
  console.log('1. Checking Apex domain redirect:');
  try {
    const apexRes = await fetch(apexHost, { redirect: 'manual' });
    console.log(`  - ${apexHost} status: ${apexRes.status}`);
    console.log(`  - Location: ${apexRes.headers.get('location')}`);
  } catch (err: any) {
    console.log(`  - Apex request error: ${err.message}`);
  }

  // 2. Robots.txt availability
  console.log('\n2. Checking /robots.txt:');
  const robotsRes = await fetch(`${prodHost}/robots.txt`);
  console.log(`  - Status: ${robotsRes.status}`);
  const robotsText = await robotsRes.text();
  console.log(`  - Content length: ${robotsText.length}`);
  console.log(`  - Content sample: ${robotsText.slice(0, 150)}`);

  // 3. Sitemap.xml availability
  console.log('\n3. Checking /sitemap.xml:');
  const sitemapRes = await fetch(`${prodHost}/sitemap.xml`);
  console.log(`  - Status: ${sitemapRes.status}`);
  const sitemapText = await sitemapRes.text();
  console.log(`  - Content length: ${sitemapText.length}`);
  console.log(`  - Content sample: ${sitemapText.slice(0, 150)}`);

  // 4. Homepage HTML Audit
  console.log('\n4. Auditing Homepage HTML:');
  const homeRes = await fetch(`${prodHost}/`);
  console.log(`  - Status: ${homeRes.status}`);
  const html = await homeRes.text();

  // Audit 1: HTML lang
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  console.log(`  [1] HTML lang: ${langMatch ? langMatch[1] : 'MISSING'}`);

  // Audit 2: Page title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  console.log(`  [2] Page Title: ${titleMatch ? titleMatch[1] : 'MISSING'}`);

  // Audit 3: Meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [3] Meta Description: ${descMatch ? descMatch[1] : 'MISSING'}`);

  // Audit 4: Canonical URL
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  console.log(`  [4] Canonical URL: ${canonicalMatch ? canonicalMatch[1] : 'MISSING'}`);

  // Audit 5: Open Graph Title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [5] OG Title: ${ogTitleMatch ? ogTitleMatch[1] : 'MISSING'}`);

  // Audit 6: Open Graph Description
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [6] OG Description: ${ogDescMatch ? ogDescMatch[1] : 'MISSING'}`);

  // Audit 7: Open Graph Image
  const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [7] OG Image: ${ogImgMatch ? ogImgMatch[1] : 'MISSING'}`);

  // Audit 8: Twitter Card
  const twitterCardMatch = html.match(/<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [8] Twitter Card: ${twitterCardMatch ? twitterCardMatch[1] : 'MISSING'}`);

  // Audit 9: Favicon
  const iconMatches = Array.from(html.matchAll(/<link[^>]*rel=["'](icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']*)["']/gi));
  console.log(`  [9] Favicon links found: ${iconMatches.length}`);
  iconMatches.forEach(m => console.log(`      - ${m[1]}: ${m[2]}`));

  // Audit 10: Robots directives
  const robotsMetaMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [10] Robots meta tag: ${robotsMetaMatch ? robotsMetaMatch[1] : 'NONE (defaults to index,follow)'}`);

  // Audit 11: Structured data (JSON-LD)
  const jsonLdMatches = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  console.log(`  [12] JSON-LD Structured Data scripts: ${jsonLdMatches.length}`);

  // Audit 13: Heading hierarchy
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)).map(m => m[1].replace(/<[^>]+>/g, '').trim());
  console.log(`  [13] Headings:`);
  console.log(`      - H1 count: ${h1Matches.length} -> "${h1Matches[0] || ''}"`);
  console.log(`      - H2 count: ${h2Matches.length}`);
  h2Matches.forEach((h, i) => console.log(`        H2[${i}]: ${h}`));

  // Audit 14: Internal links
  const linkMatches = Array.from(html.matchAll(/<a[^>]*href=["']([^"']*)["']/gi)).map(m => m[1]);
  console.log(`  [14] Total links on homepage: ${linkMatches.length}`);
  const internalLinks = linkMatches.filter(l => l.startsWith('/') || l.startsWith('#'));
  console.log(`      - Internal/anchor links: ${internalLinks.length}`);

  // Audit 15: Image alt attributes
  const imgMatches = Array.from(html.matchAll(/<img([^>]*)>/gi));
  console.log(`  [15] Total <img> tags: ${imgMatches.length}`);
  let missingAlt = 0;
  for (const m of imgMatches) {
    if (!m[1].includes('alt=') || m[1].includes('alt=""') || m[1].includes("alt=''")) {
      missingAlt++;
    }
  }
  console.log(`      - Missing / empty alt: ${missingAlt}`);

  // Audit 16: Mobile viewport
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i);
  console.log(`  [16] Mobile viewport: ${viewportMatch ? viewportMatch[1] : 'DEFAULT NEXT.JS'}`);

  // 5. Audit Other Public Pages
  console.log('\n5. Auditing Terms & Privacy Pages:');
  const termsRes = await fetch(`${prodHost}/legal/terms`);
  const termsHtml = await termsRes.text();
  const termsTitle = termsHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
  console.log(`  - /legal/terms Title: ${termsTitle ? termsTitle[1] : 'MISSING'}`);

  const privacyRes = await fetch(`${prodHost}/legal/privacy`);
  const privacyHtml = await privacyRes.text();
  const privacyTitle = privacyHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
  console.log(`  - /legal/privacy Title: ${privacyTitle ? privacyTitle[1] : 'MISSING'}`);

  // 6. Audit Private Routes for accidental indexing
  console.log('\n6. Auditing Private Routes for Robots / Indexing Directives:');
  const privateRoutes = ['/login', '/register', '/dashboard', '/norden-control-center', '/upgrade', '/forgot-password', '/onboarding'];
  for (const r of privateRoutes) {
    const res = await fetch(`${prodHost}${r}`, { redirect: 'manual' });
    const rHtml = await res.text();
    const rRobots = rHtml.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const rTitle = rHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
    console.log(`  - ${r} -> Status: ${res.status} | Title: ${rTitle ? rTitle[1] : '-'} | Robots: ${rRobots ? rRobots[1] : 'NONE (EXPOSED TO INDEXING)'}`);
  }
}

auditProductionSeo().catch(console.error);
