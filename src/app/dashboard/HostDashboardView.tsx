"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Building2, 
  CalendarDays, 
  PlusCircle, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin, 
  Edit3, 
  User, 
  Calendar,
  ExternalLink,
  Luggage,
  Download,
  CalendarX,
  Lock,
  Unlock,
  Wallet,
  Landmark,
  ArrowDownToLine,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Star,
  Sparkles,
  Compass,
  Heart,
  RotateCcw,
  ArrowRight,
  BadgeCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import HostBookingActions from "./HostBookingActions"
import GuestTripActions from "./GuestTripActions"
import ReviewModal from "./ReviewModal"
import KycModal from "@/components/KycModal"
import { ShieldAlert } from "lucide-react"
import { 
  getWibDateString, 
  toCheckInDateTimeWIB, 
  toCheckOutDateTimeWIB, 
  calculateStayNights,
  formatWibDate 
} from "@/lib/date-standards"

interface HostDashboardViewProps {
  role: string
  currentUser?: any
  myProperties: any[]
  incomingBookings: any[]
  myBookings: any[]
  userFavorites?: any[]
  initialBlockedDates?: any[]
  initialBankAccount?: any
  initialPayouts?: any[]
  currentCurrency: string
  currentLang?: string
  t: any
  defaultTab?: string
  targetPropertyId?: string
}

