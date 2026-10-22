"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Banknote,
  ShieldAlert,
  UserCheck,
  ZoomIn,
  Eye,
  Scale,
  ReceiptText,
  Copy,
  Check,
  Sliders,
  RotateCcw,
  Percent,
  Coins,
  Info,
  Save,
  Loader2,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatPrice } from "@/lib/format"
import { formatWibDate } from "@/lib/date-standards"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface AdminDashboardClientProps {
  initialUsers: any[]
  initialBookings: any[]
  initialPayouts: any[]
  initialProperties: any[]
  initialDisputes?: any[]
  initialSetting?: any
  initialTab?: "overview" | "kyc" | "payouts" | "disputes" | "refunds" | "bookings" | "users" | "settings"
  currentCurrency?: string
  currentLang?: string
  t: any
}

export default function AdminDashboardClient({
  initialUsers,
  initialBookings,
  initialPayouts,
  initialProperties,
  initialDisputes = [],
  initialSetting,
  initialTab = "overview",
  currentCurrency = "IDR",
  currentLang = "id",
  t
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"overview" | "kyc" | "payouts" | "disputes" | "refunds" | "bookings" | "users" | "settings">(initialTab)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Filter & Search states
  const [userSearch, setUserSearch] = useState("")
  const [kycRoleFilter, setKycRoleFilter] = useState<"AUDIT_QUEUE" | "HOST_ONLY" | "ALL_USERS">("AUDIT_QUEUE")
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL")
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL")
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL")
  const [disputeFilter, setDisputeFilter] = useState("ALL")
  const [refundFilter, setRefundFilter] = useState("ALL")
  
  // Dialog modal states
  const [rejectReason, setRejectReason] = useState("")
  const [selectedKycUser, setSelectedKycUser] = useState<any | null>(null)
  const [previewKtpUrl, setPreviewKtpUrl] = useState<string | null>(null)

  // Disputes & Refunds states
  const [disputesList, setDisputesList] = useState<any[]>(initialDisputes || [])
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null)
  const [disputeResolution, setDisputeResolution] = useState<"RESOLVED_RELEASE_TO_HOST" | "RESOLVED_FULL_REFUND" | "RESOLVED_PARTIAL_REFUND" | "REJECTED">("RESOLVED_RELEASE_TO_HOST")
  const [disputeAdminNotes, setDisputeAdminNotes] = useState("")
  const [disputeRefundApprovedIdr, setDisputeRefundApprovedIdr] = useState<number>(0)
  const [disputePayoutApprovedIdr, setDisputePayoutApprovedIdr] = useState<number>(0)
  const [previewEvidenceUrl, setPreviewEvidenceUrl] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }

  const [refundsList, setRefundsList] = useState<any[]>(() => 
    initialBookings.filter(b => (b.refundStatus && b.refundStatus !== "NONE") || (b.refundAmountIdr && b.refundAmountIdr > 0))
  )
  const [selectedRefundBooking, setSelectedRefundBooking] = useState<any | null>(null)
  const [refundProofUrl, setRefundProofUrl] = useState("")
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null)

  // System Settings state
  const [setting, setSetting] = useState({
    usdExchangeRate: initialSetting?.usdExchangeRate || 18051,
    guestServiceFeePct: initialSetting?.guestServiceFeePct ?? 10.0,
    hostPlatformFeePct: initialSetting?.hostPlatformFeePct ?? 3.0,
    hostCancelPenaltyIdr: initialSetting?.hostCancelPenaltyIdr || 250000,
    maxStayNights: initialSetting?.maxStayNights || 28,
    updatedAt: initialSetting?.updatedAt || new Date().toISOString(),
  })
  const [isSavingSetting, setIsSavingSetting] = useState(false)
  const [settingSuccessMsg, setSettingSuccessMsg] = useState("")
  const [settingErrorMsg, setSettingErrorMsg] = useState("")
  const [simulatedBasePrice, setSimulatedBasePrice] = useState<number>(1000000)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSetting(true)
    setSettingSuccessMsg("")
    setSettingErrorMsg("")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan")
      setSetting(data.settings)
      setSettingSuccessMsg(currentLang === "en" ? "System settings updated successfully!" : "Pengaturan sistem berhasil disimpan!")
      router.refresh()
    } catch (err: any) {
      setSettingErrorMsg(err.message)
    } finally {
      setIsSavingSetting(false)
    }
  }

  const handleResetDefaultSettings = () => {
    if (!confirm(currentLang === "en" ? "Reset all parameters to system defaults?" : "Kembalikan semua parameter ke nilai standar default sistem?")) return
    setSetting({
      usdExchangeRate: 18051,
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
      updatedAt: new Date().toISOString(),
    })
    setSettingSuccessMsg("")
    setSettingErrorMsg("")
  }

  // Calculations for Marketplace Health (Single Source of Truth IDR)
  const getBookingTotalIdr = (b: any) => b.totalPriceIdr || (b.totalPrice ? Math.round(b.totalPrice * 18051) : 0)

  const totalGMV = initialBookings
    .filter(b => b.paymentStatus === "PAID")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowHeldUSD = initialBookings
    .filter(b => b.paymentStatus === "PAID" && b.escrowStatus === "HELD" && b.status !== "CANCELLED")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowReleasedUSD = initialBookings
    .filter(b => b.paymentStatus === "PAID" && b.escrowStatus === "RELEASED" && b.status !== "CANCELLED")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const escrowRefundedUSD = initialBookings
    .filter(b => b.escrowStatus === "REFUNDED_TO_GUEST")
    .reduce((sum, b) => sum + getBookingTotalIdr(b), 0)

  const totalPayoutsDisbursedUSD = initialPayouts
    .filter(p => p.status === "COMPLETED")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const pendingPayoutsUSD = initialPayouts
    .filter(p => p.status === "PENDING" || p.status === "PROCESSING")
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const hostsCount = initialUsers.filter(u => u.role === "HOST").length
  const guestsCount = initialUsers.filter(u => u.role === "GUEST").length
  const kycPendingCount = initialUsers.filter(u => u.role !== "ADMIN" && u.kycStatus === "PENDING").length
  const kycVerifiedCount = initialUsers.filter(u => u.role === "HOST" && u.kycStatus === "VERIFIED").length

  // Handlers for KYC
  const handleUpdateKyc = async (userId: string, status: "VERIFIED" | "REJECTED", notes?: string) => {
    setLoadingAction(`kyc-${userId}`)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status KYC")
      setSelectedKycUser(null)
      setRejectReason("")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handlers for Payouts
  const handleUpdatePayout = async (payoutId: string, status: "COMPLETED" | "FAILED" | "PROCESSING", notes?: string) => {
    setLoadingAction(`payout-${payoutId}`)
    try {
      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status payout")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Handlers for User Role Update
  const handleUpdateRole = async (userId: string, newRole: "GUEST" | "HOST" | "ADMIN") => {
    if (!confirm(currentLang === "en" ? `Change role to ${newRole}?` : `Ubah role akun ini menjadi ${newRole}?`)) return
    setLoadingAction(`role-${userId}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const openDisputesCount = disputesList.filter(d => d.status === "OPEN").length
  const pendingRefundsCount = refundsList.filter(b => b.refundStatus === "PENDING_ADMIN_TRANSFER").length

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispute) return
    setLoadingAction(`dispute-${selectedDispute.id}`)
    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: disputeResolution,
          adminNotes: disputeAdminNotes.trim(),
          refundApprovedIdr: disputeResolution === "RESOLVED_PARTIAL_REFUND" ? Number(disputeRefundApprovedIdr) : undefined,
          payoutApprovedIdr: disputeResolution === "RESOLVED_PARTIAL_REFUND" ? Number(disputePayoutApprovedIdr) : undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses resolusi sengketa")

      setDisputesList(prev => prev.map(d => d.id === selectedDispute.id ? { ...d, ...data.dispute } : d))
      setSelectedDispute(null)
      setDisputeAdminNotes("")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRefundBooking) return
    setLoadingAction(`refund-${selectedRefundBooking.id}`)
    try {
      const res = await fetch(`/api/admin/refunds/${selectedRefundBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          refundProofUrl: refundProofUrl.trim() || undefined
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengonfirmasi pengembalian dana")

      setRefundsList(prev => prev.map(b => b.id === selectedRefundBooking.id ? { ...b, refundStatus: "COMPLETED", refundProofUrl: refundProofUrl.trim() || null, refundedAt: new Date().toISOString() } : b))
      setSelectedRefundBooking(null)
      setRefundProofUrl("")
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAcc(id)
    setTimeout(() => setCopiedAcc(null), 2000)
  }

  // Filtered lists
  const filteredKycUsers = initialUsers.filter(u => {
    // Exclude ADMIN accounts from Host KYC audit
    if (u.role === "ADMIN") return false

    // Target group filter
    if (kycRoleFilter === "HOST_ONLY" && u.role !== "HOST") return false
    if (kycRoleFilter === "AUDIT_QUEUE") {
      const isHost = u.role === "HOST"
      const hasSubmitted = u.kycStatus === "PENDING" || Boolean(u.idCardUrl)
      if (!isHost && !hasSubmitted) return false
    }

    // Status filter
    if (kycStatusFilter !== "ALL" && u.kycStatus !== kycStatusFilter) return false

    // Search query
    const q = userSearch.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.idCardNumber?.toLowerCase().includes(q)
    )
  })

  const filteredPayouts = initialPayouts.filter(p => {
    if (payoutStatusFilter !== "ALL" && p.status !== payoutStatusFilter) return false
    const q = userSearch.toLowerCase()
    return (
      p.user?.name?.toLowerCase().includes(q) ||
      p.user?.email?.toLowerCase().includes(q) ||
      p.bankName?.toLowerCase().includes(q) ||
      p.accountNumber?.toLowerCase().includes(q)
    )
  })

  const filteredBookings = initialBookings.filter(b => {
    if (bookingStatusFilter !== "ALL" && b.paymentStatus !== bookingStatusFilter) return false
    const q = userSearch.toLowerCase()
    return (
      b.id?.toLowerCase().includes(q) ||
      b.property?.title?.toLowerCase().includes(q) ||
      b.guest?.name?.toLowerCase().includes(q) ||
      b.guest?.email?.toLowerCase().includes(q)
    )
  })

  const filteredDisputes = disputesList.filter(d => {
    if (disputeFilter !== "ALL" && d.status !== disputeFilter) return false
    const q = userSearch.toLowerCase()
    return (
      d.id?.toLowerCase().includes(q) ||
      d.bookingId?.toLowerCase().includes(q) ||
      d.booking?.property?.title?.toLowerCase().includes(q) ||
      (d.booking?.guest?.name || d.reporter?.name)?.toLowerCase().includes(q) ||
      (d.reasonCategory || d.reason)?.toLowerCase().includes(q)
    )
  })

  const filteredRefunds = refundsList.filter(b => {
    if (refundFilter !== "ALL" && b.refundStatus !== refundFilter) return false
    const q = userSearch.toLowerCase()
    return (
      b.id?.toLowerCase().includes(q) ||
      b.property?.title?.toLowerCase().includes(q) ||
      b.refundBankName?.toLowerCase().includes(q) ||
      b.refundAccountNumber?.toLowerCase().includes(q) ||
      b.refundAccountHolder?.toLowerCase().includes(q) ||
      b.guest?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
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
            onClick={() => setActiveTab("overview")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "overview"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Marketplace Overview" : "Ringkasan Marketplace"}</span>
          </button>

          <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Audit & Governance" : "Audit & Finansial"}
          </div>

          <button
            onClick={() => setActiveTab("kyc")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "kyc"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Host KYC Audit" : "Audit KYC Host"}</span>
            {kycPendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
                {kycPendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "payouts"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Banknote className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Payouts & Escrow" : "Audit Penarikan & Escrow"}</span>
            {initialPayouts.filter(p => p.status === "PENDING").length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {initialPayouts.filter(p => p.status === "PENDING").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("disputes")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "disputes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Scale className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Disputes & Claims" : "Manajemen Sengketa"}</span>
            {openDisputesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                {openDisputesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("refunds")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer relative",
              activeTab === "refunds"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <ReceiptText className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Refunds Queue" : "Antrean Refund"}</span>
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
            onClick={() => setActiveTab("bookings")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "bookings"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "Transactions & Disputes" : "Audit Transaksi & Batal"}</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "users"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "User Directory" : "Direktori Pengguna"}</span>
          </button>

          <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">
            {currentLang === "en" ? "Governance & Settings" : "Tata Kelola & Sistem"}
          </div>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-3 cursor-pointer",
              activeTab === "settings"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left font-semibold">{currentLang === "en" ? "System Settings" : "Pengaturan Sistem"}</span>
          </button>
        </nav>

        {/* Platform Health Quick Snapshot */}
        <div className="p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Standar Waktu</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">WIB (UTC+7)</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Mata Uang Basis</span>
            <span className="font-bold text-gray-900 dark:text-gray-100">IDR (Rupiah)</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Kurs Acuan USD</span>
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100">Rp {Number(setting.usdExchangeRate).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Split Fee Rate</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{setting.guestServiceFeePct}% + {setting.hostPlatformFeePct}%</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-[11px]">
            <span>Pelepasan Escrow</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">24 Jam Check-in</span>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE: Mobile Nav, Top Banner & Active Content   */}
      {/* ========================================================= */}
      <main className="flex-1 w-full min-w-0 space-y-6">
        {/* Mobile Navigation Tabs (Shown on small screens only) */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800 scrollbar-none">
          <button
            onClick={() => setActiveTab("overview")}
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
            onClick={() => setActiveTab("kyc")}
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
            onClick={() => setActiveTab("payouts")}
            className={cn(
              "px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer relative",
              activeTab === "payouts"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
            )}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>{currentLang === "en" ? "Payouts" : "Penarikan"}</span>
            {initialPayouts.filter(p => p.status === "PENDING").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                {initialPayouts.filter(p => p.status === "PENDING").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("disputes")}
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
            onClick={() => setActiveTab("refunds")}
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
            onClick={() => setActiveTab("bookings")}
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
            onClick={() => setActiveTab("users")}
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
            onClick={() => setActiveTab("settings")}
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

        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 text-white shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentLang === "en" ? "Super Administrator Access" : "Akses Administrator Utama"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live Gateway Active
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                WIB (UTC+7)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentLang === "en" ? "Marketplace Audit & Governance" : "Tata Kelola & Audit Marketplace"}
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
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing && "animate-spin")} />
              {isRefreshing 
                ? (currentLang === "en" ? "Refreshing..." : "Memuat...") 
                : (currentLang === "en" ? "Refresh Data" : "Muat Ulang")}
            </Button>
            <Link href="/dashboard">
              <Button className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/30 rounded-2xl text-xs font-semibold shadow-md shadow-purple-950/40 cursor-pointer h-9 px-4">
                {currentLang === "en" ? "My Account" : "Akun Saya"}
              </Button>
            </Link>
          </div>
        </div>

      {/* ========================================================= */}
      {/* TAB 1: MARKETPLACE OVERVIEW                               */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total GMV */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{currentLang === "en" ? "Platform GMV" : "Total Nilai Transaksi (GMV)"}</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                {formatPrice(totalGMV, currentCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {initialBookings.filter(b => b.paymentStatus === "PAID").length} {currentLang === "en" ? "settled transactions" : "transaksi sewa berhasil"}
              </p>
            </div>

            {/* Card 2: Escrow Held */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{currentLang === "en" ? "Active Escrow (Held)" : "Escrow Ditahan (Held)"}</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatPrice(escrowHeldUSD, currentCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentLang === "en" ? "Secured until 24h check-in threshold" : "Aman di platform s.d 24 jam check-in"}
              </p>
            </div>

            {/* Card 3: Escrow Released */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{currentLang === "en" ? "Escrow Released" : "Escrow Siap Cair (Released)"}</span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {formatPrice(escrowReleasedUSD, currentCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentLang === "en" ? "Eligible for host bank withdrawal" : "Tersedia ditarik ke rekening host"}
              </p>
            </div>

            {/* Card 4: Disbursed Payouts */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">{currentLang === "en" ? "Disbursed Payouts" : "Dana Berhasil Dicairkan"}</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatPrice(totalPayoutsDisbursedUSD, currentCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pendingPayoutsUSD > 0 
                  ? `${formatPrice(pendingPayoutsUSD, currentCurrency)} ${currentLang === "en" ? "in review" : "menunggu audit"}` 
                  : (currentLang === "en" ? "All requests processed" : "Semua pengajuan selesai")}
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
                    {currentLang === "en" ? "Escrow & Liquidity Composition" : "Komposisi Likuiditas & Escrow Platform"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {currentLang === "en" ? "Real-time fund custody breakdown" : "Rincian status penyimpanan dana transaksi"}
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
                    style={{ width: `${totalGMV > 0 ? (escrowHeldUSD / totalGMV) * 100 : 0}%` }} 
                    className="bg-amber-500 transition-all" 
                    title={`Held: ${formatPrice(escrowHeldUSD, currentCurrency)}`}
                  />
                  <div 
                    style={{ width: `${totalGMV > 0 ? (escrowReleasedUSD / totalGMV) * 100 : 0}%` }} 
                    className="bg-blue-500 transition-all" 
                    title={`Released: ${formatPrice(escrowReleasedUSD, currentCurrency)}`}
                  />
                  <div 
                    style={{ width: `${totalGMV > 0 ? (escrowRefundedUSD / totalGMV) * 100 : 0}%` }} 
                    className="bg-purple-500 transition-all" 
                    title={`Refunded: ${formatPrice(escrowRefundedUSD, currentCurrency)}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50">
                    <p className="font-bold text-amber-800 dark:text-amber-300">HELD (Ditahan)</p>
                    <p className="text-sm font-black text-amber-900 dark:text-amber-200 mt-0.5">{formatPrice(escrowHeldUSD, currentCurrency)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50">
                    <p className="font-bold text-blue-800 dark:text-blue-300">RELEASED (Dirilis)</p>
                    <p className="text-sm font-black text-blue-900 dark:text-blue-200 mt-0.5">{formatPrice(escrowReleasedUSD, currentCurrency)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50">
                    <p className="font-bold text-purple-800 dark:text-purple-300">REFUNDED (Tamu)</p>
                    <p className="text-sm font-black text-purple-900 dark:text-purple-200 mt-0.5">{formatPrice(escrowRefundedUSD, currentCurrency)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Demographics Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-100 dark:border-gray-800">
                {currentLang === "en" ? "Marketplace Participants" : "Partisipan Marketplace"}
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-semibold">{currentLang === "en" ? "Registered Properties" : "Properti Terdaftar"}</span>
                  </div>
                  <span className="text-sm font-black">
                    {initialProperties.length} unit 
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({initialProperties.filter(p => p.isPublished).length} Tayang / {initialProperties.filter(p => !p.isPublished).length} Draft)
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold">{currentLang === "en" ? "Verified Hosts" : "Tuan Rumah (Host)"}</span>
                  </div>
                  <span className="text-sm font-black">{hostsCount} ({kycVerifiedCount} KYC)</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold">{currentLang === "en" ? "Active Guests" : "Pengguna Tamu"}</span>
                  </div>
                  <span className="text-sm font-black">{guestsCount} user</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-semibold">{currentLang === "en" ? "All-Time Bookings" : "Total Booking"}</span>
                  </div>
                  <span className="text-sm font-black">{initialBookings.length} order</span>
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
                  <h4 className="font-bold text-sm">{currentLang === "en" ? "Host KYC Verification Queue" : "Antrean Verifikasi KYC Host"}</h4>
                </div>
                <button onClick={() => setActiveTab("kyc")} className="text-xs text-purple-600 hover:underline font-semibold flex items-center">
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {initialUsers.filter(u => u.role !== "ADMIN" && (u.kycStatus === "PENDING" || (u.role === "HOST" && u.kycStatus === "UNVERIFIED" && Boolean(u.idCardUrl)))).slice(0, 3).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">{currentLang === "en" ? "No pending host verifications." : "Tidak ada antrean verifikasi host saat ini."}</p>
              ) : (
                <div className="space-y-3">
                  {initialUsers.filter(u => u.role !== "ADMIN" && (u.kycStatus === "PENDING" || (u.role === "HOST" && u.kycStatus === "UNVERIFIED" && Boolean(u.idCardUrl)))).slice(0, 3).map(u => (
                    <div key={u.id} className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={u.image || ""} />
                          <AvatarFallback>{u.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{u.name || u.email}</p>
                          <p className="text-[11px] text-muted-foreground">{u.phoneNumber || "No phone"} · {u.role}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                        u.kycStatus === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"
                      )}>
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
                  <h4 className="font-bold text-sm">{currentLang === "en" ? "Recent Host Payouts" : "Riwayat Penarikan Dana Host"}</h4>
                </div>
                <button onClick={() => setActiveTab("payouts")} className="text-xs text-purple-600 hover:underline font-semibold flex items-center">
                  Lihat Semua <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              {initialPayouts.slice(0, 3).length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">{currentLang === "en" ? "No payouts recorded yet." : "Belum ada riwayat penarikan dana."}</p>
              ) : (
                <div className="space-y-3">
                  {initialPayouts.slice(0, 3).map(p => (
                    <div key={p.id} className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{p.user?.name || "Host"}</p>
                        <p className="text-[11px] text-muted-foreground">{p.bankName} - {p.accountNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black">{formatPrice(p.amount, currentCurrency)}</p>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                          p.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : p.status === "FAILED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        )}>
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: AUDIT KYC HOST                                     */}
      {/* ========================================================= */}
      {activeTab === "kyc" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={currentLang === "en" ? "Search host name, email, phone, NIK..." : "Cari nama host, email, telp, NIK..."}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{currentLang === "en" ? "Scope:" : "Kategori:"}</span>
                <select
                  value={kycRoleFilter}
                  onChange={e => setKycRoleFilter(e.target.value as any)}
                  className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
                >
                  <option value="AUDIT_QUEUE">{currentLang === "en" ? "Audit Queue & Hosts (Recommended)" : "Antrean Audit & Host (Rekomendasi)"}</option>
                  <option value="HOST_ONLY">{currentLang === "en" ? "Hosts Only" : "Hanya Akun Host"}</option>
                  <option value="ALL_USERS">{currentLang === "en" ? "All Non-Admin Users" : "Semua Pengguna"}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground shrink-0">{currentLang === "en" ? "Status:" : "Status KYC:"}</span>
                <select
                  value={kycStatusFilter}
                  onChange={e => setKycStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
                >
                  <option value="ALL">{currentLang === "en" ? "All Statuses" : "Semua Status"}</option>
                  <option value="PENDING">{currentLang === "en" ? "PENDING (Needs Audit)" : "PENDING (Menunggu Audit)"}</option>
                  <option value="UNVERIFIED">{currentLang === "en" ? "UNVERIFIED (No ID)" : "UNVERIFIED (Belum Ajukan)"}</option>
                  <option value="VERIFIED">{currentLang === "en" ? "VERIFIED (Approved)" : "VERIFIED (Disetujui)"}</option>
                  <option value="REJECTED">{currentLang === "en" ? "REJECTED (Denied)" : "REJECTED (Ditolak)"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* List of KYC Users */}
          <div className="space-y-4">
            {filteredKycUsers.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
                Tidak ada pengguna yang sesuai dengan kriteria filter KYC.
              </div>
            ) : (
              filteredKycUsers.map(user => {
                const nameMatchesBank = user.bankAccount?.accountHolder && user.name 
                  ? user.bankAccount.accountHolder.trim().toLowerCase() === user.name.trim().toLowerCase()
                  : true

                return (
                  <div 
                    key={user.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6"
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                      <Avatar className="w-14 h-14 rounded-2xl shrink-0 border border-gray-200 dark:border-gray-700">
                        <AvatarImage src={user.image || ""} />
                        <AvatarFallback className="font-bold text-base">{user.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">{user.name || "Tanpa Nama"}</h4>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            user.kycStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                            user.kycStatus === "PENDING" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse" :
                            user.kycStatus === "REJECTED" ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          )}>
                            KYC: {user.kycStatus}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            {user.role}
                          </span>
                          {user.role === "GUEST" && (user.kycStatus === "PENDING" || user.idCardUrl) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                              {currentLang === "en" ? "Prospective Host" : "Calon Host"}
                            </span>
                          )}
                        </div>

                        {/* NIK & Legal Identitas */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                            NIK: {user.idCardNumber || <span className="text-muted-foreground italic font-sans font-normal">Belum diisi</span>}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> {user.phoneNumber || "-"}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 text-gray-400" /> {user.email}
                          </span>
                        </div>

                        {/* Alamat Domisili */}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{user.address || "Belum ada alamat domisili terdaftar"}</span>
                        </p>

                        {/* Bank Account Consistency Check */}
                        {user.bankAccount && (
                          <div className="pt-1">
                            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>Bank {user.bankAccount.bankName}: <strong>{user.bankAccount.accountNumber}</strong> a.n <strong>{user.bankAccount.accountHolder}</strong></span>
                                </span>
                                {nameMatchesBank ? (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Nama Akun & Rekening Cocok
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Periksa: Nama Akun & Rekening Berbeda
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reject Reason History */}
                        {user.kycRejectReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Catatan Penolakan Terakhir: </span>
                              <span>&ldquo;{user.kycRejectReason}&rdquo;</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dokumen KTP Preview Thumbnail */}
                    <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-4 border-t xl:border-t-0 pt-4 xl:pt-0 border-gray-100 dark:border-gray-800">
                      {user.idCardUrl ? (
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => setPreviewKtpUrl(user.idCardUrl)}
                            className="relative w-28 h-20 rounded-2xl overflow-hidden border-2 border-purple-300 dark:border-purple-800 bg-gray-100 dark:bg-gray-800 cursor-pointer group shadow-xs hover:border-purple-500 transition-all"
                            title="Klik untuk memperbesar dokumen KTP"
                          >
                            <img 
                              src={user.idCardUrl} 
                              alt="Dokumen KTP" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <ZoomIn className="w-5 h-5 drop-shadow-md" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                              Dokumen KTP
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewKtpUrl(user.idCardUrl)}
                              className="text-[10px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              Pratinjau HD
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{currentLang === "en" ? "No ID uploaded yet" : "Belum unggah foto KTP"}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateKyc(user.id, "VERIFIED")}
                          disabled={loadingAction === `kyc-${user.id}` || user.kycStatus === "VERIFIED" || !user.idCardUrl}
                          title={
                            !user.idCardUrl 
                              ? (currentLang === "en" ? "Cannot approve: ID document not uploaded" : "Tidak dapat menyetujui: Dokumen KTP belum diunggah")
                              : user.kycStatus === "VERIFIED"
                              ? (currentLang === "en" ? "Already verified" : "Akun sudah terverifikasi")
                              : (currentLang === "en" ? "Approve KYC and publish listings" : "Setujui verifikasi identitas dan publikasikan listing")
                          }
                          className={cn(
                            "rounded-xl text-xs font-semibold h-9 shadow-sm transition-all",
                            user.kycStatus === "VERIFIED" 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-not-allowed opacity-90"
                              : !user.idCardUrl
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {user.kycStatus === "VERIFIED"
                            ? (currentLang === "en" ? "Verified" : "Terverifikasi")
                            : (currentLang === "en" ? "Approve & Publish" : "Setujui & Publikasikan")}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedKycUser(user)
                            setRejectReason("")
                          }}
                          disabled={loadingAction === `kyc-${user.id}` || user.kycStatus === "REJECTED" || (!user.idCardUrl && user.kycStatus === "UNVERIFIED")}
                          title={
                            !user.idCardUrl && user.kycStatus === "UNVERIFIED"
                              ? (currentLang === "en" ? "User has not submitted KYC" : "Pengguna belum mengajukan dokumen KYC")
                              : user.kycStatus === "REJECTED"
                              ? (currentLang === "en" ? "Already rejected" : "Pengajuan sebelumnya sudah ditolak")
                              : (currentLang === "en" ? "Reject KYC submission" : "Tolak pengajuan KYC dengan catatan alasan")
                          }
                          className={cn(
                            "rounded-xl text-xs font-semibold h-9 transition-all",
                            user.kycStatus === "REJECTED"
                              ? "border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 cursor-not-allowed opacity-90"
                              : (!user.idCardUrl && user.kycStatus === "UNVERIFIED")
                              ? "border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                              : "border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          )}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          {user.kycStatus === "REJECTED"
                            ? (currentLang === "en" ? "Rejected" : "Ditolak")
                            : (currentLang === "en" ? "Reject" : "Tolak")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Modal Penolakan KYC */}
          <Dialog open={!!selectedKycUser} onOpenChange={open => !open && setSelectedKycUser(null)}>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>{currentLang === "en" ? "Reject Host KYC Verification" : "Tolak Verifikasi KYC Host"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Beri tahu alasan penolakan kepada <strong>{selectedKycUser?.name || selectedKycUser?.email}</strong> agar host dapat memperbaiki dokumen:
                </p>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Contoh: Foto KTP buram, nama pemilik rekening tidak sesuai identitas resmi, atau NIK tidak valid..."
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs focus:outline-none focus:border-purple-500"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setSelectedKycUser(null)} className="rounded-xl text-xs">
                    {t.cancel}
                  </Button>
                  <Button
                    onClick={() => handleUpdateKyc(selectedKycUser.id, "REJECTED", rejectReason)}
                    disabled={loadingAction === `kyc-${selectedKycUser?.id}`}
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                  >
                    {currentLang === "en" ? "Confirm Rejection" : "Konfirmasi Penolakan"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal Lightbox Dokumen KTP (High-Resolution Zoom) */}
          <Dialog open={!!previewKtpUrl} onOpenChange={open => !open && setPreviewKtpUrl(null)}>
            <DialogContent className="max-w-3xl p-6 rounded-3xl">
              <DialogHeader className="flex flex-row items-center justify-between pb-2">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  <span>Pratinjau Dokumen KTP / Paspor Resmi</span>
                </DialogTitle>
              </DialogHeader>
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black flex items-center justify-center min-h-[350px] max-h-[70vh]">
                {previewKtpUrl && (
                  <img
                    src={previewKtpUrl}
                    alt="Pratinjau Dokumen KTP"
                    className="max-h-[68vh] w-auto max-w-full object-contain"
                  />
                )}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Periksa keaslian foto, kejelasan NIK, nama lengkap, dan tanggal lahir.
                </span>
                {previewKtpUrl && (
                  <a
                    href={previewKtpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Ukuran Asli
                  </a>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AUDIT PENARIKAN & ESCROW                           */}
      {/* ========================================================= */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          {/* Top Banner Payout Rules */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span>
              <strong>Protokol Pencairan Dana:</strong> Penarikan host hanya bersumber dari dana sewa yang telah berstatus <strong>RELEASED</strong> (24 jam setelah check-in tamu). Dana berstatus HELD tidak dapat dicairkan demi melindungi hak konsumen.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari host, bank, no rekening..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Filter Status:</span>
              <select
                value={payoutStatusFilter}
                onChange={e => setPayoutStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">PENDING (Menunggu)</option>
                <option value="PROCESSING">PROCESSING (Diproses Bank)</option>
                <option value="COMPLETED">COMPLETED (Selesai Ditransfer)</option>
                <option value="FAILED">FAILED (Ditolak / Gagal)</option>
              </select>
            </div>
          </div>

          {/* Payouts List */}
          <div className="space-y-4">
            {filteredPayouts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
                Tidak ada data permohonan penarikan dana sesuai filter.
              </div>
            ) : (
              filteredPayouts.map(payout => (
                <div
                  key={payout.id}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-gray-500">#{payout.id.substring(0, 8)}</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        payout.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        payout.status === "PROCESSING" ? "bg-blue-100 text-blue-800" :
                        payout.status === "FAILED" ? "bg-rose-100 text-rose-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {payout.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleString(currentLang === "en" ? "en-US" : "id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                        {payout.user?.name || payout.user?.email || "Host"}
                      </h4>
                      <span className="text-xs text-muted-foreground">({payout.user?.email})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <span>Tujuan: <strong>{payout.bankName}</strong></span>
                      <span>No Rekening: <strong>{payout.accountNumber}</strong></span>
                      <span>Atas Nama: <strong>{payout.accountHolder}</strong></span>
                    </div>

                    {payout.notes && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl max-w-xl">
                        Catatan: "{payout.notes}"
                      </p>
                    )}
                  </div>

                  {/* Financial & Status Controls */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Nominal Dicairkan</p>
                      <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                        {formatPrice(payout.amount, currentCurrency)}
                      </h3>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {payout.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePayout(payout.id, "COMPLETED")}
                          disabled={loadingAction === `payout-${payout.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-8"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Setujui & Selesai
                        </Button>
                      )}

                      {payout.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePayout(payout.id, "PROCESSING")}
                          disabled={loadingAction === `payout-${payout.id}`}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold h-8"
                        >
                          Tandai Proses
                        </Button>
                      )}

                      {payout.status !== "FAILED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const reason = prompt("Masukkan alasan penolakan/pembekuan pencairan dana:")
                            if (reason) handleUpdatePayout(payout.id, "FAILED", reason)
                          }}
                          disabled={loadingAction === `payout-${payout.id}`}
                          className="text-rose-600 hover:bg-rose-50 text-xs h-8"
                        >
                          Tolak
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: MANAJEMEN SENGKETA (DISPUTES)                        */}
      {/* ========================================================= */}
      {activeTab === "disputes" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari sengketa, ID booking, tamu, properti..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Status Sengketa:</span>
              <select
                value={disputeFilter}
                onChange={e => setDisputeFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
              >
                <option value="ALL">Semua Sengketa</option>
                <option value="OPEN">OPEN (Menunggu Resolusi)</option>
                <option value="RESOLVED_RELEASE_TO_HOST">RESOLVED: Rilis ke Host</option>
                <option value="RESOLVED_FULL_REFUND">RESOLVED: Refund Penuh Tamu</option>
                <option value="RESOLVED_PARTIAL_REFUND">RESOLVED: Bagi Sebagian (Split)</option>
                <option value="REJECTED">REJECTED (Ditolak)</option>
              </select>
            </div>
          </div>

          {/* Disputes List */}
          <div className="space-y-4">
            {filteredDisputes.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
                Tidak ada laporan sengketa sesuai filter.
              </div>
            ) : (
              filteredDisputes.map(d => {
                const bookingTotal = d.booking?.totalPriceIdr > 0 
                  ? d.booking.totalPriceIdr 
                  : Math.round((d.booking?.totalPrice || 0) * 18051)

                return (
                  <div
                    key={d.id}
                    className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-gray-500">#{d.id.substring(0, 8)}</span>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          d.status === "OPEN" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                          d.status === "RESOLVED_FULL_REFUND" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                          d.status === "RESOLVED_RELEASE_TO_HOST" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" :
                          d.status === "RESOLVED_PARTIAL_REFUND" ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" :
                          "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                        )}>
                          {d.status === "OPEN" ? "Menunggu Resolusi Admin" :
                           d.status === "RESOLVED_FULL_REFUND" ? "Refund 100% Tamu" :
                           d.status === "RESOLVED_RELEASE_TO_HOST" ? "Rilis ke Host" :
                           d.status === "RESOLVED_PARTIAL_REFUND" ? "Bagi Sebagian (Split)" : "Ditolak"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.createdAt).toLocaleString(currentLang === "en" ? "en-US" : "id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Nilai Pesanan:</span>
                        <span className="font-extrabold text-sm text-gray-900 dark:text-gray-100">
                          {formatPrice(bookingTotal, currentCurrency)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pelapor & Pesanan */}
                      <div className="space-y-2">
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 rounded-full">
                              <AvatarImage src={(d.booking?.guest || d.reporter)?.image || ""} />
                              <AvatarFallback>{(d.booking?.guest || d.reporter)?.name?.charAt(0) || "T"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">{(d.booking?.guest || d.reporter)?.name || "Tamu"}</p>
                              <p className="text-[11px] text-muted-foreground">{(d.booking?.guest || d.reporter)?.email}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Pesanan #{d.bookingId.slice(-8).toUpperCase()}</span>
                            <span className="font-semibold text-rose-600 truncate max-w-[200px]">{d.booking?.property?.title}</span>
                          </div>
                        </div>

                        {/* Kategori & Deskripsi Keluhan */}
                        <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{d.reasonCategory || d.reason}</span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                            {d.description}
                          </p>
                        </div>
                      </div>

                      {/* Bukti Foto & Status Keputusan */}
                      <div className="space-y-2 flex flex-col justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5">
                            Bukti Foto Kejadian ({d.evidenceUrls?.length || 0}):
                          </p>
                          {d.evidenceUrls && d.evidenceUrls.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {d.evidenceUrls.map((url: string, idx: number) => (
                                <div
                                  key={idx}
                                  onClick={() => setPreviewEvidenceUrl(url)}
                                  className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 group relative"
                                >
                                  <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Tidak ada lampiran foto.</p>
                          )}
                        </div>

                        {/* Keputusan Admin jika sudah selesai */}
                        {d.status !== "OPEN" && (
                          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs space-y-1">
                            <div className="flex items-center justify-between text-purple-900 dark:text-purple-200 font-bold">
                              <span>Keputusan Admin:</span>
                              <span className="text-[10px] text-muted-foreground">
                                {d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString("id-ID") : "-"}
                              </span>
                            </div>
                            {d.adminNotes && (
                              <p className="text-[11px] text-purple-800 dark:text-purple-300 italic">
                                &ldquo;{d.adminNotes}&rdquo;
                              </p>
                            )}
                            {d.status === "RESOLVED_PARTIAL_REFUND" && (
                              <div className="pt-1 flex justify-between text-[11px] font-semibold text-purple-950 dark:text-purple-100">
                                <span>Refund Tamu: {formatPrice(d.refundApprovedIdr || 0, currentCurrency)}</span>
                                <span>Payout Host: {formatPrice(d.payoutApprovedIdr || 0, currentCurrency)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tombol Aksi jika OPEN */}
                        {d.status === "OPEN" && (
                          <div className="pt-2 flex justify-end">
                            <Button
                              onClick={() => {
                                setSelectedDispute(d)
                                setDisputeResolution("RESOLVED_RELEASE_TO_HOST")
                                setDisputeAdminNotes("")
                                setDisputeRefundApprovedIdr(Math.round(bookingTotal * 0.5))
                                setDisputePayoutApprovedIdr(Math.round(bookingTotal * 0.5))
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5 mr-1.5" />
                              Putuskan Solusi Sengketa
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ANTREAN REFUND (REFUND QUEUE)                        */}
      {/* ========================================================= */}
      {activeTab === "refunds" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari rekening, nama tamu, properti..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Status Transfer:</span>
              <select
                value={refundFilter}
                onChange={e => setRefundFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
              >
                <option value="ALL">Semua Antrean</option>
                <option value="PENDING_ADMIN_TRANSFER">PENDING (Menunggu Transfer Manual)</option>
                <option value="COMPLETED">COMPLETED (Selesai Ditransfer)</option>
              </select>
            </div>
          </div>

          {/* Refunds List */}
          <div className="space-y-4">
            {filteredRefunds.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
                Tidak ada antrean refund sesuai filter.
              </div>
            ) : (
              filteredRefunds.map(b => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-500">#{b.id.substring(0, 10)}</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        b.refundStatus === "COMPLETED" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                        b.refundStatus === "PENDING_ADMIN_TRANSFER" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {b.refundStatus === "PENDING_ADMIN_TRANSFER" ? "Menunggu Transfer Manual (BI-FAST)" :
                         b.refundStatus === "COMPLETED" ? "Selesai Ditransfer" : b.refundStatus}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {b.cancelledByRole ? `Dibatalkan oleh: ${b.cancelledByRole}` : "Refund"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Nominal Refund:</span>
                      <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                        {formatPrice(b.refundAmountIdr || 0, currentCurrency)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Detail Tamu & Alasan */}
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{b.guest?.name || "Tamu"}</p>
                        <p className="text-[11px] text-muted-foreground">{b.guest?.email} · {b.guest?.phoneNumber || "Tanpa No HP"}</p>
                        <p className="text-[11px] font-medium text-rose-600 truncate">{b.property?.title}</p>
                      </div>

                      {b.cancelReason && (
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Alasan: </span>
                          <span>{b.cancelReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Rekening Tujuan Transfer */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-purple-900 dark:text-purple-200 block">
                          Rekening Bank Tujuan Tamu:
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                          {b.refundBankName || "Bank belum ditentukan"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 tracking-wider">
                            {b.refundAccountNumber || "-"}
                          </span>
                          {b.refundAccountNumber && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(b.refundAccountNumber, b.id)}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-[10px] font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedAcc === b.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Salin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          a.n. <strong className="text-gray-900 dark:text-gray-100">{b.refundAccountHolder || "-"}</strong>
                        </p>
                      </div>

                      {/* Tombol Eksekusi Transfer */}
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-900/40 flex items-center justify-between">
                        {b.refundStatus === "COMPLETED" ? (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ditransfer: {b.refundedAt ? new Date(b.refundedAt).toLocaleDateString("id-ID") : "Selesai"}</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => {
                              setSelectedRefundBooking(b)
                              setRefundProofUrl("")
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold w-full sm:w-auto cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5 mr-1.5" />
                            Tandai Sudah Ditransfer (BI-FAST)
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: AUDIT TRANSAKSI & PEMBATALAN                       */}
      {/* ========================================================= */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari ID booking, properti, tamu..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground shrink-0">Status Bayar:</span>
              <select
                value={bookingStatusFilter}
                onChange={e => setBookingStatusFilter(e.target.value)}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="PAID">PAID (Sudah Dibayar)</option>
                <option value="PENDING">PENDING (Menunggu Bayar)</option>
                <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
                <option value="REFUNDED">REFUNDED (Dikembalikan)</option>
                <option value="EXPIRED">EXPIRED (Kedaluwarsa 60 Menit)</option>
              </select>
            </div>
          </div>

          {/* Bookings Table / Cards */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 text-muted-foreground text-xs">
                Tidak ada data pemesanan sesuai filter.
              </div>
            ) : (
              filteredBookings.map(b => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-500">#{b.id.substring(0, 10)}</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        b.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" :
                        b.paymentStatus === "CANCELLED" ? "bg-rose-100 text-rose-800" :
                        b.paymentStatus === "REFUNDED" ? "bg-purple-100 text-purple-800" :
                        b.paymentStatus === "EXPIRED" ? "bg-gray-100 text-gray-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {b.paymentStatus}
                      </span>
                      {b.paymentStatus === "PAID" && (
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          b.escrowStatus === "RELEASED" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          b.escrowStatus === "HELD" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-purple-50 text-purple-700 border-purple-200"
                        )}>
                          Escrow: {b.escrowStatus}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-gray-900 dark:text-gray-100">
                        {formatPrice(getBookingTotalIdr(b), currentCurrency)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Properti</p>
                      <Link href={`/properties/${b.propertyId}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors">
                        {b.property?.title}
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{b.property?.address}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Tamu (Penyewa)</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{b.guest?.name || "Tamu"}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{b.guest?.email} · {b.guestsCount || 1} Tamu</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Jadwal Sewa</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatWibDate(b.startDate, currentLang === "en" ? "en" : "id")} (14:00) - {formatWibDate(b.endDate, currentLang === "en" ? "en" : "id")} (12:00 WIB)
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {b.totalNights || 1} malam ({formatPrice(b.nightlyRateIdr || (b.nightlyRate ? Math.round(b.nightlyRate * 18051) : Math.round(getBookingTotalIdr(b) / (b.totalNights || 1))), currentCurrency)}/malam)
                      </p>
                    </div>
                  </div>

                  {b.cancelReason && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                      <strong>Alasan Batal / Kebijakan:</strong> {b.cancelReason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: USER DIRECTORY                                     */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari nama, email user..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-2xl text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total {initialUsers.length} pengguna terdaftar di platform
            </p>
          </div>

          {/* Users Table */}
          <div className="space-y-3">
            {initialUsers
              .filter(u => {
                const q = userSearch.toLowerCase()
                return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
              })
              .map(u => (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 rounded-full">
                      <AvatarImage src={u.image || ""} />
                      <AvatarFallback>{u.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">{u.name || "Tanpa Nama"}</h4>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          u.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                          u.role === "HOST" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={e => handleUpdateRole(u.id, e.target.value as any)}
                      disabled={loadingAction === `role-${u.id}`}
                      className="h-8 px-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-semibold focus:outline-none"
                    >
                      <option value="GUEST">GUEST</option>
                      <option value="HOST">HOST</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: PENGATURAN PARAMETER SISTEM (SYSTEM SETTINGS)       */}
      {/* ========================================================= */}
      {activeTab === "settings" && (() => {
        const basePrice = Math.max(0, simulatedBasePrice || 0)
        const guestFee = Math.round(basePrice * ((setting.guestServiceFeePct || 0) / 100))
        const totalGuestPays = basePrice + guestFee
        const hostFee = Math.round(basePrice * ((setting.hostPlatformFeePct || 0) / 100))
        const netHostPayout = Math.max(0, basePrice - hostFee)
        const totalPlatformTake = guestFee + hostFee
        const effectiveTakeRate = basePrice > 0 ? ((totalPlatformTake / basePrice) * 100).toFixed(1) : "0.0"
        const estUsdGuestPays = ((totalGuestPays) / (setting.usdExchangeRate || 18051)).toFixed(2)

        return (
          <div className="space-y-6">
            {/* Header Settings Tab */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
                    {currentLang === "en" ? "System Parameters & Governance" : "Pengaturan Parameter & Tata Kelola Sistem"}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentLang === "en" 
                    ? "Configure base exchange rates, split-fee marketplace commission percentages, cancellation penalties, and transaction safety caps."
                    : "Kelola kurs konversi USD acuan, skema split-fee komisi dua sisi, penalti pembatalan sepihak, dan batas durasi sewa transaksi."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {currentLang === "en" ? "Synchronized Live" : "Sinkron & Aktif"}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                  {currentLang === "en" ? "Last updated:" : "Diperbarui:"}{" "}
                  <strong className="text-gray-800 dark:text-gray-200">{formatWibDate(setting.updatedAt, currentLang as any)}</strong>
                </span>
              </div>
            </div>

            {/* Notification Feedback */}
            {settingSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{settingSuccessMsg}</span>
                </div>
                <button onClick={() => setSettingSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
              </div>
            )}

            {settingErrorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{settingErrorMsg}</span>
                </div>
                <button onClick={() => setSettingErrorMsg("")} className="text-rose-600 hover:text-rose-800 font-bold">×</button>
              </div>
            )}

            {/* Settings Main Layout: Form (Left 2 cols) & Simulator (Right 1 col) */}
            <form onSubmit={handleSaveSettings} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* CARD 1: KURS MATA UANG BASIS */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Currency Standard & Exchange Rate" : "Standar Mata Uang & Kurs Konversi"}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Ruang Rehat uses IDR (Rupiah) as the single source of truth for all ledger balances. This rate drives USD estimation for international travelers."
                          : "Ruang Rehat menggunakan Rupiah (IDR) murni sebagai sumber kebenaran tunggal buku kas. Kurs ini mengontrol estimasi tampilan harga bagi pengguna USD."}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                      IDR SSoT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {currentLang === "en" ? "Mata Uang Basis (Base Currency)" : "Mata Uang Basis Buku Kas"}
                      </label>
                      <div className="h-10 px-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-mono font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                        <span>IDR (Indonesian Rupiah)</span>
                        <span className="text-[10px] bg-white dark:bg-gray-900 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 font-sans">Terkunci</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {currentLang === "en" ? "USD to IDR Rate (1 USD = ? IDR)" : "Kurs Konversi 1 USD ke IDR"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          min="1"
                          max="100000"
                          value={setting.usdExchangeRate}
                          onChange={(e) => setSetting({ ...setting, usdExchangeRate: Number(e.target.value) })}
                          className="pl-10 h-10 rounded-2xl font-mono text-xs font-bold"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">Pilihan cepat:</span>
                        <button
                          type="button"
                          onClick={() => setSetting({ ...setting, usdExchangeRate: 18051 })}
                          className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          18.051 (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetting({ ...setting, usdExchangeRate: 16500 })}
                          className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          16.500
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetting({ ...setting, usdExchangeRate: 17000 })}
                          className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          17.000
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD 2: MODEL KOMISI SPLIT-FEE */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-emerald-500" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Two-Sided Marketplace Split-Fee" : "Struktur Komisi Platform (Split-Fee)"}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Platform monetization combines guest checkout service fee with host escrow release commission."
                          : "Monetisasi marketplace menggabungkan biaya layanan tamu saat pemesanan dengan potongan platform dari payout host."}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Take-Rate: {(Number(setting.guestServiceFeePct || 0) + Number(setting.hostPlatformFeePct || 0)).toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Guest Service Fee" : "Biaya Layanan Tamu"}
                        </label>
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">+ Ditambahkan</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={setting.guestServiceFeePct}
                          onChange={(e) => setSetting({ ...setting, guestServiceFeePct: parseFloat(e.target.value) || 0 })}
                          className="pr-8 h-10 rounded-2xl font-mono text-xs font-bold"
                          required
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {currentLang === "en" 
                          ? "Added on top of property rental price during guest payment checkout." 
                          : "Ditambahkan di atas subtotal harga kamar saat tamu melakukan pembayaran checkout."}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Host Platform Fee" : "Potongan Komisi Host"}
                        </label>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">- Dipotong</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={setting.hostPlatformFeePct}
                          onChange={(e) => setSetting({ ...setting, hostPlatformFeePct: parseFloat(e.target.value) || 0 })}
                          className="pr-8 h-10 rounded-2xl font-mono text-xs font-bold"
                          required
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {currentLang === "en" 
                          ? "Deducted from property earnings when escrow is unlocked for host withdrawal." 
                          : "Dipotong dari hasil sewa host ketika dana escrow berhasil dilepaskan ke saldo pencairan."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CARD 3: KEBIJAKAN & PROTEKSI PASAR */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {currentLang === "en" ? "Marketplace Safeguards & Governance Rules" : "Ketentuan Proteksi Transaksi & Operasional"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {currentLang === "en" ? "Host Cancellation Penalty" : "Denda Pembatalan Sepihak Host"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                        <Input
                          type="number"
                          step="10000"
                          min="0"
                          value={setting.hostCancelPenaltyIdr}
                          onChange={(e) => setSetting({ ...setting, hostCancelPenaltyIdr: Number(e.target.value) })}
                          className="pl-10 h-10 rounded-2xl font-mono text-xs font-bold"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {currentLang === "en" 
                          ? `Penalty charged to host: ${formatPrice(setting.hostCancelPenaltyIdr, "IDR")}. Calendar dates are also locked by system.`
                          : `Nominal sanksi wajib: ${formatPrice(setting.hostCancelPenaltyIdr, "IDR")}. Kalender tanggal tersebut otomatis dikunci sistem.`}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {currentLang === "en" ? "Max Stay Duration" : "Batas Maksimum Durasi Menginap"}
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          value={setting.maxStayNights}
                          onChange={(e) => setSetting({ ...setting, maxStayNights: Number(e.target.value) })}
                          className="pr-16 h-10 rounded-2xl font-mono text-xs font-bold"
                          required
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          {currentLang === "en" ? "Nights" : "Malam"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {currentLang === "en"
                          ? "Maximum consecutive nights allowed per booking checkout transaction."
                          : "Batas durasi menginap maksimal dalam satu transaksi pemesanan (default 28 malam)."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetDefaultSettings}
                    disabled={isSavingSetting}
                    className="rounded-2xl h-11 px-4 text-xs font-bold border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-gray-500" />
                    <span>{currentLang === "en" ? "Reset to Defaults" : "Kembalikan ke Default"}</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSavingSetting}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-11 px-6 text-xs font-extrabold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-2"
                  >
                    {isSavingSetting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{currentLang === "en" ? "Saving Changes..." : "Menyimpan..."}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{currentLang === "en" ? "Save System Parameters" : "Simpan Pengaturan Sistem"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* RIGHT COLUMN: Interactive Marketplace Financial Simulator */}
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/90 via-indigo-900/80 to-gray-900 text-white shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-200 flex items-center justify-center border border-purple-400/20">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold tracking-tight">
                        {currentLang === "en" ? "Live Fee Simulator" : "Simulasi Finansial Real-time"}
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Interaktif
                    </span>
                  </div>

                  <p className="text-xs text-purple-200/80 leading-relaxed">
                    {currentLang === "en"
                      ? "Test how parameter changes impact guest invoice breakdown, host payout, and platform gross revenue."
                      : "Uji dampak perubahan parameter terhadap tagihan tamu, penghasilan host, dan margin platform secara instan."}
                  </p>

                  {/* Simulator Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                      {currentLang === "en" ? "Sample Property Rate (Base IDR)" : "Contoh Subtotal Sewa Properti"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-300">Rp</span>
                      <input
                        type="number"
                        step="50000"
                        min="50000"
                        value={simulatedBasePrice}
                        onChange={(e) => setSimulatedBasePrice(Number(e.target.value) || 0)}
                        className="w-full h-10 pl-10 pr-3 rounded-2xl bg-white/10 border border-white/20 text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>

                  {/* Simulator Breakdown */}
                  <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                    <div className="flex items-center justify-between text-purple-200">
                      <span>Harga Dasar Kamar</span>
                      <span className="font-mono font-bold text-white">{formatPrice(basePrice, "IDR")}</span>
                    </div>

                    <div className="flex items-center justify-between text-purple-300">
                      <span>Biaya Layanan Tamu (+{setting.guestServiceFeePct}%)</span>
                      <span className="font-mono font-bold text-emerald-300">+{formatPrice(guestFee, "IDR")}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/10 font-bold">
                      <div className="flex flex-col">
                        <span className="text-white text-xs">Total Tagihan Tamu</span>
                        <span className="text-[10px] text-purple-300 font-normal">Est. ${estUsdGuestPays} USD</span>
                      </div>
                      <span className="font-mono text-sm text-emerald-400">{formatPrice(totalGuestPays, "IDR")}</span>
                    </div>

                    <div className="flex items-center justify-between text-purple-300 pt-1">
                      <span>Komisi Platform Host (-{setting.hostPlatformFeePct}%)</span>
                      <span className="font-mono font-bold text-rose-300">-{formatPrice(hostFee, "IDR")}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-purple-100 font-semibold">Net Payout Diterima Host</span>
                      <span className="font-mono font-bold text-white">{formatPrice(netHostPayout, "IDR")}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-purple-500/20 border border-emerald-400/30 pt-2">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">Margin Platform</div>
                        <div className="text-[10px] text-purple-200">Take-Rate: {effectiveTakeRate}%</div>
                      </div>
                      <div className="font-mono font-extrabold text-base text-emerald-300">
                        {formatPrice(totalPlatformTake, "IDR")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Constants & SLA Widget */}
                <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
                    <Info className="w-4 h-4 text-purple-600" />
                    <span>Konstanta Operasional Baku (SLA)</span>
                  </div>

                  <div className="space-y-2 text-[11px] text-muted-foreground">
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span>Check-in Resmi</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-mono">14:00 WIB</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span>Check-out Resmi</span>
                      <strong className="text-gray-800 dark:text-gray-200 font-mono">12:00 WIB</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span>Jeda Pembersihan Kamar</span>
                      <strong className="text-gray-800 dark:text-gray-200">2 Jam (12:00 - 14:00 WIB)</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                      <span>Garansi Komplain Tamu</span>
                      <strong className="text-gray-800 dark:text-gray-200">24 Jam sejak Check-in</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Cron Pelepasan Escrow</span>
                      <strong className="text-purple-600 dark:text-purple-400 font-mono">Setiap 60 Menit</strong>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )
      })()}
      </main>

      {/* ========================================================= */}
      {/* DIALOG: PUTUSKAN RESOLUSI SENGKETA                        */}
      {/* ========================================================= */}
      <Dialog open={!!selectedDispute} onOpenChange={open => !open && setSelectedDispute(null)}>
        <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-1">
              <Scale className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Putusan Resolusi Sengketa
            </DialogTitle>
            {selectedDispute && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pesanan #{selectedDispute.bookingId?.slice(-8).toUpperCase()} · Properti: {selectedDispute.booking?.property?.title}
              </p>
            )}
          </DialogHeader>

          {selectedDispute && (() => {
            const bookingTotal = selectedDispute.booking?.totalPriceIdr > 0 
              ? selectedDispute.booking.totalPriceIdr 
              : Math.round((selectedDispute.booking?.totalPrice || 0) * 18051)

            return (
              <form onSubmit={handleResolveDispute} className="space-y-4 pt-1 text-xs">
                {/* Ringkasan Klaim */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">Total Dana Pesanan:</span>
                    <span className="font-extrabold text-gray-900 dark:text-gray-100">{formatPrice(bookingTotal, currentCurrency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pelapor (Tamu):</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{(selectedDispute.booking?.guest || selectedDispute.reporter)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategori Masalah:</span>
                    <span className="font-semibold text-rose-600">{selectedDispute.reasonCategory || selectedDispute.reason}</span>
                  </div>
                </div>

                {/* Pilihan Resolusi */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Pilih Keputusan Admin:
                  </label>
                  
                  <div className="space-y-2">
                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                      disputeResolution === "RESOLVED_RELEASE_TO_HOST"
                        ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}>
                      <input
                        type="radio"
                        name="disputeRes"
                        className="mt-0.5"
                        checked={disputeResolution === "RESOLVED_RELEASE_TO_HOST"}
                        onChange={() => setDisputeResolution("RESOLVED_RELEASE_TO_HOST")}
                      />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">Rilis 100% Hak Dana ke Host</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Keluhan dianggap terselesaikan atau telah ada kesepakatan damai. Dana escrow dicairkan penuh ke saldo Host.
                        </p>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                      disputeResolution === "RESOLVED_FULL_REFUND"
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}>
                      <input
                        type="radio"
                        name="disputeRes"
                        className="mt-0.5"
                        checked={disputeResolution === "RESOLVED_FULL_REFUND"}
                        onChange={() => setDisputeResolution("RESOLVED_FULL_REFUND")}
                      />
                      <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-300">Refund 100% Penuh ke Tamu</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Properti tidak layak huni atau kunci tidak dapat diakses. Seluruh dana dikembalikan ke tamu dan pesanan dibatalkan.
                        </p>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                      disputeResolution === "RESOLVED_PARTIAL_REFUND"
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}>
                      <input
                        type="radio"
                        name="disputeRes"
                        className="mt-0.5"
                        checked={disputeResolution === "RESOLVED_PARTIAL_REFUND"}
                        onChange={() => setDisputeResolution("RESOLVED_PARTIAL_REFUND")}
                      />
                      <div>
                        <p className="font-bold text-blue-800 dark:text-blue-300">Bagi Sebagian / Split Partial</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Kompensasi parsial (misal: AC rusak sebagian, sebagian uang sewa dikembalikan ke tamu dan sisanya tetap untuk host).
                        </p>
                      </div>
                    </label>

                    <label className={cn(
                      "flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all",
                      disputeResolution === "REJECTED"
                        ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/30"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}>
                      <input
                        type="radio"
                        name="disputeRes"
                        className="mt-0.5"
                        checked={disputeResolution === "REJECTED"}
                        onChange={() => setDisputeResolution("REJECTED")}
                      />
                      <div>
                        <p className="font-bold text-rose-800 dark:text-rose-300">Tolak Sengketa (Reject Claim)</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Klaim tamu tidak terbukti atau palsu. Escrow dirilis ke Host.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Input Nominal jika PARTIAL */}
                {disputeResolution === "RESOLVED_PARTIAL_REFUND" && (
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
                    <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                      Tentukan Alokasi Dana (Total: {formatPrice(bookingTotal, currentCurrency)}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Nominal Refund ke Tamu (IDR):
                        </label>
                        <Input
                          type="number"
                          value={disputeRefundApprovedIdr}
                          onChange={e => {
                            const val = Number(e.target.value) || 0
                            setDisputeRefundApprovedIdr(val)
                            setDisputePayoutApprovedIdr(Math.max(0, bookingTotal - val))
                          }}
                          className="rounded-xl text-xs bg-white dark:bg-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Nominal Payout ke Host (IDR):
                        </label>
                        <Input
                          type="number"
                          value={disputePayoutApprovedIdr}
                          onChange={e => setDisputePayoutApprovedIdr(Number(e.target.value) || 0)}
                          className="rounded-xl text-xs bg-white dark:bg-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Catatan Investigasi Admin */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Catatan Investigasi & Alasan Keputusan:
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tuliskan pertimbangan dan bukti yang ditemukan selama investigasi..."
                    value={disputeAdminNotes}
                    onChange={e => setDisputeAdminNotes(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 focus:border-purple-500 outline-none text-xs bg-white dark:bg-gray-900 font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDispute(null)}
                    disabled={loadingAction === `dispute-${selectedDispute.id}`}
                    className="rounded-xl text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loadingAction === `dispute-${selectedDispute.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {loadingAction === `dispute-${selectedDispute.id}` ? "Menerapkan..." : "Terapkan Keputusan"}
                  </Button>
                </div>
              </form>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: KONFIRMASI TRANSFER REFUND MANUAL (BI-FAST)       */}
      {/* ========================================================= */}
      <Dialog open={!!selectedRefundBooking} onOpenChange={open => !open && setSelectedRefundBooking(null)}>
        <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
              <Banknote className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Konfirmasi Transfer Pengembalian Dana
            </DialogTitle>
            {selectedRefundBooking && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pesanan #{selectedRefundBooking.id?.slice(-8).toUpperCase()} · Tamu: {selectedRefundBooking.guest?.name}
              </p>
            )}
          </DialogHeader>

          {selectedRefundBooking && (
            <form onSubmit={handleConfirmRefund} className="space-y-4 pt-1 text-xs">
              {/* Detail Transfer */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Nominal Transfer:</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                    {formatPrice(selectedRefundBooking.refundAmountIdr || 0, currentCurrency)}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-1 text-gray-800 dark:text-gray-200">
                  <p><strong>Bank:</strong> {selectedRefundBooking.refundBankName || "-"}</p>
                  <p><strong>No. Rekening:</strong> <span className="font-mono font-bold tracking-wider">{selectedRefundBooking.refundAccountNumber || "-"}</span></p>
                  <p><strong>Atas Nama:</strong> {selectedRefundBooking.refundAccountHolder || "-"}</p>
                </div>
              </div>

              {/* Input Link Bukti Transfer */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Link Bukti Transfer / Resi BI-FAST (Opsional):
                </label>
                <Input
                  type="url"
                  placeholder="https://... (Link foto bukti transfer m-Banking / BI-FAST)"
                  value={refundProofUrl}
                  onChange={e => setRefundProofUrl(e.target.value)}
                  className="rounded-xl text-xs bg-white dark:bg-gray-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRefundBooking(null)}
                  disabled={loadingAction === `refund-${selectedRefundBooking.id}`}
                  className="rounded-xl text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loadingAction === `refund-${selectedRefundBooking.id}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {loadingAction === `refund-${selectedRefundBooking.id}` ? "Menyimpan..." : "Konfirmasi Telah Ditransfer"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* DIALOG: PREVIEW FOTO BUKTI SENGKETA                       */}
      {/* ========================================================= */}
      <Dialog open={!!previewEvidenceUrl} onOpenChange={open => !open && setPreviewEvidenceUrl(null)}>
        <DialogContent className="max-w-3xl p-4 rounded-3xl">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-bold">Bukti Foto Sengketa</DialogTitle>
          </DialogHeader>
          {previewEvidenceUrl && (
            <div className="max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black/5 dark:bg-black/40">
              <img
                src={previewEvidenceUrl}
                alt="Foto Bukti"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
