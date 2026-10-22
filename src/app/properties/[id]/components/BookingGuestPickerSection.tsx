import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { GuestCounterDropdown } from "@/components/calendar"
import type { Dictionary } from "@/lib/dictionary"

export interface BookingGuestPickerSectionProps {
  adults: number
  childrenCount: number
  infants: number
  maxGuests: number
  guestSummary: string
  currentLang?: string
  t: Partial<Dictionary>
  onAdultsChange: (val: number) => void
  onChildrenChange: (val: number) => void
  onInfantsChange: (val: number) => void
}

export default function BookingGuestPickerSection({
  adults,
  childrenCount,
  infants,
  maxGuests,
  guestSummary,
  currentLang = "id",
  t,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
}: BookingGuestPickerSectionProps) {
  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const guestDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        guestDropdownRef.current &&
        !guestDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGuestOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
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
            {guestSummary}
          </span>
        </div>
        {isGuestOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isGuestOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
          <GuestCounterDropdown
            adults={adults}
            childrenCount={childrenCount}
            infants={infants}
            onAdultsChange={onAdultsChange}
            onChildrenChange={onChildrenChange}
            onInfantsChange={onInfantsChange}
            maxGuests={maxGuests}
            minAdults={1}
            currentLang={currentLang}
            dict={t}
            onClose={() => setIsGuestOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
