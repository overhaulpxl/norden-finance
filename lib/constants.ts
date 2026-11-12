export const CANONICAL_ALIASES: Record<string, string[]> = {
  gopay: ['gopay', 'go pay', 'go-pay'],
  bni: ['bni', 'bank bni'],
  bca: ['bca', 'bank bca'],
  mandiri: ['mandiri', 'bank mandiri', 'livin'],
  bri: ['bri', 'bank bri', 'brimo'],
  cimb: ['cimb', 'cimb niaga', 'octo'],
  dana: ['dana'],
  ovo: ['ovo'],
  cash: ['cash', 'tunai', 'uang tunai'],
  shopeepay: ['shopeepay', 'shopee pay', 'shopee-pay', 'spay'],
  seabank: ['seabank', 'sea bank', 'sea-bank'],
  jago: ['jago', 'bank jago'],
  blu: ['blu', 'bank blu'],
  paypal: ['paypal', 'pay pal'],
  linkaja: ['linkaja', 'link aja', 'link-aja'],
  tabungan: [
    'tabungan',
    'tabungan rencana',
    'rekening tabungan',
    'simpanan',
    'bni tabungan',
    'bca tabungan',
    'mandiri tabungan',
    'bri tabungan',
    'cimb tabungan',
  ],
};

export const CANONICAL_WALLET_DISPLAY: Record<string, string> = {
  gopay: 'GoPay',
  bni: 'BNI',
  bca: 'BCA',
  mandiri: 'Mandiri',
  bri: 'BRI',
  cimb: 'CIMB',
  dana: 'DANA',
  ovo: 'OVO',
  cash: 'Cash',
  shopeepay: 'ShopeePay',
  seabank: 'SeaBank',
  jago: 'Jago',
  blu: 'blu',
  paypal: 'PayPal',
  linkaja: 'LinkAja',
  tabungan: 'Tabungan',
};

export const METHOD_ALIASES: Record<string, string> = Object.entries(CANONICAL_ALIASES).reduce(
  (acc, [canonical, aliases]) => {
    for (const alias of aliases) {
      acc[alias] = canonical;
    }
    return acc;
  },
  {} as Record<string, string>
);

export const TYPE_KEYWORDS = {
  masuk: ['masuk', 'dapet', 'dapat', 'terima', 'refund', 'gaji', 'bonus', 'jual', 'jualan', 'middleman', 'fee', 'topup', 'pemasukan', 'salary', 'payroll', 'income'],
  keluar: ['keluar', 'beli', 'bayar', 'jajan', 'makan', 'minum', 'bensin', 'langganan', 'parkir', 'ongkir', 'wd', 'tarik', 'pengeluaran', 'expense'],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  makan: ['ayam', 'geprek', 'nasi', 'minum', 'jajan', 'makan', 'makanan', 'kopi', 'indomie', 'soto', 'bakso', 'mie', 'snack', 'cafe', 'resto', 'sarapan', 'dinner', 'lunch', 'food', 'brunch', 'starbucks', 'mcd', 'kfc'],
  transport: ['bensin', 'parkir', 'gojek', 'grab', 'tol', 'kereta', 'mrt', 'lrt', 'busway', 'tije', 'krl', 'ojol', 'pertamax', 'pertalite', 'solar', 'shell', 'maxim'],
  langganan: ['netflix', 'spotify', 'youtube', 'internet', 'wifi', 'listrik', 'pdam', 'bpjs', 'pulsa', 'kuota', 'indihome', 'biznet', 'pln', 'icloud', 'disney'],
  belanja: ['belanja', 'supermarket', 'minimarket', 'indomaret', 'alfamart', 'mall', 'baju', 'sepatu', 'tokopedia', 'shopee', 'lazada', 'tiktok shop', 'skincare', 'outfit', 'tas', 'celana'],
  investasi: ['investasi', 'saham', 'crypto', 'kripto', 'reksadana', 'emas', 'xau', 'antam', 'bibit', 'ajaib', 'pluang', 'tokocrypto', 'indodax', 'obligasi', 'sbn', 'deposito'],
  hiburan: ['nonton', 'bioskop', 'game', 'steam', 'playstation', 'karaoke', 'konser', 'liburan', 'hotel', 'villa'],
  kesehatan: ['obat', 'dokter', 'apotek', 'klinik', 'rumah sakit', 'vitamin', 'lab', 'dental', 'gigi'],
  pendidikan: ['kursus', 'buku', 'kuliah', 'sekolah', 'spp', 'les', 'seminar', 'workshop'],
  middleman: ['middleman', 'mm', 'fee'],
  jualan: ['jual', 'jualan', 'laku'],
  gaji: ['gaji', 'bonus', 'thr', 'upah', 'salary', 'payroll', 'honor'],
  refund: ['refund', 'kembalian'],
  transfer: ['transfer', 'tf'],
  topup: ['topup', 'isi'],
};

export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  makan: 'Makanan',
  transport: 'Transport',
  langganan: 'Tagihan',
  belanja: 'Belanja',
  investasi: 'Investasi',
  hiburan: 'Hiburan',
  kesehatan: 'Kesehatan',
  pendidikan: 'Pendidikan',
  middleman: 'Middleman',
  jualan: 'Jualan',
  gaji: 'Gaji',
  refund: 'Refund',
  transfer: 'Transfer',
  topup: 'Top Up',
  'lain-lain': 'Lain-lain',
};

export const DEFAULT_METHOD = 'unknown';
export const DEFAULT_CATEGORY = 'Lain-lain';
export const DEFAULT_TYPE = 'keluar'; // Default is expense unless stated otherwise

export const DEFAULT_TRIAL_DAYS = 14;
export const DEFAULT_MONTHLY_PRICE = 19000;
export const DEFAULT_YEARLY_PRICE = 149000;
export const MIN_EMERGENCY_MONTHLY_EXPENSE = 100000;

export const DEFAULT_PRICING = {
  trial: {
    name: 'Trial Plan',
    type: 'trial',
    price: 0,
    durationDays: DEFAULT_TRIAL_DAYS,
    isActive: true,
  },
  monthly: {
    name: 'Pro Monthly',
    type: 'pro',
    billingType: 'monthly',
    price: DEFAULT_MONTHLY_PRICE,
    isActive: true,
  },
  yearly: {
    name: 'Pro Yearly',
    type: 'pro',
    billingType: 'yearly',
    price: DEFAULT_YEARLY_PRICE,
    isActive: true,
  },
} as const;

export const MVP_FEATURES = [
  'Unlimited transaksi',
  'Unlimited dompet',
  'Budget per kategori',
  'Subscription manager',
  'Saving goals & debt tracker',
  'Paylater tracker',
  'Financial health score',
  'No-spend calendar',
  'Norden AI Parser',
  'Norden AI Receipt Scanner',
  'Norden AI Insights',
  'PDF Monthly Report',
  'Export CSV & JSON',
  'Monthly Wrapped',
  'Share Card Generator',
  'Budget Forecast',
  'Cashflow Forecast',
];

export const MVP_FEATURES_EN = [
  'Unlimited transactions',
  'Unlimited wallets',
  'Budget per category',
  'Subscription manager',
  'Saving goals & debt tracker',
  'Paylater tracker',
  'Financial health score',
  'No-spend calendar',
  'Norden AI Parser',
  'Norden AI Receipt Scanner',
  'Norden AI Insights',
  'PDF Monthly Report',
  'Export CSV & JSON',
  'Monthly Wrapped',
  'Share Card Generator',
  'Budget Forecast',
  'Cashflow Forecast',
];
