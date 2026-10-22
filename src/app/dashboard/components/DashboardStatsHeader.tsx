import React from "react"
import {
  Building2,
  CalendarDays,
  CalendarX,
  Landmark,
  Luggage,
  Clock,
  CheckCircle2,
  XCircle,
  Compass,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import type { Dictionary } from "@/lib/dictionary"
import HostKycBanner from "./HostKycBanner"

export interface DashboardStatsHeaderProps {
  role: string
  currentUser: {
    kycStatus?: string | null
    idCardNumber?: string | null
    [key: string]: unknown
  } | null
  activeTab: "properties" | "bookings" | "availability" | "payouts" | "trips"
  onTabChange: (tab: "properties" | "bookings" | "availability" | "payouts" | "trips") => void
  tripFilter: "ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED"
  onTripFilterChange: (filter: "ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED") => void
  myPropertiesCount: number
  incomingBookingsCount: number
  paidBookingsCount: number
  blockedDatesCount: number
  totalRevenue: number
  hasBankAccount: boolean
  myBookingsCount: number
  upcomingTripsCount: number
  completedTripsCount: number
  pendingTripsCount: number
  cancelledTripsCount: number
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
  onOpenKycModal: () => void
}

interface StatCardProps {
  label: React.ReactNode
  value: React.ReactNode
  subText?: React.ReactNode
  icon: LucideIcon
  isActive: boolean
  onClick: () => void
  colorScheme: "rose" | "blue" | "amber" | "emerald" | "indigo" | "violet"
}

const COLOR_MAP: Record<
  StatCardProps["colorScheme"],
  { activeBorder: string; activeRing: string; activeBg: string; defaultBg: string; defaultText: string }
> = {
  rose: {
    activeBorder: "border-rose-500",
    activeRing: "ring-rose-500/20",
    activeBg: "bg-rose-500 text-white shadow-rose-500/20",
    defaultBg: "bg-rose-50 dark:bg-rose-950/40",
    defaultText: "text-rose-500",
  },
  blue: {
    activeBorder: "border-blue-500",
    activeRing: "ring-blue-500/20",
    activeBg: "bg-blue-600 text-white shadow-blue-500/20",
    defaultBg: "bg-blue-50 dark:bg-blue-950/40",
    defaultText: "text-blue-500",
  },
  amber: {
    activeBorder: "border-amber-500",
    activeRing: "ring-amber-500/20",
    activeBg: "bg-amber-500 text-white shadow-amber-500/20",
    defaultBg: "bg-amber-50 dark:bg-amber-950/40",
    defaultText: "text-amber-500",
  },
  emerald: {
    activeBorder: "border-emerald-500",
    activeRing: "ring-emerald-500/20",
    activeBg: "bg-emerald-600 text-white shadow-emerald-500/20",
    defaultBg: "bg-emerald-50 dark:bg-emerald-950/40",
    defaultText: "text-emerald-500",
  },
  indigo: {
    activeBorder: "border-indigo-500",
    activeRing: "ring-indigo-500/20",
    activeBg: "bg-indigo-600 text-white shadow-indigo-500/20",
    defaultBg: "bg-indigo-50 dark:bg-indigo-950/40",
    defaultText: "text-indigo-500",
  },
  violet: {
    activeBorder: "border-violet-500",
    activeRing: "ring-violet-500/20",
    activeBg: "bg-violet-600 text-white shadow-violet-500/20",
    defaultBg: "bg-violet-50 dark:bg-violet-950/40",
    defaultText: "text-violet-600",
  },
}

function StatCard({ label, value, subText, icon: Icon, isActive, onClick, colorScheme }: StatCardProps) {
  const c = COLOR_MAP[colorScheme]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
        isActive
          ? cn("bg-white dark:bg-gray-900 ring-2 shadow-md", c.activeBorder, c.activeRing)
          : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
      )}
    >
      <div className="space-y-0.5 min-w-0">
        <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
          {label}
        </span>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-gray-100 truncate">{value}</h3>
          {subText && <span className="text-[10px] text-muted-foreground font-medium shrink-0">{subText}</span>}
        </div>
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", isActive ? cn("shadow-md", c.activeBg) : cn(c.defaultBg, c.defaultText, "group-hover:scale-105"))}>
        <Icon className="w-5 h-5" />
      </div>
    </button>
  )
}

