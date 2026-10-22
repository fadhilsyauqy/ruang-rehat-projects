"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Plus, Minus, X, Navigation, Building2, Landmark, Compass, Palmtree, Trees } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getWibDateString } from "@/lib/date-standards"

interface SuggestedDestination {
  id: string
  title: string
  subtitle: {
    id: string
    en: string
  }
  icon: any
  searchValue: string
}

const SUGGESTED_DESTINATIONS: SuggestedDestination[] = [
  {
    id: "nearby",
    title: "Nearby",
    subtitle: {
      id: "Temukan penginapan terdekat di sekitar Anda",
      en: "Find what's around you"
    },
    icon: Navigation,
    searchValue: ""
  },
  {
    id: "bandung",
    title: "Bandung, Indonesia",
    subtitle: {
      id: "Pilihan favorit untuk liburan akhir pekan",
      en: "Great for a weekend getaway"
    },
    icon: Palmtree,
    searchValue: "Bandung"
  },
  {
    id: "yogyakarta",
    title: "Yogyakarta, Indonesia",
    subtitle: {
      id: "Dekat wisata budaya seperti Candi Borobudur",
      en: "For sights like Borobudur Temple"
    },
    icon: Landmark,
    searchValue: "Yogyakarta"
  },
  {
    id: "bali",
    title: "Bali, Indonesia",
    subtitle: {
      id: "Surga tropis & villa mewah tepi pantai",
      en: "Tropical paradise & luxury villas"
    },
    icon: Palmtree,
    searchValue: "Bali"
  },
  {
    id: "lembang",
    title: "Lembang, Indonesia",
    subtitle: {
      id: "Udara pegunungan sejuk & pemandangan alam",
      en: "Cool mountain breeze & nature retreats"
    },
    icon: Trees,
    searchValue: "Lembang"
  },
  {
    id: "jakarta",
    title: "Jakarta, Indonesia",
    subtitle: {
      id: "Pusat gaya hidup kota, belanja, & kuliner",
      en: "For its bustling city life & dining"
    },
    icon: Building2,
    searchValue: "Jakarta"
  },
  {
    id: "tangerang",
    title: "Tangerang, Indonesia",
    subtitle: {
      id: "Akomodasi modern & kenyamanan perkotaan",
      en: "Urban retreat & modern apartments"
    },
    icon: Compass,
    searchValue: "Tangerang"
  }
]

