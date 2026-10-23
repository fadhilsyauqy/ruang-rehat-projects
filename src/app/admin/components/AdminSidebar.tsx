import React from "react"
import {
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Banknote,
  Scale,
  ReceiptText,
  Calendar,
  Users,
  Sliders,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminTabType } from "@/types"

export interface AdminSidebarProps {
  activeTab: AdminTabType
  onTabChange: (tab: AdminTabType) => void
  currentLang?: string
  kycPendingCount: number
  pendingPayoutsCount: number
  openDisputesCount: number
  pendingRefundsCount: number
  usdExchangeRate: number
  guestServiceFeePct: number
  hostPlatformFeePct: number
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  currentLang = "id",
  kycPendingCount,
  pendingPayoutsCount,
  openDisputesCount,
  pendingRefundsCount,
  usdExchangeRate,
  guestServiceFeePct,
  hostPlatformFeePct,
}: AdminSidebarProps) {
  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR: Navigation, Quick Snapshot & Controls    */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 sticky top-24 space-y-4">
        {/* Admin Portal Header Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-gray-100 leading-tight">
                {currentLang === "en" ? "Governance Portal" : "Portal Tata Kelola"}
              </h3>
              <p className="text-[11px] text-muted-foreground">Admin Ruang Rehat</p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium">Gateway</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Active
            </span>
          </div>
        </div>

        {/* Vertical Navigation Menu */}
        <nav className="p-3 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Overview" : "Ikhtisar"}
          </div>

          <button
            type="button"
            onClick={() => onTabChange("overview")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Marketplace Overview" : "Ringkasan Marketplace"}
            </span>
          </button>

          <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Audit & Governance" : "Audit & Finansial"}
          </div>

          <button
            type="button"
            onClick={() => onTabChange("kyc")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "kyc"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Host KYC Audit" : "Audit KYC Host"}
            </span>
            {kycPendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
                {kycPendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("payouts")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "payouts"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Payouts & Escrow" : "Audit Penarikan & Escrow"}
            </span>
            {pendingPayoutsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {pendingPayoutsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("disputes")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "disputes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Disputes & Claims" : "Manajemen Sengketa"}
            </span>
            {openDisputesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                {openDisputesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("refunds")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "refunds"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Refunds Queue" : "Antrean Refund"}
            </span>
            {pendingRefundsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {pendingRefundsCount}
              </span>
            )}
          </button>

          <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Directory & Logs" : "Operasional & Pengguna"}
          </div>

          <button
            type="button"
            onClick={() => onTabChange("bookings")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "bookings"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "Transactions & Disputes" : "Audit Transaksi & Batal"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("users")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "User Directory" : "Direktori Pengguna"}
            </span>
          </button>

          <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Governance & Settings" : "Tata Kelola & Sistem"}
          </div>

          <button
            type="button"
            onClick={() => onTabChange("settings")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "settings"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">
              {currentLang === "en" ? "System Settings" : "Pengaturan Sistem"}
            </span>
          </button>
        </nav>

        {/* Platform Health Quick Snapshot */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Standar Waktu</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
              WIB (UTC+7)
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Mata Uang Basis</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              IDR (Rupiah)
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Kurs Acuan USD</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
              Rp {Number(usdExchangeRate).toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Split Fee Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {guestServiceFeePct}% + {hostPlatformFeePct}%
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Pelepasan Escrow</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">
              24 Jam Check-in
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
