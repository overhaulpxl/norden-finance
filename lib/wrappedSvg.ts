import { renderNordenHorizontalSvg, renderNordenIconSvg } from './brandSvg';

export interface WrappedShareData {
  month: string;
  totalExpense: string;
  topCategoryName: string;
  topCategoryAmount: string;
  topCategoryPercent: number;
  totalTransactions: string;
  cashflow: string;
  walletBalance: string;
  insight: string;
}

export function sanitizeSvgText(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[char] || char));
}

export function wrapSvgText(text: string, maxChars: number, maxLines = 4): string[] {
  if (!text || !text.trim()) return ['-'];
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return ['-'];

  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = current ? `${current} ${word}` : word;

    if (testLine.length <= maxChars) {
      current = testLine;
    } else {
      if (lines.length === maxLines - 1) {
        // Last line reached: fill as much as possible, append ellipsis if remaining
        const remainingWords = [current, ...words.slice(i)].filter(Boolean).join(' ');
        if (remainingWords.length > maxChars) {
          const cut = remainingWords.slice(0, Math.max(10, maxChars - 3)).trimEnd();
          lines.push(`${cut}...`);
        } else {
          lines.push(remainingWords);
        }
        current = '';
        break;
      }
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  return lines.length ? lines : ['-'];
}

export function svgMultilineText({
  text,
  x,
  y,
  maxChars,
  maxLines = 3,
  lineHeight,
  fontSize,
  fontWeight = 900,
  fill = '#000',
  anchor = 'start',
}: {
  text: string;
  x: number;
  y: number;
  maxChars: number;
  maxLines?: number;
  lineHeight: number;
  fontSize: number;
  fontWeight?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
}): string {
  const fontFam = "'Outfit', 'Plus Jakarta Sans', 'Arial Black', 'Impact', sans-serif";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fontFam}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">
    ${wrapSvgText(text, maxChars, maxLines).map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${sanitizeSvgText(line)}</tspan>`).join('')}
  </text>`;
}

export function buildWrappedSvg(data: WrappedShareData, background: string, lang: 'id' | 'en' = 'id'): string {
  const width = 1080;
  const height = 1920;
  const fontFam = "'Outfit', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const isId = lang === 'id';

  // Dynamic font sizing for total expense to guarantee it never clips
  const expenseLen = data.totalExpense.length;
  const expenseFontSize = expenseLen > 18 ? 58 : expenseLen > 14 ? 68 : 80;

  // Format transaction count cleanly without text overflow
  const countMatch = data.totalTransactions.match(/^(\d+)/);
  const txCount = countMatch ? countMatch[1] : data.totalTransactions;
  const txSubLabel = isId ? 'TRANSAKSI TERCATAT' : 'RECORDED TRANSACTIONS';

  // Check if cashflow is surplus or deficit
  const isDeficit = data.cashflow.includes('-') || data.cashflow.toLowerCase().includes('defisit');
  const cashflowTag = isDeficit
    ? (isId ? 'DEFISIT' : 'DEFICIT')
    : (isId ? 'SURPLUS' : 'SURPLUS');
  const cashflowTagBg = isDeficit ? '#FECACA' : '#BBF7D0';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <!-- Architectural Brutalist Dot Pattern -->
        <pattern id="brutal-dots" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="#111111" opacity="0.14" />
        </pattern>
      </defs>

      <!-- Background Canvas -->
      <rect width="100%" height="100%" fill="${background}"/>
      <rect width="100%" height="100%" fill="url(#brutal-dots)"/>

      <!-- Outer Neobrutalist Story Canvas -->
      <!-- Hard Shadow -->
      <rect x="74" y="74" width="948" height="1788" fill="#111111" rx="28"/>
      <!-- Main Surface -->
      <rect x="60" y="60" width="948" height="1788" fill="#FFFFFF" stroke="#111111" stroke-width="8" rx="28"/>

      <!-- Top Header Bar -->
      <g transform="translate(100, 100)">
        <!-- Official Norden Horizontal Logo -->
        ${renderNordenHorizontalSvg(0, 0, 240)}

        <!-- Official Brand Icon on Right with Brutalist Shadow -->
        <g transform="translate(790, -4)">
          <rect x="6" y="6" width="76" height="76" fill="#111111" rx="14"/>
          ${renderNordenIconSvg(0, 0, 76)}
        </g>
      </g>

      <!-- Title & Period Stamp -->
      <g transform="translate(100, 195)">
        <text x="0" y="68" font-family="${fontFam}" font-size="74" font-weight="900" fill="#111111" letter-spacing="-1">MONTHLY</text>
        <text x="0" y="142" font-family="${fontFam}" font-size="74" font-weight="900" fill="#111111" letter-spacing="-1">WRAPPED</text>

        <!-- Month Pill Badge -->
        <g transform="translate(0, 175)">
          <rect x="4" y="4" width="310" height="46" fill="#111111" rx="8"/>
          <rect x="0" y="0" width="310" height="46" fill="#FFE066" stroke="#111111" stroke-width="4" rx="8"/>
          <text x="155" y="30" text-anchor="middle" font-family="${fontFam}" font-size="20" font-weight="900" fill="#111111" letter-spacing="2">${sanitizeSvgText(data.month).toUpperCase()}</text>
        </g>
      </g>

      <!-- Hero Highlight Card: Total Expenses -->
      <g transform="translate(100, 470)">
        <!-- Shadow -->
        <rect x="10" y="10" width="868" height="230" fill="#111111" rx="20"/>
        <!-- Card -->
        <rect x="0" y="0" width="868" height="230" fill="#FFE066" stroke="#111111" stroke-width="7" rx="20"/>

        <!-- Header Pill inside card -->
        <rect x="36" y="28" width="220" height="34" fill="#111111" rx="6"/>
        <text x="146" y="51" text-anchor="middle" font-family="${fontFam}" font-size="14" font-weight="900" fill="#FFE066" letter-spacing="2">
          ${isId ? 'TOTAL PENGELUARAN' : 'TOTAL EXPENSES'}
        </text>

        <!-- Main Amount with Dynamic Safe Scaling -->
        <text x="36" y="150" font-family="${fontFam}" font-size="${expenseFontSize}" font-weight="900" fill="#111111">
          ${sanitizeSvgText(data.totalExpense)}
        </text>
        <text x="36" y="195" font-family="${fontFam}" font-size="18" font-weight="800" fill="#52525B">
          ${isId ? 'Akumulasi belanja dan pengeluaran bulan ini' : 'Cumulative spending recorded this month'}
        </text>
      </g>

      <!-- Row 1 Bento: Top Category & Total Transactions -->
      <g transform="translate(100, 740)">
        <!-- Card 1: Top Category (Left) -->
        <g transform="translate(0, 0)">
          <rect x="8" y="8" width="418" height="235" fill="#111111" rx="18"/>
          <rect x="0" y="0" width="418" height="235" fill="#FFFFFF" stroke="#111111" stroke-width="6" rx="18"/>

          <!-- Tag -->
          <rect x="24" y="24" width="160" height="32" fill="#111111" rx="6"/>
          <text x="104" y="45" text-anchor="middle" font-family="${fontFam}" font-size="12" font-weight="900" fill="#FFE066" letter-spacing="1.5">
            ${isId ? 'POS TERBESAR' : 'TOP CATEGORY'}
          </text>

          <text x="24" y="105" font-family="${fontFam}" font-size="28" font-weight="900" fill="#111111">
            ${sanitizeSvgText(data.topCategoryName.length > 16 ? data.topCategoryName.slice(0, 14) + '..' : data.topCategoryName)}
          </text>

          <!-- Percentage & Amount Pill -->
          <rect x="24" y="135" width="260" height="42" fill="#FEF08A" stroke="#111111" stroke-width="3" rx="8"/>
          <text x="154" y="162" text-anchor="middle" font-family="${fontFam}" font-size="18" font-weight="900" fill="#111111">
            ${data.topCategoryPercent}% · ${sanitizeSvgText(data.topCategoryAmount)}
          </text>

          <text x="24" y="206" font-family="${fontFam}" font-size="14" font-weight="800" fill="#71717A">
            ${isId ? 'Porsi dari total belanja' : 'Share of total expenses'}
          </text>
        </g>

        <!-- Card 2: Total Activity (Right) -->
        <g transform="translate(450, 0)">
          <rect x="8" y="8" width="418" height="235" fill="#111111" rx="18"/>
          <rect x="0" y="0" width="418" height="235" fill="#FFFFFF" stroke="#111111" stroke-width="6" rx="18"/>

          <!-- Tag -->
          <rect x="24" y="24" width="130" height="32" fill="#111111" rx="6"/>
          <text x="89" y="45" text-anchor="middle" font-family="${fontFam}" font-size="12" font-weight="900" fill="#FFE066" letter-spacing="1.5">
            ${isId ? 'AKTIVITAS' : 'ACTIVITY'}
          </text>

          <!-- Big Counter Number -->
          <text x="24" y="125" font-family="${fontFam}" font-size="64" font-weight="900" fill="#111111">
            ${sanitizeSvgText(txCount)}
          </text>

          <text x="24" y="168" font-family="${fontFam}" font-size="18" font-weight="900" fill="#111111" letter-spacing="1">
            ${txSubLabel}
          </text>
          <text x="24" y="206" font-family="${fontFam}" font-size="14" font-weight="800" fill="#71717A">
            ${isId ? 'Konsistensi mutasi aktif' : 'Active tracking frequency'}
          </text>
        </g>
      </g>

      <!-- Row 2 Bento: Net Cashflow & Wallet Balance -->
      <g transform="translate(100, 1015)">
        <!-- Card 3: Net Cashflow (Left) -->
        <g transform="translate(0, 0)">
          <rect x="8" y="8" width="418" height="235" fill="#111111" rx="18"/>
          <rect x="0" y="0" width="418" height="235" fill="#FFFFFF" stroke="#111111" stroke-width="6" rx="18"/>

          <!-- Status Tag -->
          <rect x="24" y="24" width="130" height="32" fill="${cashflowTagBg}" stroke="#111111" stroke-width="3" rx="6"/>
          <text x="89" y="45" text-anchor="middle" font-family="${fontFam}" font-size="12" font-weight="900" fill="#111111" letter-spacing="1.5">
            ${cashflowTag}
          </text>

          <text x="24" y="98" font-family="${fontFam}" font-size="18" font-weight="900" fill="#71717A" letter-spacing="1">
            ${isId ? 'ARUS KAS BERSIH' : 'NET CASHFLOW'}
          </text>

          <text x="24" y="146" font-family="${fontFam}" font-size="34" font-weight="900" fill="#111111">
            ${sanitizeSvgText(data.cashflow)}
          </text>

          <text x="24" y="206" font-family="${fontFam}" font-size="14" font-weight="800" fill="#71717A">
            ${isId ? 'Total pemasukan dikurangi belanja' : 'Net income minus expenses'}
          </text>
        </g>

        <!-- Card 4: Wallet Balance (Right) -->
        <g transform="translate(450, 0)">
          <rect x="8" y="8" width="418" height="235" fill="#111111" rx="18"/>
          <rect x="0" y="0" width="418" height="235" fill="#FFFFFF" stroke="#111111" stroke-width="6" rx="18"/>

          <!-- Tag -->
          <rect x="24" y="24" width="160" height="32" fill="#BAE6FD" stroke="#111111" stroke-width="3" rx="6"/>
          <text x="104" y="45" text-anchor="middle" font-family="${fontFam}" font-size="12" font-weight="900" fill="#111111" letter-spacing="1.5">
            ${isId ? 'TOTAL LIKUIDITAS' : 'TOTAL BALANCE'}
          </text>

          <text x="24" y="98" font-family="${fontFam}" font-size="18" font-weight="900" fill="#71717A" letter-spacing="1">
            ${isId ? 'SALDO REKENING AKTIF' : 'ACTIVE WALLET BALANCE'}
          </text>

          <text x="24" y="146" font-family="${fontFam}" font-size="34" font-weight="900" fill="#111111">
            ${sanitizeSvgText(data.walletBalance)}
          </text>

          <text x="24" y="206" font-family="${fontFam}" font-size="14" font-weight="800" fill="#71717A">
            ${isId ? 'Konsolidasi bank & e-wallet' : 'Consolidated bank & e-wallet'}
          </text>
        </g>
      </g>

      <!-- Insight & Strategy Box -->
      <g transform="translate(100, 1290)">
        <rect x="10" y="10" width="868" height="330" fill="#111111" rx="20"/>
        <rect x="0" y="0" width="868" height="330" fill="#FAF9F5" stroke="#111111" stroke-width="7" rx="20"/>

        <!-- Header Tag -->
        <rect x="36" y="32" width="310" height="38" fill="#FFE066" stroke="#111111" stroke-width="3" rx="8"/>
        <text x="191" y="57" text-anchor="middle" font-family="${fontFam}" font-size="15" font-weight="900" fill="#111111" letter-spacing="2">
          ${isId ? 'INSIGHT & STRATEGI BULAN INI' : 'MONTHLY STRATEGY & INSIGHT'}
        </text>

        <!-- Strategic Guidance Text -->
        ${svgMultilineText({ text: data.insight, x: 36, y: 120, maxChars: 42, maxLines: 4, lineHeight: 44, fontSize: 28, fontWeight: 800, fill: '#18181B' })}
      </g>

      <!-- Footer Brand Elements -->
      <g transform="translate(100, 1670)">
        <text x="0" y="32" font-family="${fontFam}" font-size="30" font-weight="900" fill="#111111">Track your money. Find your direction.</text>
        <text x="0" y="72" font-family="${fontFam}" font-size="22" font-weight="800" fill="#71717A">https://www.nordenfinance.site</text>

        <!-- Official Verified Brand Seal -->
        <g transform="translate(760, -20)">
          <rect x="8" y="8" width="100" height="100" fill="#111111" rx="16"/>
          ${renderNordenIconSvg(0, 0, 100)}
        </g>
      </g>
    </svg>
  `;
}
