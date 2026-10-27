"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import { formatGuestSummary } from "@/components/calendar"
import type { Dictionary } from "@/lib/dictionary"
import BookingOwnerNotice from "./components/BookingOwnerNotice"
import BookingDatePickerSection from "./components/BookingDatePickerSection"
import BookingGuestPickerSection from "./components/BookingGuestPickerSection"
import BookingPriceBreakdown from "./components/BookingPriceBreakdown"
import BookingConfirmDialog from "./components/BookingConfirmDialog"
import { formatInputDate } from "./components/BookingDateInputs"
import {
  getPropertyDisabledDates,
  checkRangeOverlap,
  calculateBookingPricing,
} from "./components/booking.utils"
import { toast } from "@/components/ui/use-toast"

export interface BookingClientProperty {
  id: string
  title: string
  hostId: string
  pricePerNight?: number | null
  price?: number | null
  cleaningFee?: number | null
  maxStayNights?: number | null
  maxGuests?: number | null
  bookings?: Array<{ startDate: Date | string; endDate: Date | string }>
  blockedDates?: Array<{ startDate: Date | string; endDate: Date | string }>
}

export default function BookingClient({
  property,
  sessionUser,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: {
  property: BookingClientProperty
  sessionUser?: { id?: string; email?: string | null; name?: string | null } | null
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}) {
  const router = useRouter()

  const [checkInStr, setCheckInStr] = useState("")
  const [checkOutStr, setCheckOutStr] = useState("")
  const [loading, setLoading] = useState(false)

  const maxGuests = property.maxGuests || 1
  const [adults, setAdults] = useState(1)
  const [childrenCount, setChildrenCount] = useState(0)
  const [infants, setInfants] = useState(0)

  const dateFrom = checkInStr ? new Date(`${checkInStr}T00:00:00`) : undefined
  const dateTo = checkOutStr ? new Date(`${checkOutStr}T00:00:00`) : undefined
  const disabledDates = getPropertyDisabledDates(property)

  const diffTime = dateFrom && dateTo && dateTo > dateFrom ? Math.abs(dateTo.getTime() - dateFrom.getTime()) : 0
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  const basePricePerNight =
    property.pricePerNight && property.pricePerNight > 0
      ? property.pricePerNight
      : Math.round((property.price || 0) * 18051)
  const maxStay = property.maxStayNights || 28
  const isExceedingMaxStay = Boolean(dateFrom && dateTo && diffDays > maxStay)

  const { nightsPriceIdr, cleaningFeeIdr, guestServiceFeeIdr, totalPriceIdr } =
    calculateBookingPricing(diffDays, basePricePerNight, property.cleaningFee || 0)

  const isOverlapping = checkRangeOverlap(dateFrom, dateTo, disabledDates)
  const isOwner = sessionUser?.id === property.hostId

  const handleBooking = async () => {
    if (!sessionUser) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Sign In Required" : "Perlu Masuk Akun",
        description: currentLang === "en" ? "Please sign in to book this accommodation." : "Silakan login terlebih dahulu.",
      })
      return router.push("/signin")
    }
    if (!checkInStr || !checkOutStr || !dateFrom || !dateTo) return
    if (isOverlapping) {
      toast({
        variant: "destructive",
        title: t.datesUnavailable || (currentLang === "en" ? "Dates Unavailable" : "Tanggal Tidak Tersedia"),
        description: t.rangeOverlapsDisabled,
      })
      return
    }
    if (isExceedingMaxStay) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Max Stay Exceeded" : "Batas Menginap Terlampaui",
        description:
          currentLang === "en"
            ? `Maximum stay duration is ${maxStay} nights per transaction.`
            : `Batas menginap maksimal adalah ${maxStay} malam per transaksi.`,
      })
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
          guests: adults + childrenCount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses pembayaran")
      router.push(`/checkout/${data.bookingId}?token=${data.token}`)
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Reservation Failed" : "Gagal Memproses Reservasi",
        description: error instanceof Error ? error.message : "Gagal memproses reservasi",
      })
    } finally {
      setLoading(false)
    }
  }

  const guestSummary = formatGuestSummary({ adults, childrenCount, infants, currentLang, labels: t })

  const triggerLabel = isOverlapping
    ? t.datesUnavailable || "Tanggal Tidak Tersedia"
    : isExceedingMaxStay
      ? (currentLang === "en" ? "Max Stay Exceeded" : "Maksimal Malam Terlampaui")
      : t.reserve || "Pesan Sekarang"

  return (
    <Card className="shadow-xl border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-visible relative bg-white dark:bg-gray-900">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-baseline justify-between">
          <CardTitle className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
              {formatPrice(basePricePerNight, currentCurrency)}
            </span>
            <span className="text-muted-foreground font-normal text-xs sm:text-sm">
              / {t.perNight || t.night}
            </span>
          </CardTitle>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50">
            {currentLang === "en" ? `Max ${maxGuests} Guests` : `Maks. ${maxGuests} Tamu`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3.5 pt-3.5">
        {isOwner ? (
          <BookingOwnerNotice propertyId={property.id} currentLang={currentLang} t={t} />
        ) : (
          <>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-visible divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
              <BookingDatePickerSection
                checkInStr={checkInStr}
                checkOutStr={checkOutStr}
                onCheckInChange={setCheckInStr}
                onCheckOutChange={setCheckOutStr}
                disabledDatesList={disabledDates}
                currentLang={currentLang}
                diffDays={diffDays}
                t={t}
              />

              <div className="px-3 py-1.5 bg-gray-50/70 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                <span>Check-in: 14:00 WIB</span>
                <span>Check-out: 12:00 WIB</span>
              </div>

              <BookingGuestPickerSection
                adults={adults}
                childrenCount={childrenCount}
                infants={infants}
                maxGuests={maxGuests}
                guestSummary={guestSummary}
                currentLang={currentLang}
                t={t}
                onAdultsChange={setAdults}
                onChildrenChange={setChildrenCount}
                onInfantsChange={setInfants}
              />
            </div>

            {checkInStr && checkOutStr && (
              <BookingPriceBreakdown
                basePricePerNight={basePricePerNight}
                diffDays={diffDays}
                nightsPriceIdr={nightsPriceIdr}
                cleaningFeeIdr={cleaningFeeIdr}
                guestServiceFeeIdr={guestServiceFeeIdr}
                totalPriceIdr={totalPriceIdr}
                currentCurrency={currentCurrency}
                currentLang={currentLang}
                maxStay={maxStay}
                isSelectedRangeOverlappingDisabled={isOverlapping}
                isExceedingMaxStay={isExceedingMaxStay}
                t={t}
              />
            )}

            <BookingConfirmDialog
              propertyTitle={property.title}
              checkInFormatted={checkInStr ? formatInputDate(checkInStr, currentLang) : ""}
              checkOutFormatted={checkOutStr ? formatInputDate(checkOutStr, currentLang) : ""}
              guestSummary={guestSummary}
              totalPriceIdr={totalPriceIdr}
              currentCurrency={currentCurrency}
              currentLang={currentLang}
              loading={loading}
              disabled={!checkInStr || !checkOutStr || isOverlapping || isExceedingMaxStay}
              triggerLabel={triggerLabel}
              t={t}
              onConfirm={handleBooking}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
