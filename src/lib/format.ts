import { 
  DEFAULT_USD_EXCHANGE_RATE, 
  DEFAULT_HOST_FEE_MULTIPLIER, 
  USD_TO_IDR_EXCHANGE_RATE 
} from "./constants";

/**
 * Interface dasar untuk objek booking dengan kalkulasi total harga.
 */
export interface BookingPriceLike {
  totalPriceIdr?: number | null;
  totalPrice?: number | null;
}

/**
 * Interface dasar untuk objek booking dengan kalkulasi penerimaan bersih host (net payout).
 */
export interface BookingPayoutLike extends BookingPriceLike {
  netHostPayoutIdr?: number | null;
}

/**
 * Format harga ke format display yang sesuai dengan pilihan mata uang pengguna.
 * Nilai input selalu dalam satuan Rupiah (IDR) sebagai Single Source of Truth.
 */
export function formatPrice(
  priceIdr: number,
  currency: string = "IDR",
  exchangeRate: number = USD_TO_IDR_EXCHANGE_RATE
): string {
  const safeIdr = priceIdr || 0;

  if (currency === "USD") {
    const usd = safeIdr / exchangeRate;
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(usd);
  } else {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(safeIdr);
  }
}

/**
 * Mendapatkan nilai total booking dalam IDR secara terpusat.
 * Mendukung data modern (totalPriceIdr) dan fallback legacy USD (totalPrice * kurs dinamis).
 */
export function getBookingPriceIdr(
  booking: BookingPriceLike | null | undefined,
  exchangeRate: number = DEFAULT_USD_EXCHANGE_RATE
): number {
  if (!booking) return 0;
  if (typeof booking.totalPriceIdr === "number" && booking.totalPriceIdr > 0) {
    return booking.totalPriceIdr;
  }
  if (typeof booking.totalPrice === "number" && booking.totalPrice > 0) {
    return Math.round(booking.totalPrice * exchangeRate);
  }
  return 0;
}

/**
 * Mendapatkan nilai payout bersih host (net host payout) dalam IDR.
 * Jika netHostPayoutIdr belum terhitung di database, fallback mengalikan totalPriceIdr
 * dengan multiplier fee host (default 0.97 untuk platform fee 3%), atau konversi legacy USD.
 */
export function getBookingHostPayoutIdr(
  booking: BookingPayoutLike | null | undefined,
  hostFeeMultiplier: number = DEFAULT_HOST_FEE_MULTIPLIER,
  exchangeRate: number = DEFAULT_USD_EXCHANGE_RATE
): number {
  if (!booking) return 0;
  if (typeof booking.netHostPayoutIdr === "number" && booking.netHostPayoutIdr > 0) {
    return booking.netHostPayoutIdr;
  }
  if (typeof booking.totalPriceIdr === "number" && booking.totalPriceIdr > 0) {
    return Math.round(booking.totalPriceIdr * hostFeeMultiplier);
  }
  if (typeof booking.totalPrice === "number" && booking.totalPrice > 0) {
    return Math.round(booking.totalPrice * exchangeRate);
  }
  return 0;
}

/**
 * Format string atau angka input menjadi format ribuan yang bersih.
 * Menghilangkan karakter non-digit dan memformat dengan pemisah ribuan.
 */
export function formatNumberInput(
  value: string | number | null | undefined,
  locale: string = "id-ID"
): string {
  if (value === null || value === undefined || value === "") return "";
  const cleaned = String(value).replace(/\D/g, "");
  if (!cleaned) return "";
  const num = Number(cleaned);
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Mengubah teks bernomor/ribuan menjadi integer murni (0 jika tidak valid).
 */
export function parseNumberInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const cleaned = String(value).replace(/\D/g, "");
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}
