"use client"

import { useSearchParams } from "next/navigation"
import SearchSubFilterBar from "./SearchSubFilterBar"

export default function NavbarSubFilters({
  currentLang = "id",
  currentCurrency = "IDR",
  t
}: {
  currentLang?: string
  currentCurrency?: string
  t: any
}) {
  const searchParams = useSearchParams()

  const location = searchParams.get("location")
  const checkIn = searchParams.get("checkIn")
  const checkOut = searchParams.get("checkOut")
  const guests = searchParams.get("guests")
  const selected = searchParams.get("selected")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const amenities = searchParams.get("amenities")

  // Tampilkan sub-filter bar hanya ketika pengguna sedang dalam mode eksplorasi wilayah / pencarian
  const isSearchActive = !!(location || checkIn || checkOut || guests || selected || minPrice || maxPrice || amenities)

  if (!isSearchActive) {
    return null
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-3 transition-colors">
      <div className="max-w-[2520px] mx-auto px-4 sm:px-6 xl:px-8 flex justify-center items-center">
        <SearchSubFilterBar
          currentLang={currentLang}
          currentCurrency={currentCurrency}
          t={t}
        />
      </div>
    </div>
  )
}
