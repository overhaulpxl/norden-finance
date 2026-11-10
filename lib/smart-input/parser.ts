import type { Balance } from '../../types';
import { CANONICAL_ALIASES, CANONICAL_WALLET_DISPLAY } from '../constants';

type WalletLike = Pick<Balance, 'id' | 'name' | 'archivedAt'>;

export type WalletMatch = {
  wallet: WalletLike;
  alias: string;
  index: number;
  source: 'input' | 'ai' | 'fallback';
};

function displayCanonicalWalletName(value: string) {
  const normalized = normalizeWalletName(value);
  return CANONICAL_WALLET_DISPLAY[normalized] || value;
}

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeWalletName(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function aliasesForWallet(walletName: string) {
  const normalized = normalizeWalletName(walletName);
  const spaced = normalizeText(walletName);
  const aliases = new Set<string>([normalized, spaced]);

  const canonicalAliases = CANONICAL_ALIASES[normalized] || [];
  for (const alias of canonicalAliases) {
    aliases.add(normalizeText(alias));
    aliases.add(normalizeWalletName(alias));
  }

  // Handle compound words like "tabungan", "simpanan", "rencana"
  const words = spaced.split(' ').filter((w) => w.length >= 3);
  for (const w of words) {
    aliases.add(w);
  }

  return Array.from(aliases).filter(Boolean);
}

export function stripWalletAliasesFromText(value: string | null | undefined, wallets: WalletLike[]) {
  if (!value) return value || '';

  let cleaned = ` ${value} `;
  const aliases = wallets
    .flatMap((wallet) => aliasesForWallet(wallet.name))
    .map((alias) => normalizeText(alias))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const alias of aliases) {
    const pattern = alias
      .split(/\s+/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[\\s\\W_]+');
    cleaned = cleaned.replace(new RegExp(`\\s${pattern}\\s`, 'gi'), ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim() || '-';
}

export function buildWalletAliasMap(wallets: WalletLike[]) {
  const map = new Map<string, WalletLike>();
  for (const wallet of wallets) {
    for (const alias of aliasesForWallet(wallet.name)) {
      if (!map.has(alias)) map.set(alias, wallet);
    }
  }
  return map;
}

function findAliasIndex(input: string, alias: string) {
  const normalizedInput = normalizeText(input);
  const normalizedAlias = normalizeText(alias);
  if (!normalizedAlias) return -1;

  const spacedIndex = ` ${normalizedInput} `.indexOf(` ${normalizedAlias} `);
  if (spacedIndex >= 0) return Math.max(0, spacedIndex);

  // If not space-delimited, only match when bounded by non-alphabetic chars (e.g. "gopay50k" matches, but "perdana" does not)
  const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const boundedRegex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
  const match = normalizedInput.match(boundedRegex);
  return match && match.index !== undefined ? match.index : -1;
}

export function detectWalletsFromInput(input: string, wallets: WalletLike[]): WalletMatch[] {
  const aliasMap = buildWalletAliasMap(wallets);
  const matches: WalletMatch[] = [];
  const seenWalletIds = new Set<string>();
  const claimedSpans: Array<{ start: number; end: number }> = [];

  const normalizedInput = normalizeText(input);

  // Sort entries so longer aliases match first (e.g. 'bni tabungan' before 'bni')
  const sortedEntries = Array.from(aliasMap.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, wallet] of sortedEntries) {
    if (seenWalletIds.has(wallet.id)) continue;
    const normalizedAlias = normalizeText(alias);
    if (!normalizedAlias) continue;

    const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi');
    let regexMatch: RegExpExecArray | null;

    while ((regexMatch = regex.exec(normalizedInput)) !== null) {
      const start = regexMatch.index;
      const end = start + normalizedAlias.length;

      const overlaps = claimedSpans.some(
        (span) => Math.max(start, span.start) < Math.min(end, span.end)
      );

      if (!overlaps) {
        claimedSpans.push({ start, end });
        seenWalletIds.add(wallet.id);
        matches.push({ wallet, alias, index: start, source: 'input' });
        break;
      }
    }
  }

  return matches.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
}

export function detectWalletFromInput(input: string, wallets: WalletLike[]) {
  const matches = detectWalletsFromInput(input, wallets);
  if (matches.length <= 1) return matches[0] || null;

  const first = matches[0];
  const firstIsCashWithdrawalWord = normalizeWalletName(first.wallet.name) === 'cash' && normalizeWalletName(first.alias) === 'tunai';
  if (firstIsCashWithdrawalWord && /\btarik\s+tunai\b/i.test(input)) {
    const nonCashMatch = matches.find((match) => normalizeWalletName(match.wallet.name) !== 'cash');
    if (nonCashMatch) return nonCashMatch;
  }

  return first;
}

export function detectKnownWalletAliasFromInput(input: string) {
  return detectKnownWalletAliasesFromInput(input)[0] || null;
}

export function detectKnownWalletAliasesFromInput(input: string) {
  const aliases = Object.entries(CANONICAL_ALIASES)
    .flatMap(([canonical, values]) => values.map((alias) => ({ canonical, alias })))
    .sort((a, b) => b.alias.length - a.alias.length);

  const matches: Array<{ canonical: string; displayName: string; alias: string; index: number }> = [];
  const seen = new Set<string>();

  for (const { canonical, alias } of aliases) {
    const index = findAliasIndex(input, alias);
    if (index >= 0 && !seen.has(canonical)) {
      seen.add(canonical);
      matches.push({
        canonical,
        displayName: displayCanonicalWalletName(canonical),
        alias,
        index,
      });
    }
  }

  return matches.sort((a, b) => a.index - b.index || b.alias.length - a.alias.length);
}

export function validateWalletMatch(walletName: string | null | undefined, wallets: WalletLike[]) {
  if (!walletName) return null;

  const requested = normalizeWalletName(walletName);
  if (!requested || requested === 'unknown') return null;

  const aliasMap = buildWalletAliasMap(wallets);
  const wallet = aliasMap.get(requested) || aliasMap.get(normalizeText(walletName));
  if (!wallet) return null;

  return { wallet, alias: walletName, index: -1, source: 'ai' as const };
}

export function getFallbackWallet(wallets: WalletLike[]) {
  const activeWallets = wallets.filter((wallet) => !wallet.archivedAt);
  if (activeWallets.length === 0) return null;
  if (activeWallets.length === 1) return { wallet: activeWallets[0], alias: activeWallets[0].name, index: -1, source: 'fallback' as const };

  const cash = validateWalletMatch('cash', activeWallets);
  if (cash) return { ...cash, source: 'fallback' as const };

  return { wallet: activeWallets[0], alias: activeWallets[0].name, index: -1, source: 'fallback' as const };
}

export function resolveWalletForTransaction({
  input,
  parsedWalletName,
  wallets,
}: {
  input: string;
  parsedWalletName?: string | null;
  wallets: WalletLike[];
}) {
  const explicitMatch = detectWalletFromInput(input, wallets);
  if (explicitMatch) return explicitMatch;

  const aiMatch = validateWalletMatch(parsedWalletName, wallets);
  if (aiMatch) return aiMatch;

  return getFallbackWallet(wallets);
}

export function resolveTransferWalletsFromInput(input: string, wallets: WalletLike[]) {
  const matches = detectWalletsFromInput(input, wallets);
  if (matches.length < 2) return null;

  const lower = ' ' + normalizeText(input) + ' ';

  // Disambiguate with longer aliases first
  const sortedByLength = [...matches].sort((a, b) => b.alias.length - a.alias.length);

  let toMatch: WalletMatch | null = null;
  let fromMatch: WalletMatch | null = null;

  for (const match of sortedByLength) {
    const aliasNorm = normalizeText(match.alias);
    if (new RegExp(`\\s(?:ke|to)\\s+${aliasNorm}\\s`, 'i').test(lower)) {
      toMatch = match;
      break;
    }
  }

  for (const match of sortedByLength) {
    if (match.wallet.id === toMatch?.wallet.id) continue;
    const aliasNorm = normalizeText(match.alias);
    if (new RegExp(`\\s(?:dari|from|pakai)\\s+${aliasNorm}\\s`, 'i').test(lower)) {
      fromMatch = match;
      break;
    }
  }

  if (toMatch && !fromMatch) {
    fromMatch = matches.find((m) => m.wallet.id !== toMatch!.wallet.id) || null;
  } else if (fromMatch && !toMatch) {
    toMatch = matches.find((m) => m.wallet.id !== fromMatch!.wallet.id) || null;
  } else if (!fromMatch && !toMatch) {
    fromMatch = matches[0];
    toMatch = matches.find((m) => m.wallet.id !== matches[0].wallet.id) || null;
  }

  if (!fromMatch || !toMatch || fromMatch.wallet.id === toMatch.wallet.id) return null;
  return { from: fromMatch, to: toMatch };
}
