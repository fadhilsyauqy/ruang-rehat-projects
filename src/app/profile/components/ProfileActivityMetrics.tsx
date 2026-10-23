"use client"

import Link from "next/link"
import {
  BadgeCheck,
  CreditCard,
  Users,
  Home,
  Luggage,
  Star,
  Heart,
  ShieldCheck
} from "lucide-react"
import type { ProfileUser, AdminStats } from "../types"

interface ProfileActivityMetricsProps {
  user: ProfileUser
  isAdmin: boolean
  isHost: boolean
  adminStats?: AdminStats
  currentLang: string
  t: any
}

export default function ProfileActivityMetrics({
  user,
  isAdmin,
  isHost,
  adminStats,
  currentLang,
  t
}: ProfileActivityMetricsProps) {
  if (isAdmin) {
    return (
      <div className="flex items-center gap-2 sm:gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 overflow-x-auto pb-1 md:pb-0">
        <Link
          href="/admin/kyc"
          className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-purple-400 transition-all group"
          title={currentLang === "en" ? "Pending KYC identity review queue" : "Antrean verifikasi KTP"}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-purple-500">
            <BadgeCheck className="w-3 h-3 text-purple-500 shrink-0" />
            <span>{currentLang === "en" ? "KYC Queue" : "Antrean KYC"}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5 flex items-center justify-center gap-1">
            <span>{adminStats?.pendingKyc ?? 0}</span>
            {(adminStats?.pendingKyc ?? 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            )}
          </div>
        </Link>

        <Link
          href="/admin/payouts"
          className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-emerald-400 transition-all group"
          title={currentLang === "en" ? "Pending host payouts queue" : "Pencairan dana host"}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-emerald-500">
            <CreditCard className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>{currentLang === "en" ? "Payouts" : "Pencairan"}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {adminStats?.pendingPayouts ?? 0}
          </div>
        </Link>

        <Link
          href="/admin"
          className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-indigo-400 transition-all group"
          title={currentLang === "en" ? "Total registered platform users" : "Total pengguna terdaftar"}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-indigo-500">
            <Users className="w-3 h-3 text-indigo-500 shrink-0" />
            <span>{currentLang === "en" ? "Users" : "Pengguna"}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {adminStats?.totalUsers ?? 0}
          </div>
        </Link>

        <Link
          href="/admin"
          className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-rose-400 transition-all group"
          title={currentLang === "en" ? "Total active properties" : "Total listing properti"}
        >
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-rose-500">
            <Home className="w-3 h-3 text-rose-500 shrink-0" />
            <span>{currentLang === "en" ? "Listings" : "Properti"}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {adminStats?.totalProperties ?? 0}
          </div>
        </Link>
      </div>
    )
  }

  if (isHost) {
    return (
      <div className="flex items-center gap-2 sm:gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 overflow-x-auto pb-1 md:pb-0">
        <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[70px] shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            <Home className="w-3 h-3 text-sky-500 shrink-0" />
            <span>{t.statsProperties}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {user.stats.totalProperties}
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[70px] shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            <Luggage className="w-3 h-3 text-rose-500 shrink-0" />
            <span>{t.statsTrips}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {user.stats.totalBookings}
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[70px] shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            <Star className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{t.statsReviews}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {user.stats.totalReviews}
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[70px] shadow-2xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            <Heart className="w-3 h-3 text-rose-500 shrink-0" />
            <span>{t.statsWishlists}</span>
          </div>
          <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
            {user.stats.totalFavorites}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 overflow-x-auto pb-1 md:pb-0">
      <Link
        href="/dashboard?tab=trips"
        className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-rose-400 transition-all group"
      >
        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-rose-500">
          <Luggage className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{currentLang === "en" ? "My Stays" : "Perjalanan"}</span>
        </div>
        <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
          {user.stats.totalBookings}
        </div>
      </Link>

      <Link
        href="/wishlists"
        className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs hover:border-rose-400 transition-all group"
      >
        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 group-hover:text-rose-500">
          <Heart className="w-3 h-3 text-rose-500 shrink-0" />
          <span>{currentLang === "en" ? "Wishlists" : "Favorit"}</span>
        </div>
        <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
          {user.stats.totalFavorites}
        </div>
      </Link>

      <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs">
        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          <Star className="w-3 h-3 text-amber-500 shrink-0" />
          <span>{currentLang === "en" ? "Reviews" : "Ulasan"}</span>
        </div>
        <div className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
          {user.stats.totalReviews}
        </div>
      </div>

      <div className="px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-150 dark:border-gray-800 text-center min-w-[80px] shadow-2xs">
        <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{currentLang === "en" ? "Status" : "Akun"}</span>
        </div>
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
          {currentLang === "en" ? "Active" : "Aktif"}
        </div>
      </div>
    </div>
  )
}
