import { USD_TO_IDR_EXCHANGE_RATE } from "./currency";

/**
 * Format harga ke format display yang sesuai dengan pilihan mata uang pengguna.
 * Nilai input selalu dalam satuan Rupiah (IDR) sebagai Single Source of Truth.
 */
export function formatPrice(
  priceIdr: number,
  currency: string = 'IDR',
  exchangeRate: number = USD_TO_IDR_EXCHANGE_RATE
) {
  const safeIdr = priceIdr || 0;

  if (currency === 'USD') {
    const usd = safeIdr / exchangeRate;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(usd);
  } else {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(safeIdr);
  }
}
