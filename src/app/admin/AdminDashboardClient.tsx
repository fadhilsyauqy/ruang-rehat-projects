"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type {
  AdminTabType,
  AdminUserItem,
  AdminBookingItem,
  AdminPayoutItem,
  AdminPropertyItem,
  AdminDisputeItem,
} from "@/types"
import type { Dictionary } from "@/lib/dictionary"
import AdminSidebar from "./components/AdminSidebar"
import AdminMobileNav from "./components/AdminMobileNav"
import OverviewTab from "./components/tabs/OverviewTab"
import KycAuditTab from "./components/tabs/KycAuditTab"
import PayoutsTab from "./components/tabs/PayoutsTab"
import DisputesTab from "./components/tabs/DisputesTab"
import RefundsTab, { type RefundItem } from "./components/tabs/RefundsTab"
import BookingsTab from "./components/tabs/BookingsTab"
import UsersDirectoryTab from "./components/tabs/UsersDirectoryTab"
import SystemSettingsTab, { type SettingData } from "./components/tabs/SystemSettingsTab"

export interface AdminDashboardClientProps {
  initialUsers: AdminUserItem[]
  initialBookings: AdminBookingItem[]
  initialPayouts: AdminPayoutItem[]
  initialProperties: AdminPropertyItem[]
  initialDisputes?: AdminDisputeItem[]
  initialSetting?: SettingData | null
  initialTab?: AdminTabType
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function AdminDashboardClient({
  initialUsers,
  initialBookings,
  initialPayouts,
  initialProperties,
  initialDisputes = [],
  initialSetting = null,
  initialTab = "overview",
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTabType>(initialTab)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [disputesList, setDisputesList] = useState<AdminDisputeItem[]>(
    initialDisputes || []
  )
  const [refundsList, setRefundsList] = useState<RefundItem[]>(() =>
    (initialBookings as RefundItem[]).filter(
      (b) =>
        (b.refundStatus && b.refundStatus !== "NONE") ||
        ((b.refundAmountIdr ?? 0) > 0)
    )
  )
  const [currentSetting, setCurrentSetting] = useState<SettingData | null>(
    initialSetting
  )

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  // Calculations for Platform Overview & Sidebar Badges
  const getBookingTotalIdr = (b: AdminBookingItem) =>
    (b.totalPriceIdr ?? 0) > 0
      ? (b.totalPriceIdr ?? 0)
      : b.totalPrice
      ? Math.round(b.totalPrice * 18051)
      : 0

  const totalGMV = initialBookings
    .filter((b) => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowHeldUSD = initialBookings
    .filter(
      (b) =>
        b.paymentStatus === "PAID" &&
        b.escrowStatus === "HELD" &&
        b.status !== "CANCELLED"
    )
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowReleasedUSD = initialBookings
    .filter(
      (b) =>
        b.paymentStatus === "PAID" &&
        b.escrowStatus === "RELEASED" &&
        b.status !== "CANCELLED"
    )
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowRefundedUSD = initialBookings
    .filter((b) => b.escrowStatus === "REFUNDED_TO_GUEST")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const totalPayoutsDisbursedUSD = initialPayouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingPayoutsUSD = initialPayouts
    .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const hostsCount = initialUsers.filter((u) => u.role === "HOST").length
  const guestsCount = initialUsers.filter((u) => u.role === "GUEST").length
  const kycPendingCount = initialUsers.filter(
    (u) => u.role !== "ADMIN" && u.kycStatus === "PENDING"
  ).length
  const kycVerifiedCount = initialUsers.filter(
    (u) => u.role === "HOST" && u.kycStatus === "VERIFIED"
  ).length

  const pendingPayoutsCount = initialPayouts.filter(
    (p) => p.status === "PENDING"
  ).length
  const openDisputesCount = disputesList.filter(
    (d) => d.status === "OPEN"
  ).length
  const pendingRefundsCount = refundsList.filter(
    (b) => b.refundStatus === "PENDING_ADMIN_TRANSFER"
  ).length

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
      {/* Desktop Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentLang={currentLang}
        kycPendingCount={kycPendingCount}
        pendingPayoutsCount={pendingPayoutsCount}
        openDisputesCount={openDisputesCount}
        pendingRefundsCount={pendingRefundsCount}
        usdExchangeRate={currentSetting?.usdExchangeRate || 18051}
        guestServiceFeePct={currentSetting?.guestServiceFeePct ?? 10.0}
        hostPlatformFeePct={currentSetting?.hostPlatformFeePct ?? 3.0}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full space-y-6">
        {/* Mobile Navigation Tabs */}
        <AdminMobileNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentLang={currentLang}
          kycPendingCount={kycPendingCount}
          pendingPayoutsCount={pendingPayoutsCount}
          openDisputesCount={openDisputesCount}
          pendingRefundsCount={pendingRefundsCount}
        />

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 text-white shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentLang === "en"
                  ? "Super Administrator Access"
                  : "Akses Administrator Utama"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Gateway Active
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                WIB (UTC+7)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentLang === "en"
                ? "Marketplace Audit & Governance"
                : "Tata Kelola & Audit Marketplace"}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              {currentLang === "en"
                ? "Oversee platform financial liquidity, verify host KYC credentials, supervise 24h escrow cycles, and execute audited payouts."
                : "Pantau likuiditas finansial platform, verifikasi kelayakan identitas KYC host, awasi pelepasan escrow 24 jam, serta audit penyaluran dana penarikan."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-semibold cursor-pointer backdrop-blur-md transition-all shadow-sm h-9 px-3.5"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5 mr-1.5",
                  isRefreshing && "animate-spin"
                )}
              />
              {isRefreshing
                ? currentLang === "en"
                  ? "Refreshing..."
                  : "Memuat..."
                : currentLang === "en"
                ? "Refresh Data"
                : "Muat Ulang"}
            </Button>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 rounded-2xl text-xs font-semibold shadow-md shadow-purple-950/40 cursor-pointer h-9 px-4">
                {currentLang === "en" ? "My Account" : "Akun Saya"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab 1: Marketplace Overview */}
        {activeTab === "overview" && (
          <OverviewTab
            initialBookings={initialBookings}
            initialPayouts={initialPayouts}
            initialProperties={initialProperties}
            initialUsers={initialUsers}
            totalGMV={totalGMV}
            escrowHeldUSD={escrowHeldUSD}
            escrowReleasedUSD={escrowReleasedUSD}
            escrowRefundedUSD={escrowRefundedUSD}
            totalPayoutsDisbursedUSD={totalPayoutsDisbursedUSD}
            pendingPayoutsUSD={pendingPayoutsUSD}
            hostsCount={hostsCount}
            guestsCount={guestsCount}
            kycVerifiedCount={kycVerifiedCount}
            onTabChange={setActiveTab}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
          />
        )}

        {/* Tab 2: Host KYC Audit */}
        {activeTab === "kyc" && (
          <KycAuditTab
            initialUsers={initialUsers}
            currentLang={currentLang}
            t={t}
          />
        )}

        {/* Tab 3: Payouts & Escrow */}
        {activeTab === "payouts" && (
          <PayoutsTab
            initialPayouts={initialPayouts}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
          />
        )}

        {/* Tab 4: Disputes & Claims */}
        {activeTab === "disputes" && (
          <DisputesTab
            disputesList={disputesList}
            onDisputeResolved={(updatedDispute) => {
              setDisputesList((prev) =>
                prev.map((d) =>
                  d.id === updatedDispute.id ? { ...d, ...updatedDispute } : d
                )
              )
            }}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
          />
        )}

        {/* Tab 5: Refunds Queue */}
        {activeTab === "refunds" && (
          <RefundsTab
            refundsList={refundsList}
            onRefundConfirmed={(updatedBooking) => {
              setRefundsList((prev) =>
                prev.map((b) =>
                  b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b
                )
              )
            }}
            currentCurrency={currentCurrency}
          />
        )}

        {/* Tab 6: Bookings & Cancellations Audit */}
        {activeTab === "bookings" && (
          <BookingsTab
            initialBookings={initialBookings}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
          />
        )}

        {/* Tab 7: User Directory */}
        {activeTab === "users" && (
          <UsersDirectoryTab
            initialUsers={initialUsers}
            currentLang={currentLang}
          />
        )}

        {/* Tab 8: System Settings */}
        {activeTab === "settings" && (
          <SystemSettingsTab
            initialSetting={currentSetting}
            currentLang={currentLang}
            onSettingUpdated={setCurrentSetting}
          />
        )}
      </main>
    </div>
  )
}
