import { generateMonthlyReportPdf, MonthlyReportData } from '../lib/pdf/monthlyReport';
import * as fs from 'fs';
import * as path from 'path';

const mockDataWithGoals: MonthlyReportData = {
  userFullName: "Zaidaan Zalfaa",
  userPlan: "pro",
  month: 6,
  year: 2026,
  periodStart: new Date('2026-06-01T00:00:00.000Z'),
  periodEnd: new Date('2026-06-30T23:59:59.000Z'),
  generatedAt: new Date(),
  monthName: "Juni 2026",
  periodLabel: "01/06/2026 - 30/06/2026",
  generatedDateLabel: "05 Juni 2026 13:00",
  totalTransactions: 12,
  totalIncome: 15000000,
  totalExpense: 8500000,
  transferVolume: 2000000,
  cashflow: 6500000,
  activeWalletBalance: 12450000,
  largestExpenseCategory: "Makanan & Minuman",
  largestExpenseAmount: 3400000,
  largestExpensePercentage: 40,
  recentTransactions: [
    {
      id: "1",
      transactionDate: new Date('2026-06-02'),
      type: "keluar",
      amount: 150000,
      note: "Makan siang sushi di mall dekat kantor",
      category: { name: "Makanan" },
      wallet: { name: "BCA" }
    },
    {
      id: "2",
      transactionDate: new Date('2026-06-03'),
      type: "masuk",
      amount: 5000000,
      note: "Gaji bulanan",
      category: { name: "Gaji" },
      wallet: { name: "BNI" }
    },
    {
      id: "3",
      transactionDate: new Date('2026-06-04'),
      type: "transfer",
      amount: 1000000,
      note: "Pindah dana ke e-wallet",
      category: null,
      wallet: { name: "BCA" },
      transferToWallet: { name: "DANA" }
    }
  ],
  savingGoals: [
    {
      id: "g1",
      title: "Tabungan Nikah",
      targetAmount: 50000000,
      currentAmount: 15000000,
      deadline: new Date('2027-06-30')
    },
    {
      id: "g2",
      title: "Beli Laptop Baru",
      targetAmount: 15000000,
      currentAmount: 12000000,
      deadline: new Date('2026-08-30')
    }
  ],
  financialHealthScore: 75,
  streak: {
    currentStreak: 5,
    longestStreak: 12,
    lastInputDate: new Date()
  },
  achievements: [
    {
      id: "a1",
      title: "Hemat Pangkal Kaya",
      description: "Menabung pertama kali",
      unlockedAt: new Date()
    },
    {
      id: "a2",
      title: "Pencatat Ulung",
      description: "Mencatat 10 hari berturut-turut",
      unlockedAt: new Date()
    }
  ]
};

const mockDataEmptyGoals: MonthlyReportData = {
  ...mockDataWithGoals,
  savingGoals: [],
  financialHealthScore: 42
};

const mockDataCompact: MonthlyReportData = {
  ...mockDataWithGoals,
  savingGoals: mockDataWithGoals.savingGoals,
  recentTransactions: mockDataWithGoals.recentTransactions, // 3 tx
};

const mockDataMulti: MonthlyReportData = {
  ...mockDataWithGoals,
  recentTransactions: Array.from({ length: 15 }, (_, i) => ({
    id: `tx-${i}`,
    transactionDate: new Date('2026-06-05'),
    type: (i % 3 === 0 ? 'masuk' : i % 3 === 1 ? 'keluar' : 'transfer') as 'masuk' | 'keluar' | 'transfer',
    amount: (i + 1) * 75000,
    note: `Transaksi mutasi testing nomor ${i + 1}`,
    category: { name: i % 2 === 0 ? 'Belanja' : 'Makanan' },
    wallet: { name: 'BCA' },
  })),
};

function run() {
  const pdfCompact = generateMonthlyReportPdf(mockDataCompact);
  const pdfMulti = generateMonthlyReportPdf(mockDataMulti);

  fs.writeFileSync(path.join(process.cwd(), 'test-report-compact.pdf'), Buffer.from(pdfCompact));
  fs.writeFileSync(path.join(process.cwd(), 'test-report-multi.pdf'), Buffer.from(pdfMulti));
  console.log('Mock PDFs (compact & multi) generated successfully.');
}

run();
