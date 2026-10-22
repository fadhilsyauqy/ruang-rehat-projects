import React from "react"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"

export interface BookingPriceBreakdownProps {
  basePricePerNight: number
  diffDays: number
  nightsPriceIdr: number
  cleaningFeeIdr: number
  guestServiceFeeIdr: number
  totalPriceIdr: number
  currentCurrency: string
  currentLang?: string
  maxStay: number
  isSelectedRangeOverlappingDisabled: boolean
  isExceedingMaxStay: boolean
  t: Partial<Dictionary>
}

export default function BookingPriceBreakdown({
  basePricePerNight,
  diffDays,
  nightsPriceIdr,
  cleaningFeeIdr,
  guestServiceFeeIdr,
  totalPriceIdr,
  currentCurrency,
  currentLang = "id",
  maxStay,
  isSelectedRangeOverlappingDisabled,
  isExceedingMaxStay,
  t,
}: BookingPriceBreakdownProps) {
  return (
    <div className="space-y-2 py-3 border-t border-b border-gray-100 dark:border-gray-800">
      {isSelectedRangeOverlappingDisabled ? (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-semibold text-center">
          {t.rangeOverlapsDisabled}
        </div>
      ) : isExceedingMaxStay ? (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 font-semibold text-center">
          {currentLang === "en"
            ? `Exceeds max stay of ${maxStay} nights (${diffDays} nights selected)`
            : `Melebihi batas menginap maksimal ${maxStay} malam (Dipilih ${diffDays} malam)`}
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span className="underline">
              {formatPrice(basePricePerNight, currentCurrency)} x {diffDays}{" "}
              {t.perNight || t.night}
            </span>
            <span className="font-semibold">
              {formatPrice(nightsPriceIdr, currentCurrency)}
            </span>
          </div>
          {cleaningFeeIdr > 0 && (
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{t.cleaningFee || "Biaya Kebersihan"}</span>
              <span className="font-semibold">
                {formatPrice(cleaningFeeIdr, currentCurrency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>
              {currentLang === "en"
                ? "Guest Service Fee (10%)"
                : "Biaya Layanan Tamu (10%)"}
            </span>
            <span className="font-semibold">
              {formatPrice(guestServiceFeeIdr, currentCurrency)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-1 text-gray-900 dark:text-gray-100 border-t dark:border-gray-800">
            <span>{t.totalBill}</span>
            <span className="text-rose-600 dark:text-rose-400">
              {formatPrice(totalPriceIdr, currentCurrency)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
