import React from "react"
import {
  DollarSign,
  Clock,
  CheckCircle2,
  Banknote,
  Building2,
  UserCheck,
  Users,
  Calendar,
  ShieldAlert,
  CreditCard,
  ChevronRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type {
  AdminBookingItem,
  AdminPayoutItem,
  AdminPropertyItem,
  AdminUserItem,
  AdminTabType,
} from "@/types"

export interface OverviewTabProps {
  initialBookings: AdminBookingItem[]
  initialPayouts: AdminPayoutItem[]
  initialProperties: AdminPropertyItem[]
  initialUsers: AdminUserItem[]
  totalGMV: number
  escrowHeldUSD: number
  escrowReleasedUSD: number
  escrowRefundedUSD: number
  totalPayoutsDisbursedUSD: number
  pendingPayoutsUSD: number
  hostsCount: number
  guestsCount: number
  kycVerifiedCount: number
  onTabChange: (tab: AdminTabType) => void
  currentCurrency?: string
  currentLang?: string
}

export default function OverviewTab({
  initialBookings,
  initialPayouts,
  initialProperties,
  initialUsers,
  totalGMV,
  escrowHeldUSD,
  escrowReleasedUSD,
  escrowRefundedUSD,
  totalPayoutsDisbursedUSD,
  pendingPayoutsUSD,
  hostsCount,
  guestsCount,
  kycVerifiedCount,
  onTabChange,
  currentCurrency = "IDR",
  currentLang = "id",
}: OverviewTabProps) {
  const settledBookingsCount = initialBookings.filter(
    (b) => b.paymentStatus === "PAID"
  ).length

  const pendingKycUsers = initialUsers
    .filter(
      (u) =>
        u.role !== "ADMIN" &&
        (u.kycStatus === "PENDING" ||
          (u.role === "HOST" &&
            u.kycStatus === "UNVERIFIED" &&
            Boolean(u.idCardUrl)))
    )
    .slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total GMV */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentLang === "en"
                ? "Platform GMV"
                : "Total Nilai Transaksi (GMV)"}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
            {formatPrice(totalGMV, currentCurrency)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {settledBookingsCount}{" "}
            {currentLang === "en"
              ? "settled transactions"
              : "transaksi sewa berhasil"}
          </p>
        </div>

        {/* Card 2: Escrow Held */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentLang === "en"
                ? "Active Escrow (Held)"
                : "Escrow Ditahan (Held)"}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatPrice(escrowHeldUSD, currentCurrency)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {currentLang === "en"
              ? "Secured until 24h check-in threshold"
              : "Aman di platform s.d 24 jam check-in"}
          </p>
        </div>

        {/* Card 3: Escrow Released */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentLang === "en"
                ? "Escrow Released"
                : "Escrow Siap Cair (Released)"}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {formatPrice(escrowReleasedUSD, currentCurrency)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {currentLang === "en"
              ? "Eligible for host bank withdrawal"
              : "Tersedia ditarik ke rekening host"}
          </p>
        </div>

        {/* Card 4: Disbursed Payouts */}
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              {currentLang === "en"
                ? "Disbursed Payouts"
                : "Dana Berhasil Dicairkan"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatPrice(totalPayoutsDisbursedUSD, currentCurrency)}
          </h3>
          <p className="text-xs text-muted-foreground">
            {pendingPayoutsUSD > 0
              ? `${formatPrice(pendingPayoutsUSD, currentCurrency)} ${
                  currentLang === "en" ? "in review" : "menunggu audit"
                }`
              : currentLang === "en"
              ? "All requests processed"
              : "Semua pengajuan selesai"}
          </p>
        </div>
      </div>

      {/* Secondary Metrics & Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escrow Health Distribution Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                {currentLang === "en"
                  ? "Escrow & Liquidity Composition"
                  : "Komposisi Likuiditas & Escrow Platform"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentLang === "en"
                  ? "Real-time fund custody breakdown"
                  : "Rincian status penyimpanan dana transaksi"}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-gray-500">
              Total: {formatPrice(totalGMV, currentCurrency)}
            </span>
          </div>

          {/* Progress Bar Visualization */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${
                    totalGMV > 0 ? (escrowHeldUSD / totalGMV) * 100 : 0
                  }%`,
                }}
                className="bg-amber-500 transition-all"
                title={`Held: ${formatPrice(escrowHeldUSD, currentCurrency)}`}
              />
              <div
                style={{
                  width: `${
                    totalGMV > 0 ? (escrowReleasedUSD / totalGMV) * 100 : 0
                  }%`,
                }}
                className="bg-blue-500 transition-all"
                title={`Released: ${formatPrice(
                  escrowReleasedUSD,
                  currentCurrency
                )}`}
              />
              <div
                style={{
                  width: `${
                    totalGMV > 0 ? (escrowRefundedUSD / totalGMV) * 100 : 0
                  }%`,
                }}
                className="bg-purple-500 transition-all"
                title={`Refunded: ${formatPrice(
                  escrowRefundedUSD,
                  currentCurrency
                )}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                <p className="font-bold text-amber-800 dark:text-amber-300">
                  HELD (Ditahan)
                </p>
                <p className="text-sm font-black text-amber-900 dark:text-amber-200 mt-0.5">
                  {formatPrice(escrowHeldUSD, currentCurrency)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
                <p className="font-bold text-blue-800 dark:text-blue-300">
                  RELEASED (Dirilis)
                </p>
                <p className="text-sm font-black text-blue-900 dark:text-blue-200 mt-0.5">
                  {formatPrice(escrowReleasedUSD, currentCurrency)}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50">
                <p className="font-bold text-purple-800 dark:text-purple-300">
                  REFUNDED (Tamu)
                </p>
                <p className="text-sm font-black text-purple-900 dark:text-purple-200 mt-0.5">
                  {formatPrice(escrowRefundedUSD, currentCurrency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Demographics Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-100 dark:border-gray-800">
            {currentLang === "en"
              ? "Marketplace Participants"
              : "Partisipan Marketplace"}
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold">
                  {currentLang === "en"
                    ? "Registered Properties"
                    : "Properti Terdaftar"}
                </span>
              </div>
              <span className="text-sm font-black">
                {initialProperties.length} unit{" "}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({initialProperties.filter((p) => p.isPublished).length} Tayang
                  / {initialProperties.filter((p) => !p.isPublished).length}{" "}
                  Draft)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold">
                  {currentLang === "en" ? "Verified Hosts" : "Tuan Rumah (Host)"}
                </span>
              </div>
              <span className="text-sm font-black">
                {hostsCount} ({kycVerifiedCount} KYC)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold">
                  {currentLang === "en" ? "Active Guests" : "Pengguna Tamu"}
                </span>
              </div>
              <span className="text-sm font-black">{guestsCount} user</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold">
                  {currentLang === "en" ? "All-Time Bookings" : "Total Booking"}
                </span>
              </div>
              <span className="text-sm font-black">
                {initialBookings.length} order
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Audit Action Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Queue 1: KYC Pending Attention */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm">
                {currentLang === "en"
                  ? "Host KYC Verification Queue"
                  : "Antrean Verifikasi KYC Host"}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("kyc")}
              className="text-xs text-purple-600 hover:underline font-semibold flex items-center cursor-pointer"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {pendingKycUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {currentLang === "en"
                ? "No pending host verifications."
                : "Tidak ada antrean verifikasi host saat ini."}
            </p>
          ) : (
            <div className="space-y-3">
              {pendingKycUsers.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.image || ""} />
                      <AvatarFallback>
                        {u.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {u.name || u.email}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.phoneNumber || "No phone"} · {u.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                      u.kycStatus === "PENDING"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {u.kycStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue 2: Recent Payout Requests */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <h4 className="font-bold text-sm">
                {currentLang === "en"
                  ? "Recent Host Payouts"
                  : "Riwayat Penarikan Dana Host"}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("payouts")}
              className="text-xs text-purple-600 hover:underline font-semibold flex items-center cursor-pointer"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {initialPayouts.slice(0, 3).length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              {currentLang === "en"
                ? "No payouts recorded yet."
                : "Belum ada riwayat penarikan dana."}
            </p>
          ) : (
            <div className="space-y-3">
              {initialPayouts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                      {p.user?.name || "Host"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.bankName} - {p.accountNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">
                      {formatPrice(p.amount, currentCurrency)}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        p.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "FAILED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
