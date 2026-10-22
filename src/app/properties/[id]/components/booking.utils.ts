import { startOfDay, eachDayOfInterval } from "date-fns"
import type { BookingClientProperty } from "../BookingClient"

export function getPropertyDisabledDates(
  property: Pick<BookingClientProperty, "bookings" | "blockedDates">
): Date[] {
  const bookedDays =
    property.bookings?.flatMap((b) =>
      eachDayOfInterval({
        start: new Date(b.startDate),
        end: new Date(b.endDate),
      })
    ) || []

  const manualBlockedDays =
    property.blockedDates?.flatMap((b) =>
      eachDayOfInterval({
        start: new Date(b.startDate),
        end: new Date(b.endDate),
      })
    ) || []

  return [...bookedDays, ...manualBlockedDays]
}

export function checkRangeOverlap(
  dateFrom: Date | undefined,
  dateTo: Date | undefined,
  disabledDates: Date[]
): boolean {
  if (!dateFrom || !dateTo || dateFrom >= dateTo) return false
  const currentInterval = eachDayOfInterval({ start: dateFrom, end: dateTo })
  const todayTimestamp = startOfDay(new Date()).getTime()

  return currentInterval.some((d) => {
    const time = startOfDay(d).getTime()
    if (time < todayTimestamp) return true
    return disabledDates.some((dis) => startOfDay(dis).getTime() === time)
  })
}

export function calculateBookingPricing(
  diffDays: number,
  basePricePerNight: number,
  cleaningFee: number
) {
  const nightsPriceIdr = diffDays * basePricePerNight
  const cleaningFeeIdr = cleaningFee || 0
  const grossStayIdr = nightsPriceIdr + cleaningFeeIdr
  const guestServiceFeeIdr = Math.round(grossStayIdr * 0.1)
  const totalPriceIdr = grossStayIdr + guestServiceFeeIdr

  return {
    nightsPriceIdr,
    cleaningFeeIdr,
    guestServiceFeeIdr,
    totalPriceIdr,
  }
}
