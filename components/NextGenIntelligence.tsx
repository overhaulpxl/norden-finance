'use client';

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  Flag,
  LineChart as LineChartIcon,
  PiggyBank,
  Repeat,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addBudget } from '../app/actions';
import {
  Achievement,
  AppSubscription,
  Balance,
  Budget,
  Debt,
  Paylater,
  SavingGoal,
  Transaction,
} from '../types';
import { formatCurrency, formatRupiah } from '../lib/format';

interface NextGenIntelligenceProps {
  transactions: Transaction[];
  balances: Balance[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  savingGoals: SavingGoal[];
  debts: Debt[];
  paylaters: Paylater[];
  achievements: Achievement[];
}

interface MonthlyFinance {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

const DAY_MS = 86_400_000;
const CARD_COLORS = ['#bbf7d0', '#bfdbfe', '#fef08a', '#fecaca', '#ddd6fe'];
const WEEKDAY_LABELS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_FORMAT = new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' });
const LONG_MONTH_FORMAT = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const compactRupiah = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameMonth(date: Date, reference: Date) {
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function sanitizeSvgText(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[char] || char));
}

function wrapSvgText(text: string, maxChars: number, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    } else {
      current = next;
    }
  }

  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : ['-'];
}

function svgMultilineText({
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
}) {
  const fontFam = "'Outfit', 'Plus Jakarta Sans', 'Arial Black', 'Impact', sans-serif";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${fontFam}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">
    ${wrapSvgText(text, maxChars, maxLines).map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${sanitizeSvgText(line)}</tspan>`).join('')}
  </text>`;
}

function getMonthlyFinances(transactions: Transaction[]): MonthlyFinance[] {
  const map = new Map<string, MonthlyFinance>();

  transactions.forEach((transaction) => {
    if (transaction.type === 'transfer') return;
    const date = new Date(transaction.transactionDate);
    if (Number.isNaN(date.getTime())) return;
    const key = monthKey(date);
    const monthDate = startOfMonth(date);
    const current = map.get(key) ?? {
      key,
      label: MONTH_FORMAT.format(monthDate),
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    };

    if (transaction.type === 'masuk') current.income += transaction.amount;
    if (transaction.type === 'keluar') current.expense += transaction.amount;
    current.net = current.income - current.expense;
    current.count += 1;
    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function categoryTotals(transactions: Transaction[], reference?: Date) {
  const map = new Map<string, { name: string; amount: number; count: number }>();
  transactions.forEach((transaction) => {
    const date = new Date(transaction.transactionDate);
    if (reference && !sameMonth(date, reference)) return;
    if (transaction.type !== 'keluar') return;

    const name = transaction.category?.name || 'Lain-lain';
    const current = map.get(name.toLowerCase()) ?? { name, amount: 0, count: 0 };
    current.amount += transaction.amount;
    current.count += 1;
    map.set(name.toLowerCase(), current);
  });

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

interface WrappedShareData {
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

function buildWrappedSvg(data: WrappedShareData, background: string) {
  const width = 1080;
  const height = 1920;
  const fontFam = "'Outfit', 'Plus Jakarta Sans', 'Arial Black', 'Impact', sans-serif";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <style type="text/css">
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
        </style>
      </defs>

      <!-- Background and Decorative Grid -->
      <rect width="100%" height="100%" fill="${background}"/>
      <path d="M0 250H1080M0 580H1080M0 910H1080M0 1240H1080M0 1570H1080" stroke="#000" stroke-width="3" opacity="0.12"/>
      <path d="M210 0V1920M540 0V1920M870 0V1920" stroke="#000" stroke-width="3" opacity="0.08"/>

      <!-- Outer Card with Neobrutalist Shadow -->
      <rect x="74" y="74" width="964" height="1804" fill="#000"/>
      <rect x="58" y="58" width="964" height="1804" fill="#fff" stroke="#000" stroke-width="10"/>

      <!-- Header Bar with Shadow -->
      <rect x="108" y="108" width="896" height="116" fill="#FFE066"/>
      <rect x="92" y="92" width="896" height="116" fill="#000" stroke="#000" stroke-width="8"/>
      <text x="136" y="166" font-family="${fontFam}" font-size="44" font-weight="900" fill="#FFE066" letter-spacing="2">NORDEN FINANCE</text>
      <rect x="846" y="118" width="86" height="54" fill="#FFE066" stroke="#fff" stroke-width="4"/>
      <text x="889" y="158" text-anchor="middle" font-family="${fontFam}" font-size="34" font-weight="900" fill="#000">N</text>

      <!-- Title -->
      <text x="92" y="302" font-family="${fontFam}" font-size="76" font-weight="900" fill="#000">Monthly</text>
      <text x="92" y="382" font-family="${fontFam}" font-size="76" font-weight="900" fill="#000">Wrapped</text>
      <text x="96" y="432" font-family="${fontFam}" font-size="32" font-weight="800" fill="#525252">${sanitizeSvgText(data.month)}</text>

      <!-- Total Pengeluaran Card -->
      <rect x="108" y="506" width="896" height="285" fill="#000"/>
      <rect x="92" y="490" width="896" height="285" fill="#FFE066" stroke="#000" stroke-width="8"/>
      <text x="138" y="566" font-family="${fontFam}" font-size="34" font-weight="900" fill="#000" letter-spacing="1">TOTAL PENGELUARAN</text>
      ${svgMultilineText({ text: data.totalExpense, x: 138, y: 680, maxChars: 18, maxLines: 1, lineHeight: 0, fontSize: 92 })}

      <!-- Kategori Utama Card -->
      <rect x="108" y="851" width="416" height="250" fill="#000"/>
      <rect x="92" y="835" width="416" height="250" fill="#fff" stroke="#000" stroke-width="8"/>
      <rect x="126" y="866" width="110" height="38" rx="19" ry="19" fill="#FFE066" stroke="#000" stroke-width="4"/>
      <text x="181" y="892" text-anchor="middle" font-family="${fontFam}" font-size="16" font-weight="900" fill="#000">UTAMA</text>
      <text x="136" y="958" font-family="${fontFam}" font-size="30" font-weight="900" fill="#000">Kategori Utama</text>
      ${svgMultilineText({ text: data.topCategoryName, x: 136, y: 1010, maxChars: 17, maxLines: 1, lineHeight: 0, fontSize: 40 })}
      <text x="136" y="1055" font-family="${fontFam}" font-size="24" font-weight="900" fill="#737373">${sanitizeSvgText(data.topCategoryAmount)} · ${data.topCategoryPercent}%</text>

      <!-- Total Transaksi Card (Black theme with yellow shadow) -->
      <rect x="588" y="851" width="416" height="250" fill="#FFE066"/>
      <rect x="572" y="835" width="416" height="250" fill="#000" stroke="#000" stroke-width="8"/>
      <rect x="606" y="866" width="130" height="38" rx="19" ry="19" fill="#fff" stroke="#000" stroke-width="4"/>
      <text x="671" y="892" text-anchor="middle" font-family="${fontFam}" font-size="16" font-weight="900" fill="#000">AKTIVITAS</text>
      <text x="616" y="958" font-family="${fontFam}" font-size="30" font-weight="900" fill="#FFE066">Total Transaksi</text>
      ${svgMultilineText({ text: data.totalTransactions, x: 616, y: 1018, maxChars: 16, maxLines: 1, lineHeight: 0, fontSize: 50, fill: '#fff' })}

      <!-- Cashflow Card (Black theme with yellow shadow) -->
      <rect x="108" y="1156" width="416" height="250" fill="#FFE066"/>
      <rect x="92" y="1140" width="416" height="250" fill="#000" stroke="#000" stroke-width="8"/>
      <rect x="126" y="1171" width="130" height="38" rx="19" ry="19" fill="#FFE066" stroke="#000" stroke-width="4"/>
      <text x="191" y="1197" text-anchor="middle" font-family="${fontFam}" font-size="16" font-weight="900" fill="#000">CASHFLOW</text>
      <text x="136" y="1258" font-family="${fontFam}" font-size="30" font-weight="900" fill="#FFE066">Cashflow</text>
      ${svgMultilineText({ text: data.cashflow, x: 136, y: 1323, maxChars: 16, maxLines: 1, lineHeight: 0, fontSize: 46, fill: '#fff' })}

      <!-- Wallet Aktif Card -->
      <rect x="588" y="1156" width="416" height="250" fill="#000"/>
      <rect x="572" y="1140" width="416" height="250" fill="#fff" stroke="#000" stroke-width="8"/>
      <rect x="606" y="1171" width="110" height="38" rx="19" ry="19" fill="#FFE066" stroke="#000" stroke-width="4"/>
      <text x="661" y="1197" text-anchor="middle" font-family="${fontFam}" font-size="16" font-weight="900" fill="#000">DOMPET</text>
      <text x="616" y="1258" font-family="${fontFam}" font-size="30" font-weight="900" fill="#000">Wallet Aktif</text>
      ${svgMultilineText({ text: data.walletBalance, x: 616, y: 1323, maxChars: 17, maxLines: 1, lineHeight: 0, fontSize: 40 })}

      <!-- Insight Card -->
      <rect x="108" y="1466" width="896" height="230" fill="#000"/>
      <rect x="92" y="1450" width="896" height="230" fill="#FFE066" stroke="#000" stroke-width="8"/>
      <text x="136" y="1514" font-family="${fontFam}" font-size="32" font-weight="900" fill="#000" letter-spacing="1">INSIGHT BULAN INI</text>
      ${svgMultilineText({ text: data.insight, x: 136, y: 1575, maxChars: 42, maxLines: 2, lineHeight: 42, fontSize: 28, fontWeight: 800 })}

      <!-- Footer Brand Elements -->
      <text x="92" y="1760" font-family="${fontFam}" font-size="30" font-weight="900" fill="#000">Track your money. Find your direction.</text>
      <rect x="866" y="1731" width="86" height="86" fill="#000"/>
      <rect x="850" y="1715" width="86" height="86" fill="#FFE066" stroke="#000" stroke-width="6"/>
      <text x="893" y="1776" text-anchor="middle" font-family="${fontFam}" font-size="52" font-weight="900" fill="#000">N</text>
    </svg>
  `;
}

function downloadSharePng({ data, background }: { data: WrappedShareData; background: string }) {
  const width = 1080;
  const height = 1920;
  const svg = buildWrappedSvg(data, background);
  const image = new Image();
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement('a');
    link.download = 'norden-monthly-wrapped-story.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  image.src = url;
}

function SmallMetric({ label, value, tone = 'bg-white' }: { label: string; value: string; tone?: string }) {
  let toneClass = 'bg-white dark:bg-neutral-800 text-black dark:text-white';
  let labelClass = 'text-neutral-600 dark:text-neutral-400';
  let valueClass = 'text-black dark:text-white';

  if (tone === 'bg-[#bbf7d0]') {
    toneClass = 'bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-emerald-200';
    labelClass = 'text-neutral-700 dark:text-emerald-300';
    valueClass = 'text-black dark:text-emerald-100';
  } else if (tone === 'bg-[#fecaca]') {
    toneClass = 'bg-[#fecaca] dark:bg-red-950/70 text-black dark:text-red-200';
    labelClass = 'text-neutral-700 dark:text-red-300';
    valueClass = 'text-black dark:text-red-100';
  } else if (tone === 'bg-[#bfdbfe]') {
    toneClass = 'bg-[#bfdbfe] dark:bg-blue-950/70 text-black dark:text-blue-200';
    labelClass = 'text-neutral-700 dark:text-blue-300';
    valueClass = 'text-black dark:text-blue-100';
  } else if (tone === 'bg-[#fef08a]') {
    toneClass = 'bg-[#fef08a] dark:bg-amber-950/70 text-black dark:text-amber-200';
    labelClass = 'text-neutral-700 dark:text-amber-300';
    valueClass = 'text-black dark:text-amber-100';
  } else if (tone.includes('bg-black')) {
    toneClass = 'bg-black dark:bg-neutral-950 text-white';
    labelClass = 'text-neutral-400';
    valueClass = 'text-white';
  } else if (tone !== 'bg-white' && tone !== 'white') {
    toneClass = tone;
  }

  return (
    <div className={`border-2 border-black dark:border-neutral-700 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${toneClass}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest ${labelClass}`}>{label}</p>
      <p className={`mt-1 text-sm font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function NextGenIntelligence({
  transactions,
  balances,
  budgets,
  subscriptions,
  savingGoals,
  debts,
  paylaters,
  achievements,
}: NextGenIntelligenceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'habits' | 'wrapped'>('trends');
  const [allocatorIncome, setAllocatorIncome] = useState('');
  const [allocatorStatus, setAllocatorStatus] = useState<string | null>(null);
  const [shareTemplate, setShareTemplate] = useState('Monthly Wrapped');
  const [shareBackground, setShareBackground] = useState('#bbf7d0');
  const today = useMemo(() => new Date(), []);

  const analysis = useMemo(() => {
    const monthly = getMonthlyFinances(transactions);
    const recentMonths = monthly.slice(-6);
    const currentMonth = monthly.find((item) => item.key === monthKey(today)) ?? {
      key: monthKey(today),
      label: MONTH_FORMAT.format(today),
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    };
    const priorMonth = monthly[monthly.length - 2] ?? null;
    const avgIncome = recentMonths.length
      ? recentMonths.reduce((sum, item) => sum + item.income, 0) / recentMonths.length
      : 0;
    const avgExpense = recentMonths.length
      ? recentMonths.reduce((sum, item) => sum + item.expense, 0) / recentMonths.length
      : 0;
    const avgDailyExpense = avgExpense > 0 ? avgExpense / 30 : 0;
    const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);
    const netDebt = debts
      .filter((debt) => !debt.isSettled)
      .reduce((sum, debt) => sum + (debt.type === 'piutang' ? -debt.amount : debt.amount), 0);
    const netWorth = totalBalance - netDebt;
    const journeyBase = recentMonths.reduce((value, item) => value - item.net, netWorth);
    const journey = recentMonths.reduce<{ runningWorth: number; points: Array<{ label: string; value: number }> }>((acc, item) => {
      const nextWorth = acc.runningWorth + item.net;
      return {
        runningWorth: nextWorth,
        points: [...acc.points, { label: item.label, value: Math.round(nextWorth) }],
      };
    }, { runningWorth: journeyBase, points: [] }).points;
    const journeyStart = journey[0]?.value ?? netWorth;
    const journeyGrowth = journeyStart !== 0 ? ((netWorth - journeyStart) / Math.abs(journeyStart)) * 100 : 0;

    const thisMonthTransactions = transactions.filter((transaction) => sameMonth(new Date(transaction.transactionDate), today));
    const todayTransactions = transactions.filter((transaction) => dayKey(new Date(transaction.transactionDate)) === dayKey(today));
    const todayExpense = todayTransactions
      .filter((transaction) => transaction.type === 'keluar')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const savingUpdatedToday = savingGoals.some((goal) => dayKey(new Date(goal.updatedAt)) === dayKey(today) && goal.currentAmount > 0);
    const missions = [
      { title: 'No Spend Today', reward: 50, done: todayExpense === 0, detail: todayExpense === 0 ? 'Belum ada pengeluaran hari ini.' : `Pengeluaran hari ini ${formatRupiah(todayExpense)}.` },
      { title: 'Catat 3 transaksi hari ini', reward: 30, done: todayTransactions.length >= 3, detail: `${Math.min(todayTransactions.length, 3)}/3 transaksi tercatat.` },
      { title: 'Tambahkan progres ke Saving Goal', reward: 40, done: savingUpdatedToday, detail: savingUpdatedToday ? 'Ada goal diperbarui hari ini.' : 'Update saldo salah satu goal.' },
      { title: 'Cek budget hari ini', reward: 20, done: budgets.length > 0, detail: budgets.length ? `${budgets.length} budget aktif.` : 'Buat atau cek budget kategori.' },
    ];

    const elapsedDays = Math.max(1, today.getDate());
    const monthDays = daysInMonth(today);
    const budgetForecasts = budgets.map((budget) => {
      const spent = thisMonthTransactions
        .filter((transaction) => transaction.type === 'keluar' && transaction.category?.name.toLowerCase() === budget.category?.name.toLowerCase())
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const forecast = (spent / elapsedDays) * monthDays;
      return {
        name: budget.category?.name || 'Budget',
        limit: budget.monthlyLimit,
        spent,
        forecast,
        risk: budget.monthlyLimit > 0 ? forecast / budget.monthlyLimit : 0,
      };
    }).sort((a, b) => b.risk - a.risk);

    const upcomingSubscriptions = subscriptions
      .filter((subscription) => subscription.isActive)
      .reduce((sum, subscription) => sum + subscription.amount, 0);
    const upcomingPaylater = paylaters
      .filter((item) => !item.isSettled)
      .reduce((sum, item) => sum + item.installmentAmount, 0);
    const avgDailyNet = (avgIncome - avgExpense) / 30;
    const cashflow30 = totalBalance + (avgDailyNet * 30) - upcomingSubscriptions - upcomingPaylater;

    const currentCategories = categoryTotals(transactions, today);
    const allCategoriesByCount = categoryTotals(transactions).sort((a, b) => b.count - a.count);
    const topCategory = currentCategories[0] ?? null;
    const coffeeTransactions = transactions.filter((transaction) => {
      const text = `${transaction.note || ''} ${transaction.category?.name || ''} ${transaction.rawInput || ''}`.toLowerCase();
      return transaction.type === 'keluar' && /\b(kopi|coffee|cafe|latte|americano)\b/.test(text);
    });
    const daySpend = Array.from({ length: 7 }, (_, day) => ({
      day,
      amount: transactions
        .filter((transaction) => transaction.type === 'keluar' && new Date(transaction.transactionDate).getDay() === day)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    })).sort((a, b) => b.amount - a.amount);
    const busiestDay = daySpend[0];

    const subscriptionInsights = subscriptions.filter((subscription) => subscription.isActive).map((subscription) => {
      const subscriptionName = subscription.name.toLowerCase();
      const related = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.transactionDate);
        const daysAgo = Math.floor((today.getTime() - transactionDate.getTime()) / DAY_MS);
        const text = `${transaction.note || ''} ${transaction.category?.name || ''} ${transaction.rawInput || ''}`.toLowerCase();
        return daysAgo <= 90 && text.includes(subscriptionName);
      });
      const burden = avgIncome > 0 ? subscription.amount / avgIncome : 0;
      return {
        ...subscription,
        relatedCount: related.length,
        burden,
        risk: related.length === 0 || burden >= 0.08,
      };
    }).sort((a, b) => Number(b.risk) - Number(a.risk));

    const replayMonth = monthly[monthly.length - 1] ?? currentMonth;
    const replayTransactions = transactions.filter((transaction) => monthKey(new Date(transaction.transactionDate)) === replayMonth.key);
    const largestTransaction = [...replayTransactions].sort((a, b) => b.amount - a.amount)[0] ?? null;
    const bestMonth = [...monthly].sort((a, b) => b.net - a.net)[0] ?? null;
    const walletActivity = new Map<string, number>();
    thisMonthTransactions.forEach((transaction) => {
      const walletName = transaction.wallet?.name || 'Unknown';
      walletActivity.set(walletName, (walletActivity.get(walletName) || 0) + 1);
    });
    const activeWallet = Array.from(walletActivity.entries()).sort((a, b) => b[1] - a[1])[0] ?? null;

    return {
      monthly,
      recentMonths,
      currentMonth,
      priorMonth,
      avgIncome,
      avgExpense,
      avgDailyExpense,
      totalBalance,
      netWorth,
      journey,
      journeyGrowth,
      missions,
      budgetForecasts,
      cashflow30,
      upcomingSubscriptions,
      upcomingPaylater,
      currentCategories,
      topCategory,
      coffeeTransactions,
      busiestDay,
      allCategoriesByCount,
      subscriptionInsights,
      replayMonth,
      replayTransactions,
      largestTransaction,
      bestMonth,
      activeWallet,
    };
  }, [balances, budgets, debts, paylaters, savingGoals, subscriptions, today, transactions]);

  const suggestedIncome = Number(allocatorIncome.replace(/\D/g, '')) || Math.round(analysis.avgIncome || analysis.currentMonth.income || 0);
  const allocator = {
    needs: Math.round(suggestedIncome * 0.5),
    wants: Math.round(suggestedIncome * 0.3),
    savings: Math.round(suggestedIncome * 0.2),
  };
  const topCategoryPercent = analysis.currentMonth.expense > 0 && analysis.topCategory
    ? Math.round((analysis.topCategory.amount / analysis.currentMonth.expense) * 100)
    : 0;
  const wrappedData: WrappedShareData = {
    month: LONG_MONTH_FORMAT.format(today),
    totalExpense: formatCurrency(analysis.currentMonth.expense),
    topCategoryName: analysis.topCategory?.name || 'Belum ada data kategori',
    topCategoryAmount: formatCurrency(analysis.topCategory?.amount || 0),
    topCategoryPercent,
    totalTransactions: analysis.currentMonth.count > 0 ? `${analysis.currentMonth.count} transaksi` : 'Belum ada transaksi',
    cashflow: formatCurrency(analysis.currentMonth.net),
    walletBalance: formatCurrency(analysis.totalBalance),
    insight: analysis.topCategory
      ? `Pengeluaran terbesar bulan ini berasal dari kategori ${analysis.topCategory.name}.`
      : 'Belum ada transaksi bulan ini.',
  };
  const wrappedPreviewSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildWrappedSvg(wrappedData, shareBackground))}`;
  const shareTemplates = useMemo(() => {
    const goalTemplates = savingGoals
      .map((goal) => `${goal.title} Progress`)
      .filter(Boolean);
    const achievementTemplates = achievements
      .map((achievement) => achievement.title)
      .filter(Boolean);

    return Array.from(new Set([
      'Monthly Wrapped',
      'Financial Growth',
      ...goalTemplates,
      ...achievementTemplates,
    ]));
  }, [achievements, savingGoals]);

  async function handleCreateAllocatorBudgets() {
    if (suggestedIncome <= 0) {
      setAllocatorStatus('Masukkan pendapatan bulanan terlebih dahulu.');
      return;
    }

    const results = await Promise.all([
      addBudget('Kebutuhan Pokok', allocator.needs),
      addBudget('Wants', allocator.wants),
      addBudget('Tabungan', allocator.savings),
    ]);
    const failed = results.find((result) => !result.success);
    setAllocatorStatus(failed ? failed.error || 'Gagal membuat budget.' : 'Budget 50/30/20 berhasil dibuat.');
    setTimeout(() => setAllocatorStatus(null), 5000);
  }

  return (
    <section className="space-y-6">
      <div className="brutal-card bg-black p-5 text-white sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wider">
              <Sparkles className="h-5 w-5 text-[#bbf7d0]" />
              Norden Next-Gen Intelligence
            </h3>
            <p className="mt-1 max-w-3xl text-xs font-bold uppercase tracking-wide text-neutral-300">
              Goal projection, allocator, missions, journey, replay, forecasts, habits, subscription insights, wrapped, dan share card dari data asli pengguna.
            </p>
          </div>
          <div className="border-[2px] border-white bg-[#bbf7d0] px-3 py-2 text-xs font-black uppercase tracking-widest text-black">
            {analysis.monthly.length} bulan data
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b-2 border-black dark:border-neutral-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('trends')}
          className={`px-4 py-2 border-2 border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'trends'
              ? 'bg-[#FFE066] text-black shadow-[3px_3px_0px_0px_#000] -translate-x-[1px] -translate-y-[1px]'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-750 shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          Tren & Arus Kas
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('habits')}
          className={`px-4 py-2 border-2 border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'habits'
              ? 'bg-[#FFE066] text-black shadow-[3px_3px_0px_0px_#000] -translate-x-[1px] -translate-y-[1px]'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-750 shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          Alokasi & Kebiasaan
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('wrapped')}
          className={`px-4 py-2 border-2 border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'wrapped'
              ? 'bg-[#FFE066] text-black shadow-[3px_3px_0px_0px_#000] -translate-x-[1px] -translate-y-[1px]'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-750 shadow-[1.5px_1.5px_0px_0px_#000]'
          }`}
        >
          Rangkuman & Berbagi
        </button>
      </div>

      {/* Tab 1: Tren & Arus Kas */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <TrendingUp className="h-4 w-4 stroke-[3px]" />
                  Financial Journey (Net Worth)
                </h4>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <SmallMetric label="Net worth saat ini" value={formatRupiah(analysis.netWorth)} tone="bg-white" />
                <SmallMetric label="Pertumbuhan" value={`${analysis.journeyGrowth >= 0 ? '+' : ''}${analysis.journeyGrowth.toFixed(1)}%`} tone={analysis.journeyGrowth >= 0 ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'} />
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analysis.journey.length ? analysis.journey : [{ label: 'Saat ini', value: analysis.netWorth }]}>
                    <CartesianGrid stroke="#d4d4d4" strokeDasharray="4 4" />
                    <XAxis dataKey="label" tick={{ fill: '#171717', fontSize: 10, fontWeight: 800 }} tickLine={false} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
                    <YAxis tickFormatter={(value) => compactRupiah.format(Number(value || 0))} tick={{ fill: '#525252', fontSize: 10, fontWeight: 800 }} tickLine={false} axisLine={false} width={52} />
                    <Tooltip formatter={(value: unknown) => formatRupiah(Number(value || 0))} contentStyle={{ background: '#fff', border: '3px solid #000', borderRadius: 0, fontSize: 11, fontWeight: 900 }} />
                    <Area type="monotone" dataKey="value" stroke="#000" strokeWidth={3} fill="#bbf7d0" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <Wallet className="h-4 w-4 stroke-[3px]" />
                  Proyeksi Arus Kas (30 Hari)
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SmallMetric label="Saldo saat ini" value={formatRupiah(analysis.totalBalance)} tone="bg-white" />
                <SmallMetric label="Prediksi 30 hari" value={formatRupiah(analysis.cashflow30)} tone={analysis.cashflow30 >= analysis.totalBalance * 0.5 ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'} />
                <SmallMetric label="Tagihan rutin" value={formatRupiah(analysis.upcomingSubscriptions)} tone="bg-[#bfdbfe]" />
                <SmallMetric label="Cicilan paylater" value={formatRupiah(analysis.upcomingPaylater)} tone="bg-[#fef08a]" />
              </div>
              <div className="mt-4 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 p-3 text-xs font-bold text-neutral-700 dark:text-neutral-300 rounded-xl">
                Prediksi dihitung dari saldo aktif, rata-rata harian, tagihan subscription, dan cicilan paylater yang belum lunas.
              </div>
            </div>
          </div>

          <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
            <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                <LineChartIcon className="h-4 w-4 stroke-[3px]" />
                Tren Pertumbuhan Finansial (6 Bulan Terakhir)
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.recentMonths}>
                  <CartesianGrid stroke="#d4d4d4" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tick={{ fill: '#171717', fontSize: 10, fontWeight: 800 }} tickLine={false} axisLine={{ stroke: '#000', strokeWidth: 2 }} />
                  <YAxis tickFormatter={(value) => compactRupiah.format(Number(value || 0))} tick={{ fill: '#525252', fontSize: 10, fontWeight: 800 }} tickLine={false} axisLine={false} width={58} />
                  <Tooltip formatter={(value: unknown) => formatRupiah(Number(value || 0))} contentStyle={{ background: '#fff', border: '3px solid #000', borderRadius: 0, fontSize: 11, fontWeight: 900 }} />
                  <Line type="monotone" dataKey="income" stroke="#047857" strokeWidth={3} dot={{ r: 3, fill: '#bbf7d0', stroke: '#000', strokeWidth: 2 }} name="Pemasukan" />
                  <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={3} dot={{ r: 3, fill: '#fecaca', stroke: '#000', strokeWidth: 2 }} name="Pengeluaran" />
                  <Line type="monotone" dataKey="net" stroke="#000" strokeWidth={3} dot={{ r: 3, fill: '#fef08a', stroke: '#000', strokeWidth: 2 }} name="Surplus/Defisit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Alokasi & Kebiasaan */}
      {activeSubTab === 'habits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <PiggyBank className="h-4 w-4 stroke-[3px]" />
                  Alokasi Ideal 50/30/20
                </h4>
              </div>
              <label className="mb-2 block text-xs font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">Pendapatan bulanan</label>
              <input
                value={allocatorIncome}
                onChange={(event) => setAllocatorIncome(event.target.value)}
                placeholder={analysis.avgIncome ? `Saran: ${Math.round(analysis.avgIncome)}` : 'Masukkan nominal pendapatan'}
                className="brutal-input mb-4 text-xs font-bold bg-white dark:bg-neutral-800 text-black dark:text-white border-2 border-black dark:border-neutral-700"
                inputMode="numeric"
              />
              <div className="mb-4 grid grid-cols-3 gap-2">
                <SmallMetric label="Needs 50%" value={formatRupiah(allocator.needs)} tone="bg-[#bbf7d0]" />
                <SmallMetric label="Wants 30%" value={formatRupiah(allocator.wants)} tone="bg-[#bfdbfe]" />
                <SmallMetric label="Savings 20%" value={formatRupiah(allocator.savings)} tone="bg-[#fef08a]" />
              </div>
              <button type="button" onClick={handleCreateAllocatorBudgets} className="brutal-btn w-full text-xs">
                Buat Pos Anggaran 50/30/20
              </button>
              {allocatorStatus && <p className="mt-3 text-xs font-bold text-black dark:text-white">{allocatorStatus}</p>}
            </div>

            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <BarChart3 className="h-4 w-4 stroke-[3px]" />
                  Prediksi Risiko Anggaran (Budget Forecast)
                </h4>
              </div>
              {analysis.budgetForecasts.length === 0 ? (
                <div className="border-2 border-dashed border-black dark:border-neutral-700 p-6 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 rounded-xl">
                  Buat anggaran kategori untuk melihat proyeksi akhir bulan.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.budgetForecasts.slice(0, 4).map((budget) => (
                    <div key={budget.name} className={`border-2 border-black dark:border-neutral-700 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${budget.risk >= 1 ? 'bg-[#fecaca] dark:bg-red-950/70 text-black dark:text-red-200' : budget.risk >= 0.8 ? 'bg-[#fef08a] dark:bg-amber-950/70 text-black dark:text-amber-200' : 'bg-white dark:bg-neutral-800 text-black dark:text-white'}`}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">{budget.name}</p>
                        <p className="text-xs font-black text-black dark:text-white">{Math.round(budget.risk * 100)}%</p>
                      </div>
                      <div className="h-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900">
                        <div className="h-full bg-black dark:bg-white" style={{ width: `${Math.min(budget.risk * 100, 100)}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                        Terpakai {formatRupiah(budget.spent)}, prediksi {formatRupiah(budget.forecast)}, limit {formatRupiah(budget.limit)}.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <Activity className="h-4 w-4 stroke-[3px]" />
                  Pola Kebiasaan Finansial
                </h4>
              </div>
              <div className="space-y-3">
                <SmallMetric label="Kopi bulan ini" value={`${analysis.coffeeTransactions.filter((item) => sameMonth(new Date(item.transactionDate), today)).length} kali`} tone="bg-[#fef08a]" />
                <SmallMetric label="Total jajan kopi" value={formatRupiah(analysis.coffeeTransactions.reduce((sum, item) => sum + item.amount, 0))} tone="bg-white" />
                <SmallMetric label="Hari paling boros" value={WEEKDAY_LABELS[analysis.busiestDay.day]} tone="bg-[#fecaca]" />
                <SmallMetric label="Kategori tersering" value={analysis.allCategoriesByCount[0]?.name || 'Belum ada'} tone="bg-[#bfdbfe]" />
              </div>
            </div>

            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <Repeat className="h-4 w-4 stroke-[3px]" />
                  Evaluasi Langganan Rutin
                </h4>
              </div>
              {analysis.subscriptionInsights.length === 0 ? (
                <div className="border-2 border-dashed border-black dark:border-neutral-700 p-6 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 rounded-xl">
                  Catat subscription untuk mendeteksi tagihan berulang yang jarang terpakai.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.subscriptionInsights.slice(0, 3).map((subscription) => (
                    <div key={subscription.id} className={`border-2 border-black dark:border-neutral-700 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${subscription.risk ? 'bg-[#fecaca] dark:bg-red-950/70 text-black dark:text-red-200' : 'bg-white dark:bg-neutral-800 text-black dark:text-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">{subscription.name}</p>
                          <p className="mt-1 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            {formatRupiah(subscription.amount)}/bulan, {subscription.relatedCount} transaksi terkait dalam 90 hari.
                          </p>
                        </div>
                        {subscription.risk && <AlertTriangle className="h-4 w-4 flex-shrink-0 stroke-[3px] text-black dark:text-red-300" />}
                      </div>
                      {subscription.risk && (
                        <p className="mt-2 text-[11px] font-black text-black dark:text-red-200">Pertimbangkan apakah langganan ini masih dibutuhkan.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
            <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                <Flag className="h-4 w-4 stroke-[3px]" />
                Tantangan Disiplin Harian (Missions)
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {analysis.missions.map((mission) => (
                <div key={mission.title} className={`border-2 border-black dark:border-neutral-700 p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${mission.done ? 'bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-emerald-200' : 'bg-white dark:bg-neutral-800 text-black dark:text-white'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">{mission.title}</p>
                      <p className="mt-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 leading-snug">{mission.detail}</p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white shrink-0">{mission.reward} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Rangkuman & Berbagi */}
      {activeSubTab === 'wrapped' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <Target className="h-4 w-4 stroke-[3px]" />
                  Rangkuman Bulanan ({LONG_MONTH_FORMAT.format(today)})
                </h4>
              </div>
              <div className="space-y-3">
                <SmallMetric label={LONG_MONTH_FORMAT.format(today)} value={formatRupiah(analysis.currentMonth.expense)} tone="bg-black text-white" />
                <SmallMetric label="Kategori favorit" value={analysis.topCategory?.name || 'Belum ada'} tone="bg-[#bbf7d0]" />
                <SmallMetric label="Hari paling sibuk" value={analysis.busiestDay ? WEEKDAY_LABELS[analysis.busiestDay.day] : 'Belum ada'} tone="bg-[#bfdbfe]" />
                <SmallMetric label="Dompet teraktif" value={analysis.activeWallet?.[0] || 'Belum ada'} tone="bg-[#fef08a]" />
                <SmallMetric label="Pencapaian terbuka" value={`${achievements.length} badge terbuka`} tone="bg-white" />
              </div>
            </div>

            <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
              <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  <CalendarDays className="h-4 w-4 stroke-[3px]" />
                  Kilas Balik Transaksi (Replay)
                </h4>
              </div>
              {analysis.replayTransactions.length === 0 ? (
                <div className="border-2 border-dashed border-black dark:border-neutral-700 p-6 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 rounded-xl">
                  Replay bulanan akan muncul setelah ada mutasi transaksi tercatat.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <SmallMetric label={analysis.replayMonth.label} value={`${analysis.replayMonth.count} transaksi`} tone="bg-[#bbf7d0]" />
                    <SmallMetric label="Estimasi saldo akhir" value={formatRupiah(analysis.totalBalance)} tone="bg-white" />
                    <SmallMetric label="Total pemasukan" value={formatRupiah(analysis.replayMonth.income)} tone="bg-[#bfdbfe]" />
                    <SmallMetric label="Total pengeluaran" value={formatRupiah(analysis.replayMonth.expense)} tone="bg-[#fecaca]" />
                  </div>
                  <div className="border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 p-3 rounded-xl text-black dark:text-white">
                    <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">Sorotan</p>
                    <p className="mt-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Transaksi terbesar: {analysis.largestTransaction ? `${analysis.largestTransaction.note || analysis.largestTransaction.category?.name || 'Transaksi'} (${formatRupiah(analysis.largestTransaction.amount)})` : 'Belum ada'}.
                    </p>
                    <p className="mt-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Bulan terbaik: {analysis.bestMonth ? `${analysis.bestMonth.label}, surplus ${formatRupiah(analysis.bestMonth.net)}` : 'Belum ada'}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
            <div className="mb-5 flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-black dark:text-white">
                <Share2 className="h-4 w-4 stroke-[3px]" />
                Kartu Berbagi Visual (Share Card)
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_260px] items-start">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 mb-1 tracking-wider">Template Kartu</label>
                  <select value={shareTemplate} onChange={(event) => setShareTemplate(event.target.value)} className="brutal-input text-xs font-black uppercase bg-white dark:bg-neutral-800 text-black dark:text-white border-2 border-black dark:border-neutral-700">
                    {shareTemplates.map((template) => (
                      <option key={template} value={template}>{template}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 mb-1 tracking-wider">Warna Latar</label>
                  <div className="flex gap-2">
                    {CARD_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setShareBackground(color)}
                        className={`h-9 w-9 border-2 border-black dark:border-neutral-700 ${shareBackground === color ? 'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : ''}`}
                        style={{ backgroundColor: color }}
                        aria-label={`Pilih warna ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadSharePng({
                    data: wrappedData,
                    background: shareBackground,
                  })}
                  className="brutal-btn flex w-full items-center justify-center gap-2 text-xs font-black uppercase tracking-wider"
                >
                  <Download className="h-4 w-4" />
                  Unduh Kartu PNG
                </button>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <SmallMetric label="Kategori Utama" value={wrappedData.topCategoryName} tone="bg-[#fef08a]" />
                  <SmallMetric label="Cashflow" value={wrappedData.cashflow} tone={analysis.currentMonth.net >= 0 ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'} />
                  <SmallMetric label="Transaksi" value={wrappedData.totalTransactions} tone="bg-white" />
                  <SmallMetric label="Saldo Dompet" value={wrappedData.walletBalance} tone="bg-[#bfdbfe]" />
                </div>
              </div>
              <div className="mx-auto w-full max-w-[260px]">
                <div className="aspect-[9/16] overflow-hidden border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <img src={wrappedPreviewSvg} alt="Preview Monthly Wrapped Norden Finance" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
