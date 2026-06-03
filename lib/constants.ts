export const METHOD_ALIASES: Record<string, string> = {
  cash: 'cash',
  tunai: 'cash',
  bni: 'bni',
  dana: 'dana',
  gopay: 'gopay',
  gojek: 'gopay',
  ovo: 'ovo',
  shopeepay: 'shopeepay',
  spay: 'shopeepay',
  seabank: 'seabank',
  jago: 'jago',
  blu: 'blu',
  paypal: 'paypal',
};

export const TYPE_KEYWORDS = {
  masuk: ['masuk', 'dapet', 'dapat', 'terima', 'refund', 'gaji', 'bonus', 'jual', 'jualan', 'middleman', 'fee', 'topup'],
  keluar: ['keluar', 'beli', 'bayar', 'jajan', 'makan', 'minum', 'bensin', 'langganan', 'parkir', 'ongkir', 'transfer', 'wd', 'tarik'],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  makan: ['ayam', 'geprek', 'nasi', 'minum', 'jajan', 'makan', 'kopi', 'indomie'],
  transport: ['bensin', 'parkir', 'gojek', 'grab', 'tol', 'kereta'],
  langganan: ['netflix', 'spotify', 'youtube', 'internet', 'wifi', 'listrik'],
  middleman: ['middleman', 'mm', 'fee'],
  jualan: ['jual', 'jualan', 'laku'],
  gaji: ['gaji', 'bonus'],
  refund: ['refund'],
  transfer: ['transfer', 'tf'],
  topup: ['topup', 'isi'],
};

export const DEFAULT_METHOD = 'unknown';
export const DEFAULT_CATEGORY = 'lain-lain';
export const DEFAULT_TYPE = 'keluar'; // Default is expense unless stated otherwise
