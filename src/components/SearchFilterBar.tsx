"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DualMonthCalendar,
  GuestCounterDropdown,
  DestinationSuggestions,
  DateFlexibilityPills,
  formatGuestSummary,
  type SuggestedDestination,
} from "@/components/calendar"
import type { Dictionary } from "@/lib/dictionary"

export default function SearchFilterBar({
  dict,
  currentLang = "id",
}: {
  dict?: Partial<Dictionary>
  currentLang?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "")
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "")

  const initialGuests = parseInt(searchParams.get("guests") || "0", 10)
  const [adults, setAdults] = useState(initialGuests > 0 ? initialGuests : 0)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)

  const [whereOpen, setWhereOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [dateFlexibility, setDateFlexibility] = useState<number | null>(0)

  const isSearchFocused = whereOpen || datesOpen || guestsOpen
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocation(searchParams.get("location") || "")
    setCheckIn(searchParams.get("checkIn") || "")
    setCheckOut(searchParams.get("checkOut") || "")
    const g = parseInt(searchParams.get("guests") || "0", 10)
    if (g > 0 && adults === 0 && children === 0) setAdults(g)
  }, [searchParams])

  const totalGuests = adults + children

  const handleDateClick = (dateStr: string) => {
    if (!checkIn || (checkIn && checkOut) || dateStr <= checkIn) {
      setCheckIn(dateStr)
      setCheckOut("")
    } else {
      setCheckOut(dateStr)
      setDatesOpen(false)
      setGuestsOpen(true)
    }
  }

  const handleSelectDestination = (dest: SuggestedDestination) => {
    setLocation(dest.searchValue)
    setWhereOpen(false)
    setDatesOpen(true)
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setWhereOpen(false)
    setDatesOpen(false)
    setGuestsOpen(false)

    const params = new URLSearchParams()
    if (location.trim()) params.set("location", location.trim())
    if (checkIn) params.set("checkIn", checkIn)
    if (checkOut) params.set("checkOut", checkOut)
    if (totalGuests > 0) params.set("guests", String(totalGuests))

    const amenities = searchParams.get("amenities")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    if (amenities) params.set("amenities", amenities)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)

    router.push(`/?${params.toString()}`)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocation("")
    setCheckIn("")
    setCheckOut("")
    setAdults(0)
    setChildren(0)
    setInfants(0)
    setPets(0)
    router.push("/")
  }

  const getWhenLabel = () => {
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    if (checkIn && checkOut) {
      const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
      return `${new Date(checkIn).toLocaleDateString(locale, opt)} – ${new Date(checkOut).toLocaleDateString(locale, opt)}`
    }
    if (checkIn) {
      const addCheckOutText = dict?.addCheckOut || (currentLang === "en" ? "Add check-out" : "Tambah check-out")
      return `${new Date(checkIn).toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${addCheckOutText}`
    }
    return dict?.addDates || (currentLang === "en" ? "Add dates" : "Tambah tanggal")
  }

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 flex items-center divide-x dark:divide-gray-800 relative z-10 transition-all ${
        isSearchFocused ? "shadow-md ring-1 ring-black/5 dark:ring-white/10" : "shadow-sm hover:shadow-md"
      }`}
    >
      {/* 1. Destination */}
      <Popover open={whereOpen} onOpenChange={setWhereOpen}>
        <PopoverTrigger
          className={`flex-1 px-6 py-2.5 rounded-full cursor-pointer transition-colors text-left outline-none ${
            whereOpen ? "bg-white shadow-lg dark:bg-gray-900" : "hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
          }`}
          onClick={() => {
            setWhereOpen(true)
            setTimeout(() => inputRef.current?.focus(), 50)
          }}
        >
          <label className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block mb-0.5 pointer-events-none">
            {dict?.where || (currentLang === "en" ? "Where" : "Ke Mana")}
          </label>
          <input
            ref={inputRef}
            type="text"
            placeholder={dict?.searchDest || (currentLang === "en" ? "Search destinations" : "Cari destinasi")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setWhereOpen(true)}
            className="w-full bg-transparent outline-none text-xs text-gray-800 dark:text-gray-200 truncate placeholder-gray-400 font-medium"
          />
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-5 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 mt-3" align="start" sideOffset={8}>
          <DestinationSuggestions onSelect={handleSelectDestination} currentLang={currentLang} title={dict?.suggestedDestinations} />
        </PopoverContent>
      </Popover>

      {/* 2. Dates */}
      <Popover open={datesOpen} onOpenChange={setDatesOpen}>
        <PopoverTrigger className={`flex-1 px-6 py-2.5 rounded-full cursor-pointer transition-colors text-left outline-none ${datesOpen ? "bg-white shadow-lg dark:bg-gray-900" : "hover:bg-gray-100/70 dark:hover:bg-gray-800/70"}`}>
          <label className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block mb-0.5 pointer-events-none">
            {dict?.when || (currentLang === "en" ? "When" : "Kapan")}
          </label>
          <span className={`text-xs block truncate font-medium pointer-events-none ${checkIn ? "text-gray-900 dark:text-gray-100 font-semibold" : "text-gray-400"}`}>
            {getWhenLabel()}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-[660px] p-6 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 mt-3" align="center" sideOffset={8}>
          <DualMonthCalendar checkIn={checkIn} checkOut={checkOut} onDateClick={handleDateClick} currentLang={currentLang} theme="rose" />
          <DateFlexibilityPills dateFlexibility={dateFlexibility} onSelectFlexibility={setDateFlexibility} currentLang={currentLang} exactDatesText={dict?.exactDates} />
        </PopoverContent>
      </Popover>

      {/* 3. Guests */}
      <div className="flex-1 pl-6 pr-2 py-2 rounded-full hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors flex items-center justify-between">
        <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
          <PopoverTrigger className={`flex-1 text-left cursor-pointer transition-colors py-0.5 outline-none ${guestsOpen ? "text-gray-900 dark:text-gray-100" : ""}`}>
            <div className="truncate pr-2">
              <label className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block mb-0.5 pointer-events-none">
                {dict?.who || (currentLang === "en" ? "Who" : "Siapa")}
              </label>
              <span className={`text-xs block truncate font-medium pointer-events-none ${totalGuests > 0 ? "text-gray-900 dark:text-gray-100 font-semibold" : "text-gray-400"}`}>
                {formatGuestSummary({ adults, childrenCount: children, infants, pets, currentLang, labels: dict })}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 mt-3" align="end" sideOffset={8}>
            <GuestCounterDropdown
              adults={adults}
              childrenCount={children}
              infants={infants}
              pets={pets}
              onAdultsChange={setAdults}
              onChildrenChange={(val) => { if (adults === 0 && val > 0) setAdults(1); setChildren(val) }}
              onInfantsChange={(val) => { if (adults === 0 && val > 0) setAdults(1); setInfants(val) }}
              onPetsChange={(val) => { if (adults === 0 && val > 0) setAdults(1); setPets(val) }}
              showPets
              minAdults={0}
              currentLang={currentLang}
              dict={dict}
            />
          </PopoverContent>
        </Popover>

        {/* Clear & Search */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {(location || checkIn || checkOut || totalGuests > 0) && (
            <button type="button" onClick={handleClear} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer" title={dict?.clearAll || (currentLang === "en" ? "Clear all" : "Hapus semua")}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            onPointerDown={(e) => { e.preventDefault(); handleSearch() }}
            onClick={(e) => handleSearch(e)}
            className={`bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow relative z-20 ${isSearchFocused ? "px-4 py-2.5" : "p-2.5"}`}
          >
            <Search className="w-4 h-4 stroke-[3]" />
            {isSearchFocused && (
              <span className="text-xs font-bold transition-all">
                {dict?.search || (currentLang === "en" ? "Search" : "Cari")}
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
