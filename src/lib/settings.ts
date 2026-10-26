import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  DEFAULT_USD_EXCHANGE_RATE,
  DEFAULT_GUEST_SERVICE_FEE_PCT,
  DEFAULT_HOST_PLATFORM_FEE_PCT,
  DEFAULT_HOST_CANCEL_PENALTY_IDR,
  DEFAULT_MAX_STAY_NIGHTS,
  SYSTEM_SETTING_GLOBAL_ID,
} from "./constants";

export type PrismaDbClient = PrismaClient | Prisma.TransactionClient;

export interface SystemSettingsValues {
  id: string;
  baseCurrency: string;
  usdExchangeRate: number;
  guestServiceFeePct: number;
  hostPlatformFeePct: number;
  hostCancelPenaltyIdr: number;
  maxStayNights: number;
  updatedAt: Date;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsValues = {
  id: SYSTEM_SETTING_GLOBAL_ID,
  baseCurrency: "IDR",
  usdExchangeRate: DEFAULT_USD_EXCHANGE_RATE,
  guestServiceFeePct: DEFAULT_GUEST_SERVICE_FEE_PCT,
  hostPlatformFeePct: DEFAULT_HOST_PLATFORM_FEE_PCT,
  hostCancelPenaltyIdr: DEFAULT_HOST_CANCEL_PENALTY_IDR,
  maxStayNights: DEFAULT_MAX_STAY_NIGHTS,
  updatedAt: new Date(),
};

/**
 * Mengambil parameter konfigurasi global platform dari tabel SystemSetting.
 * Jika tabel belum memiliki data atau database tidak dapat dijangkau,
 * fungsi ini mengembalikan fallback default yang aman (kurs 18.051, 10% tamu, 3% host, 28 malam).
 *
 * @param dbClient Opsional client Prisma atau tx (TransactionClient)
 */
export async function getSystemSettings(
  dbClient?: PrismaDbClient
): Promise<SystemSettingsValues> {
  const db = dbClient || prisma;
  try {
    const setting = await db.systemSetting.findUnique({
      where: { id: SYSTEM_SETTING_GLOBAL_ID },
    });

    if (setting) {
      return {
        id: setting.id,
        baseCurrency: setting.baseCurrency || "IDR",
        usdExchangeRate:
          setting.usdExchangeRate > 0
            ? setting.usdExchangeRate
            : DEFAULT_USD_EXCHANGE_RATE,
        guestServiceFeePct:
          typeof setting.guestServiceFeePct === "number" &&
          setting.guestServiceFeePct >= 0
            ? setting.guestServiceFeePct
            : DEFAULT_GUEST_SERVICE_FEE_PCT,
        hostPlatformFeePct:
          typeof setting.hostPlatformFeePct === "number" &&
          setting.hostPlatformFeePct >= 0
            ? setting.hostPlatformFeePct
            : DEFAULT_HOST_PLATFORM_FEE_PCT,
        hostCancelPenaltyIdr:
          typeof setting.hostCancelPenaltyIdr === "number" &&
          setting.hostCancelPenaltyIdr >= 0
            ? setting.hostCancelPenaltyIdr
            : DEFAULT_HOST_CANCEL_PENALTY_IDR,
        maxStayNights:
          setting.maxStayNights > 0
            ? setting.maxStayNights
            : DEFAULT_MAX_STAY_NIGHTS,
        updatedAt: setting.updatedAt || new Date(),
      };
    }
  } catch (error) {
    console.error(
      "[getSystemSettings] Gagal mengambil konfigurasi dari database, menggunakan fallback default:",
      error
    );
  }

  return DEFAULT_SYSTEM_SETTINGS;
}

export interface BookingFinancialsInput {
  nightlyRateIdr: number;
  cleaningFeeIdr?: number;
  totalNights: number;
  settings: SystemSettingsValues;
}

export interface BookingFinancialsBreakdown {
  roomSubtotalIdr: number;
  cleaningFeeIdr: number;
  grossStayIdr: number;
  guestServiceFeeIdr: number;
  hostPlatformFeeIdr: number;
  totalPriceIdr: number;
  netHostPayoutIdr: number;
}

/**
 * Menghitung rincian finansial pesanan secara deterministik berdasarkan konfigurasi sistem dinamis.
 */
export function calculateBookingFinancials({
  nightlyRateIdr,
  cleaningFeeIdr = 0,
  totalNights,
  settings,
}: BookingFinancialsInput): BookingFinancialsBreakdown {
  const safeCleaningFeeIdr = Math.max(0, cleaningFeeIdr);
  const safeTotalNights = Math.max(1, totalNights);
  const safeNightlyRateIdr = Math.max(0, nightlyRateIdr);

  const roomSubtotalIdr = safeNightlyRateIdr * safeTotalNights;
  const grossStayIdr = roomSubtotalIdr + safeCleaningFeeIdr;

  const guestServiceFeeIdr = Math.round(
    grossStayIdr * (settings.guestServiceFeePct / 100)
  );
  const hostPlatformFeeIdr = Math.round(
    grossStayIdr * (settings.hostPlatformFeePct / 100)
  );
  const totalPriceIdr = grossStayIdr + guestServiceFeeIdr;
  const netHostPayoutIdr = Math.max(0, grossStayIdr - hostPlatformFeeIdr);

  return {
    roomSubtotalIdr,
    cleaningFeeIdr: safeCleaningFeeIdr,
    grossStayIdr,
    guestServiceFeeIdr,
    hostPlatformFeeIdr,
    totalPriceIdr,
    netHostPayoutIdr,
  };
}