export default function HostDashboardView({
  role,
  currentUser,
  myProperties,
  incomingBookings,
  myBookings,
  userFavorites = [],
  initialBlockedDates = [],
  initialBankAccount = null,
  initialPayouts = [],
  currentCurrency,
  currentLang = "id",
  t,
  defaultTab,
  targetPropertyId,
}: HostDashboardViewProps) {
  // Tab aktif: Jika Host, default ke defaultTab (jika valid) atau "properties", jika Guest default ke "trips"
  const getInitialTab = (): "properties" | "bookings" | "availability" | "payouts" | "trips" => {
    if (role === "HOST") {
      if (defaultTab && ["properties", "bookings", "availability", "payouts", "trips"].includes(defaultTab)) {
        return defaultTab as any
      }
      return "properties"
    }
    return "trips"
  }

  const [activeTab, setActiveTab] = useState<"properties" | "bookings" | "availability" | "payouts" | "trips">(
    getInitialTab()
  )

  const [showKycModal, setShowKycModal] = useState(false)

  // Blocked Dates State
  const [blockedDatesList, setBlockedDatesList] = useState<any[]>(initialBlockedDates)
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    targetPropertyId && myProperties.some(p => p.id === targetPropertyId)
      ? targetPropertyId
      : myProperties[0]?.id || ""
  )
  const [blockStartDate, setBlockStartDate] = useState("")
  const [blockEndDate, setBlockEndDate] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [blockingLoading, setBlockingLoading] = useState(false)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  // Payout & Bank Account State
  const [bankAccount, setBankAccount] = useState<any>(initialBankAccount)
  const [payoutsList, setPayoutsList] = useState<any[]>(initialPayouts)
  const [bankNameInput, setBankNameInput] = useState(initialBankAccount?.bankName || "BCA")
  const [accountNumberInput, setAccountNumberInput] = useState(initialBankAccount?.accountNumber || "")
  const [accountHolderInput, setAccountHolderInput] = useState(initialBankAccount?.accountHolder || "")
  const [savingBankLoading, setSavingBankLoading] = useState(false)
  const [bankSuccessMsg, setBankSuccessMsg] = useState("")

  const [withdrawAmountInput, setWithdrawAmountInput] = useState("")
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutErrorMsg, setPayoutErrorMsg] = useState("")
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState("")

  // State untuk Real-Case Bank Inquiry & Confirmation Modal
  const [checkingBank, setCheckingBank] = useState(false)
  const [inquiryResult, setInquiryResult] = useState<any>(null)
  const [inquiryError, setInquiryError] = useState("")

  // State Modal Konfirmasi Penarikan
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [completedReceipt, setCompletedReceipt] = useState<any>(null)

  // Filter & Search states
  const [propSearch, setPropSearch] = useState("")
  const [bookingSearch, setBookingSearch] = useState("")
  const [bookingFilterStatus, setBookingFilterStatus] = useState<"ALL" | "PAID" | "PENDING" | "CANCELLED">("ALL")
  const [tripFilter, setTripFilter] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED">("ALL")
  const [tripSearch, setTripSearch] = useState("")

  // Kategorisasi & Filter Perjalanan Tamu (Guest Trips) berdasarkan Waktu Standar Indonesia (WIB)
  const nowTime = new Date()
  const upcomingTrips = myBookings.filter(b => 
    b.status === "CONFIRMED" && b.paymentStatus === "PAID" && toCheckOutDateTimeWIB(b.endDate) > nowTime
  )
  const completedTrips = myBookings.filter(b => 
    b.status === "COMPLETED" || (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && toCheckOutDateTimeWIB(b.endDate) <= nowTime)
  )
  const pendingTrips = myBookings.filter(b => 
    b.paymentStatus === "PENDING" && b.status !== "CANCELLED"
  )
  const cancelledTrips = myBookings.filter(b => 
    b.status === "CANCELLED"
  )

  const filteredTrips = myBookings.filter(b => {
    if (tripFilter === "UPCOMING") {
      if (!(b.status === "CONFIRMED" && b.paymentStatus === "PAID" && toCheckOutDateTimeWIB(b.endDate) > nowTime)) return false
    } else if (tripFilter === "COMPLETED") {
      if (!(b.status === "COMPLETED" || (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && toCheckOutDateTimeWIB(b.endDate) <= nowTime))) return false
    } else if (tripFilter === "PENDING") {
      if (!(b.paymentStatus === "PENDING" && b.status !== "CANCELLED")) return false
    } else if (tripFilter === "CANCELLED") {
      if (b.status !== "CANCELLED") return false
    }

    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase()
      const title = b.property?.title?.toLowerCase() || ""
      const address = b.property?.address?.toLowerCase() || ""
      const id = b.id?.toLowerCase() || ""
      if (!title.includes(q) && !address.includes(q) && !id.includes(q)) return false
    }

    return true
  })

  // Perhitungan Keuangan Payout (Single Source of Truth IDR murni)
  const totalRevenue = incomingBookings
    .filter(b => b.paymentStatus === "PAID")
    .reduce((acc, curr) => acc + (curr.netHostPayoutIdr || (curr.totalPriceIdr ? Math.round(curr.totalPriceIdr * 0.97) : Math.round((curr.totalPrice || 0) * 18051))), 0)

  const paidBookingsCount = incomingBookings.filter(b => b.paymentStatus === "PAID").length

  const escrowIdr = incomingBookings
    .filter(b => b.paymentStatus === "PAID" && b.escrowStatus === "HELD" && b.status !== "CANCELLED")
    .reduce((acc, curr) => acc + (curr.netHostPayoutIdr || (curr.totalPriceIdr ? Math.round(curr.totalPriceIdr * 0.97) : Math.round((curr.totalPrice || 0) * 18051))), 0)

  const releasedRevenueIdr = incomingBookings
    .filter(b => b.paymentStatus === "PAID" && b.escrowStatus === "RELEASED" && b.status !== "CANCELLED")
    .reduce((acc, curr) => acc + (curr.netHostPayoutIdr || (curr.totalPriceIdr ? Math.round(curr.totalPriceIdr * 0.97) : Math.round((curr.totalPrice || 0) * 18051))), 0)

  const totalWithdrawnIdr = payoutsList
    .filter(p => p.status !== "FAILED")
    .reduce((acc, curr) => acc + (curr.amount || 0), 0)

  const availablePayoutIdr = Math.max(0, releasedRevenueIdr - totalWithdrawnIdr)

  // Nilai nominal yang ditampilkan / dihitung sesuai mata uang aktif saat ini
  const availablePayoutInCurrentCurrency = currentCurrency === "USD" 
    ? Math.round((availablePayoutIdr / 18051) * 100) / 100
    : availablePayoutIdr

  // Helper Format Input Uang (Otomatis titik ribuan jika IDR, atau koma jika USD)
  const formatCurrencyInput = (val: string | number) => {
    if (!val) return ""
    const num = String(val).replace(/\D/g, "")
    if (!num) return ""
    return new Intl.NumberFormat(currentCurrency === "USD" ? "en-US" : "id-ID").format(Number(num))
  }

  const handleWithdrawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "")
    setWithdrawAmountInput(rawVal)
    if (payoutErrorMsg) setPayoutErrorMsg("")
  }

  // Cek apakah input melebihi saldo siap ditarik
  const currentWithdrawNum = Number(withdrawAmountInput) || 0
  const isOverBalance = currentWithdrawNum > availablePayoutInCurrentCurrency

  // Filter List Properti
  const filteredProperties = myProperties.filter(p => {
    const query = propSearch.toLowerCase()
    return (
      p.title?.toLowerCase().includes(query) ||
      p.address?.toLowerCase().includes(query)
    )
  })

  // Filter List Reservasi Masuk
  const filteredIncomingBookings = incomingBookings.filter(b => {
    const query = bookingSearch.toLowerCase()
    const matchesSearch =
      b.property?.title?.toLowerCase().includes(query) ||
      b.guest?.name?.toLowerCase().includes(query) ||
      b.guest?.email?.toLowerCase().includes(query)

    let matchesStatus = true
    if (bookingFilterStatus === "PAID") {
      matchesStatus = b.paymentStatus === "PAID"
    } else if (bookingFilterStatus === "PENDING") {
      matchesStatus = b.paymentStatus === "PENDING" && b.status !== "CANCELLED"
    } else if (bookingFilterStatus === "CANCELLED") {
      matchesStatus = b.status === "CANCELLED"
    }

    return matchesSearch && matchesStatus
  })

  // Fungsi Ekspor Laporan Keuangan ke format CSV / Excel
  const handleExportCSV = () => {
    if (!incomingBookings || incomingBookings.length === 0) {
      alert(t.noDataToExport || (currentLang === "en" ? "No transaction data to export." : "Belum ada data transaksi untuk diekspor."))
      return
    }

    const headers = currentLang === "en" ? [
      "Booking Code",
      "Booking Date",
      "Property",
      "Property Address",
      "Guest Name",
      "Guest Email",
      "Check-In",
      "Check-Out",
      "Duration (Nights)",
      "Booking Status",
      "Payment Status",
      `Total Revenue (${currentCurrency})`,
      "Cancel Reason"
    ] : [
      "Kode Reservasi",
      "Tanggal Pemesanan",
      "Properti",
      "Alamat Properti",
      "Nama Tamu",
      "Email Tamu",
      "Check-In",
      "Check-Out",
      "Durasi (Malam)",
      "Status Pesanan",
      "Status Pembayaran",
      `Total Pendapatan (${currentCurrency})`,
      "Alasan Batal"
    ]

    const rows = incomingBookings.map(b => {
      const code = `RR-${b.id.slice(-8).toUpperCase()}`
      const bookingDate = new Date(b.createdAt).toLocaleDateString("id-ID")
      const title = `"${(b.property?.title || "").replace(/"/g, '""')}"`
      const address = `"${(b.property?.address || "").replace(/"/g, '""')}"`
      const guestName = `"${(b.guest?.name || "").replace(/"/g, '""')}"`
      const guestEmail = b.guest?.email || ""
      const checkIn = new Date(b.startDate).toLocaleDateString("id-ID")
      const checkOut = new Date(b.endDate).toLocaleDateString("id-ID")
      const nights = Math.max(1, Math.ceil(Math.abs(new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)))
      const status = b.status
      const paymentStatus = b.paymentStatus
      const revenue = b.totalPrice || 0
      const cancelReason = b.cancelReason ? `"${b.cancelReason.replace(/"/g, '""')}"` : ""

      return [
        code,
        bookingDate,
        title,
        address,
        guestName,
        guestEmail,
        checkIn,
        checkOut,
        nights,
        status,
        paymentStatus,
        revenue,
        cancelReason
      ].join(",")
    })

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const dateStr = getWibDateString(new Date())
    link.setAttribute("href", url)
    link.setAttribute("download", `Laporan_Keuangan_RuangRehat_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Fungsi Menambah Blokir Tanggal Manual
  const handleCreateBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId || !blockStartDate || !blockEndDate) {
      alert(t.selectPropertyAndDatesAlert || "Harap pilih properti serta tanggal mulai dan tanggal selesai.")
      return
    }

    setBlockingLoading(true)
    try {
      const res = await fetch("/api/properties/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || (currentLang === "en" ? "Failed to block dates" : "Gagal memblokir tanggal"))

      // Cari judul properti terkait
      const propTitle = myProperties.find(p => p.id === selectedPropertyId)?.title || "Properti"
      setBlockedDatesList(prev => [...prev, { ...data, property: { id: selectedPropertyId, title: propTitle } }])
      
      // Reset form
      setBlockStartDate("")
      setBlockEndDate("")
      setBlockReason("")
      alert(t.datesBlockedSuccess || "Tanggal berhasil diblokir! Tamu tidak dapat memesan pada rentang tanggal tersebut.")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBlockingLoading(false)
    }
  }

  // Fungsi Membuka Blokir Tanggal
  const handleRemoveBlockedDate = async (id: string) => {
    if (!confirm(t.confirmUnblock || "Buka kembali tanggal ini agar dapat dipesan oleh tamu?")) return

    setUnblockingId(id)
    try {
      const res = await fetch(`/api/properties/blocked-dates?id=${id}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Gagal membuka blokir")

      setBlockedDatesList(prev => prev.filter(b => b.id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUnblockingId(null)
    }
  }

  // Fungsi Simulasi Bank Account Inquiry (Cek Rekening ke Jaringan Bank)
  const handleCheckBankAccount = async () => {
    if (!accountNumberInput) {
      setInquiryError("Masukkan nomor rekening terlebih dahulu.")
      return
    }

    setCheckingBank(true)
    setInquiryError("")
    setInquiryResult(null)

    try {
      const res = await fetch("/api/host/bank-account/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: accountNumberInput,
          accountHolder: accountHolderInput,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memeriksa rekening bank.")
      }

      setInquiryResult(data.data)
      setAccountHolderInput(data.data.accountHolder)
    } catch (err: any) {
      setInquiryError(err.message)
      setAccountHolderInput("")
    } finally {
      setCheckingBank(false)
    }
  }

  // Fungsi Menyimpan Rekening Bank Terverifikasi
  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inquiryResult && !bankAccount) {
      alert("Harap klik 'Periksa Rekening' untuk memvalidasi nomor rekening Anda terlebih dahulu.")
      return
    }

    setSavingBankLoading(true)
    setBankSuccessMsg("")

    try {
      const res = await fetch("/api/host/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: accountNumberInput,
          accountHolder: accountHolderInput,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || (currentLang === "en" ? "Failed to save bank account" : "Gagal menyimpan rekening bank"))

      setBankAccount(data.bankAccount)
      setBankSuccessMsg(t.bankVerifiedSuccess || "Rekening bank terverifikasi dan berhasil disimpan!")
      setInquiryResult(null)
      setTimeout(() => setBankSuccessMsg(""), 4000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingBankLoading(false)
    }
  }

  // Langkah 1 Penarikan: Validasi & Buka Modal Konfirmasi
  const handleOpenConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutErrorMsg("")

    const amount = Number(withdrawAmountInput)
    if (!amount || amount <= 0) {
      setPayoutErrorMsg(t.enterValidPayoutAmount || "Masukkan nominal penarikan yang valid")
      return
    }

    if (amount > availablePayoutInCurrentCurrency) {
      setPayoutErrorMsg(currentLang === "en" 
        ? `Amount exceeds available payout balance (${formatPrice(availablePayoutIdr, currentCurrency)})`
        : `Nominal melebihi saldo siap ditarik (${formatPrice(availablePayoutIdr, currentCurrency)})`)
      return
    }

    if (!bankAccount) {
      setPayoutErrorMsg(t.noBankAccountSavedAlert || "Rekening bank belum terdaftar. Silakan verifikasi rekening terlebih dahulu.")
      return
    }

    // Buka modal konfirmasi transfer
    setIsConfirmModalOpen(true)
  }

  // Langkah 2 Penarikan: Eksekusi Transfer Nyata Setelah Konfirmasi
  const handleExecutePayout = async () => {
    setPayoutLoading(true)
    setPayoutErrorMsg("")
    setPayoutSuccessMsg("")

    const amount = Number(withdrawAmountInput)
    const amountInIdr = currentCurrency === "USD" ? Math.round(amount * 18051) : amount

    try {
      const res = await fetch("/api/host/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInIdr,
          notes: `Penarikan dana oleh host ke ${bankAccount?.bankName} - ${bankAccount?.accountNumber}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memproses penarikan dana")

      setPayoutsList((prev) => [data.payout, ...prev])
      setIsConfirmModalOpen(false)
      setPayoutSuccessMsg("Permintaan penarikan dana berhasil diproses.")
      setCompletedReceipt({
        ...data.payout,
        displayAmount: formatPrice(amountInIdr, currentCurrency),
      })
      setWithdrawAmountInput("")
    } catch (err: any) {
      setIsConfirmModalOpen(false)
      setPayoutErrorMsg(err.message)
    } finally {
      setPayoutLoading(false)
    }
  }

  const getBadgeClass = (status: string, paymentStatus: string) => {
    if (status === "CANCELLED") return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    if (paymentStatus === "PAID") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
  }

  const getBadgeText = (status: string, paymentStatus: string) => {
    if (status === "CANCELLED") return t.statusCancelled
    if (paymentStatus === "PAID") return t.statusPaid
    return t.statusPending
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. INTERACTIVE KPI CARDS SEBAGAI TAB NAVIGASI UTAMA     */}
      {/* ======================================================== */}
      {role === "HOST" && (
        <div className="space-y-4">
          {/* Dynamic Host KYC Status Banner (Model Hybrid) */}
          {currentUser && currentUser.kycStatus === "UNVERIFIED" && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                    {currentLang === "en" ? "Host Identity Verification Required (KYC)" : "Verifikasi Identitas Host Diperlukan (KYC)"}
                  </h4>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed max-w-3xl">
                    {currentLang === "en"
                      ? "Your property listings are kept as DRAFT and hidden from public search until you complete ID Card (KTP) verification."
                      : "Listing properti Anda saat ini berstatus DRAFT dan belum dapat dicari tamu hingga Anda melengkapi verifikasi KTP."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKycModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold px-3.5 py-2 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{currentLang === "en" ? "Verify ID (KTP) Now" : "Verifikasi KTP Sekarang"}</span>
              </button>
            </div>
          )}

          {currentUser && currentUser.kycStatus === "PENDING" && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200">
                    {currentLang === "en" ? "ID Documents Under Admin Review" : "Dokumen Identitas Sedang Ditinjau Admin"}
                  </h4>
                  <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-relaxed max-w-3xl">
                    {currentLang === "en"
                      ? "Your KTP verification is currently being audited by Admin. Properties will be published automatically once approved."
                      : "Pengajuan verifikasi KTP sedang diproses tim Admin (maks 1x24 jam). Listing otomatis tayang begitu disetujui."}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200 shrink-0 self-start sm:self-center">
                PENDING AUDIT
              </span>
            </div>
          )}

          {currentUser && currentUser.kycStatus === "REJECTED" && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-rose-900 dark:text-rose-200">
                    {currentLang === "en" ? "Identity Verification Rejected" : "Verifikasi Identitas Ditolak"}
                  </h4>
                  <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 leading-relaxed max-w-3xl">
                    {currentUser.kycRejectReason 
                      ? `Alasan penolakan: "${currentUser.kycRejectReason}"` 
                      : (currentLang === "en" ? "Please re-upload a clearer photo of your ID Card." : "Silakan unggah ulang foto KTP yang lebih jelas.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKycModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-3.5 py-2 shrink-0 shadow-xs cursor-pointer self-start sm:self-center"
              >
                {currentLang === "en" ? "Re-upload ID Card" : "Unggah Ulang KTP"}
              </button>
            </div>
          )}

          {currentUser && currentUser.kycStatus === "VERIFIED" && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-xs">
                  {currentLang === "en" ? "Official Verified Host Account" : "Akun Host Terverifikasi Resmi"}
                </span>
                {currentUser.idCardNumber && (
                  <span className="text-[11px] text-muted-foreground">· NIK: {currentUser.idCardNumber.substring(0, 6)}******</span>
                )}
              </div>
              <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                ACTIVE
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Card Tab 1: Kelola Properti */}
            <button
              type="button"
              onClick={() => setActiveTab("properties")}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                activeTab === "properties"
                  ? "bg-white dark:bg-gray-900 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
              )}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.statProperties}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    {myProperties.length}
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">unit</span>
                </div>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                activeTab === "properties"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-500 group-hover:scale-105"
              )}>
                <Building2 className="w-5 h-5" />
              </div>
            </button>

            {/* Card Tab 2: Reservasi Masuk */}
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                activeTab === "bookings"
                  ? "bg-white dark:bg-gray-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
              )}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.tabBookings}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    {incomingBookings.length}
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {paidBookingsCount} Lunas
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                activeTab === "bookings"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-500 group-hover:scale-105"
              )}>
                <CalendarDays className="w-5 h-5" />
              </div>
            </button>

            {/* Card Tab 3: Kalender & Ketersediaan */}
            <button
              type="button"
              onClick={() => setActiveTab("availability")}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                activeTab === "availability"
                  ? "bg-white dark:bg-gray-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
              )}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.tabAvailability}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    {blockedDatesList.length}
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">terkunci</span>
                </div>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                activeTab === "availability"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-500 group-hover:scale-105"
              )}>
                <CalendarX className="w-5 h-5" />
              </div>
            </button>

            {/* Card Tab 4: Pencairan Dana & Rekening */}
            <button
              type="button"
              onClick={() => setActiveTab("payouts")}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                activeTab === "payouts"
                  ? "bg-white dark:bg-gray-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
              )}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {t.tabPayouts}
                  </span>
                  {bankAccount ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Rekening terdaftar" />
                  ) : (
                    <span className="px-1 py-0.2 rounded-full text-[8px] font-bold bg-amber-500 text-white">Setup</span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 truncate">
                  {formatPrice(totalRevenue, currentCurrency)}
                </h3>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                activeTab === "payouts"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 group-hover:scale-105"
              )}>
                <Landmark className="w-5 h-5" />
              </div>
            </button>

            {/* Card Tab 5: Perjalanan Saya */}
            <button
              type="button"
              onClick={() => setActiveTab("trips")}
              className={cn(
                "p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                activeTab === "trips"
                  ? "bg-white dark:bg-gray-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-2xs"
              )}
            >
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t.tabTrips}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">
                    {myBookings.length}
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-medium">pesanan</span>
                </div>
              </div>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                activeTab === "trips"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 group-hover:scale-105"
              )}>
                <Luggage className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1.B. INTERACTIVE KPI CARDS KHUSUS TAMU (GUEST PERSONA)   */}
      {/* ======================================================== */}
      {role !== "HOST" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: Mendatang */}
            <button
              type="button"
              onClick={() => setTripFilter(tripFilter === "UPCOMING" ? "ALL" : "UPCOMING")}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                tripFilter === "UPCOMING"
                  ? "bg-white dark:bg-gray-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-xs"
              )}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {currentLang === "en" ? "Upcoming" : "Mendatang"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {upcomingTrips.length}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {currentLang === "en" ? "stays" : "menginap"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                tripFilter === "UPCOMING"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:scale-105"
              )}>
                <Luggage className="w-5 h-5" />
              </div>
            </button>

            {/* Card 2: Selesai */}
            <button
              type="button"
              onClick={() => setTripFilter(tripFilter === "COMPLETED" ? "ALL" : "COMPLETED")}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                tripFilter === "COMPLETED"
                  ? "bg-white dark:bg-gray-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-xs"
              )}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {currentLang === "en" ? "Completed" : "Selesai"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {completedTrips.length}
                  </h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {currentLang === "en" ? "can review" : "bisa ulas"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                tripFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:scale-105"
              )}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </button>

            {/* Card 3: Menunggu Bayar */}
            <button
              type="button"
              onClick={() => setTripFilter(tripFilter === "PENDING" ? "ALL" : "PENDING")}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                tripFilter === "PENDING"
                  ? "bg-white dark:bg-gray-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-xs"
              )}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {currentLang === "en" ? "Pending" : "Menunggu Bayar"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {pendingTrips.length}
                  </h3>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    {currentLang === "en" ? "60m limit" : "60 menit"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                tripFilter === "PENDING"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 group-hover:scale-105"
              )}>
                <Clock className="w-5 h-5" />
              </div>
            </button>

            {/* Card 4: Dibatalkan */}
            <button
              type="button"
              onClick={() => setTripFilter(tripFilter === "CANCELLED" ? "ALL" : "CANCELLED")}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden",
                tripFilter === "CANCELLED"
                  ? "bg-white dark:bg-gray-900 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-xs"
              )}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {currentLang === "en" ? "Cancelled" : "Dibatalkan"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {cancelledTrips.length}
                  </h3>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    {currentLang === "en" ? "refunded" : "riwayat"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                tripFilter === "CANCELLED"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-500 group-hover:scale-105"
              )}>
                <XCircle className="w-5 h-5" />
              </div>
            </button>

            {/* Card 5: Semua */}
            <button
              type="button"
              onClick={() => setTripFilter("ALL")}
              className={cn(
                "p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden col-span-2 sm:col-span-1",
                tripFilter === "ALL"
                  ? "bg-white dark:bg-gray-900 border-violet-500 ring-2 ring-violet-500/20 shadow-md"
                  : "bg-white/70 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-900 shadow-xs"
              )}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {currentLang === "en" ? "All Trips" : "Semua Pesanan"}
                </span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                    {myBookings.length}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {currentLang === "en" ? "total" : "total"}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                tripFilter === "ALL"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-violet-50 dark:bg-violet-950/40 text-violet-600 group-hover:scale-105"
              )}>
                <Compass className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Bar Action & Context Header Khusus Sesuai Tab yang Aktif */}
      {role === "HOST" && (
        <div className="flex items-center justify-between pt-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {activeTab === "properties" && t.tabProperties}
              {activeTab === "bookings" && t.tabBookings}
              {activeTab === "availability" && t.tabAvailability}
              {activeTab === "payouts" && t.tabPayouts}
              {activeTab === "trips" && t.tabTrips}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === "bookings" && (
              <button
                type="button"
                onClick={handleExportCSV}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs rounded-xl shadow-xs px-3.5 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                )}
                title={t.exportReportDesc}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.exportReport}</span>
              </button>
            )}

            {activeTab === "properties" && (
              <Link
                href="/properties/new"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 px-4 py-2 flex items-center gap-2 cursor-pointer transition-all"
                )}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.btnAddProperty}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BAGIAN 1: MODUL KELOLA PROPERTI                          */}
      {/* ======================================================== */}
      {activeTab === "properties" && role === "HOST" && (
        <div className="space-y-6">
          {/* Bar Pencarian Properti */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchPropertyPlaceholder}
                value={propSearch}
                onChange={e => setPropSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground self-start sm:self-center">
              Menampilkan {filteredProperties.length} dari {myProperties.length} properti
            </p>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.noPropertiesFound}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-5">
                Mulai sewakan akomodasi Anda dan raih pemesanan pertama.
              </p>
              <Link
                href="/properties/new"
                className={cn(buttonVariants({ variant: "default" }), "bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold")}
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                {t.addProperty}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProperties.map(p => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative h-42 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <img
                      src={p.imageUrls[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600"}
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
                          {formatPrice(p.pricePerNight || (p.price ? p.price * 18051 : 0), currentCurrency)}
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* BAGIAN 2: MODUL RESERVASI MASUK (PEMESANAN DARI TAMU)    */}
      {/* ======================================================== */}
      {activeTab === "bookings" && role === "HOST" && (
        <div className="space-y-6">
          {/* Bar Filter Status dan Pencarian Reservasi */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t.searchBookingPlaceholder}
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setBookingFilterStatus("ALL")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  bookingFilterStatus === "ALL"
                    ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                )}
              >
                {t.allStatuses}
              </button>
              <button
                type="button"
                onClick={() => setBookingFilterStatus("PAID")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  bookingFilterStatus === "PAID"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.statusPaid}</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingFilterStatus("PENDING")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  bookingFilterStatus === "PENDING"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t.statusPending}</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingFilterStatus("CANCELLED")}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                  bookingFilterStatus === "CANCELLED"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                )}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{t.statusCancelled}</span>
              </button>
            </div>
          </div>

          {filteredIncomingBookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30">
              <CalendarDays className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.noBookingsFound}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t.noIncomingBookingsWithFilter || "Belum ada reservasi masuk dengan filter yang dipilih."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredIncomingBookings.map(b => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between gap-3.5"
                >
                  {/* Kolom Info Properti & Tamu */}
                  <div className="flex gap-3.5 items-start">
                    <img
                      src={b.property?.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=300"}
                      alt={b.property?.title}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                        <Link href={`/properties/${b.propertyId}`} className="hover:text-rose-500 transition-colors">
                          {b.property?.title}
                        </Link>
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{b.guest?.name}</span>
                          <span className="hidden sm:inline text-[11px]">({b.guest?.email})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {new Date(b.startDate).toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short" })}
                          {" — "}
                          {new Date(b.endDate).toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Status & Aksi Pembatalan */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getBadgeClass(b.status, b.paymentStatus))}>
                        {getBadgeText(b.status, b.paymentStatus)}
                      </span>
                      {b.paymentStatus === "PAID" && b.escrowStatus === "RELEASED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {t.escrowReleasedBadge || "Escrow Dirilis"}
                        </span>
                      )}
                      {b.paymentStatus === "PAID" && b.escrowStatus === "HELD" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {t.escrowHeldBadge || "Escrow Ditahan"}
                        </span>
                      )}
                      {b.escrowStatus === "REFUNDED_TO_GUEST" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {currentLang === "en" ? "Refunded to Guest" : "Refund ke Tamu"}
                        </span>
                      )}
                      <span className="text-sm font-black text-gray-900 dark:text-gray-100">
                        {formatPrice(b.totalPriceIdr || (b.totalPrice ? b.totalPrice * 18051 : 0), currentCurrency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <HostBookingActions booking={b} t={t} currentLang={currentLang} />
                    </div>
                  </div>

                  {b.cancelReason && (
                    <p className="text-[11px] text-red-600 dark:text-red-400 italic bg-red-50 dark:bg-red-950/40 p-2 rounded-xl">
                      {t.cancelReasonLabel || (currentLang === "en" ? "Cancellation reason:" : "Alasan batal:")} "{b.cancelReason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* BAGIAN 3: MODUL KALENDER & KETERSEDIAAN (BLOKIR TANGGAL) */}
      {/* ======================================================== */}
      {activeTab === "availability" && role === "HOST" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Blokir Tanggal Baru (5 Kolom) */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>{t.blockDatesTitle}</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.blockDatesDesc}
              </p>
            </div>

            <form onSubmit={handleCreateBlockedDate} className="space-y-3.5">
              {/* Pilih Properti */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.selectProperty}
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={e => setSelectedPropertyId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500 transition-colors"
                >
                  {myProperties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Mulai & Selesai Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.checkIn} (Mulai)
                  </label>
                  <input
                    type="date"
                    required
                    value={blockStartDate}
                    min={getWibDateString(new Date())}
                    onChange={e => setBlockStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.checkOut} (Selesai)
                  </label>
                  <input
                    type="date"
                    required
                    value={blockEndDate}
                    min={blockStartDate || getWibDateString(new Date())}
                    onChange={e => setBlockEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              {/* Alasan Blokir */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.blockReason}
                </label>
                <input
                  type="text"
                  placeholder={t.blockReasonPlaceholder}
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={blockingLoading || !selectedPropertyId || !blockStartDate || !blockEndDate}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{blockingLoading ? t.blockingDate : t.btnBlockDate}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List Tanggal yang Sedang Diblokir (7 Kolom) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CalendarX className="w-4 h-4 text-gray-400" />
                <span>{t.activeBlockedDates}</span>
              </h4>
              <span className="text-xs text-muted-foreground font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">
                {blockedDatesList.length} terkunci
              </span>
            </div>

            {blockedDatesList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center bg-gray-50/50 dark:bg-gray-900/30">
                <CalendarDays className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t.noBlockedDates}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {blockedDatesList.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md inline-block">
                          {item.property?.title || "Properti"}
                        </span>
                        {item.isSystemLocked && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{currentLang === "en" ? "System Locked (Penalty)" : "Dikunci Sistem (Penalti Pembatalan)"}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>
                          {new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          {" — "}
                          {new Date(item.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </p>
                      {item.reason && (
                        <p className="text-[11px] text-muted-foreground italic">
                          "{item.reason}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      {item.isSystemLocked ? (
                        <div className="flex items-center gap-1 text-[11px] text-red-500 font-semibold italic">
                          <Lock className="w-3 h-3 text-red-500" />
                          <span>{currentLang === "en" ? "Locked by System" : "Terkunci Permanen"}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveBlockedDate(item.id)}
                          disabled={unblockingId === item.id}
                          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Unlock className="w-3 h-3 text-gray-400" />
                          <span>{unblockingId === item.id ? "Membuka..." : t.unblockDate}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BAGIAN 4: MODUL PENCAIRAN DANA & REKENING BANK HOST       */}
      {/* ======================================================== */}
      {activeTab === "payouts" && role === "HOST" && (
        <div className="space-y-8">
          {/* 3 Kartu Ringkasan Saldo Finansial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Saldo Siap Ditarik */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                  {t.readyToWithdraw}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {formatPrice(availablePayoutIdr, currentCurrency)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.readyToWithdrawDesc || "Dana dari tamu yang sudah menyelesaikan masa tinggal (check-out)."}</span>
              </p>
            </div>

            {/* 2. Saldo Tertahan (Escrow) */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tracking-wide uppercase">
                  {t.escrowBalance}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {formatPrice(escrowIdr, currentCurrency)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t.escrowBalanceDesc || "Ditahan sementara di platform hingga tamu selesai check-out."}</span>
              </p>
            </div>

            {/* 3. Total Dicairkan */}
            <div className="p-6 rounded-3xl bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 bg-white dark:bg-gray-900 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                  {t.totalWithdrawn}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {formatPrice(totalWithdrawnIdr, currentCurrency)}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t.totalWithdrawnDesc || "Total akumulasi dana yang telah berhasil ditransfer ke rekening bank Anda."}
              </p>
            </div>
          </div>

          {/* Grid Dua Kolom: Form Rekening Bank & Form Penarikan Dana */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Rekening Bank Host */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t.bankAccountTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {t.bankAccountDesc}
                  </p>
                </div>
              </div>

              {bankSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{bankSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveBankAccount} className="space-y-4">
                {/* Pilihan Bank */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.bankName}
                  </label>
                  <select
                    value={bankNameInput}
                    onChange={e => setBankNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
                  >
                    <option value="BCA">Bank BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">Bank BNI (Bank Negara Indonesia)</option>
                    <option value="BRI">Bank BRI (Bank Rakyat Indonesia)</option>
                    <option value="CIMB Niaga">Bank CIMB Niaga</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="Permata">Bank Permata</option>
                    <option value="Jago">Bank Jago</option>
                  </select>
                </div>

                {/* Nomor Rekening + Tombol Cek Rekening (Inquiry) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {t.accountNumber}
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {bankNameInput === "Mandiri" ? "13 digit" : bankNameInput === "BRI" ? "15 digit" : "10 digit"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 8820192381"
                      value={accountNumberInput}
                      onChange={e => {
                        setAccountNumberInput(e.target.value.replace(/\D/g, ""))
                        setInquiryResult(null)
                        setInquiryError("")
                      }}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCheckBankAccount}
                      disabled={checkingBank || !accountNumberInput}
                      className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {checkingBank ? "Memeriksa..." : "Periksa Rekening"}
                    </button>
                  </div>
                </div>

                {/* Pesan Kesalahan Inquiry */}
                {inquiryError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                {/* Hasil Inquiry Terverifikasi */}
                {inquiryResult && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Rekening Valid & Ditemukan ({inquiryResult.network})</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                      Atas Nama: <strong className="font-semibold text-emerald-950 dark:text-emerald-100">{inquiryResult.accountHolder}</strong>
                    </p>
                  </div>
                )}

                {/* Nama Pemilik Rekening */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.accountHolder} (Sesuai Buku Tabungan)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama terverifikasi otomatis setelah periksa rekening"
                    value={accountHolderInput}
                    onChange={e => setAccountHolderInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors uppercase font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBankLoading || !accountNumberInput || !accountHolderInput}
                  className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingBankLoading ? t.savingBankAccount : t.saveBankAccount}
                </button>
              </form>
            </div>

            {/* Form Permintaan Penarikan Dana */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t.requestPayout}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Cairkan penghasilan sewa langsung ke rekening bank Anda.
                  </p>
                </div>
              </div>

              {payoutErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{payoutErrorMsg}</span>
                </div>
              )}

              {payoutSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              )}

              {currentUser && currentUser.kycStatus !== "VERIFIED" && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Verifikasi Identitas Host Diperlukan</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Demi kepatuhan regulasi finansial dan anti-fraud, penarikan dana hanya dapat diproses setelah dokumen KTP Anda disetujui oleh tim Admin.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowKycModal(true)}
                    className="text-[11px] font-bold text-amber-900 dark:text-amber-100 underline cursor-pointer"
                  >
                    Lengkapi Verifikasi KTP Sekarang →
                  </button>
                </div>
              )}

              <form onSubmit={handleOpenConfirmPayout} className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {currentLang === "en" ? "Registered Payout Destination:" : "Tujuan Transfer Terdaftar:"}
                  </span>
                  {bankAccount ? (
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span>{bankAccount.bankName} - {bankAccount.accountNumber} ({bankAccount.accountHolder})</span>
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{t.noBankAccountSavedAlert || "Belum ada rekening bank yang tersimpan. Periksa dan simpan rekening di form samping terlebih dahulu."}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {t.payoutAmount} ({currentCurrency})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawAmountInput(String(availablePayoutInCurrentCurrency))
                        setPayoutErrorMsg("")
                      }}
                      disabled={availablePayoutInCurrentCurrency <= 0}
                      className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer disabled:opacity-40"
                    >
                      {currentLang === "en" ? "Withdraw All" : "Tarik Semua"} ({formatPrice(availablePayoutIdr, currentCurrency)})
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {currentCurrency === "USD" ? "$" : "Rp"}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={formatCurrencyInput(withdrawAmountInput)}
                      onChange={handleWithdrawInputChange}
                      className={cn(
                        "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-xs font-semibold outline-none transition-colors",
                        isOverBalance
                          ? "border-rose-500 focus:border-rose-600 text-rose-600"
                          : "border-gray-200 dark:border-gray-800 focus:border-rose-500 text-gray-900 dark:text-gray-100"
                      )}
                    />
                  </div>

                  {isOverBalance && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      Nominal melebihi saldo siap ditarik (Maksimal: {formatPrice(availablePayoutIdr, currentCurrency)})
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={payoutLoading || !bankAccount || availablePayoutInCurrentCurrency <= 0 || !withdrawAmountInput || currentWithdrawNum <= 0 || isOverBalance || (currentUser && currentUser.kycStatus !== "VERIFIED")}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Lanjutkan Penarikan</span>
                </button>
              </form>
            </div>
          </div>

          {/* Riwayat Penarikan Dana (Tabel Ledger) */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{t.payoutHistory}</span>
            </h4>

            {payoutsList.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center bg-gray-50/50 dark:bg-gray-900/30">
                <Landmark className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t.noPayoutHistory}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-4 py-3">ID Transaksi</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Tujuan Transfer</th>
                        <th className="px-4 py-3">Nominal</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {payoutsList.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[11px] text-gray-900 dark:text-gray-100">
                            PAY-{p.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{p.bankName}</span>
                            <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">{p.accountNumber}</span>
                            <div className="text-[10px] text-muted-foreground">{p.accountHolder}</div>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">
                            {formatPrice(p.amount, currentCurrency)}
                          </td>
                          <td className="px-4 py-3">
                            {p.status === "COMPLETED" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                {t.payoutStatusCompleted}
                              </span>
                            )}
                            {p.status === "PENDING" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                {t.payoutStatusPending}
                              </span>
                            )}
                            {p.status === "PROCESSING" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {t.payoutStatusProcessing}
                              </span>
                            )}
                            {p.status === "FAILED" && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                {t.payoutStatusFailed}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BAGIAN 5: MODUL PERJALANAN SAYA (UNTUK SEMUA PENGGUNA)   */}
      {/* ======================================================== */}
      {activeTab === "trips" && (
        <div className="space-y-6">
          {/* Bar Kontrol & Filter Pencarian Pesanan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">
                {t.myTrips || (currentLang === "en" ? "My Stays & Bookings" : "Riwayat & Jadwal Perjalanan")}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-muted-foreground ml-1">
                {filteredTrips.length} {currentLang === "en" ? "of" : "dari"} {myBookings.length}
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={currentLang === "en" ? "Search property or city..." : "Cari nama vila, kota..."}
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

              {/* Status Pill Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setTripFilter("ALL")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    tripFilter === "ALL"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {currentLang === "en" ? "All" : "Semua"}
                </button>
                <button
                  type="button"
                  onClick={() => setTripFilter("UPCOMING")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    tripFilter === "UPCOMING"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {currentLang === "en" ? "Upcoming" : "Mendatang"}
                </button>
                <button
                  type="button"
                  onClick={() => setTripFilter("COMPLETED")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    tripFilter === "COMPLETED"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {currentLang === "en" ? "Completed" : "Selesai"}
                </button>
                <button
                  type="button"
                  onClick={() => setTripFilter("PENDING")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    tripFilter === "PENDING"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {currentLang === "en" ? "Pending" : "Menunggu Bayar"}
                </button>
                <button
                  type="button"
                  onClick={() => setTripFilter("CANCELLED")}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    tripFilter === "CANCELLED"
                      ? "bg-rose-500 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {currentLang === "en" ? "Cancelled" : "Dibatalkan"}
                </button>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Layout: Maksimalkan Efisiensi & Ruang Visual */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Kolom Kiri: Daftar Kartu Perjalanan (8 Kolom di LG) */}
            <div className="lg:col-span-8 space-y-4">
              {filteredTrips.length === 0 ? (
                myBookings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-900/30">
                    <Luggage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {t.noTripsBooked || (currentLang === "en" ? "No trips booked yet" : "Belum ada perjalanan yang dipesan")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-5">
                      {t.exploreDesc || (currentLang === "en" ? "Find your perfect stay based on location." : "Cari destinasi impian Anda dan nikmati penginapan berkualitas.")}
                    </p>
                    <Link 
                      href="/" 
                      className={cn(buttonVariants({ variant: "default" }), "bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer")}
                    >
                      {t.startExplore || (currentLang === "en" ? "Start Exploring" : "Mulai Eksplorasi Sekarang")}
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
                    <Compass className="w-10 h-10 text-gray-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "No trips match the selected filter" : "Tidak ada pesanan yang sesuai dengan filter"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {currentLang === "en" ? "Try clearing search keywords or selecting another status category." : "Coba bersihkan kata kunci pencarian atau pilih kategori status lain."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setTripFilter("ALL"); setTripSearch("") }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{currentLang === "en" ? "Reset Filters" : "Reset Filter & Pencarian"}</span>
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {filteredTrips.map(b => {
                    const isPastCheckIn = nowTime >= toCheckInDateTimeWIB(b.startDate)
                    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate)
                    const isOngoing = isPastCheckIn && !isPastCheckOut && b.status === "CONFIRMED" && b.paymentStatus === "PAID"
                    const isCompleted = b.status === "COMPLETED" || (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && isPastCheckOut)
                    const nights = b.totalNights || calculateStayNights(b.startDate, b.endDate)

                    return (
                      <div 
                        key={b.id} 
                        className="rounded-2xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row group"
                      >
                        {/* Thumbnail Properti */}
                        <div className="w-full sm:w-56 md:w-64 h-52 sm:h-auto shrink-0 relative bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img 
                            src={b.property.imageUrls?.[0] || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400`} 
                            alt={b.property.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Dynamic Status Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            {b.status === "CANCELLED" ? (
                              <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-600/90 text-white shadow-xs">
                                {t.statusCancelled || (currentLang === "en" ? "Cancelled" : "Dibatalkan")}
                              </span>
                            ) : isOngoing ? (
                              <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600/90 text-white shadow-xs animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{currentLang === "en" ? "Ongoing Stay" : "Sedang Menginap"}</span>
                              </span>
                            ) : isCompleted ? (
                              <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/90 text-white shadow-xs">
                                ✓ {currentLang === "en" ? "Completed" : "Selesai"}
                              </span>
                            ) : b.paymentStatus === "PAID" ? (
                              <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-600/90 text-white shadow-xs">
                                {t.statusPaid || (currentLang === "en" ? "Confirmed" : "Terkonfirmasi")}
                              </span>
                            ) : (
                              <span className="backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-white shadow-xs">
                                {t.statusPending || (currentLang === "en" ? "Pending" : "Menunggu Bayar")}
                              </span>
                            )}
                          </div>

                          {/* Durasi Menginap Floating Badge */}
                          <div className="absolute bottom-2.5 left-2.5 backdrop-blur-md px-2 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                            {nights} {currentLang === "en" ? (nights > 1 ? "nights" : "night") : "malam"}
                          </div>
                        </div>

                        {/* Konten & Aksi Perjalanan */}
                        <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between gap-3">
                          {/* Header Detail */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-bold uppercase tracking-wider text-rose-500">
                                {b.property.category || "Ruang Rehat Stay"}
                              </span>
                              <span className="font-mono text-[10px] text-gray-400">
                                #{b.id.slice(-8).toUpperCase()}
                              </span>
                            </div>

                            <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-rose-500 transition-colors line-clamp-1">
                              <Link href={`/properties/${b.propertyId}`}>
                                {b.property.title}
                              </Link>
                            </h3>

                            <p className="text-muted-foreground text-xs flex items-center gap-1 truncate">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{b.property.address}</span>
                            </p>
                          </div>

                          {/* Info Tanggal & Finansial */}
                          <div className="bg-gray-50/80 dark:bg-gray-800/40 p-2.5 rounded-xl text-xs space-y-1.5 border border-gray-150 dark:border-gray-800/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                <CalendarDays className="w-3 h-3 text-gray-400" />
                                <span>{t.dates || (currentLang === "en" ? "Dates:" : "Jadwal:")}</span>
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                                {formatWibDate(b.startDate, currentLang === "en" ? "en" : "id")} (14:00) – {formatWibDate(b.endDate, currentLang === "en" ? "en" : "id")} (12:00 WIB)
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                              <div className="flex items-center gap-1 text-[11px]">
                                <span className="text-muted-foreground">{currentLang === "en" ? "Total Price:" : "Total Biaya:"}</span>
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>Escrow</span>
                                </span>
                              </div>
                              <span className="font-black text-sm text-gray-900 dark:text-white">
                                {formatPrice(b.totalPriceIdr || (b.totalPrice ? b.totalPrice * 18051 : 0), currentCurrency)}
                              </span>
                            </div>
                          </div>

                          {/* Notifikasi Pembatalan (Jika Dibatalkan) */}
                          {b.status === "CANCELLED" && (
                            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                              <div className="flex items-center justify-between font-semibold">
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{currentLang === "en" ? "Cancellation Notice" : "Catatan Pembatalan"}</span>
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60">
                                  {b.paymentStatus === "REFUNDED" ? (currentLang === "en" ? "Refund Processed" : "Refund 100% Diproses") : b.paymentStatus}
                                </span>
                              </div>
                              {b.cancelReason && (
                                <p className="italic text-[11px] text-rose-600 dark:text-rose-400 pl-4">
                                  "{b.cancelReason}"
                                </p>
                              )}
                            </div>
                          )}

                          {/* Notifikasi Sedang Menginap */}
                          {isOngoing && (
                            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
                              <span className="leading-tight">
                                {currentLang === "en" 
                                  ? "You are currently staying at this property. Enjoy your stay!" 
                                  : "Anda sedang dalam masa menginap. Selamat menikmati liburan Anda!"}
                              </span>
                            </div>
                          )}

                          {/* Area Aksi Sesuai Status Pesanan */}
                          <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                            {/* Jika Selesai Menginap (COMPLETED) */}
                            {isCompleted && (
                              <div className="space-y-2">
                                {/* Modul Ulasan Tamu */}
                                {b.reviews && b.reviews.length === 0 ? (
                                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{currentLang === "en" ? "How was your stay?" : "Bagaimana pengalaman Anda?"}</span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">
                                        {currentLang === "en" ? "Leave a 5-star review to support your host." : "Beri rating & ulasan untuk membantu wisatawan lain."}
                                      </p>
                                    </div>
                                    <div className="shrink-0 sm:w-44">
                                      <ReviewModal bookingId={b.id} propertyId={b.propertyId} currentLang={currentLang} t={t} />
                                    </div>
                                  </div>
                                ) : b.reviews && b.reviews.length > 0 ? (
                                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 text-amber-500">
                                        {[...Array(5)].map((_, i) => (
                                          <Star 
                                            key={i} 
                                            className={cn("w-3.5 h-3.5", i < (b.reviews[0]?.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300")} 
                                          />
                                        ))}
                                        <span className="font-bold text-gray-900 dark:text-gray-100 ml-1">
                                          {b.reviews[0]?.rating}/5
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                        ✓ {currentLang === "en" ? "Review Published" : "Ulasan Terbit"}
                                      </span>
                                    </div>
                                    {b.reviews[0]?.comment && (
                                      <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                                        "{b.reviews[0].comment}"
                                      </p>
                                    )}
                                  </div>
                                ) : null}

                                {/* Tombol Navigasi Sekunder */}
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/bookings/${b.id}/voucher`}
                                    className={cn(
                                      buttonVariants({ variant: "outline" }),
                                      "flex-1 text-xs rounded-xl font-semibold border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                  >
                                    {currentLang === "en" ? "View Receipt" : "Bukti Pembayaran"}
                                  </Link>
                                  <Link
                                    href={`/properties/${b.propertyId}`}
                                    className={cn(
                                      buttonVariants({ variant: "default" }),
                                      "flex-1 text-xs rounded-xl font-semibold bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                                    )}
                                  >
                                    {currentLang === "en" ? "Book Again" : "Pesan Lagi"}
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Jika Belum Selesai (Pending atau Confirmed Mendatang) */}
                            {!isCompleted && b.status !== "CANCELLED" && (
                              <GuestTripActions booking={b} t={t} currentLang={currentLang} />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Kolom Kanan: Paspor Pelancong, Wishlist & Jaminan Keamanan (4 Kolom di LG) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Widget 1: Kartu Profil Pelancong (Traveler Passport) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3.5 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "T"}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {currentUser?.name || (currentLang === "en" ? "Guest Traveler" : "Tamu Ruang Rehat")}
                      </h4>
                      <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentUser?.email || ""}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {currentLang === "en" ? "Completed Stays" : "Selesai Menginap"}
                    </span>
                    <span className="text-lg font-black text-gray-900 dark:text-gray-100">
                      {completedTrips.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {currentLang === "en" ? "Reviews Given" : "Ulasan Diberi"}
                    </span>
                    <span className="text-lg font-black text-amber-500">
                      {myBookings.filter(b => b.reviews && b.reviews.length > 0).length}
                    </span>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full rounded-2xl text-xs font-bold border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "Manage Profile & Security" : "Kelola Profil & Keamanan"}</span>
                </Link>
              </div>

              {/* Widget 2: Destinasi Impian Tersimpan (Wishlist Preview) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {currentLang === "en" ? "Wishlist Destinasi" : "Destinasi Favorit"}
                    </h4>
                  </div>
                  <Link 
                    href="/wishlists" 
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
                  >
                    <span>{currentLang === "en" ? "View all" : "Semua"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {userFavorites && userFavorites.length > 0 ? (
                  <div className="space-y-3">
                    {userFavorites.slice(0, 3).map((fav: any) => (
                      <Link 
                        key={fav.id} 
                        href={`/properties/${fav.property?.id}`}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <img 
                          src={fav.property?.imageUrls?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=200"} 
                          alt={fav.property?.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-rose-500 transition-colors">
                            {fav.property?.title}
                          </h5>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {fav.property?.address}
                          </p>
                          <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200 mt-0.5 block">
                            {formatPrice(fav.property?.pricePerNight || (fav.property?.price ? fav.property.price * 18051 : 0), currentCurrency)} <span className="font-normal text-muted-foreground">/ malam</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 text-center space-y-2 text-xs">
                    <p className="text-muted-foreground leading-relaxed">
                      {currentLang === "en" 
                        ? "Save places you love by clicking the heart icon on listings." 
                        : "Simpan vila impian Anda dengan menekan ikon hati pada listing properti."}
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
                    >
                      <span>{currentLang === "en" ? "Explore listings" : "Jelajahi Properti"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Widget 3: Perlindungan SafeStay & Escrow Midtrans */}
              <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-rose-500/5 via-transparent to-indigo-500/5 border border-rose-500/20 dark:border-rose-500/10 space-y-3.5">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold">
                    {currentLang === "en" ? "Ruang Rehat SafeStay™" : "Jaminan Perlindungan Tamu"}
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-gray-900 dark:text-gray-100 font-semibold">{currentLang === "en" ? "Escrow Protection:" : "Rekening Escrow Aman:"}</strong>{" "}
                      {currentLang === "en"
                        ? "Your payment is held securely by Midtrans and only released to the host 24 hours after successful check-in."
                        : "Dana sewa ditahan aman di penampungan resmi Midtrans dan baru diteruskan ke Host 24 jam setelah Anda sukses check-in."}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-gray-900 dark:text-gray-100 font-semibold">{currentLang === "en" ? "Transparent Cancellation:" : "Kepastian Kebijakan Refund:"}</strong>{" "}
                      {currentLang === "en"
                        ? "Guaranteed refunds based on property policy before the check-in deadline."
                        : "Pengembalian dana otomatis sesuai matriks kebijakan pembatalan properti sebelum jadwal check-in."}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <p>
                      <strong className="text-gray-900 dark:text-gray-100 font-semibold">{currentLang === "en" ? "24/7 Support:" : "Bantuan Tamu 24 Jam:"}</strong>{" "}
                      {currentLang === "en"
                        ? "Contact customer support if host is unreachable during check-in."
                        : "Tim dukungan pelanggan siap sedia membantu jika Anda mengalami kendala saat tiba di lokasi."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL KONFIRMASI TRANSFER DANA PERBANKAN (REVIEW)      */}
      {/* ======================================================== */}
      {isConfirmModalOpen && bankAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Konfirmasi Penarikan Dana
                </h3>
                <p className="text-xs text-muted-foreground">
                  Periksa rincian transfer sebelum memproses ke rekening bank Anda.
                </p>
              </div>
            </div>

            {/* Slip Rincian Transfer */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Bank Tujuan:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{bankAccount.bankName}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Nomor Rekening:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{bankAccount.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Nama Pemilik:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{bankAccount.accountHolder}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Metode Transfer:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">BI-FAST (Real-time Instan)</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center text-muted-foreground">
                <span>{t.serviceFee || (currentLang === "en" ? "Service Fee:" : "Biaya Layanan Admin:")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {currentLang === "en" ? "Free ($0)" : "Rp 0 (Gratis)"}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-gray-900 dark:text-gray-100">
                  {currentLang === "en" ? "Total Transferred:" : "Total Ditransfer:"}
                </span>
                <span className="text-rose-600 dark:text-rose-400 text-base">
                  {formatPrice(
                    currentCurrency === "USD" ? Number(withdrawAmountInput) : Number(withdrawAmountInput) / 15000,
                    currentCurrency
                  )}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                {t.payoutWarningNotice || "Pastikan nama pemilik rekening sesuai dengan buku tabungan Anda. Penarikan yang sudah diproses tidak dapat dibatalkan."}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={payoutLoading}
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {t.cancel || (currentLang === "en" ? "Cancel" : "Batal")}
              </button>
              <button
                type="button"
                disabled={payoutLoading}
                onClick={handleExecutePayout}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {payoutLoading 
                    ? (currentLang === "en" ? "Processing Transfer..." : "Memproses Transfer...") 
                    : (currentLang === "en" ? "Yes, Confirm & Withdraw" : "Ya, Konfirmasi & Cairkan")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. STRUK DIGITAL / RESI TRANSFER BERHASIL (RECEIPT)       */}
      {/* ======================================================== */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                {currentLang === "en" ? "Transfer Successfully Processed" : "Transfer Berhasil Diproses"}
              </span>
              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-3">
                {completedReceipt.displayAmount}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {t.payoutSuccessCompletedNotice || "Dana telah berhasil dikirimkan ke rekening bank Anda."}
              </p>
            </div>

            {/* Kotak Detail Resi */}
            <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>No. Referensi:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                  PAY-{completedReceipt.id.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Waktu Transaksi:</span>
                <span className="text-gray-900 dark:text-gray-100">
                  {new Date(completedReceipt.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Bank Tujuan:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {completedReceipt.bankName} ({completedReceipt.accountNumber})
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Penerima:</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{completedReceipt.accountHolder}</span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t border-gray-200 dark:border-gray-700 pt-2">
                <span>Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">SELESAI (COMPLETED)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCompletedReceipt(null)}
              className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs transition-all cursor-pointer shadow-sm"
            >
              Tutup Resi
            </button>
          </div>
        </div>
      )}

      {/* Reusable KYC Verification Modal for Host */}
      <KycModal
        open={showKycModal}
        onOpenChange={setShowKycModal}
        user={currentUser}
        currentLang={currentLang}
      />
    </div>
  )
}
