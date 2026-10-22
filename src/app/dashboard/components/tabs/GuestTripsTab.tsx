import React, { useState } from "react"
import Link from "next/link"
import { Search, Luggage, Compass, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { toCheckOutDateTimeWIB } from "@/lib/date-standards"
import GuestTripCard from "./GuestTripCard"
import GuestTravelerSidebar from "./GuestTravelerSidebar"
import type { Dictionary } from "@/lib/dictionary"
import type { GuestTripBooking } from "@/types"

export interface GuestTripsTabProps {
  myBookings: GuestTripBooking[]
  currentUser: {
    name?: string | null
    email?: string | null
    [key: string]: unknown
  } | null
  userFavorites: Array<{
    id: string
    property?: {
      id: string
      title: string
      address: string
      imageUrls: string[]
      price?: number | null
      pricePerNight?: number | null
    } | null
  }>
  tripFilter: "ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED"
  onTripFilterChange: (
    filter: "ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED"
  ) => void
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function GuestTripsTab({
  myBookings,
  currentUser,
  userFavorites,
  tripFilter,
  onTripFilterChange,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: GuestTripsTabProps) {
  const [tripSearch, setTripSearch] = useState("")
  const nowTime = new Date().getTime()

  const completedTrips = myBookings.filter((b) => {
    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    return (
      b.status === "COMPLETED" ||
      (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && isPastCheckOut)
    )
  })

  const reviewedTripsCount = myBookings.filter(
    (b) => b.reviews && b.reviews.length > 0
  ).length

  const filteredTrips = myBookings.filter((b) => {
    const query = tripSearch.toLowerCase()
    const matchesSearch =
      b.property.title.toLowerCase().includes(query) ||
      b.property.address.toLowerCase().includes(query) ||
      Boolean(b.property.category && b.property.category.toLowerCase().includes(query))

    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    const isCompleted =
      b.status === "COMPLETED" ||
      (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && isPastCheckOut)
    const isUpcoming = b.status !== "CANCELLED" && !isPastCheckOut

    let matchesFilter = true
    if (tripFilter === "UPCOMING") matchesFilter = isUpcoming
    else if (tripFilter === "COMPLETED") matchesFilter = isCompleted
    else if (tripFilter === "PENDING")
      matchesFilter = b.paymentStatus === "PENDING" && b.status !== "CANCELLED"
    else if (tripFilter === "CANCELLED") matchesFilter = b.status === "CANCELLED"

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {/* Bar Kontrol & Filter Pencarian Pesanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
            {t.myTrips ||
              (currentLang === "en"
                ? "My Stays & Bookings"
                : "Riwayat & Jadwal Perjalanan")}
          </h2>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-muted-foreground ml-1">
            {filteredTrips.length} {currentLang === "en" ? "of" : "dari"}{" "}
            {myBookings.length}
          </span>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                currentLang === "en"
                  ? "Search property or city..."
                  : "Cari nama vila, kota..."
              }
              value={tripSearch}
              onChange={(e) => setTripSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            {tripSearch && (
              <button
                type="button"
                onClick={() => setTripSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: "ALL", label: currentLang === "en" ? "All" : "Semua" },
                {
                  id: "UPCOMING",
                  label: currentLang === "en" ? "Upcoming" : "Mendatang",
                },
                {
                  id: "COMPLETED",
                  label: currentLang === "en" ? "Completed" : "Selesai",
                },
                {
                  id: "PENDING",
                  label: currentLang === "en" ? "Pending" : "Menunggu Bayar",
                },
                {
                  id: "CANCELLED",
                  label: currentLang === "en" ? "Cancelled" : "Dibatalkan",
                },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTripFilterChange(item.id)}
                className={cn(
                  "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  tripFilter === item.id
                    ? item.id === "UPCOMING"
                      ? "bg-blue-600 text-white shadow-xs"
                      : item.id === "COMPLETED"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : item.id === "PENDING"
                      ? "bg-amber-500 text-white shadow-xs"
                      : item.id === "CANCELLED"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Trip cards (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {filteredTrips.length === 0 ? (
            myBookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30">
                <Luggage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {t.noTripsBooked ||
                    (currentLang === "en"
                      ? "No trips booked yet"
                      : "Belum ada perjalanan yang dipesan")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-5">
                  {t.exploreDesc ||
                    (currentLang === "en"
                      ? "Find your perfect stay based on location."
                      : "Cari destinasi impian Anda dan nikmati penginapan berkualitas.")}
                </p>
                <Link
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  )}
                >
                  {t.startExplore ||
                    (currentLang === "en"
                      ? "Start Exploring"
                      : "Mulai Eksplorasi Sekarang")}
                </Link>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                <Compass className="w-10 h-10 text-gray-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "No trips match the selected filter"
                      : "Tidak ada pesanan yang sesuai dengan filter"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "en"
                      ? "Try clearing search keywords or selecting another status category."
                      : "Coba bersihkan kata kunci pencarian atau pilih kategori status lain."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onTripFilterChange("ALL")
                    setTripSearch("")
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {currentLang === "en"
                      ? "Reset Filters"
                      : "Reset Filter & Pencarian"}
                  </span>
                </button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              {filteredTrips.map((b) => (
                <GuestTripCard
                  key={b.id}
                  booking={b}
                  nowTime={nowTime}
                  currentCurrency={currentCurrency}
                  currentLang={currentLang}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Traveler Sidebar (4 Cols) */}
        <div className="lg:col-span-4">
          <GuestTravelerSidebar
            currentUser={currentUser}
            completedTripsCount={completedTrips.length}
            reviewedTripsCount={reviewedTripsCount}
            userFavorites={userFavorites}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
          />
        </div>
      </div>
    </div>
  )
}
