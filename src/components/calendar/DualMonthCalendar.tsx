import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getWibDateString } from "@/lib/date-standards"

export interface DualMonthCalendarProps {
  checkIn: string
  checkOut: string
  onDateClick: (dateStr: string) => void
  disabledDates?: Date[]
  currentLang?: string
  theme?: "rose" | "dark"
  dayHeaderVariant?: "short" | "narrow"
  hideSecondMonthOnMobile?: boolean
  initialMonth?: Date
  className?: string
}

export default function DualMonthCalendar({
  checkIn,
  checkOut,
  onDateClick,
  disabledDates = [],
  currentLang = "id",
  theme = "rose",
  dayHeaderVariant = "short",
  hideSecondMonthOnMobile = false,
  initialMonth,
  className = "",
}: DualMonthCalendarProps) {
  // Navigation state for month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (initialMonth) return new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
    if (checkIn) {
      const d = new Date(checkIn)
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1)
    }
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const secondMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
  }, [currentMonth])

  // Pre-calculate disabled dates set for O(1) checking
  const disabledDatesSet = useMemo(() => {
    if (!disabledDates || disabledDates.length === 0) return new Set<string>()
    const set = new Set<string>()
    for (const d of disabledDates) {
      const year = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      set.add(`${year}-${m}-${day}`)
    }
    return set
  }, [disabledDates])

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

  const todayStr = getWibDateString(new Date())

  const getDayHeaders = () => {
    if (dayHeaderVariant === "narrow") {
      return currentLang === "en"
        ? ["S", "M", "T", "W", "T", "F", "S"]
        : ["M", "S", "S", "R", "K", "J", "S"]
    }
    return currentLang === "en"
      ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
      : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  }

  const dayHeaders = getDayHeaders()

  const renderMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    const monthName = baseDate.toLocaleDateString(locale, {
      month: "long",
      year: "numeric",
    })

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    const blankSizeClass =
      theme === "dark" ? "h-7 w-7 sm:h-8 sm:w-8" : "h-9 w-9"

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} className={blankSizeClass} />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(year, month, day)
      const isPast = dateStr < todayStr
      const isBlockedOrBooked = disabledDatesSet.has(dateStr)
      const isDisabled = isPast || isBlockedOrBooked

      const isStart = dateStr === checkIn
      const isEnd = dateStr === checkOut
      const isInRange = Boolean(
        checkIn && checkOut && dateStr > checkIn && dateStr < checkOut
      )
      const isToday = dateStr === todayStr

      let dayClasses = ""
      if (theme === "rose") {
        dayClasses = `h-9 w-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all relative select-none cursor-pointer
          ${isDisabled ? "text-gray-300 dark:text-gray-700 cursor-not-allowed" : "text-gray-800 dark:text-gray-200 hover:border hover:border-black dark:hover:border-white"}
          ${isInRange ? "bg-rose-50 dark:bg-rose-950/40 rounded-none text-rose-600 dark:text-rose-300" : ""}
          ${isStart ? "bg-rose-500 text-white dark:bg-rose-600 dark:text-white rounded-full z-10 font-bold shadow-xs hover:bg-rose-600" : ""}
          ${isEnd ? "bg-rose-500 text-white dark:bg-rose-600 dark:text-white rounded-full z-10 font-bold shadow-xs hover:bg-rose-600" : ""}
        `
      } else {
        dayClasses = `h-7 w-7 sm:h-8 sm:w-8 text-[11px] sm:text-xs font-semibold flex items-center justify-center transition-all relative select-none cursor-pointer
          ${isDisabled ? "text-gray-300 dark:text-gray-700 line-through opacity-35 cursor-not-allowed" : "text-gray-900 dark:text-gray-100 hover:border-2 hover:border-black dark:hover:border-white rounded-full"}
          ${isInRange ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-none font-bold" : ""}
          ${isStart ? "bg-black text-white dark:bg-white dark:text-black rounded-full z-10 font-bold shadow-xs" : ""}
          ${isEnd ? "bg-black text-white dark:bg-white dark:text-black rounded-full z-10 font-bold shadow-xs" : ""}
          ${isToday && !isStart && !isEnd ? "border border-gray-400 dark:border-gray-600 rounded-full" : ""}
        `
      }

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isDisabled}
          onClick={() => onDateClick(dateStr)}
          className={dayClasses}
        >
          {day}
        </button>
      )
    }

    const containerWidth =
      theme === "dark" ? "w-[215px] sm:w-[235px]" : "w-[280px]"
    const gridGap = theme === "dark" ? "gap-0.5" : "gap-1"
    const headerTextSize =
      theme === "dark"
        ? "text-xs sm:text-sm mb-2"
        : "text-sm mb-3"
    const dayHeaderSize =
      theme === "dark" ? "text-[10px] mb-1.5" : "text-[11px] mb-2"

    return (
      <div className={containerWidth}>
        <div
          className={`text-center font-bold text-gray-900 dark:text-gray-100 capitalize ${headerTextSize}`}
        >
          {monthName}
        </div>
        <div
          className={`grid grid-cols-7 text-center font-semibold text-gray-400 ${gridGap} ${dayHeaderSize}`}
        >
          {dayHeaders.map((dh, idx) => (
            <span key={idx}>{dh}</span>
          ))}
        </div>
        <div className={`grid grid-cols-7 ${gridGap}`}>{days}</div>
      </div>
    )
  }

  const navBtnClasses =
    theme === "dark"
      ? "p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer z-10"
      : "p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer z-10"

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevMonth}
        className={`absolute -top-1 left-1 sm:left-3 ${navBtnClasses}`}
        aria-label="Previous Month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={nextMonth}
        className={`absolute -top-1 right-1 sm:right-3 ${navBtnClasses}`}
        aria-label="Next Month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Two months side by side */}
      <div
        className={`flex items-start justify-between ${
          theme === "dark"
            ? "flex-col sm:flex-row gap-6"
            : "gap-8 pt-1"
        }`}
      >
        {renderMonth(currentMonth)}
        <div className={hideSecondMonthOnMobile ? "hidden sm:block" : ""}>
          {renderMonth(secondMonth)}
        </div>
      </div>
    </div>
  )
}
