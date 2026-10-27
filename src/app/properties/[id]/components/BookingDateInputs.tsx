import React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getWibDateString } from "@/lib/date-standards"
import { toast } from "@/components/ui/use-toast"

export interface BookingDateInputsProps {
  checkInStr: string
  checkOutStr: string
  activeDateTab: "checkIn" | "checkOut"
  diffDays: number
  currentLang?: string
  selectDatesText: string
  disabledDatesList?: Array<Date | string>
  onSelectTab: (tab: "checkIn" | "checkOut") => void
  onCheckInChange: (val: string) => void
  onCheckOutChange: (val: string) => void
}

export function formatInputDate(dStr: string, currentLang = "id"): string {
  if (!dStr) return ""
  const [y, m, d] = dStr.split("-")
  return currentLang === "en" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
}

export default function BookingDateInputs({
  checkInStr,
  checkOutStr,
  activeDateTab,
  diffDays,
  currentLang = "id",
  selectDatesText,
  disabledDatesList = [],
  onSelectTab,
  onCheckInChange,
  onCheckOutChange,
}: BookingDateInputsProps) {
  const dateFrom = checkInStr ? new Date(`${checkInStr}T00:00:00`) : undefined
  const dateTo = checkOutStr ? new Date(`${checkOutStr}T00:00:00`) : undefined

  const formatRangeHeader = () => {
    if (!dateFrom) {
      return currentLang === "en"
        ? "Add your travel dates"
        : "Pilih tanggal perjalanan Anda"
    }
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    if (!dateTo) return `${dateFrom.toLocaleDateString(locale, opts)} - ...`
    return `${dateFrom.toLocaleDateString(locale, opts)} - ${dateTo.toLocaleDateString(locale, opts)}`
  }

  const handleManualInput = (
    val: string,
    isCheckIn: boolean,
    callback: (iso: string) => void
  ) => {
    if (val.length === 10) {
      const parts = val.split("/")
      if (parts.length === 3) {
        const year = parts[2]
        const month = currentLang === "en" ? parts[0] : parts[1]
        const day = currentLang === "en" ? parts[1] : parts[0]

        if (
          isNaN(Number(year)) ||
          isNaN(Number(month)) ||
          isNaN(Number(day)) ||
          Number(month) < 1 ||
          Number(month) > 12 ||
          Number(day) < 1 ||
          Number(day) > 31
        ) {
          toast({
            variant: "destructive",
            title: currentLang === "en" ? "Invalid Date Format" : "Format Tanggal Tidak Valid",
            description: currentLang === "en"
              ? "Please enter a valid calendar date."
              : "Harap masukkan tanggal kalender yang valid.",
          })
          return
        }

        const iso = `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
        const todayWib = getWibDateString(new Date())

        if (iso < todayWib) {
          toast({
            variant: "destructive",
            title: currentLang === "en" ? "Past Date Rejected" : "Tanggal Masa Lalu",
            description: currentLang === "en"
              ? "Check-in date cannot be in the past."
              : "Tanggal check-in tidak boleh berada di masa lalu.",
          })
          return
        }

        const isDateDisabled = disabledDatesList?.some((d) => {
          const disabledIso = typeof d === "string" ? d : getWibDateString(d)
          return disabledIso === iso
        })

        if (isDateDisabled) {
          toast({
            variant: "destructive",
            title: currentLang === "en" ? "Date Unavailable" : "Tanggal Tidak Tersedia",
            description: currentLang === "en"
              ? "The selected date is already booked or blocked by the host."
              : "Tanggal tersebut sudah dipesan tamu lain atau diblokir oleh host.",
          })
          return
        }

        if (!isCheckIn && checkInStr && iso <= checkInStr) {
          toast({
            variant: "destructive",
            title: currentLang === "en" ? "Invalid Checkout Date" : "Tanggal Checkout Tidak Valid",
            description: currentLang === "en"
              ? "Check-out date must be after the check-in date."
              : "Tanggal check-out harus setelah tanggal check-in.",
          })
          return
        }

        callback(iso)
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {checkInStr && checkOutStr
            ? `${diffDays} ${
                currentLang === "en"
                  ? diffDays === 1
                    ? "night"
                    : "nights"
                  : "malam"
              }`
            : selectDatesText}
        </h3>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          {formatRangeHeader()}
        </p>
      </div>

      {/* Dual Input Box Check-In & Checkout */}
      <div className="flex items-center rounded-xl border border-black dark:border-white divide-x divide-black dark:divide-white overflow-hidden bg-white dark:bg-gray-900 shrink-0">
        {/* Check-In */}
        <div
          onClick={() => onSelectTab("checkIn")}
          className={cn(
            "px-3 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer transition-colors min-w-[110px]",
            activeDateTab === "checkIn" ? "bg-gray-50 dark:bg-gray-800" : ""
          )}
        >
          <div>
            <span className="block text-[8px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
              CHECK-IN
            </span>
            <input
              type="text"
              placeholder={currentLang === "en" ? "MM/DD/YYYY" : "DD/MM/YYYY"}
              value={checkInStr ? formatInputDate(checkInStr, currentLang) : ""}
              onChange={(e) => handleManualInput(e.target.value, true, onCheckInChange)}
              className="w-18 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          {checkInStr && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCheckInChange("")
              }}
              className="text-gray-400 hover:text-black dark:hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Checkout */}
        <div
          onClick={() => onSelectTab("checkOut")}
          className={cn(
            "px-3 py-1.5 flex items-center justify-between gap-1.5 cursor-pointer transition-colors min-w-[110px]",
            activeDateTab === "checkOut" ? "bg-gray-50 dark:bg-gray-800" : ""
          )}
        >
          <div>
            <span className="block text-[8px] font-black uppercase tracking-wider text-gray-800 dark:text-gray-200">
              CHECKOUT
            </span>
            <input
              type="text"
              placeholder={currentLang === "en" ? "MM/DD/YYYY" : "DD/MM/YYYY"}
              value={
                checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""
              }
              onChange={(e) => handleManualInput(e.target.value, false, onCheckOutChange)}
              className="w-18 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          {checkOutStr && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCheckOutChange("")
              }}
              className="text-gray-400 hover:text-black dark:hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
