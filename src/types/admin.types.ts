import type { SystemSetting } from "@prisma/client";

export type { SystemSetting };

/**
 * Daftar tab yang valid pada Portal Tata Kelola Admin
 */
export type AdminTabType = 
  | "overview" 
  | "kyc" 
  | "payouts" 
  | "disputes" 
  | "refunds" 
  | "bookings" 
  | "users" 
  | "settings";

/**
 * State formulir konfigurasi parameter global sistem
 */
export interface SystemSettingsFormState {
  usdExchangeRate: number;
  guestServiceFeePct: number;
  hostPlatformFeePct: number;
  hostCancelPenaltyIdr: number;
}

/**
 * Ringkasan metrik kesehatan ekosistem platform (Admin Overview)
 */
export interface PlatformHealthMetrics {
  totalGmvIdr: number;
  escrowHeldIdr: number;
  escrowReleasedIdr: number;
  pendingPayoutsCount: number;
  pendingKycCount: number;
  openDisputesCount: number;
}