export default function DashboardStatsHeader({
  role,
  currentUser,
  activeTab,
  onTabChange,
  tripFilter,
  onTripFilterChange,
  myPropertiesCount,
  incomingBookingsCount,
  paidBookingsCount,
  blockedDatesCount,
  totalRevenue,
  hasBankAccount,
  myBookingsCount,
  upcomingTripsCount,
  completedTripsCount,
  pendingTripsCount,
  cancelledTripsCount,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
  onOpenKycModal,
}: DashboardStatsHeaderProps) {
  return (
    <div className="space-y-4">
      {role === "HOST" && (
        <HostKycBanner
          currentUser={currentUser}
          currentLang={currentLang}
          onOpenKycModal={onOpenKycModal}
        />
      )}

      {role === "HOST" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label={t.statProperties}
            value={myPropertiesCount}
            subText="unit"
            icon={Building2}
            isActive={activeTab === "properties"}
            onClick={() => onTabChange("properties")}
            colorScheme="rose"
          />
          <StatCard
            label={t.tabBookings}
            value={incomingBookingsCount}
            subText={`${paidBookingsCount} Lunas`}
            icon={CalendarDays}
            isActive={activeTab === "bookings"}
            onClick={() => onTabChange("bookings")}
            colorScheme="blue"
          />
          <StatCard
            label={t.tabAvailability}
            value={blockedDatesCount}
            subText="terkunci"
            icon={CalendarX}
            isActive={activeTab === "availability"}
            onClick={() => onTabChange("availability")}
            colorScheme="amber"
          />
          <StatCard
            label={
              <span className="flex items-center gap-1.5">
                <span>{t.tabPayouts}</span>
                {hasBankAccount ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : (
                  <span className="px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500 text-white">Setup</span>
                )}
              </span>
            }
            value={formatPrice(totalRevenue, currentCurrency)}
            icon={Landmark}
            isActive={activeTab === "payouts"}
            onClick={() => onTabChange("payouts")}
            colorScheme="emerald"
          />
          <StatCard
            label={t.tabTrips}
            value={myBookingsCount}
            subText="pesanan"
            icon={Luggage}
            isActive={activeTab === "trips"}
            onClick={() => onTabChange("trips")}
            colorScheme="indigo"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label={currentLang === "en" ? "Upcoming" : "Mendatang"}
            value={upcomingTripsCount}
            subText={currentLang === "en" ? "stays" : "menginap"}
            icon={Luggage}
            isActive={tripFilter === "UPCOMING"}
            onClick={() => onTripFilterChange(tripFilter === "UPCOMING" ? "ALL" : "UPCOMING")}
            colorScheme="blue"
          />
          <StatCard
            label={currentLang === "en" ? "Completed" : "Selesai"}
            value={completedTripsCount}
            subText={currentLang === "en" ? "can review" : "bisa ulas"}
            icon={CheckCircle2}
            isActive={tripFilter === "COMPLETED"}
            onClick={() => onTripFilterChange(tripFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
            colorScheme="emerald"
          />
          <StatCard
            label={currentLang === "en" ? "Pending" : "Menunggu Bayar"}
            value={pendingTripsCount}
            subText={currentLang === "en" ? "60m limit" : "60 menit"}
            icon={Clock}
            isActive={tripFilter === "PENDING"}
            onClick={() => onTripFilterChange(tripFilter === "PENDING" ? "ALL" : "PENDING")}
            colorScheme="amber"
          />
          <StatCard
            label={currentLang === "en" ? "Cancelled" : "Dibatalkan"}
            value={cancelledTripsCount}
            subText={currentLang === "en" ? "refunded" : "riwayat"}
            icon={XCircle}
            isActive={tripFilter === "CANCELLED"}
            onClick={() => onTripFilterChange(tripFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
            colorScheme="rose"
          />
          <StatCard
            label={currentLang === "en" ? "All Trips" : "Semua Pesanan"}
            value={myBookingsCount}
            subText="total"
            icon={Compass}
            isActive={tripFilter === "ALL"}
            onClick={() => onTripFilterChange("ALL")}
            colorScheme="violet"
          />
        </div>
      )}
    </div>
  )
}
