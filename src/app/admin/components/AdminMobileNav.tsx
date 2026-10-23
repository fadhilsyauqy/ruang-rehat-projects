import React from "react"
import {
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

export interface AdminMobileNavProps {
  activeTab: AdminTabType
  onTabChange: (tab: AdminTabType) => void
  currentLang?: string
  kycPendingCount: number
  pendingPayoutsCount: number
  openDisputesCount: number
  pendingRefundsCount: number
}

export default function AdminMobileNav({
  activeTab,
  onTabChange,
  currentLang = "id",
  kycPendingCount,
  pendingPayoutsCount,
  openDisputesCount,
  pendingRefundsCount,
}: AdminMobileNavProps) {
  return (
    <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800 scrollbar-none">
      <button
        type="button"
        onClick={() => onTabChange("overview")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
          activeTab === "overview"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Overview" : "Ringkasan"}</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("kyc")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
          activeTab === "kyc"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <UserCheck className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Host KYC" : "KYC Host"}</span>
        {kycPendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
            {kycPendingCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("payouts")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
          activeTab === "payouts"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <Banknote className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Payouts" : "Penarikan"}</span>
        {pendingPayoutsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
            {pendingPayoutsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("disputes")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
          activeTab === "disputes"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <Scale className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Disputes" : "Sengketa"}</span>
        {openDisputesCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
            {openDisputesCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("refunds")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
          activeTab === "refunds"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <ReceiptText className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Refunds" : "Refund"}</span>
        {pendingRefundsCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
            {pendingRefundsCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange("bookings")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
          activeTab === "bookings"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Transactions" : "Transaksi"}</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("users")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
          activeTab === "users"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <Users className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Users" : "Pengguna"}</span>
      </button>

      <button
        type="button"
        onClick={() => onTabChange("settings")}
        className={cn(
          "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer",
          activeTab === "settings"
            ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
        )}
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>{currentLang === "en" ? "Settings" : "Pengaturan"}</span>
      </button>
    </div>
  )
}
