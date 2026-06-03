import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return format(date, 'd MMM yyyy, HH:mm', { locale: id });
}

// "bni" -> "BNI", "gopay" -> "GOPAY"
export function formatMethodName(method: string): string {
  return method.toUpperCase();
}

// "makan" -> "Makan", "lain-lain" -> "Lain-Lain", "ayam geprek" -> "Ayam Geprek"
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(text.includes('-') ? '-' : ' ');
}
