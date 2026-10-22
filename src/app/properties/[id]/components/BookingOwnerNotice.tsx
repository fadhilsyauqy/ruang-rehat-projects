import React from "react"
import Link from "next/link"
import { Home, CalendarX, Settings } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"

export interface BookingOwnerNoticeProps {
  propertyId: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function BookingOwnerNotice({
  propertyId,
  currentLang = "id",
  t,
}: BookingOwnerNoticeProps) {
  return (
    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3 text-left">
      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
        <Home className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{t.hostOwnListingNotice}</span>
      </div>
      <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
        {t.hostOwnListingDesc}
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Link
          href={`/dashboard?tab=availability&propertyId=${propertyId}`}
          className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
        >
          <CalendarX className="w-3.5 h-3.5" />
          <span>
            {t.blockDates || (currentLang === "en" ? "Block Dates" : "Blokir Tanggal")}
          </span>
        </Link>
        <Link
          href={`/properties/${propertyId}/edit`}
          className="py-2.5 px-3 rounded-xl bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs font-bold text-center hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{t.editListing}</span>
        </Link>
      </div>
    </div>
  )
}
