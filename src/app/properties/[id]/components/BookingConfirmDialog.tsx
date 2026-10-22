import React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"

export interface BookingConfirmDialogProps {
  propertyTitle: string
  checkInFormatted: string
  checkOutFormatted: string
  guestSummary: string
  totalPriceIdr: number
  currentCurrency: string
  currentLang?: string
  loading: boolean
  disabled: boolean
  triggerLabel: string
  t: Partial<Dictionary>
  onConfirm: () => void
}

export default function BookingConfirmDialog({
  propertyTitle,
  checkInFormatted,
  checkOutFormatted,
  guestSummary,
  totalPriceIdr,
  currentCurrency,
  currentLang = "id",
  loading,
  disabled,
  triggerLabel,
  t,
  onConfirm,
}: BookingConfirmDialogProps) {
  return (
    <Dialog>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "default" }),
          "w-full h-12 text-base rounded-2xl bg-rose-500 hover:bg-rose-600 font-bold transition-all shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{t.confirmReservation}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl space-y-2 border border-gray-100 dark:border-gray-800">
            <p>
              <strong>
                {currentLang === "en" ? "Property:" : "Penginapan:"}
              </strong>{" "}
              {propertyTitle}
            </p>
            <p>
              <strong>Check-in:</strong> {checkInFormatted || "-"}
            </p>
            <p>
              <strong>Check-out:</strong> {checkOutFormatted || "-"}
            </p>
            <p>
              <strong>{t.guestsLabel}:</strong> {guestSummary}
            </p>
          </div>
          <div className="flex justify-between font-bold text-lg px-1">
            <span>{t.totalPayment}</span>
            <span className="text-rose-600">
              {formatPrice(totalPriceIdr, currentCurrency)}
            </span>
          </div>
        </div>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold cursor-pointer"
        >
          {loading ? t.confirming : t.confirmAndPay}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
