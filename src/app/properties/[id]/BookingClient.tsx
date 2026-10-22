"use client"

import { useState, useRef, useEffect } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { startOfDay, eachDayOfInterval } from "date-fns"
import { useRouter } from "next/navigation"
import { formatPrice } from "@/lib/format"
import { getWibDateString } from "@/lib/date-standards"
import Link from "next/link"
import {
  Home,
  Settings,
  CalendarX,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Info,
  X
} from "lucide-react"

export default function BookingClient({
  property,
  sessionUser,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: {
  property: any
  sessionUser: any
  currentCurrency?: string
  currentLang?: string
  t: any
}) {
  const router = useRouter()

  // State String Tanggal (YYYY-MM-DD)
  const [checkInStr, setCheckInStr] = useState("")
  const [checkOutStr, setCheckOutStr] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeDateTab, setActiveDateTab] = useState<"checkIn" | "checkOut">("checkIn")
  const [loading, setLoading] = useState(false)

  // Calendar Navigation: 2 Bulan Sejajar
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const secondMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

  // State Guest Breakdown (Adults, Children, Infants, Pets)
  const maxGuests = property.maxGuests || 1
  const [adults, setAdults] = useState(1)
  const [childrenCount, setChildrenCount] = useState(0)
  const [infants, setInfants] = useState(0)

  // Popover / Dropdown Controller untuk Tamu & Kalender
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const guestDropdownRef = useRef<HTMLDivElement>(null)
  const calendarDropdownRef = useRef<HTMLDivElement>(null)

  // Total tamu yang dihitung terhadap batas maxGuests (Dewasa + Anak)
  const currentTotalGuests = adults + childrenCount
  const isMaxGuestsReached = currentTotalGuests >= maxGuests

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target as Node)) {
        setIsGuestOpen(false)
      }
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Konversi string ke Date object yang valid
  const dateFrom = checkInStr ? new Date(`${checkInStr}T00:00:00`) : undefined
  const dateTo = checkOutStr ? new Date(`${checkOutStr}T00:00:00`) : undefined

  // Generate disabled dates from existing bookings & blocked dates
  const bookedDays =
    property.bookings?.flatMap((b: any) => {
      return eachDayOfInterval({
        start: new Date(b.startDate),
        end: new Date(b.endDate),
      })
    }) || []

  const manualBlockedDays =
    property.blockedDates?.flatMap((b: any) => {
      return eachDayOfInterval({
        start: new Date(b.startDate),
        end: new Date(b.endDate),
      })
    }) || []

  const disabledDatesList = [...bookedDays, ...manualBlockedDays]

  const diffTime = dateFrom && dateTo && dateTo > dateFrom ? Math.abs(dateTo.getTime() - dateFrom.getTime()) : 0
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  
  // Single Source of Truth IDR
  const basePricePerNight = property.pricePerNight > 0 
    ? property.pricePerNight 
    : Math.round((property.price || 0) * 18051)
  const maxStay = property.maxStayNights || 28
  const isExceedingMaxStay = Boolean(dateFrom && dateTo && diffDays > maxStay)

  const cleaningFeeIdr = property.cleaningFee || 0
  const nightsPriceIdr = diffDays * basePricePerNight
  const grossStayIdr = nightsPriceIdr + cleaningFeeIdr
  const guestServiceFeeIdr = Math.round(grossStayIdr * 0.10) // 10% Layanan Tamu
  const totalPriceIdr = grossStayIdr + guestServiceFeeIdr

  // Validasi apakah rentang tanggal yang dipilih melompati/menabrak tanggal yang diblokir atau sudah dibooking
  const isSelectedRangeOverlappingDisabled = (() => {
    if (!dateFrom || !dateTo || dateFrom >= dateTo) return false
    const currentInterval = eachDayOfInterval({ start: dateFrom, end: dateTo })
    const todayTimestamp = startOfDay(new Date()).getTime()

    return currentInterval.some((d) => {
      const time = startOfDay(d).getTime()
      if (time < todayTimestamp) return true
      return disabledDatesList.some((dis) => startOfDay(dis).getTime() === time)
    })
  })()

  // Status kepemilikan listing (Standar Airbnb: Pemilik tidak dapat memesan propertinya sendiri)
  const isOwner = sessionUser?.id === property.hostId

  // Month navigation
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const formatDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${year}-${m}-${d}`
  }

  // Handle Klik Tanggal pada Kalender Ala Airbnb
  const handleDateClick = (dateStr: string) => {
    if (!checkInStr || (checkInStr && checkOutStr)) {
      setCheckInStr(dateStr)
      setCheckOutStr("")
      setActiveDateTab("checkOut")
    } else if (checkInStr && !checkOutStr) {
      if (dateStr < checkInStr) {
        setCheckInStr(dateStr)
        setCheckOutStr("")
        setActiveDateTab("checkOut")
      } else if (dateStr === checkInStr) {
        setCheckInStr(dateStr)
        setCheckOutStr("")
        setActiveDateTab("checkOut")
      } else {
        setCheckOutStr(dateStr)
        setTimeout(() => setIsCalendarOpen(false), 250)
      }
    }
  }

  // Format Tanggal Subjudul Modal (misal: "Oct 17, 2026 - Oct 19, 2026")
  const formatRangeHeader = () => {
    if (!dateFrom) return currentLang === "en" ? "Add your travel dates" : "Pilih tanggal perjalanan Anda"
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    if (!dateTo) {
      return `${dateFrom.toLocaleDateString(locale, opts)} - ...`
    }
    return `${dateFrom.toLocaleDateString(locale, opts)} - ${dateTo.toLocaleDateString(locale, opts)}`
  }

  // Format Input MM/DD/YYYY atau DD/MM/YYYY
  const formatInputDate = (dStr: string) => {
    if (!dStr) return ""
    const [y, m, d] = dStr.split("-")
    return currentLang === "en" ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
  }

  // Render Satu Bulan Kalender dengan Desain Presisi Screenshot Airbnb
  const renderCalendarMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const monthName = baseDate.toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID", {
      month: "long",
      year: "numeric"
    })

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayStr = getWibDateString(new Date())

    const days = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} className="h-7 w-7 sm:h-8 sm:w-8" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(year, month, day)
      const thisDayDate = new Date(`${dateStr}T00:00:00`)
      const isPast = dateStr < todayStr
      const isBlockedOrBooked = disabledDatesList.some(
        dis => startOfDay(dis).getTime() === startOfDay(thisDayDate).getTime()
      )
      const isDisabled = isPast || isBlockedOrBooked

      const isStart = dateStr === checkInStr
      const isEnd = dateStr === checkOutStr
      const isInRange = checkInStr && checkOutStr && dateStr > checkInStr && dateStr < checkOutStr

      // Cek apakah tanggal hari ini untuk border outline bulat
      const isToday = dateStr === todayStr

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateClick(dateStr)}
          className={`h-7 w-7 sm:h-8 sm:w-8 text-[11px] sm:text-xs font-semibold flex items-center justify-center transition-all relative select-none cursor-pointer
            ${isDisabled ? "text-gray-300 dark:text-gray-700 line-through opacity-35 cursor-not-allowed" : "text-gray-900 dark:text-gray-100 hover:border-2 hover:border-black dark:hover:border-white rounded-full"}
            ${isInRange ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-none font-bold" : ""}
            ${isStart ? "bg-black text-white dark:bg-white dark:text-black rounded-full z-10 font-bold shadow-xs" : ""}
            ${isEnd ? "bg-black text-white dark:bg-white dark:text-black rounded-full z-10 font-bold shadow-xs" : ""}
            ${isToday && !isStart && !isEnd ? "border border-gray-400 dark:border-gray-600 rounded-full" : ""}
          `}
        >
          {day}
        </button>
      )
    }

    const dayHeaders = currentLang === "en" ? ["S", "M", "T", "W", "T", "F", "S"] : ["M", "S", "S", "R", "K", "J", "S"]

    return (
      <div className="w-[215px] sm:w-[235px]">
        <div className="text-center font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 mb-2 capitalize">
          {monthName}
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-gray-400 mb-1.5">
          {dayHeaders.map((dh, idx) => (
            <span key={idx}>{dh}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days}
        </div>
      </div>
    )
  }

  const handleBooking = async () => {
    if (!sessionUser) {
      alert(currentLang === "en" ? "Please login first" : "Silakan login terlebih dahulu")
      return router.push("/signin")
    }
    if (!checkInStr || !checkOutStr || !dateFrom || !dateTo) return

    if (isSelectedRangeOverlappingDisabled) {
      alert(t.rangeOverlapsDisabled)
      return
    }

    if (isExceedingMaxStay) {
      alert(currentLang === "en" ? `Maximum stay duration is ${maxStay} nights per transaction.` : `Batas menginap maksimal adalah ${maxStay} malam per transaksi.`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          startDate: dateFrom,
          endDate: dateTo,
          totalPrice: totalPriceIdr,
          guests: currentTotalGuests,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses pembayaran")

      router.push(`/checkout/${data.bookingId}?token=${data.token}`)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Label ringkas teks jumlah tamu
  const getGuestLabel = () => {
    const parts = []
    parts.push(`${currentTotalGuests} ${t.guestUnit || "tamu"}`)
    if (infants > 0) parts.push(`${infants} ${t.infantUnit || "bayi"}`)
    return parts.join(", ")
  }

  return (
    <Card className="shadow-xl border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-visible relative bg-white dark:bg-gray-900">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-baseline justify-between">
          <CardTitle className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
              {formatPrice(basePricePerNight, currentCurrency)}
            </span>
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">/ {t.perNight || t.night}</span>
          </CardTitle>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50">
            {currentLang === "en" ? `Max ${maxGuests} Guests` : `Maks. ${maxGuests} Tamu`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3.5 pt-3.5">
        {/* ======================================================== */}
        {/* KONDISI 1: JIKA USER ADALAH PEMILIK LISTING INI SENDIRI */}
        {/* ======================================================== */}
        {isOwner ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 text-left">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <Home className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.hostOwnListingNotice}</span>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              {t.hostOwnListingDesc}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href={`/dashboard?tab=availability&propertyId=${property.id}`}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CalendarX className="w-3.5 h-3.5" />
                <span>{t.blockDates || (currentLang === "en" ? "Block Dates" : "Blokir Tanggal")}</span>
              </Link>
              <Link
                href={`/properties/${property.id}/edit`}
                className="py-2.5 px-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs font-bold text-center hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.editListing}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STANDAR PROFESIONAL AIRBNB: SEMUA PENGGUNA DAPAT MEMESAN */
          /* ======================================================== */
          <>
            {/* 1. SELEKTOR TANGGAL & TAMU DENGAN TAMPILAN MODERN AIRBNB */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-visible divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
          
          {/* Baris Atas: Check-in & Check-out (Klik Buka Popover Persis Screenshot Airbnb) */}
          <div className="relative" ref={calendarDropdownRef}>
            <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
              {/* Kolom Check-in */}
              <div
                onClick={() => {
                  setActiveDateTab("checkIn")
                  setIsCalendarOpen(true)
                }}
                className={cn(
                  "p-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors rounded-tl-2xl",
                  isCalendarOpen && activeDateTab === "checkIn" ? "ring-2 ring-black dark:ring-white rounded-tl-2xl bg-white dark:bg-gray-900 z-10" : ""
                )}
              >
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.checkInLabel}
                </label>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                  {checkInStr ? formatInputDate(checkInStr) : t.selectDates}
                </div>
              </div>

              {/* Kolom Check-out */}
              <div
                onClick={() => {
                  setActiveDateTab("checkOut")
                  setIsCalendarOpen(true)
                }}
                className={cn(
                  "p-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors rounded-tr-2xl",
                  isCalendarOpen && activeDateTab === "checkOut" ? "ring-2 ring-black dark:ring-white rounded-tr-2xl bg-white dark:bg-gray-900 z-10" : ""
                )}
              >
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.checkOutLabel}
                </label>
                <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
                  {checkOutStr ? formatInputDate(checkOutStr) : t.selectDates}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* MODAL / POPOVER KALENDER 2 BULAN SEJAJAR PERSIS AIRBNB  */}
            {/* ======================================================== */}
            {isCalendarOpen && (
              <div className="absolute right-0 sm:-right-4 top-full z-50 mt-2 p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 w-[300px] sm:w-[540px]">
                
                {/* Header Atas Modal: Rincian Malam & Kotak Check-In/Check-Out */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                      {checkInStr && checkOutStr
                        ? `${diffDays} ${currentLang === "en" ? (diffDays === 1 ? "night" : "nights") : "malam"}`
                        : t.selectDates}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {formatRangeHeader()}
                    </p>
                  </div>

                  {/* Kotak Dual Input Check-In & Checkout Ala Airbnb */}
                  <div className="flex items-center rounded-xl border border-black dark:border-white divide-x divide-black dark:divide-white overflow-hidden bg-white dark:bg-gray-900 shrink-0">
                    {/* Check In Box */}
                    <div
                      onClick={() => setActiveDateTab("checkIn")}
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
                          value={checkInStr ? formatInputDate(checkInStr) : ""}
                          onChange={(e) => {
                            // Support ketik manual
                            const val = e.target.value
                            if (val.length === 10) {
                              const parts = val.split("/")
                              if (parts.length === 3) {
                                const iso = currentLang === "en"
                                  ? `${parts[2]}-${parts[0]}-${parts[1]}`
                                  : `${parts[2]}-${parts[1]}-${parts[0]}`
                                setCheckInStr(iso)
                              }
                            }
                          }}
                          className="w-18 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                      {checkInStr && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCheckInStr("")
                          }}
                          className="text-gray-400 hover:text-black dark:hover:text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Checkout Box */}
                    <div
                      onClick={() => setActiveDateTab("checkOut")}
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
                          value={checkOutStr ? formatInputDate(checkOutStr) : ""}
                          onChange={(e) => {
                            // Support ketik manual
                            const val = e.target.value
                            if (val.length === 10) {
                              const parts = val.split("/")
                              if (parts.length === 3) {
                                const iso = currentLang === "en"
                                  ? `${parts[2]}-${parts[0]}-${parts[1]}`
                                  : `${parts[2]}-${parts[1]}-${parts[0]}`
                                setCheckOutStr(iso)
                              }
                            }
                          }}
                          className="w-18 text-[11px] font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                      {checkOutStr && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCheckOutStr("")
                          }}
                          className="text-gray-400 hover:text-black dark:hover:text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid 2 Bulan Kalender Berdampingan */}
                <div className="relative pt-1">
                  {/* Panah Navigasi Bulan */}
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="absolute -top-1 left-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="absolute -top-1 right-1 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    {renderCalendarMonth(currentMonth)}
                    <div className="hidden sm:block">
                      {renderCalendarMonth(secondMonth)}
                    </div>
                  </div>
                </div>

                {/* Footer Modal Kalender: Reset Tanggal & Tombol Close Hitam (Logo Keyboard Dihilangkan) */}
                <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckInStr("")
                      setCheckOutStr("")
                    }}
                    className="text-xs font-semibold underline text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    {currentLang === "en" ? "Clear dates" : "Hapus tanggal"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="px-4 py-1.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    {currentLang === "en" ? "Close" : "Tutup"}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Standar Waktu Operasional (Zona Waktu Indonesia Barat - WIB) */}
          <div className="px-3 py-1.5 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
            <span>{currentLang === "en" ? "Check-in: 14:00 WIB" : "Check-in: 14:00 WIB"}</span>
            <span>{currentLang === "en" ? "Check-out: 12:00 WIB" : "Check-out: 12:00 WIB"}</span>
          </div>

          {/* Baris Bawah: Selektor Tamu (Dropdown Gaya Airbnb) */}
          <div className="relative" ref={guestDropdownRef}>
            <button
              type="button"
              onClick={() => setIsGuestOpen(!isGuestOpen)}
              className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer rounded-b-2xl"
            >
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.guestsLabel}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5 block">
                  {getGuestLabel()}
                </span>
              </div>
              {isGuestOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {/* Menu Popover Tamu (Airbnb Stepper) */}
            {isGuestOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* 1. Dewasa */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.adultsLabel}</h5>
                    <p className="text-[11px] text-muted-foreground">{t.adultsDesc}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{adults}</span>
                    <button
                      type="button"
                      disabled={isMaxGuestsReached}
                      onClick={() => setAdults((prev) => prev + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* 2. Anak-anak */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.childrenLabel}</h5>
                    <p className="text-[11px] text-muted-foreground">{t.childrenDesc}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={childrenCount <= 0}
                      onClick={() => setChildrenCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{childrenCount}</span>
                    <button
                      type="button"
                      disabled={isMaxGuestsReached}
                      onClick={() => setChildrenCount((prev) => prev + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800" />

                {/* 3. Bayi */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.infantsLabel}</h5>
                    <p className="text-[11px] text-muted-foreground">{t.infantsDesc}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={infants <= 0}
                      onClick={() => setInfants((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{infants}</span>
                    <button
                      type="button"
                      disabled={infants >= 5}
                      onClick={() => setInfants((prev) => prev + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Notifikasi Batas Maksimal Tamu */}
                {isMaxGuestsReached && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{t.maxGuestsLimitAlert} ({maxGuests} {t.guestUnit}).</span>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsGuestOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Tanggal & Biaya */}
        {checkInStr && checkOutStr && (
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
                    {formatPrice(basePricePerNight, currentCurrency)} x {diffDays} {t.perNight || t.night}
                  </span>
                  <span className="font-semibold">{formatPrice(nightsPriceIdr, currentCurrency)}</span>
                </div>
                {cleaningFeeIdr > 0 && (
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{t.cleaningFee || "Biaya Kebersihan"}</span>
                    <span className="font-semibold">{formatPrice(cleaningFeeIdr, currentCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>{currentLang === "en" ? "Guest Service Fee (10%)" : "Biaya Layanan Tamu (10%)"}</span>
                  <span className="font-semibold">{formatPrice(guestServiceFeeIdr, currentCurrency)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 text-gray-900 dark:text-gray-100 border-t dark:border-gray-800">
                  <span>{t.totalBill}</span>
                  <span className="text-rose-600 dark:text-rose-400">{formatPrice(totalPriceIdr, currentCurrency)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tombol Reservasi & Modal Konfirmasi Tamu */}
        <Dialog>
          <DialogTrigger
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full h-12 text-base rounded-2xl bg-rose-500 hover:bg-rose-600 font-bold transition-all shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={!checkInStr || !checkOutStr || isSelectedRangeOverlappingDisabled || isExceedingMaxStay}
          >
            {isSelectedRangeOverlappingDisabled ? t.datesUnavailable : isExceedingMaxStay ? (currentLang === "en" ? "Max Stay Exceeded" : "Maksimal Malam Terlampaui") : t.reserve}
          </DialogTrigger>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle>{t.confirmReservation}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl space-y-2 border border-gray-100 dark:border-gray-800">
                <p>
                  <strong>{currentLang === "en" ? "Property:" : "Penginapan:"}</strong> {property.title}
                </p>
                <p>
                  <strong>Check-in:</strong> {checkInStr ? formatInputDate(checkInStr) : "-"}
                </p>
                <p>
                  <strong>Check-out:</strong> {checkOutStr ? formatInputDate(checkOutStr) : "-"}
                </p>
                <p>
                  <strong>{t.guestsLabel}:</strong> {getGuestLabel()}
                </p>
              </div>
              <div className="flex justify-between font-bold text-lg px-1">
                <span>{t.totalPayment}</span>
                <span className="text-rose-600">{formatPrice(totalPriceIdr, currentCurrency)}</span>
              </div>
            </div>
            <Button
              onClick={handleBooking}
              disabled={loading}
              className="w-full h-12 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold cursor-pointer"
            >
              {loading ? t.confirming : t.confirmAndPay}
            </Button>
          </DialogContent>
        </Dialog>
      </>
    )}
      </CardContent>
    </Card>
  )
}
