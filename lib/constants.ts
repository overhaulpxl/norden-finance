export const CANONICAL_ALIASES: Record<string, string[]> = {
  gopay: ['gopay', 'go pay', 'go-pay', 'gojek'],
  bni: ['bni', 'bank bni'],
  bca: ['bca', 'bank bca'],
  dana: ['dana'],
  ovo: ['ovo'],
  cash: ['cash', 'tunai', 'uang tunai'],
  shopeepay: ['shopeepay', 'shopee pay', 'shopee-pay', 'spay'],
  seabank: ['seabank', 'sea bank', 'sea-bank'],
  jago: ['jago', 'bank jago'],
  blu: ['blu', 'bank blu'],
  paypal: ['paypal', 'pay pal'],
  linkaja: ['linkaja', 'link aja', 'link-aja'],
};

export const CANONICAL_WALLET_DISPLAY: Record<string, string> = {
  gopay: 'GoPay',
  bni: 'BNI',
  bca: 'BCA',
  dana: 'DANA',
  ovo: 'OVO',
  cash: 'Cash',
  shopeepay: 'ShopeePay',
  seabank: 'SeaBank',
  jago: 'Jago',
  blu: 'blu',
  paypal: 'PayPal',
  linkaja: 'LinkAja',
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
  masuk: ['masuk', 'dapet', 'dapat', 'terima', 'refund', 'gaji', 'bonus', 'jual', 'jualan', 'middleman', 'fee', 'topup'],
  keluar: ['keluar', 'beli', 'bayar', 'jajan', 'makan', 'minum', 'bensin', 'langganan', 'parkir', 'ongkir', 'transfer', 'wd', 'tarik'],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  makan: ['ayam', 'geprek', 'nasi', 'minum', 'jajan', 'makan', 'kopi', 'indomie', 'soto', 'bakso', 'mie', 'snack', 'cafe', 'resto', 'sarapan', 'dinner', 'lunch'],
  transport: ['bensin', 'parkir', 'gojek', 'grab', 'tol', 'kereta', 'mrt', 'lrt', 'busway', 'tije', 'krl', 'ojol', 'pertamax', 'pertalite', 'solar', 'shell'],
  langganan: ['netflix', 'spotify', 'youtube', 'internet', 'wifi', 'listrik', 'pdam', 'bpjs', 'pulsa', 'kuota', 'indihome', 'biznet', 'pln'],
  belanja: ['belanja', 'supermarket', 'minimarket', 'indomaret', 'alfamart', 'mall', 'baju', 'sepatu', 'tokopedia', 'shopee', 'lazada', 'tiktok shop'],
  middleman: ['middleman', 'mm', 'fee'],
  jualan: ['jual', 'jualan', 'laku'],
  gaji: ['gaji', 'bonus', 'thr', 'upah', 'salary', 'payroll'],
  refund: ['refund', 'kembalian'],
  transfer: ['transfer', 'tf'],
  topup: ['topup', 'isi'],
};

export const CATEGORY_DISPLAY_MAP: Record<string, string> = {
  makan: 'Makanan',
  transport: 'Transport',
  langganan: 'Tagihan',
  belanja: 'Belanja',
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
