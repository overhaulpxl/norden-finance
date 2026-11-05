/**
 * Automatically maps category names to intuitive emojis for faster visual scanning.
 */
export function getCategoryEmoji(categoryName?: string | null): string {
  if (!categoryName) return '📦';
  const name = categoryName.toLowerCase().trim();

  // Food & Drinks
  if (/makan|minum|kopi|coffee|resto|restoran|cafe|kafe|food|snack|jajan|lunch|dinner|sarapan|bakso|ayam/.test(name)) {
    return '🍔';
  }
  // Transportation
  if (/transport|bensin|bbm|pertalite|pertamax|ojol|gojek|grab|taxi|taksi|parkir|tol|kereta|krl|mrt|bus|angkot/.test(name)) {
    return '🚗';
  }
  // Shopping & Groceries
  if (/belanja|shopping|market|pasar|indomaret|alfamart|supermarket|baju|sepatu|fashion|sembako/.test(name)) {
    return '🛍️';
  }
  // Bills & Utilities
  if (/tagihan|bill|listrik|pln|air|pdam|wifi|internet|indihome|pulsa|paket data|bpjs|pajak|iuran/.test(name)) {
    return '⚡';
  }
  // Income & Salary
  if (/gaji|salary|income|pemasukan|pendapatan|bonus|thr|dividen|profit|upah|omset/.test(name)) {
    return '💰';
  }
  // Health & Medical
  if (/kesehatan|health|obat|apotek|dokter|rumah sakit|rs|klinik|vitamin|dental|gigi/.test(name)) {
    return '💊';
  }
  // Entertainment & Subscription
  if (/hiburan|entertainment|game|gaming|steam|netflix|spotify|youtube|bioskop|cinema|wisata|liburan/.test(name)) {
    return '🎬';
  }
  // Education
  if (/pendidikan|edukasi|kursus|course|sekolah|kuliah|spp|buku|book|ujian/.test(name)) {
    return '📚';
  }
  // Home & Living
  if (/rumah|home|kos|kost|sewa|kontrak|properti|furnitur|kebersihan|laundry/.test(name)) {
    return '🏠';
  }
  // Charity & Gift
  if (/sedekah|infaq|zakat|donasi|gift|kado|hadiah|amal/.test(name)) {
    return '🤲';
  }
  // Debt & Paylater
  if (/utang|hutang|piutang|cicilan|paylater|angsuran|kredit|pinjaman/.test(name)) {
    return '💳';
  }
  // Transfer
  if (/transfer|top up|topup|tarik tunai/.test(name)) {
    return '🔁';
  }
  // Investment & Savings
  if (/investasi|reksadana|saham|crypto|kripto|tabungan|saving|emas/.test(name)) {
    return '📈';
  }
  // Personal care
  if (/skincare|salon|barbershop|cukur|perawatan|makeup/.test(name)) {
    return '✨';
  }

  return '🏷️';
}
