import React, { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { DualMonthCalendar } from "@/components/calendar"
import type { Dictionary } from "@/lib/dictionary"
import BookingDateInputs, { formatInputDate } from "./BookingDateInputs"

export interface BookingDatePickerSectionProps {
  checkInStr: string
  checkOutStr: string
  onCheckInChange: (val: string) => void
  onCheckOutChange: (val: string) => void
  disabledDatesList: Date[]
  currentLang?: string
  diffDays: number
  t: Partial<Dictionary>
}

export default function BookingDatePickerSection({
  checkInStr,
  checkOutStr,
  onCheckInChange,
  onCheckOutChange,
  disabledDatesList,
  currentLang = "id",
  diffDays,
  t,
}: BookingDatePickerSectionProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [activeDateTab, setActiveDateTab] = useState<"checkIn" | "checkOut">("checkIn")
  const calendarDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleDateClick = (dateStr: string) => {
    if (!checkInStr || (checkInStr && checkOutStr) || dateStr <= checkInStr) {
      onCheckInChange(dateStr)
      onCheckOutChange("")
      setActiveDateTab("checkOut")
    } else {
      onCheckOutChange(dateStr)
      setTimeout(() => setIsCalendarOpen(false), 250)
    }
  }

  return (
    <div className="relative" ref={calendarDropdownRef}>
      <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800">
        <div
          onClick={() => {
            setActiveDateTab("checkIn")
            setIsCalendarOpen(true)
          }}
          className={cn(
            "p-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors rounded-tl-2xl",
            isCalendarOpen && activeDateTab === "checkIn"
              ? "ring-2 ring-black dark:ring-white rounded-tl-2xl bg-white dark:bg-gray-900 z-10"
              : ""
          )}
        >
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t.checkInLabel}
          </label>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
            {checkInStr ? formatInputDate(checkInStr, currentLang) : t.selectDates}
          </div>
        </div>

        <div
          onClick={() => {
            setActiveDateTab("checkOut")
            setIsCalendarOpen(true)
          }}
          className={cn(
            "p-3 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors rounded-tr-2xl",
            isCalendarOpen && activeDateTab === "checkOut"
              ? "ring-2 ring-black dark:ring-white rounded-tr-2xl bg-white dark:bg-gray-900 z-10"
              : ""
          )}
        >
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t.checkOutLabel}
          </label>
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5 truncate">
            {checkOutStr ? formatInputDate(checkOutStr, currentLang) : t.selectDates}
          </div>
        </div>
      </div>

      {/* Calendar Dropdown Modal */}
      {isCalendarOpen && (
        <div className="absolute right-0 sm:-right-4 top-full z-50 mt-2 p-5 sm:p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 w-[300px] sm:w-[540px]">
          <BookingDateInputs
            checkInStr={checkInStr}
            checkOutStr={checkOutStr}
            activeDateTab={activeDateTab}
            diffDays={diffDays}
            currentLang={currentLang}
            selectDatesText={t.selectDates || "Pilih tanggal"}
            onSelectTab={setActiveDateTab}
            onCheckInChange={onCheckInChange}
            onCheckOutChange={onCheckOutChange}
          />

          <DualMonthCalendar
            checkIn={checkInStr}
            checkOut={checkOutStr}
            onDateClick={handleDateClick}
            disabledDates={disabledDatesList}
            currentLang={currentLang}
            theme="dark"
            dayHeaderVariant="narrow"
            hideSecondMonthOnMobile={true}
          />

          <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                onCheckInChange("")
                onCheckOutChange("")
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
  )
}
