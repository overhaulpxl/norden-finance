import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const RUPIAH_FORMATTER = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | null | undefined): string {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const sign = safeValue < 0 ? '-' : '';
  return `Rp ${sign}${RUPIAH_FORMATTER.format(Math.abs(Math.round(safeValue)))}`;
}

export function formatRupiah(amount: number): string {
  return formatCurrency(amount);
}

export function formatCoverageMonths(value: number | null | undefined): string {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;

  if (safeValue >= 24) return '24+ bulan';
  if (safeValue === 1) return '1 bulan';
  return `${safeValue.toFixed(1)} bulan`;
}

export function formatTanggal(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!date || isNaN(date.getTime())) return '-';
  return format(date, 'd MMM yyyy, HH:mm', { locale: id });
}

export function formatShortDateTime(dateString: string | Date | null | undefined, lang: 'id' | 'en' = 'id'): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!date || isNaN(date.getTime())) return '-';
  const dayMonth = date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${dayMonth} • ${hours}:${minutes}`;
}

// "bni" -> "BNI", "gopay" -> "GOPAY"
export function formatMethodName(method: string): string {
  return method.toUpperCase();
}

/**
 * Formats user input with Indonesian thousand separators (dot).
 * Examples:
 *   "10000" -> "10.000"
 *   "10.000" -> "10.000"
 *   "1500000" -> "1.500.000"
 *   "" -> ""
 */
export function formatRupiahInput(value: string | number | null | undefined): string {
  if (value === '' || value === null || value === undefined) return '';
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Extracts clean positive integer from formatted currency string.
 * Examples:
 *   "10.000" -> 10000
 *   "Rp 10.000" -> 10000
 *   "10000" -> 10000
 *   "" -> 0
 */
export function parseRupiahInput(value: string | number | null | undefined): number {
  if (value === '' || value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value) : 0;
  const digits = String(value).replace(/\D/g, '');
  const parsed = parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

// "makan" -> "Makan", "lain-lain" -> "Lain-Lain", "ayam geprek" -> "Ayam Geprek"
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(text.includes('-') ? '-' : ' ');
}
