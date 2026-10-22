/**
 * Ruang Rehat - Global Application Constants
 *
 * Nilai default sistem terpusat untuk kurs, persentase potongan fee platform,
 * dan batasan waktu/transaksi standar.
 */

// Kurs Konversi Standar (Single Source of Truth: 1 USD = 18.051 IDR)
export const DEFAULT_USD_EXCHANGE_RATE = 18051;
export const USD_TO_IDR_EXCHANGE_RATE = DEFAULT_USD_EXCHANGE_RATE;

// Rasio dan Persentase Potongan Platform (Fee Configuration)
export const DEFAULT_GUEST_SERVICE_FEE_PCT = 10.0; // 10% dibebankan ke Tamu
export const DEFAULT_HOST_PLATFORM_FEE_PCT = 3.0;  // 3% dipotong dari Host
export const DEFAULT_HOST_FEE_MULTIPLIER = 0.97;   // (100% - 3%) = 97% yang diterima Host

// Denda pembatalan sepihak oleh Host (Rp 250.000)
export const DEFAULT_HOST_CANCEL_PENALTY_IDR = 250000;

// Default System Setting Identifier
export const SYSTEM_SETTING_GLOBAL_ID = "global";

// Batasan Masa Kedaluwarsa Transaksi Pending (Menit)
export const BOOKING_PENDING_EXPIRES_MINUTES = 60;

// Batasan Waktu Garansi Tamu & Rilis Escrow (Jam sejak Check-in Resmi)
export const ESCROW_RELEASE_WINDOW_HOURS = 24;