export default function SearchFilterBar({
  dict,
  currentLang = "id"
}: {
  dict?: {
    where: string
    when?: string
    addDates?: string
    addCheckOut?: string
    checkIn?: string
    checkOut?: string
    who: string
    searchDest: string
    addGuests: string
    exactDates?: string
    suggestedDestinations?: string
    search?: string
    clearAll?: string
    adultsLabel?: string
    adultsDesc?: string
    childrenLabel?: string
    childrenDesc?: string
    infantsLabel?: string
    infantsDesc?: string
    petsLabel?: string
    petsDesc?: string
    guestUnit?: string
    infantUnit?: string
    petUnit?: string
  }
  currentLang?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "")
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "")
  
  // Guest counts
  const initialGuests = parseInt(searchParams.get("guests") || "0", 10)
  const [adults, setAdults] = useState(initialGuests > 0 ? initialGuests : 0)
  const [children, setChildren] = useState(0)
  const [infants, setInfants] = useState(0)
  const [pets, setPets] = useState(0)

  // Popover state controllers
  const [whereOpen, setWhereOpen] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [guestsOpen, setGuestsOpen] = useState(false)
  const [dateFlexibility, setDateFlexibility] = useState<number | null>(0)

  // Status apakah ada opsi pencarian yang sedang aktif/terbuka
  const isSearchFocused = whereOpen || datesOpen || guestsOpen

  const inputRef = useRef<HTMLInputElement>(null)

  // Calendar month navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (searchParams.get("checkIn")) {
      const d = new Date(searchParams.get("checkIn")!)
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1)
    }
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  // Sinkronisasi dengan URL searchParams
  useEffect(() => {
    setLocation(searchParams.get("location") || "")
    setCheckIn(searchParams.get("checkIn") || "")
    setCheckOut(searchParams.get("checkOut") || "")
    const g = parseInt(searchParams.get("guests") || "0", 10)
    if (g > 0 && adults === 0 && children === 0) {
      setAdults(g)
    }
  }, [searchParams])

  const totalGuests = adults + children

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

  const handleDateClick = (dateStr: string) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr)
      setCheckOut("")
    } else if (checkIn && !checkOut) {
      if (dateStr < checkIn) {
        setCheckIn(dateStr)
        setCheckOut("")
      } else if (dateStr === checkIn) {
        setCheckIn(dateStr)
        setCheckOut("")
      } else {
        setCheckOut(dateStr)
        // Otomatis tutup popover tanggal dan alihkan fokus ke pemilihan tamu
        setDatesOpen(false)
        setGuestsOpen(true)
      }
    }
  }

  const handleSelectDestination = (dest: SuggestedDestination) => {
    setLocation(dest.searchValue)
    setWhereOpen(false)
    setDatesOpen(true)
  }

  // Guest increment / decrement handlers
  const incrementAdults = () => setAdults(prev => prev + 1)
  const decrementAdults = () => setAdults(prev => Math.max(0, prev - 1))

  const incrementChildren = () => {
    if (adults === 0) setAdults(1)
    setChildren(prev => prev + 1)
  }
  const decrementChildren = () => setChildren(prev => Math.max(0, prev - 1))

  const incrementInfants = () => {
    if (adults === 0) setAdults(1)
    setInfants(prev => prev + 1)
  }
  const decrementInfants = () => setInfants(prev => Math.max(0, prev - 1))

  const incrementPets = () => {
    if (adults === 0) setAdults(1)
    setPets(prev => prev + 1)
  }
  const decrementPets = () => setPets(prev => Math.max(0, prev - 1))

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Tutup seluruh popover
    setWhereOpen(false)
    setDatesOpen(false)
    setGuestsOpen(false)

    // Bentuk URL searchParams dengan parameter yang bersih
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

  // Text Formatter for "When / Add dates"
  const getWhenLabel = () => {
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn)
      const d2 = new Date(checkOut)
      const opt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
      return `${d1.toLocaleDateString(locale, opt)} – ${d2.toLocaleDateString(locale, opt)}`
    }
    if (checkIn) {
      const d1 = new Date(checkIn)
      const addCheckOutText = dict?.addCheckOut || (currentLang === "en" ? "Add check-out" : "Tambah check-out")
      return `${d1.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${addCheckOutText}`
    }
    return dict?.addDates || (currentLang === "en" ? "Add dates" : "Tambah tanggal")
  }

  // Text Formatter for "Who / Add guests"
  const getWhoLabel = () => {
    if (totalGuests === 0 && infants === 0 && pets === 0) {
      return dict?.addGuests || (currentLang === "en" ? "Add guests" : "Tambah tamu")
    }
    const parts = []
    if (totalGuests > 0) {
      const unit = currentLang === "en" ? (totalGuests === 1 ? "guest" : "guests") : (dict?.guestUnit || "tamu")
      parts.push(`${totalGuests} ${unit}`)
    }
    if (infants > 0) {
      const unit = currentLang === "en" ? (infants === 1 ? "infant" : "infants") : (dict?.infantUnit || "bayi")
      parts.push(`${infants} ${unit}`)
    }
    if (pets > 0) {
      const unit = currentLang === "en" ? (pets === 1 ? "pet" : "pets") : (dict?.petUnit || "hewan")
      parts.push(`${pets} ${unit}`)
    }
    return parts.join(", ")
  }

  // Render Satu Bulan Kalender
  const renderCalendarMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const locale = currentLang === "en" ? "en-US" : "id-ID"
    const monthName = baseDate.toLocaleDateString(locale, { month: "long", year: "numeric" })

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayStr = getWibDateString(new Date())

    const days = []
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`blank-${i}`} className="h-9 w-9" />)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(year, month, day)
      const isPast = dateStr < todayStr
      const isStart = dateStr === checkIn
      const isEnd = dateStr === checkOut
      const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut

      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(dateStr)}
          className={`h-9 w-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all relative select-none cursor-pointer
            ${isPast ? "text-gray-300 dark:text-gray-700 cursor-not-allowed" : "text-gray-800 dark:text-gray-200 hover:border hover:border-black dark:hover:border-white"}
            ${isInRange ? "bg-rose-50 dark:bg-rose-950/40 rounded-none text-rose-600 dark:text-rose-300" : ""}
            ${isStart ? "bg-rose-500 text-white dark:bg-rose-600 dark:text-white rounded-full z-10 font-bold shadow-xs hover:bg-rose-600" : ""}
            ${isEnd ? "bg-rose-500 text-white dark:bg-rose-600 dark:text-white rounded-full z-10 font-bold shadow-xs hover:bg-rose-600" : ""}
          `}
        >
          {day}
        </button>
      )
    }

    const dayHeaders = currentLang === "en" 
      ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
      : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

    return (
      <div className="w-[280px]">
        <div className="text-center font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 capitalize">
          {monthName}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400 mb-2">
          {dayHeaders.map((dh, idx) => (
            <span key={idx}>{dh}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  const secondMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)

  return (
    <form
      onSubmit={handleSearch}
      className={`w-full bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800 flex items-center divide-x dark:divide-gray-800 relative z-10 transition-all ${
        isSearchFocused ? "shadow-md ring-1 ring-black/5 dark:ring-white/10" : "shadow-sm hover:shadow-md"
      }`}
    >
      {/* 1. Lokasi (Where - Popover Rekomendasi Destinasi Persis Gambar 1) */}
      <Popover open={whereOpen} onOpenChange={setWhereOpen}>
        <PopoverTrigger
          className={`flex-1 px-6 py-2.5 rounded-full cursor-pointer transition-colors text-left outline-none ${
            whereOpen
              ? "bg-white shadow-lg dark:bg-gray-900"
              : "hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
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

        <PopoverContent
          className="w-[420px] p-5 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 mt-3"
          align="start"
          sideOffset={8}
        >
          <div className="mb-3 px-2">
            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 tracking-wide">
              {dict?.suggestedDestinations || (currentLang === "en" ? "Suggested destinations" : "Rekomendasi destinasi")}
            </h4>
          </div>

          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-1">
            {SUGGESTED_DESTINATIONS.map((dest) => {
              const IconComp = dest.icon
              const subtitleText = dest.subtitle[currentLang as "id" | "en"] || dest.subtitle.id
              const displayTitle = dest.id === "nearby" ? (currentLang === "en" ? "Nearby" : "Sekitar Anda") : dest.title

              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => handleSelectDestination(dest)}
                  className="w-full p-2.5 rounded-2xl flex items-center gap-3.5 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700 flex items-center justify-center shrink-0 transition-colors text-gray-700 dark:text-gray-300">
                    <IconComp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                      {displayTitle}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {subtitleText}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Tanggal (When / Add dates - Popover Kalender) */}
      <Popover open={datesOpen} onOpenChange={setDatesOpen}>
        <PopoverTrigger
          className={`flex-1 px-6 py-2.5 rounded-full cursor-pointer transition-colors text-left outline-none ${
            datesOpen
              ? "bg-white shadow-lg dark:bg-gray-900"
              : "hover:bg-gray-100/70 dark:hover:bg-gray-800/70"
          }`}
        >
          <label className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block mb-0.5 pointer-events-none">
            {dict?.when || (currentLang === "en" ? "When" : "Kapan")}
          </label>
          <span
            className={`text-xs block truncate font-medium pointer-events-none ${
              checkIn ? "text-gray-900 dark:text-gray-100 font-semibold" : "text-gray-400"
            }`}
          >
            {getWhenLabel()}
          </span>
        </PopoverTrigger>

        <PopoverContent
          className="w-[660px] p-6 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 mt-3"
          align="center"
          sideOffset={8}
        >
          {/* Dual Month Calendar View */}
          <div className="relative">
            {/* Nav Arrows */}
            <button
              type="button"
              onClick={prevMonth}
              className="absolute -top-1 left-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="absolute -top-1 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dua Bulan Sejajar */}
            <div className="flex items-start justify-between gap-8 pt-1">
              {renderCalendarMonth(currentMonth)}
              {renderCalendarMonth(secondMonth)}
            </div>
          </div>

          {/* Bottom Pill Flexibility Options: Exact dates, ± 1 day, etc */}
          <div className="flex items-center justify-center gap-2 pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
            {[
              { label: dict?.exactDates || (currentLang === "en" ? "Exact dates" : "Tanggal pas"), val: 0 },
              { label: currentLang === "en" ? "± 1 day" : "± 1 hari", val: 1 },
              { label: currentLang === "en" ? "± 2 days" : "± 2 hari", val: 2 },
              { label: currentLang === "en" ? "± 3 days" : "± 3 hari", val: 3 },
              { label: currentLang === "en" ? "± 7 days" : "± 7 hari", val: 7 },
              { label: currentLang === "en" ? "± 14 days" : "± 14 hari", val: 14 }
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setDateFlexibility(opt.val)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  dateFlexibility === opt.val
                    ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900 font-semibold text-gray-900 dark:text-gray-100"
                    : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 3. Tamu (Who / Add guests - Popover Pembagian Tamu) */}
      <div className="flex-1 pl-6 pr-2 py-2 rounded-full hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-colors flex items-center justify-between">
        <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
          <PopoverTrigger
            className={`flex-1 text-left cursor-pointer transition-colors py-0.5 outline-none ${
              guestsOpen ? "text-gray-900 dark:text-gray-100" : ""
            }`}
          >
            <div className="truncate pr-2">
              <label className="text-[11px] font-bold text-gray-900 dark:text-gray-100 block mb-0.5 pointer-events-none">
                {dict?.who || (currentLang === "en" ? "Who" : "Siapa")}
              </label>
              <span
                className={`text-xs block truncate font-medium pointer-events-none ${
                  totalGuests > 0 ? "text-gray-900 dark:text-gray-100 font-semibold" : "text-gray-400"
                }`}
              >
                {getWhoLabel()}
              </span>
            </div>
          </PopoverTrigger>

          <PopoverContent
            className="w-80 p-6 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 space-y-5 mt-3"
            align="end"
            sideOffset={8}
          >
            {/* 1. Adults */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {dict?.adultsLabel || (currentLang === "en" ? "Adults" : "Dewasa")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {dict?.adultsDesc || (currentLang === "en" ? "Ages 13 or above" : "Usia 13 tahun ke atas")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementAdults}
                  disabled={adults <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{adults}</span>
                <button
                  type="button"
                  onClick={incrementAdults}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-black transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* 2. Children */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {dict?.childrenLabel || (currentLang === "en" ? "Children" : "Anak-anak")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {dict?.childrenDesc || (currentLang === "en" ? "Ages 2 – 12" : "Usia 2 – 12 tahun")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementChildren}
                  disabled={children <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{children}</span>
                <button
                  type="button"
                  onClick={incrementChildren}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-black transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* 3. Infants */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {dict?.infantsLabel || (currentLang === "en" ? "Infants" : "Bayi")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {dict?.infantsDesc || (currentLang === "en" ? "Under 2" : "Di bawah 2 tahun")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementInfants}
                  disabled={infants <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{infants}</span>
                <button
                  type="button"
                  onClick={incrementInfants}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-black transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            {/* 4. Pets */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {dict?.petsLabel || (currentLang === "en" ? "Pets" : "Hewan Peliharaan")}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {dict?.petsDesc || (currentLang === "en" ? "Bringing a service animal?" : "Membawa hewan pemandu / peliharaan?")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decrementPets}
                  disabled={pets <= 0}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{pets}</span>
                <button
                  type="button"
                  onClick={incrementPets}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:border-black transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear button & Submit Button Dinamis (Tampilkan text "Search" saat opsi aktif) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {(location || checkIn || checkOut || totalGuests > 0) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              title={dict?.clearAll || (currentLang === "en" ? "Clear all" : "Hapus semua")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            onPointerDown={(e) => {
              // Hindari useDismiss dari popover mendahului dan mengabaikan event klik saat popover terbuka
              e.preventDefault()
              handleSearch()
            }}
            onClick={(e) => {
              // Fallback jika diklik melalui keyboard / enter
              handleSearch(e)
            }}
            className={`bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow relative z-20 ${
              isSearchFocused
                ? "px-4 py-2.5"
                : "p-2.5"
            }`}
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
