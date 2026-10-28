import React, { useState } from "react"
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

function formatWithMask(inputVal: string, prevVal: string): string {
  const isDeleting = inputVal.length < prevVal.length

  if (isDeleting) {
    const digits = inputVal.replace(/\D/g, "").slice(0, 8)
    if (!digits) return ""
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  // Handle single digit followed by slash, e.g. "5/" -> "05/" or "28/5/" -> "28/05/"
  let cleanInput = inputVal
  if (inputVal.endsWith("/") && !prevVal.endsWith("/")) {
    const parts = inputVal.split("/")
    if (parts.length === 2 && parts[0].length === 1) {
      cleanInput = `0${parts[0]}/`
    } else if (parts.length === 3 && parts[1].length === 1) {
      cleanInput = `${parts[0]}/0${parts[1]}/`
    }
  }

  const digits = cleanInput.replace(/\D/g, "").slice(0, 8)
  if (!digits) return ""

  if (digits.length <= 2) {
    return digits.length === 2 ? `${digits}/` : digits
  }
  if (digits.length <= 4) {
    return digits.length === 4
      ? `${digits.slice(0, 2)}/${digits.slice(2)}/`
      : `${digits.slice(0, 2)}/${digits.slice(2)}`
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDateParts(
  val: string,
  currentLang: string
): { year: number; month: number; day: number; iso: string } | null {
  const parts = val.split("/")
  if (parts.length !== 3) return null
  const yStr = parts[2]
  const mStr = currentLang === "en" ? parts[0] : parts[1]
  const dStr = currentLang === "en" ? parts[1] : parts[0]

  if (yStr.length !== 4 || mStr.length < 1 || dStr.length < 1) return null

  const yNum = Number(yStr)
  const mNum = Number(mStr)
  const dNum = Number(dStr)

  if (isNaN(yNum) || isNaN(mNum) || isNaN(dNum)) return null
  if (mNum < 1 || mNum > 12 || dNum < 1 || dNum > 31) return null

  const testDate = new Date(yNum, mNum - 1, dNum)
  if (
    testDate.getFullYear() !== yNum ||
    testDate.getMonth() !== mNum - 1 ||
    testDate.getDate() !== dNum
  ) {
    return null
  }

  const iso = `${String(yNum).padStart(4, "0")}-${String(mNum).padStart(2, "0")}-${String(dNum).padStart(2, "0")}`
  return { year: yNum, month: mNum, day: dNum, iso }
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

  const [rawInputCheckIn, setRawInputCheckIn] = useState(() =>
    checkInStr ? formatInputDate(checkInStr, currentLang) : ""
  )
  const [rawInputCheckOut, setRawInputCheckOut] = useState(() =>
    checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""
  )

  const [prevCheckIn, setPrevCheckIn] = useState({ checkInStr, currentLang })
  if (prevCheckIn.checkInStr !== checkInStr || prevCheckIn.currentLang !== currentLang) {
    setPrevCheckIn({ checkInStr, currentLang })
    setRawInputCheckIn(checkInStr ? formatInputDate(checkInStr, currentLang) : "")
  }

  const [prevCheckOut, setPrevCheckOut] = useState({ checkOutStr, currentLang })
  if (prevCheckOut.checkOutStr !== checkOutStr || prevCheckOut.currentLang !== currentLang) {
    setPrevCheckOut({ checkOutStr, currentLang })
    setRawInputCheckOut(checkOutStr ? formatInputDate(checkOutStr, currentLang) : "")
  }

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

  const validateAndCommitDate = (
    dateStr: string,
    isCheckIn: boolean
  ): boolean => {
    if (!dateStr.trim()) {
      if (isCheckIn) {
        onCheckInChange("")
      } else {
        onCheckOutChange("")
      }
      return true
    }

    const parsed = parseDateParts(dateStr, currentLang)
    if (!parsed) {
      toast({
        variant: "destructive",
        title:
          currentLang === "en"
            ? "Invalid Date Format"
            : "Format Tanggal Tidak Valid",
        description:
          currentLang === "en"
            ? "Please enter a valid calendar date."
            : "Harap masukkan tanggal kalender yang valid.",
      })
      return false
    }

    const { iso } = parsed
    const todayWib = getWibDateString(new Date())

    if (iso < todayWib) {
      toast({
        variant: "destructive",
        title:
          currentLang === "en" ? "Past Date Rejected" : "Tanggal Masa Lalu",
        description:
          currentLang === "en"
            ? isCheckIn
              ? "Check-in date cannot be in the past."
              : "Check-out date cannot be in the past."
            : isCheckIn
              ? "Tanggal check-in tidak boleh berada di masa lalu."
              : "Tanggal check-out tidak boleh berada di masa lalu.",
      })
      return false
    }

    if (!isCheckIn) {
      if (!checkInStr) {
        toast({
          variant: "destructive",
          title:
            currentLang === "en"
              ? "Select Check-In First"
              : "Pilih Check-In Terlebih Dahulu",
          description:
            currentLang === "en"
              ? "Please select a check-in date before choosing checkout."
              : "Harap tentukan tanggal check-in terlebih dahulu sebelum tanggal check-out.",
        })
        onSelectTab("checkIn")
        return false
      }

      if (iso <= checkInStr) {
        toast({
          variant: "destructive",
          title:
            currentLang === "en"
              ? "Invalid Checkout Date"
              : "Tanggal Checkout Tidak Valid",
          description:
            currentLang === "en"
              ? "Check-out date must be after the check-in date."
              : "Tanggal check-out harus setelah tanggal check-in.",
        })
        return false
      }

      // Check for unavailable nights inside the selected range
      const checkInDate = new Date(`${checkInStr}T00:00:00`)
      const checkOutDate = new Date(`${iso}T00:00:00`)
      let hasBlockedInRange = false
      const cur = new Date(checkInDate)
      cur.setDate(cur.getDate() + 1)
      while (cur < checkOutDate) {
        const curIso = getWibDateString(cur)
        if (
          disabledDatesList?.some((d) => {
            const disabledIso = typeof d === "string" ? d : getWibDateString(d)
            return disabledIso === curIso
          })
        ) {
          hasBlockedInRange = true
          break
        }
        cur.setDate(cur.getDate() + 1)
      }

      if (hasBlockedInRange) {
        toast({
          variant: "destructive",
          title:
            currentLang === "en"
              ? "Dates Include Unavailable Nights"
              : "Rentang Tanggal Tidak Tersedia",
          description:
            currentLang === "en"
              ? "Some nights in the selected date range are already booked or blocked."
              : "Beberapa malam dalam rentang tanggal yang dipilih sudah terpesan atau diblokir.",
        })
        return false
      }
    }

    const isDateDisabled = disabledDatesList?.some((d) => {
      const disabledIso = typeof d === "string" ? d : getWibDateString(d)
      return disabledIso === iso
    })

    if (isDateDisabled) {
      toast({
        variant: "destructive",
        title:
          currentLang === "en" ? "Date Unavailable" : "Tanggal Tidak Tersedia",
        description:
          currentLang === "en"
            ? "The selected date is already booked or blocked by the host."
            : "Tanggal tersebut sudah dipesan tamu lain atau diblokir oleh host.",
      })
      return false
    }

    if (isCheckIn) {
      onCheckInChange(iso)
      if (checkOutStr && iso >= checkOutStr) {
        onCheckOutChange("")
      }
      onSelectTab("checkOut")
    } else {
      onCheckOutChange(iso)
    }

    return true
  }

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    const formatted = formatWithMask(newVal, rawInputCheckIn)
    setRawInputCheckIn(formatted)

    if (formatted === "") {
      if (checkInStr) {
        onCheckInChange("")
      }
      return
    }

    if (formatted.length === 10) {
      const success = validateAndCommitDate(formatted, true)
      if (!success) {
        setRawInputCheckIn(
          checkInStr ? formatInputDate(checkInStr, currentLang) : ""
        )
      }
    }
  }

  const handleCheckInBlur = () => {
    if (!rawInputCheckIn.trim()) {
      if (checkInStr) {
        onCheckInChange("")
      }
      return
    }

    if (rawInputCheckIn.length < 10) {
      toast({
        variant: "destructive",
        title:
          currentLang === "en"
            ? "Invalid Date Format"
            : "Format Tanggal Tidak Valid",
        description:
          currentLang === "en"
            ? "Please enter a complete date (MM/DD/YYYY)."
            : "Harap masukkan format tanggal yang lengkap (DD/MM/YYYY).",
      })
      setRawInputCheckIn(
        checkInStr ? formatInputDate(checkInStr, currentLang) : ""
      )
      return
    }

    if (rawInputCheckIn.length === 10) {
      const success = validateAndCommitDate(rawInputCheckIn, true)
      if (!success) {
        setRawInputCheckIn(
          checkInStr ? formatInputDate(checkInStr, currentLang) : ""
        )
      }
    }
  }

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    const formatted = formatWithMask(newVal, rawInputCheckOut)
    setRawInputCheckOut(formatted)

    if (formatted === "") {
      if (checkOutStr) {
        onCheckOutChange("")
      }
      return
    }

    if (formatted.length === 10) {
      const success = validateAndCommitDate(formatted, false)
      if (!success) {
        setRawInputCheckOut(
          checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""
        )
      }
    }
  }

  const handleCheckOutBlur = () => {
    if (!rawInputCheckOut.trim()) {
      if (checkOutStr) {
        onCheckOutChange("")
      }
      return
    }

    if (rawInputCheckOut.length < 10) {
      toast({
        variant: "destructive",
        title:
          currentLang === "en"
            ? "Invalid Date Format"
            : "Format Tanggal Tidak Valid",
        description:
          currentLang === "en"
            ? "Please enter a complete date (MM/DD/YYYY)."
            : "Harap masukkan format tanggal yang lengkap (DD/MM/YYYY).",
      })
      setRawInputCheckOut(
        checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""
      )
      return
    }

    if (rawInputCheckOut.length === 10) {
      const success = validateAndCommitDate(rawInputCheckOut, false)
      if (!success) {
        setRawInputCheckOut(
          checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""
        )
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
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
              value={rawInputCheckIn}
              onChange={handleCheckInChange}
              onBlur={handleCheckInBlur}
              onKeyDown={handleKeyDown}
              onFocus={() => onSelectTab("checkIn")}
              className="w-20 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          {(checkInStr || rawInputCheckIn) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setRawInputCheckIn("")
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
              value={rawInputCheckOut}
              onChange={handleCheckOutChange}
              onBlur={handleCheckOutBlur}
              onKeyDown={handleKeyDown}
              onFocus={() => onSelectTab("checkOut")}
              className="w-20 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          {(checkOutStr || rawInputCheckOut) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setRawInputCheckOut("")
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
