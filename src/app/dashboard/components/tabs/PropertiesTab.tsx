import React, { useState } from "react"
import Link from "next/link"
import {
  Search,
  Building2,
  PlusCircle,
  CheckCircle2,
  Clock,
  CalendarDays,
  MapPin,
  ExternalLink,
  Edit3,
  SearchX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import EmptyState from "@/components/ui/EmptyState"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"
import type { HostPropertyItem } from "@/types"

export interface PropertiesTabProps {
  properties: HostPropertyItem[]
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function PropertiesTab({
  properties,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: PropertiesTabProps) {
  const [propSearch, setPropSearch] = useState("")

  const filteredProperties = properties.filter((p) => {
    const query = propSearch.toLowerCase()
    return (
      p.title?.toLowerCase().includes(query) ||
      p.address?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Property Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPropertyPlaceholder}
            value={propSearch}
            onChange={(e) => setPropSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
          />
        </div>
        <p className="text-xs text-muted-foreground self-start sm:self-center">
          {currentLang === "en"
            ? `Showing ${filteredProperties.length} of ${properties.length} properties`
            : `Menampilkan ${filteredProperties.length} dari ${properties.length} properti`}
        </p>
      </div>

      {filteredProperties.length === 0 ? (
        properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t.noPropertiesFound || "Belum ada properti terdaftar"}
            description={
              currentLang === "en"
                ? "Start hosting your place and get your first bookings."
                : "Mulai sewakan akomodasi Anda dan raih pemesanan pertama."
            }
            actionLabel={t.addProperty}
            actionHref="/properties/new"
          />
        ) : (
          <EmptyState
            icon={SearchX}
            title={
              currentLang === "en"
                ? "No properties match your filter"
                : "Tidak ada properti yang cocok"
            }
            description={
              currentLang === "en"
                ? "Try searching with a different keyword or reset your filter."
                : "Coba cari dengan kata kunci lain atau reset filter pencarian Anda."
            }
            actionLabel={currentLang === "en" ? "Reset Filter" : "Reset Filter"}
            onAction={() => setPropSearch("")}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredProperties.map((p) => {
            const priceVal =
              p.pricePerNight && p.pricePerNight > 0
                ? p.pricePerNight
                : p.price
                ? p.price * 18051
                : 0

            return (
              <div
                key={p.id}
                className="rounded-3xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-42 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={
                      p.imageUrls[0] ||
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600"
                    }
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    {p.isPublished ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        PUBLIK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-600/95 text-white backdrop-blur-md shadow-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        DRAFT (Menunggu KYC)
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-gray-800 dark:text-gray-200 shadow-xs flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-rose-500" />
                    <span>{p.bookings?.length || 0} Pesanan</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-rose-500 transition-colors">
                      <Link href={`/properties/${p.id}`}>{p.title}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 line-clamp-1">
                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{p.address}</span>
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-sm sm:text-base font-black text-gray-900 dark:text-gray-100">
                        {formatPrice(priceVal, currentCurrency)}
                      </span>
                      <span className="text-[10px] text-muted-foreground"> / {t.night}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/properties/${p.id}`}
                        className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Lihat Halaman Publik"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/properties/${p.id}/edit`}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{t.btnEdit}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
