"use client"

import { useState, useRef } from "react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Globe,
  Building2,
  Check,
  CheckCircle2,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Mail,
  Home,
  Pencil,
  Plus,
  BadgeCheck,
  Luggage,
  Heart,
  Star,
  SlidersHorizontal,
  X,
  Compass,
  Ticket,
  Clock,
  ShieldAlert,
  Download,
  Database,
  AlertTriangle,
  Users,
  Calendar
} from "lucide-react"
import { updateProfile, changePassword, changeEmail, updatePrivacySettings, updateNotificationSettings, updateBusinessBilling } from "@/app/actions/preferences"
import KycModal from "@/components/KycModal"

interface ProfileUser {
  id: string
  name: string | null
  preferredName?: string | null
  email: string | null
  image: string | null
  phoneNumber?: string | null
  address?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
  kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
  idCardUrl?: string | null
  idCardNumber?: string | null
  kycRejectReason?: string | null
  role: string
  createdAt: string
  hasPassword: boolean
  hideLastNameReview?: boolean
  hideSearchEngines?: boolean
  readReceipts?: boolean
  notifyTripReminder?: boolean
  notifyPromoMarketing?: boolean
  notifyHostBooking?: boolean
  notifyHostPayout?: boolean
  billingCompanyName?: string
  billingTaxId?: string
  billingAddress?: string
  stats: {
    totalBookings: number
    totalProperties: number
    totalReviews: number
    totalFavorites: number
  }
}

type TabType =
  | "personal"
  | "security"
  | "privacy"
  | "notifications"
  | "payments"
  | "preferences"
  | "hosting"

export default function ProfileClient({
  user,
  currentLang,
  currentCurrency,
  t,
  adminStats
}: {
  user: ProfileUser
  currentLang: string
  currentCurrency: string
  t: any
  adminStats?: {
    pendingKyc: number
    pendingPayouts: number
    totalUsers: number
    totalProperties: number
  }
}) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

  // Sub-menu Tab State (Default: personal)
  const [activeTab, setActiveTab] = useState<TabType>("personal")

  // State inline edit accordion: 'name' | 'photo' | 'prefName' | 'email' | 'phone' | 'password' | 'lang' | 'currency' | 'theme' | null
  const [editingSection, setEditingSection] = useState<string | null>(null)

  // Form State: Informasi Pribadi & Preferensi
  const [name, setName] = useState(user.name || "")
  const [preferredName, setPreferredName] = useState(user.preferredName || "")
  const [image, setImage] = useState(user.image || "")
  const [phone, setPhone] = useState(user.phoneNumber || "")
  const [address, setAddress] = useState(user.address || "")
  const [emergencyName, setEmergencyName] = useState(user.emergencyContactName || "")
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContactPhone || "")
  const [emergencyRelation, setEmergencyRelation] = useState(user.emergencyContactRelation || "")
  const [lang, setLang] = useState(currentLang)
  const [currency, setCurrency] = useState(currentCurrency)

  // Status State
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showKycModal, setShowKycModal] = useState(false)

  // Form State: Ganti Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState("")

  // Form State: Ganti Email Terverifikasi Kata Sandi
  const [currentEmail, setCurrentEmail] = useState(user.email || "")
  const [newEmailInput, setNewEmailInput] = useState("")
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState("")
  const [emailError, setEmailError] = useState("")
  const [showEmailPw, setShowEmailPw] = useState(false)

  // Form State: Privasi & Tata Kelola Data Pribadi
  const [hideLastName, setHideLastName] = useState(user.hideLastNameReview ?? false)
  const [hideSearch, setHideSearch] = useState(user.hideSearchEngines ?? false)
  const [readReceipts, setReadReceipts] = useState(user.readReceipts ?? true)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacySuccessMsg, setPrivacySuccessMsg] = useState("")
  const [exportingData, setExportingData] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  // Handler: Update Toggle Privasi
  const handleTogglePrivacy = async (key: "hideLastName" | "hideSearch" | "readReceipts", newVal: boolean) => {
    const updatedLastName = key === "hideLastName" ? newVal : hideLastName
    const updatedSearch = key === "hideSearch" ? newVal : hideSearch
    const updatedReceipts = key === "readReceipts" ? newVal : readReceipts

    if (key === "hideLastName") setHideLastName(newVal)
    if (key === "hideSearch") setHideSearch(newVal)
    if (key === "readReceipts") setReadReceipts(newVal)

    setSavingPrivacy(true)
    setPrivacySuccessMsg("")
    try {
      await updatePrivacySettings({
        hideLastNameReview: updatedLastName,
        hideSearchEngines: updatedSearch,
        readReceipts: updatedReceipts
      })
      setPrivacySuccessMsg(
        currentLang === "en" ? "Privacy settings updated" : "Pengaturan privasi berhasil disimpan"
      )
      setTimeout(() => setPrivacySuccessMsg(""), 3000)
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui pengaturan privasi")
    } finally {
      setSavingPrivacy(false)
    }
  }

  // Handler: Ekspor Data Pribadi (UU PDP / GDPR)
  const handleExportData = async () => {
    setExportingData(true)
    try {
      const res = await fetch("/api/user/export-data")
      if (!res.ok) throw new Error("Gagal mengekspor data")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `ruang-rehat-data-export-${user.id}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err.message || "Gagal mengunduh arsip data pribadi")
    } finally {
      setExportingData(false)
    }
  }

  // Form State: Preferensi Notifikasi Interaktif
  const [notifyTrip, setNotifyTrip] = useState(user.notifyTripReminder ?? true)
  const [notifyPromo, setNotifyPromo] = useState(user.notifyPromoMarketing ?? false)
  const [notifyHostBook, setNotifyHostBook] = useState(user.notifyHostBooking ?? true)
  const [notifyPayout, setNotifyPayout] = useState(user.notifyHostPayout ?? true)
  const [savingNotify, setSavingNotify] = useState(false)
  const [notifySuccessMsg, setNotifySuccessMsg] = useState("")

  // Handler: Update Toggle Notifikasi
  const handleToggleNotify = async (
    key: "trip" | "promo" | "hostBook" | "payout",
    newVal: boolean
  ) => {
    const upTrip = key === "trip" ? newVal : notifyTrip
    const upPromo = key === "promo" ? newVal : notifyPromo
    const upHostBook = key === "hostBook" ? newVal : notifyHostBook
    const upPayout = key === "payout" ? newVal : notifyPayout

    if (key === "trip") setNotifyTrip(newVal)
    if (key === "promo") setNotifyPromo(newVal)
    if (key === "hostBook") setNotifyHostBook(newVal)
    if (key === "payout") setNotifyPayout(newVal)

    setSavingNotify(true)
    setNotifySuccessMsg("")
    try {
      await updateNotificationSettings({
        notifyTripReminder: upTrip,
        notifyPromoMarketing: upPromo,
        notifyHostBooking: upHostBook,
        notifyHostPayout: upPayout
      })
      setNotifySuccessMsg(
        currentLang === "en" ? "Notification settings updated" : "Pengaturan notifikasi berhasil disimpan"
      )
      setTimeout(() => setNotifySuccessMsg(""), 3000)
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui pengaturan notifikasi")
    } finally {
      setSavingNotify(false)
    }
  }

  // Form State: Informasi Penagihan Bisnis (Business Travel Billing)
  const [billingCompany, setBillingCompany] = useState(user.billingCompanyName || "")
  const [billingTax, setBillingTax] = useState(user.billingTaxId || "")
  const [billingAddr, setBillingAddr] = useState(user.billingAddress || "")
  const [savingBilling, setSavingBilling] = useState(false)
  const [billingSuccessMsg, setBillingSuccessMsg] = useState("")
  const [billingError, setBillingError] = useState("")
  const [isEditingBilling, setIsEditingBilling] = useState(false)

  // Handler: Simpan Informasi Penagihan Bisnis
  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBilling(true)
    setBillingError("")
    setBillingSuccessMsg("")
    try {
      await updateBusinessBilling({
        billingCompanyName: billingCompany,
        billingTaxId: billingTax,
        billingAddress: billingAddr
      })
      setBillingSuccessMsg(
        currentLang === "en" ? "Business billing details updated!" : "Informasi penagihan bisnis berhasil disimpan!"
      )
      setIsEditingBilling(false)
      setTimeout(() => setBillingSuccessMsg(""), 3500)
    } catch (err: any) {
      setBillingError(err.message || (currentLang === "en" ? "Failed to save billing info" : "Gagal menyimpan informasi penagihan"))
    } finally {
      setSavingBilling(false)
    }
  }

  // Format tanggal bergabung
  const joinDate = (() => {
    try {
      const date = new Date(user.createdAt)
      return date.toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID", {
        month: "long",
        year: "numeric"
      })
    } catch {
      return "-"
    }
  })()

  // Handler: Upload Foto Langsung
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (currentLang === "en" ? "Failed to upload photo" : "Gagal mengunggah foto"))
      }

      setImage(data.url)
    } catch (err: any) {
      alert(err.message || (currentLang === "en" ? "Failed to upload image. Please check file format." : "Gagal mengunggah gambar. Pastikan format file sesuai."))
    } finally {
      setUploadingImage(false)
    }
  }

  // Handler: Simpan Profil
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoadingProfile(true)
    setProfileSuccess(false)

    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("preferredName", preferredName)
      formData.set("image", image)
      formData.set("phoneNumber", phone)
      formData.set("address", address)
      formData.set("emergencyContactName", emergencyName)
      formData.set("emergencyContactPhone", emergencyPhone)
      formData.set("emergencyContactRelation", emergencyRelation)
      formData.set("lang", lang)
      formData.set("currency", currency)

      await updateProfile(formData)
      setProfileSuccess(true)
      setEditingSection(null)
      router.refresh()
      setTimeout(() => setProfileSuccess(false), 4000)
    } catch (err: any) {
      alert(err.message || (currentLang === "en" ? "Failed to update profile" : "Gagal memperbarui profil"))
    } finally {
      setLoadingProfile(false)
    }
  }

  // Handler: Ganti Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwSuccess(false)

    if (newPassword.length < 6) {
      setPwError(currentLang === "en" ? "New password must be at least 6 characters" : "Kata sandi baru minimal 6 karakter")
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError(currentLang === "en" ? "New passwords do not match" : "Konfirmasi kata sandi baru tidak cocok")
      return
    }

    setPwLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPwSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setEditingSection(null)
      setTimeout(() => setPwSuccess(false), 4000)
    } catch (err: any) {
      setPwError(err.message || "Gagal mengganti kata sandi")
    } finally {
      setPwLoading(false)
    }
  }

  // Handler: Ganti Email Terverifikasi Kata Sandi
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setEmailSuccess("")

    const cleanInput = newEmailInput.trim().toLowerCase()
    if (!cleanInput) {
      setEmailError(currentLang === "en" ? "Please enter a valid new email address." : "Silakan masukkan alamat email baru.")
      return
    }

    if (cleanInput === currentEmail.toLowerCase()) {
      setEmailError(currentLang === "en" ? "New email cannot be identical to your current email." : "Alamat email baru tidak boleh sama dengan email saat ini.")
      return
    }

    if (!emailCurrentPassword) {
      setEmailError(currentLang === "en" ? "Please enter your current account password for security verification." : "Silakan masukkan kata sandi akun saat ini untuk verifikasi keamanan.")
      return
    }

    setEmailLoading(true)
    try {
      const res = await changeEmail(cleanInput, emailCurrentPassword)
      if (res.success && res.email) {
        setCurrentEmail(res.email)
        setEmailSuccess(currentLang === "en" ? "Email address updated successfully!" : "Alamat email berhasil diperbarui!")
        setNewEmailInput("")
        setEmailCurrentPassword("")
        setTimeout(() => {
          setEditingSection(null)
          setEmailSuccess("")
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setEmailError(err.message || (currentLang === "en" ? "Failed to update email address" : "Gagal memperbarui alamat email"))
    } finally {
      setEmailLoading(false)
    }
  }

  // Masked email ala Airbnb
  const maskedEmail = (() => {
    if (!currentEmail) return currentLang === "en" ? "Not provided" : "Tidak disediakan"
    const parts = currentEmail.split("@")
    if (parts.length !== 2) return currentEmail
    const userPart = parts[0]
    if (userPart.length <= 2) return `${userPart[0]}***@${parts[1]}`
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${parts[1]}`
  })()

  // Item Menu Navigasi Sisi Kiri (Relevan & Kontekstual untuk Tamu & Tuan Rumah)
  const sidebarItems = [
    {
      id: "personal" as TabType,
      label: currentLang === "en" ? "Personal info" : "Informasi pribadi",
      sub: currentLang === "en" ? "Legal name, email & photo" : "Nama, email & foto profil",
      icon: User
    },
    {
      id: "security" as TabType,
      label: currentLang === "en" ? "Login & security" : "Log masuk & keamanan",
      sub: currentLang === "en" ? "Password & protection" : "Kata sandi & proteksi akun",
      icon: Shield
    },
    {
      id: "privacy" as TabType,
      label: currentLang === "en" ? "Privacy & sharing" : "Privasi & berbagi",
      sub: currentLang === "en" ? "Account data & visibility" : "Kelola data akun & visibilitas",
      icon: Eye
    },
    {
      id: "notifications" as TabType,
      label: currentLang === "en" ? "Notifications" : "Notifikasi",
      sub: isHost
        ? (currentLang === "en" ? "Booking alerts & host payouts" : "Pemesanan tamu & pencairan")
        : (currentLang === "en" ? "E-vouchers & trip reminders" : "E-voucher & pengingat menginap"),
      icon: Bell
    },
    {
      id: "payments" as TabType,
      label: isHost
        ? (currentLang === "en" ? "Payouts & bank accounts" : "Pencairan & rekening bank")
        : (currentLang === "en" ? "Payments & receipts" : "Pembayaran & tagihan"),
      sub: isHost
        ? (currentLang === "en" ? "Bank accounts & earnings" : "Rekening BI-FAST & pendapatan")
        : (currentLang === "en" ? "Trip receipts & e-vouchers" : "Bukti transfer & e-voucher"),
      icon: CreditCard
    },
    {
      id: "preferences" as TabType,
      label: currentLang === "en" ? "Global preferences" : "Bahasa & terjemahan",
      sub: currentLang === "en" ? "Language, currency & theme" : "Bahasa, mata uang & tema",
      icon: Globe,
      badge: currentLang === "en" ? "New" : "Baru"
    }
  ]

  // Item Tab Terakhir (Role Contextual: Admin Governance vs Host Professional vs Guest Host Opportunity)
  const hostingItem = {
    id: "hosting" as TabType,
    label: isAdmin
      ? (currentLang === "en" ? "Admin governance & oversight" : "Tata kelola & pengawasan admin")
      : isHost
      ? (currentLang === "en" ? "Professional hosting tools" : "Fitur menerima tamu profesional")
      : (currentLang === "en" ? "Become a Host" : "Jadikan ruang Anda Ruang Rehat"),
    sub: isAdmin
      ? (currentLang === "en" ? "KYC review, payouts & platform control" : "Persetujuan KYC, payout BI-FAST & sistem")
      : isHost 
      ? (currentLang === "en" ? "Manage properties & operational standards" : "Kelola properti & standar operasional") 
      : (currentLang === "en" ? "Earn extra income with your space" : "Mulai raih penghasilan sewa fleksibel"),
    icon: isAdmin ? ShieldAlert : (isHost ? Building2 : Sparkles),
    badge: isAdmin
      ? (currentLang === "en" ? "Admin" : "Admin")
      : (isHost ? undefined : (currentLang === "en" ? "Earn" : "Peluang"))
  }

  return (
    <div className="w-full space-y-6">
      
      {/* ======================================================== */}
      {/* 1. TOP BAR DENGAN TOMBOL 'SELESAI' MODERN               */}
      {/* ======================================================== */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
          <Link href="/" className="hover:text-rose-500 transition-colors">
            {currentLang === "en" ? "Home" : "Beranda"}
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <span className="text-gray-900 dark:text-gray-100 font-semibold">
            {currentLang === "en" ? "Account settings" : "Pengaturan akun"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-5 py-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <span>{currentLang === "en" ? "Done" : "Selesai"}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. DUAL-ROLE HERO BANNER (RELEVAN UNTUK TAMU MAUPUN HOST)*/}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-rose-50/20 to-indigo-50/10 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950 border border-gray-200/80 dark:border-gray-800 shadow-xs relative overflow-hidden">
        {/* Glow Ambient Dekoratif */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          
          {/* Sisi Kiri: Foto, Nama, Status Peran */}
          <div className="flex items-center gap-3.5 sm:gap-4.5">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 sm:h-18 sm:w-18 ring-2 ring-rose-500/20 ring-offset-2 dark:ring-offset-gray-900 shadow-sm">
                <AvatarImage src={image || ""} alt={name || "User"} className="object-cover" />
                <AvatarFallback className="text-xl sm:text-2xl font-black bg-gradient-to-tr from-rose-500 to-rose-400 text-white">
                  {name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Tombol Kamera Instan */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer disabled:opacity-50"
                title={t.uploadPhoto}
              >
                {uploadingImage ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight truncate">
                  {name || "User"}
                </h2>

                {/* Badge Identitas Terverifikasi */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.verifiedIdentity}</span>
                </span>

                {/* Role Chip: Tamu vs Host vs Admin */}
                {isAdmin ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-purple-100/90 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/80 flex items-center gap-1 shadow-2xs">
                    <ShieldAlert className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{currentLang === "en" ? "Platform Administrator" : "Administrator Platform"}</span>
                  </span>
                ) : isHost ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-rose-100/80 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 flex items-center gap-1 shadow-2xs">
                    <Home className="w-3 h-3" />
                    <span>{currentLang === "en" ? "Host" : "Tuan Rumah"}</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60 flex items-center gap-1 shadow-2xs">
                    <Compass className="w-3 h-3" />
                    <span>{currentLang === "en" ? "Verified Traveler" : "Tamu Terverifikasi"}</span>
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span>{t.memberSince} {joinDate}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "Protected Account" : "Akun Terlindungi"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Metrik Aktivitas yang Relevan untuk Admin, Host, ATAU Tamu */}
          <div className="flex items-center gap-2 sm:gap-2.5 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800 overflow-x-auto pb-1 md:pb-0">
            {isAdmin ? (
              /* Metrik Tata Kelola Platform untuk Super-Admin */
              <>
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
              </>
            ) : isHost ? (
              /* Metrik untuk Host: Properti, Reservasi, Ulasan, Wishlist */
              <>
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
              </>
            ) : (
              /* Metrik untuk Tamu: Perjalanan, Wishlist, Ulasan, Status Akun */
              <>
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
                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{currentLang === "en" ? "Status" : "Akun"}</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {currentLang === "en" ? "Active" : "Aktif"}
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Alert Notifikasi Global Sukses Simpan */}
      {profileSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t.saveSuccess}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TATA LETAK 2 KOLOM: SIDEBAR KIRI & CONTENT KANAN      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start pt-2">
        
        {/* ======================================================== */}
        {/* KOLOM KIRI: MENU NAVIGASI (MODERN FLOATING SIDEBAR)      */}
        {/* ======================================================== */}
        <aside className="lg:col-span-4 xl:col-span-3.5 space-y-5 lg:sticky lg:top-24">
          <div className="p-3 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-800 shadow-xs">
            
            <div className="px-3.5 py-2 mb-1 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{currentLang === "en" ? "Settings" : "Pengaturan Akun"}</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>

            <nav className="space-y-1.5" aria-label="Sidebar navigation">
              {sidebarItems.map((item) => {
                const IconComp = item.icon
                const isActive = activeTab === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id)
                      setEditingSection(null)
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 font-bold shadow-md scale-[1.01]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-white/15 dark:bg-black/10 text-white dark:text-black"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40"
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm tracking-tight truncate ${isActive ? "font-bold" : "font-semibold"}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider shrink-0 ${
                              isActive 
                                ? "bg-rose-500 text-white" 
                                : "bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                          {item.sub}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "opacity-100 translate-x-0.5" : "opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5"
                    }`} />
                  </button>
                )
              })}

              {/* Garis Pemisah untuk Fitur Menerima Tamu / Peluang Hosting */}
              <div className="pt-2 pb-1 px-2">
                <div className="h-px bg-gray-150 dark:bg-gray-800" />
              </div>

              {/* Item Hosting / Menjadi Tuan Rumah */}
              {(() => {
                const IconComp = hostingItem.icon
                const isActive = activeTab === hostingItem.id

                return (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(hostingItem.id)
                      setEditingSection(null)
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 font-bold shadow-md scale-[1.01]"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-white/15 dark:bg-black/10 text-white dark:text-black"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40"
                      }`}>
                        <IconComp className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm tracking-tight truncate ${isActive ? "font-bold" : "font-semibold"}`}>
                            {hostingItem.label}
                          </span>
                          {hostingItem.badge && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider shrink-0 ${
                              isActive 
                                ? "bg-rose-500 text-white" 
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            }`}>
                              {hostingItem.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate mt-0.5 ${isActive ? "opacity-80" : "text-muted-foreground"}`}>
                          {hostingItem.sub}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? "opacity-100 translate-x-0.5" : "opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5"
                    }`} />
                  </button>
                )
              })()}
            </nav>
          </div>

          {/* Mini Card Pintasan Bawah Sidebar (Disesuaikan Konteks Admin vs Host vs Tamu) */}
          {isAdmin ? (
            /* Mini Card untuk Super-Admin */
            <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-950 via-purple-950/70 to-gray-900 text-white shadow-sm space-y-2.5 border border-purple-900/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>{currentLang === "en" ? "Admin Governance" : "Tata Kelola Admin"}</span>
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-200 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                  Super-Admin
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {currentLang === "en" 
                  ? "Access KYC verification queue, host BI-FAST payouts, and user role moderation." 
                  : "Akses antrean verifikasi KTP, persetujuan penarikan saldo BI-FAST, dan moderasi platform."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/admin"
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>{currentLang === "en" ? "Control Center" : "Pusat Kendali"}</span>
                </Link>
                <Link
                  href="/admin/kyc"
                  className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs inline-flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                  title={currentLang === "en" ? "Review KYC Queue" : "Antrean KTP"}
                >
                  <BadgeCheck className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : isHost ? (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-950 to-gray-900 text-white shadow-sm space-y-2.5 border border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{currentLang === "en" ? "Host Hub" : "Portal Host"}</span>
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">
                  {user.stats.totalProperties} {currentLang === "en" ? "Listings" : "Listing"}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {currentLang === "en" ? "Jump to Host Hub to manage bookings and calendar." : "Kelola ketersediaan kamar, reservasi, dan payout langsung."}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/dashboard"
                  className="flex-1 py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span>{currentLang === "en" ? "Dashboard" : "Dashboard"}</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </Link>
                <Link
                  href="/properties/new"
                  className="py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                  title={currentLang === "en" ? "Add New Unit" : "Tambah Unit Baru"}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-rose-50/40 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950 border border-indigo-100 dark:border-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "Traveler Hub" : "Pusat Tamu"}</span>
                </span>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                  {user.stats.totalBookings} {currentLang === "en" ? "Trips" : "Perjalanan"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentLang === "en"
                  ? "View your active stay vouchers, boarding passes, and saved wishlist."
                  : "Buka bukti voucher menginap digital, check-in pass, atau daftar favorit."}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <Link
                  href="/dashboard?tab=trips"
                  className="flex-1 py-2 px-3 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Luggage className="w-3 h-3" />
                  <span>{currentLang === "en" ? "My Stays" : "Perjalanan"}</span>
                </Link>
                <Link
                  href="/wishlists"
                  className="py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs inline-flex items-center justify-center gap-1 transition-all shadow-2xs"
                  title={currentLang === "en" ? "Open Wishlists" : "Buka Wishlist"}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* KOLOM KANAN: BARIS PENGATURAN MODERN (MODULAR TILES)     */}
        {/* ======================================================== */}
        <main className="lg:col-span-8 xl:col-span-8.5 space-y-5">
          
          {/* ======================================================== */}
          {/* TAB 1: INFORMASI PRIBADI                                 */}
          {/* ======================================================== */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {currentLang === "en" ? "Personal info" : "Informasi pribadi"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentLang === "en" 
                      ? "Manage how your identity appears to hosts and guests upon reservation." 
                      : "Kelola data resmi dan bagaimana identitas Anda ditampilkan saat bertransaksi."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 1. Nama Resmi */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "name" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Legal name" : "Nama resmi"}
                      </span>
                      {editingSection !== "name" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {name || (currentLang === "en" ? "Not provided" : "Tidak disediakan")}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "name" ? null : "name")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "name" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "name" && (
                    <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "This is the name on your official identity document (ID or passport)."
                          : "Pastikan nama ini sesuai dengan yang tertera di dokumen identitas resmi Anda (seperti paspor atau KTP)."}
                      </p>
                      <div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="submit"
                          disabled={loadingProfile}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Foto Profil */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "photo" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Profile photo" : "Foto profil"}
                      </span>
                      {editingSection !== "photo" && (
                        <div className="flex items-center gap-3 pt-0.5">
                          <Avatar className="h-11 w-11 border border-rose-500/20 shadow-2xs">
                            <AvatarImage src={image || ""} alt={name || "User"} className="object-cover" />
                            <AvatarFallback className="font-bold text-sm bg-rose-50 text-rose-600">
                              {name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {image
                              ? (currentLang === "en" ? "Custom photo uploaded" : "Foto kustom terpasang")
                              : (currentLang === "en" ? "Default profile avatar" : "Avatar bawaan")}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "photo" ? null : "photo")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "photo" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "photo" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "A clear photo helps hosts and guests recognize you upon check-in."
                          : "Foto wajah yang jelas memudahkan tuan rumah dan tamu saling mengenali saat check-in."}
                      </p>

                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                        <Avatar className="h-16 w-16 border-2 border-rose-500/20 shrink-0">
                          <AvatarImage src={image || ""} alt={name || "User"} className="object-cover" />
                          <AvatarFallback className="font-bold text-lg bg-rose-50 text-rose-600">
                            {name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImage}
                            className="rounded-xl text-xs font-bold gap-2 cursor-pointer h-10 px-4"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingImage ? t.uploadingPhoto : (currentLang === "en" ? "Upload photo" : "Pilih file")}</span>
                          </Button>

                          {image && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setImage("")}
                              className="rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold cursor-pointer h-10 px-3"
                            >
                              {currentLang === "en" ? "Remove" : "Hapus"}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {currentLang === "en" ? "Or image URL" : "Atau tautan URL foto"}
                        </label>
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                      </div>

                      <div className="pt-1">
                        <Button
                          type="button"
                          onClick={() => handleSaveProfile()}
                          disabled={loadingProfile}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Nama Depan Pilihan */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "prefName" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Preferred first name" : "Nama depan pilihan"}
                      </span>
                      {editingSection !== "prefName" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {preferredName || (name ? name.split(" ")[0] : (currentLang === "en" ? "Not provided" : "Tidak disediakan"))}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "prefName" ? null : "prefName")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "prefName" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "prefName" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "This name will be displayed across reservations, reviews, and e-voucher confirmations."
                          : "Nama panggilan ini yang akan disapa oleh tuan rumah dan tamu pada bukti reservasi, e-voucher, dan ulasan."}
                      </p>
                      <input
                        type="text"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        placeholder="John"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                      <Button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={loadingProfile}
                        className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 4. Alamat Email */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "email" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Email address" : "Alamat email"}
                      </span>
                      {editingSection !== "email" && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            {maskedEmail}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{currentLang === "en" ? "Verified" : "Terverifikasi"}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "email" ? null : "email")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "email" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "email" && (
                    <form onSubmit={handleChangeEmail} className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>{currentLang === "en" ? "Security Verification Required" : "Verifikasi Keamanan Akun"}</span>
                        </div>
                        <p className="leading-relaxed text-[11px] text-blue-700/80 dark:text-blue-300/80">
                          {currentLang === "en"
                            ? "To protect your reservations and identity, updating your email address requires entering your current account password."
                            : "Untuk melindungi tiket reservasi dan data akun Anda, perubahan alamat email mewajibkan konfirmasi kata sandi akun saat ini."}
                        </p>
                      </div>

                      {emailError && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{emailError}</span>
                        </div>
                      )}

                      {emailSuccess && (
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{emailSuccess}</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {currentLang === "en" ? "Current email address" : "Alamat email saat ini"}
                        </label>
                        <input
                          type="email"
                          value={currentEmail}
                          disabled
                          className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/60 text-xs font-medium text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {currentLang === "en" ? "New email address" : "Alamat email baru"} *
                        </label>
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => setNewEmailInput(e.target.value)}
                          placeholder={currentLang === "en" ? "name@example.com" : "nama@email.com"}
                          required
                          className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {currentLang === "en" ? "Current password (Confirmation)" : "Kata sandi saat ini (Konfirmasi)"} *
                        </label>
                        <div className="relative">
                          <input
                            type={showEmailPw ? "text" : "password"}
                            value={emailCurrentPassword}
                            onChange={(e) => setEmailCurrentPassword(e.target.value)}
                            placeholder={currentLang === "en" ? "Enter your password" : "Masukkan kata sandi saat ini"}
                            required
                            className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmailPw(!showEmailPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
                          >
                            {showEmailPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="submit"
                          disabled={emailLoading || !newEmailInput || !emailCurrentPassword}
                          className="rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs cursor-pointer px-4 py-2"
                        >
                          {emailLoading ? (currentLang === "en" ? "Saving..." : "Menyimpan...") : (currentLang === "en" ? "Save Email Address" : "Simpan Email Baru")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingSection(null)
                            setEmailError("")
                            setEmailSuccess("")
                            setNewEmailInput("")
                            setEmailCurrentPassword("")
                          }}
                          className="rounded-xl text-xs font-semibold border-gray-200 dark:border-gray-800 cursor-pointer px-4 py-2"
                        >
                          {currentLang === "en" ? "Cancel" : "Batal"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 5. Nomor Telepon */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "phone" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Phone number" : "Nomor telepon"}
                      </span>
                      {editingSection !== "phone" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {phone || (currentLang === "en" ? "Not provided" : "Belum disediakan")}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "phone" ? null : "phone")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "phone" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{phone ? (currentLang === "en" ? "Edit" : "Edit") : (currentLang === "en" ? "Add" : "Tambahkan")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "phone" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "We'll send you stay updates, reservation receipts, and check-in door codes."
                          : "Nomor telepon digunakan untuk mengirimkan konfirmasi check-in, e-voucher, dan kode akses penginapan."}
                      </p>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+62 812-3456-7890"
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                      />
                      <Button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={loadingProfile}
                        className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 6. Verifikasi Identitas (Sesuai Peran: Admin Oversight vs Host KYC) */}
                {isAdmin ? (
                  <div className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-purple-200/80 dark:border-purple-900/60 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          {currentLang === "en" ? "Identity KYC Authority & Review" : "Otoritas Verifikasi Identitas (KYC)"}
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 dark:text-purple-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>{currentLang === "en" ? "Platform Administrator Authority" : "Wewenang Administrator Platform"}</span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                          {currentLang === "en"
                            ? "You hold platform authority to inspect user identity documents, validate NIK compliance with UU PDP, and issue official verified badges."
                            : "Anda memegang wewenang platform untuk memeriksa keabsahan foto KTP/Paspor pengguna, memvalidasi NIK sesuai UU PDP, dan menerbitkan lencana Host Terverifikasi."}
                        </p>
                      </div>

                      <Link
                        href="/admin/kyc"
                        className="rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-center"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>{currentLang === "en" ? "Open KYC Review Center" : "Buka Antrean KYC"}</span>
                      </Link>
                    </div>
                  </div>
                ) : isHost ? (
                  <div className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 max-w-xl">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {currentLang === "en" ? "Host identity verification (KYC)" : "Verifikasi identitas Tuan Rumah (KTP/Paspor)"}
                        </span>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                            user.kycStatus === "VERIFIED"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : user.kycStatus === "PENDING"
                              ? "text-purple-600 dark:text-purple-400"
                              : user.kycStatus === "REJECTED"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {user.kycStatus === "VERIFIED" ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : user.kycStatus === "PENDING" ? (
                              <Clock className="w-4 h-4" />
                            ) : (
                              <ShieldAlert className="w-4 h-4" />
                            )}
                            <span>
                              {user.kycStatus === "VERIFIED"
                                ? (currentLang === "en" ? "Verified Host" : "Host Terverifikasi Resmi")
                                : user.kycStatus === "PENDING"
                                ? (currentLang === "en" ? "Verification In Review" : "Sedang Ditinjau Admin")
                                : user.kycStatus === "REJECTED"
                                ? (currentLang === "en" ? "Verification Rejected" : "Verifikasi Ditolak")
                                : (currentLang === "en" ? "Unverified Host Account" : "Akun Host Belum Terverifikasi")}
                            </span>
                          </span>
                          <span className="text-xs text-gray-300 dark:text-gray-700">•</span>
                          <span className="text-xs text-muted-foreground">
                            {t.memberSince} {joinDate}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
                          {user.kycStatus === "VERIFIED"
                            ? (currentLang === "en"
                                ? `Official identity document confirmed. NIK: ${user.idCardNumber ? user.idCardNumber.substring(0, 6) + "******" : "Confirmed"}. Your properties are eligible for public exploration and instant booking.`
                                : `Dokumen identitas resmi terkonfirmasi. NIK: ${user.idCardNumber ? user.idCardNumber.substring(0, 6) + "******" : "Terkonfirmasi"}. Properti Anda otomatis tayang ke publik dan siap menerima tamu.`)
                            : user.kycStatus === "PENDING"
                            ? (currentLang === "en"
                                ? "Your ID Card submission is currently being reviewed by Admin. Approval typically takes within 24 hours."
                                : "Foto KTP Anda sedang dalam peninjauan oleh tim Admin (maksimal 1x24 jam). Listing properti akan otomatis tayang begitu disetujui.")
                            : user.kycStatus === "REJECTED"
                            ? (currentLang === "en"
                                ? `Reason: "${user.kycRejectReason || "ID document unreadable or mismatched"}". Please re-upload a clear ID Card photo.`
                                : `Alasan penolakan: "${user.kycRejectReason || "Foto KTP buram atau data tidak cocok"}". Silakan unggah ulang foto dokumen Anda.`)
                            : (currentLang === "en"
                                ? "Verify your ID Card (KTP) to build trust and ensure your listings are publicly searchable and bookable by guests."
                                : "Lengkapi verifikasi KTP untuk memastikan keamanan platform dan mengaktifkan penayangan properti Anda ke publik.")}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {user.kycStatus === "VERIFIED" ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/60">
                            {currentLang === "en" ? "Verified" : "Terverifikasi"}
                          </span>
                        ) : user.kycStatus === "PENDING" ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 border border-purple-200/60">
                            {currentLang === "en" ? "Pending" : "Menunggu"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowKycModal(true)}
                            className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {user.kycStatus === "REJECTED"
                                ? (currentLang === "en" ? "Re-upload KTP" : "Unggah Ulang KTP")
                                : (currentLang === "en" ? "Verify Now" : "Verifikasi Sekarang")}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* 7. Alamat Tempat Tinggal */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "address" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Residential address" : "Alamat tempat tinggal"}
                      </span>
                      {editingSection !== "address" && (
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {address || (currentLang === "en" ? "Not provided" : "Belum disediakan")}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "address" ? null : "address")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "address" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{address ? (currentLang === "en" ? "Edit" : "Edit") : (currentLang === "en" ? "Add" : "Tambahkan")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "address" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Your official residential address for billing receipts and account protection."
                          : "Alamat tempat tinggal resmi untuk keperluan tanda terima penagihan dan verifikasi akun."}
                      </p>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        placeholder={currentLang === "en" ? "Jl. Sudirman No. 12, Jakarta" : "Jl. Jenderal Sudirman No. 10, Jakarta"}
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                      />
                      <Button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={loadingProfile}
                        className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* 8. Kontak Darurat */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "emergency" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Emergency contact" : "Kontak darurat"}
                      </span>
                      {editingSection !== "emergency" && (
                        <div>
                          {emergencyName ? (
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {emergencyName} {emergencyRelation ? `(${emergencyRelation})` : ""} {emergencyPhone ? `• ${emergencyPhone}` : ""}
                            </h4>
                          ) : (
                            <h4 className="text-sm font-semibold text-muted-foreground">
                              {currentLang === "en" ? "Not provided" : "Belum disediakan"}
                            </h4>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "emergency" ? null : "emergency")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "emergency" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{emergencyName ? (currentLang === "en" ? "Edit" : "Edit") : (currentLang === "en" ? "Add" : "Tambahkan")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "emergency" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "A trusted contact who can be reached in the event of an emergency during your stay."
                          : "Kontak terpercaya yang dapat dihubungi sewaktu-waktu jika terjadi keadaan darurat saat Anda menginap."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {currentLang === "en" ? "Contact Name" : "Nama Kontak"}
                          </label>
                          <input
                            type="text"
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            placeholder="Jane Doe"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            {currentLang === "en" ? "Relationship" : "Hubungan"}
                          </label>
                          <input
                            type="text"
                            value={emergencyRelation}
                            onChange={(e) => setEmergencyRelation(e.target.value)}
                            placeholder={currentLang === "en" ? "Sibling, Spouse, Friend" : "Saudara, Pasangan, Teman"}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {currentLang === "en" ? "Emergency Phone Number" : "Nomor Telepon Darurat"}
                        </label>
                        <input
                          type="tel"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="+62 813-9876-5432"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleSaveProfile()}
                        disabled={loadingProfile}
                        className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                      >
                        {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                      </Button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: LOG MASUK & KEAMANAN                              */}
          {/* ======================================================== */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {currentLang === "en" ? "Login & security" : "Log masuk & keamanan"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentLang === "en" ? "Update your password and protect your account." : "Perbarui kata sandi dan lindungi akses akun Anda."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* 1. Kata Sandi */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "password" ? "md:col-span-2" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t.currentPassword || (currentLang === "en" ? "Password" : "Kata sandi")}
                      </span>
                      {editingSection !== "password" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {user.hasPassword
                            ? (currentLang === "en" ? "Password configured • Protected" : "Kata sandi telah dikonfigurasi • Aman")
                            : (currentLang === "en" ? "No password configured" : "Belum mengatur kata sandi")}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "password" ? null : "password")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "password" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Update" : "Perbarui"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "password" && (
                    <form onSubmit={handleChangePassword} className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      {pwSuccess && (
                        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{t.passwordChangedSuccess}</span>
                        </div>
                      )}

                      {pwError && (
                        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                          <span>{pwError}</span>
                        </div>
                      )}

                      {user.hasPassword && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {t.currentPassword}
                          </label>
                          <div className="relative">
                            <input
                              type={showCurrentPw ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                              placeholder="••••••••"
                              className="w-full px-4 py-3 pr-11 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPw(!showCurrentPw)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                            >
                              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {t.newPassword}
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPw ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              placeholder={currentLang === "en" ? "Min. 6 chars" : "Min. 6 karakter"}
                              className="w-full px-4 py-3 pr-11 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPw(!showNewPw)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                            >
                              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {t.confirmNewPassword}
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPw ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                              placeholder={currentLang === "en" ? "Re-enter" : "Ulangi sandi"}
                              className="w-full px-4 py-3 pr-11 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPw(!showConfirmPw)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                            >
                              {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={pwLoading}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {pwLoading ? t.saving : t.changePasswordBtn}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2. Perlindungan Akun */}
                <div className="col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Account security tips" : "Tips perlindungan akun"}
                      </span>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed pt-0.5">
                        {currentLang === "en"
                          ? "Keep your credentials private and use unique combinations of characters to protect your account."
                          : "Jaga kerahasiaan kata sandi dan jangan pernah membagikannya kepada siapa pun."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Riwayat Sesi */}
                <div className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Registration & history" : "Riwayat akun"}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {t.memberSince} {joinDate}
                      </h4>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/50">
                      {currentLang === "en" ? "Active" : "Aktif"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PRIVASI & BERBAGI (MODERN LUXURY AIRBNB-INSPIRED) */}
          {/* ======================================================== */}
          {activeTab === "privacy" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {currentLang === "en" ? "Privacy & sharing" : "Privasi & berbagi"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {currentLang === "en"
                      ? "Manage your personal data, connected services, and public visibility settings."
                      : "Kelola data pribadi Anda, visibilitas pencarian, dan pengaturan interaksi publik."}
                  </p>
                </div>

                {privacySuccessMsg && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{privacySuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Seksi 1: Kelola Data Akun Anda */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Manage your account data" : "Kelola data akun Anda"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
                  {/* Row: Minta Data Pribadi */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Request your personal data" : "Minta data pribadi Anda"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "We'll create a file of your personal data and account records for you to download."
                            : "Kami akan membuat file berisi salinan data profil, riwayat reservasi, dan ulasan Anda untuk diunduh."}
                        </p>
                        <div className="pt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Database className="w-3 h-3 text-gray-400" />
                            {user.stats.totalBookings} {currentLang === "en" ? "bookings" : "reservasi"} • {user.stats.totalReviews} {currentLang === "en" ? "reviews" : "ulasan"}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleExportData}
                        disabled={exportingData}
                        variant="outline"
                        className="rounded-full text-xs font-bold border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                      >
                        <Download className={`w-3.5 h-3.5 ${exportingData ? "animate-bounce text-rose-500" : ""}`} />
                        <span>
                          {exportingData
                            ? (currentLang === "en" ? "Preparing..." : "Menyiapkan...")
                            : (currentLang === "en" ? "Download data (.JSON)" : "Unduh data")}
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Row: Hapus / Nonaktifkan Akun */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Deactivate your account" : "Nonaktifkan akun Anda"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "This will deactivate your account and initiate permanent data deletion in accordance with applicable law."
                            : "Tindakan ini akan menonaktifkan akun Anda dan menghapus data secara permanen sesuai ketentuan hukum yang berlaku."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowDeactivateModal(true)}
                        className="text-xs font-bold text-rose-600 dark:text-rose-400 underline underline-offset-4 hover:text-rose-700 dark:hover:text-rose-300 transition-colors shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        {currentLang === "en" ? "Deactivate" : "Nonaktifkan"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Berbagi & Visibilitas */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Sharing & Visibility" : "Berbagi & Visibilitas"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
                  {/* Row: Mesin Pencari */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Include profile in search engines" : "Sertakan profil dan iklan dalam mesin pencari"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "When turned on, search engines like Google and Bing can display your public profile or listings in search results."
                            : "Saat diaktifkan, mesin pencari seperti Google dan Bing dapat menampilkan profil publik atau listing properti Anda di hasil pencarian web."}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={!hideSearch}
                        disabled={savingPrivacy}
                        onClick={() => handleTogglePrivacy("hideSearch", !hideSearch)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                          !hideSearch ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            !hideSearch ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Row: Format Nama pada Ulasan Publik */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "Public review name display" : "Format nama pada ulasan publik"}
                          </h4>
                          {hideLastName && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50">
                              {currentLang === "en" ? "Initials only" : "Inisial saja"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "Show only your first name and last initial (e.g. \"Bryan S.\") rather than your full legal name on public property reviews."
                            : "Samarkan nama belakang menjadi inisial (contoh: \"Bryan S.\") pada ulasan properti publik untuk kenyamanan privasi Anda."}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={hideLastName}
                        disabled={savingPrivacy}
                        onClick={() => handleTogglePrivacy("hideLastName", !hideLastName)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                          hideLastName ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            hideLastName ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Row: Tanda Terima Telah Dibaca (Read Receipts) */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Read receipts" : "Tanda terima telah dibaca"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "Let others know when you’ve read their booking messages and check-in guidance."
                            : "Beri tahu lawan bicara saat Anda telah membaca pesan obrolan dan panduan check-in."}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={readReceipts}
                        disabled={savingPrivacy}
                        onClick={() => handleTogglePrivacy("readReceipts", !readReceipts)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                          readReceipts ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            readReceipts ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Deaktivasi Akun Protektif */}
              {showDeactivateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                  <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeactivateModal(false)}
                        className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "Deactivate your account?" : "Nonaktifkan akun Anda?"}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {currentLang === "en"
                          ? "Before deactivating, ensure you have no upcoming confirmed stays or pending host payouts. Once confirmed, your active listings and traveler profile will be hidden."
                          : "Sebelum menonaktifkan, pastikan Anda tidak memiliki jadwal menginap aktif atau dana sewa yang belum dicairkan. Profil dan reservasi Anda akan disembunyikan dari sistem."}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "Need your data before leaving?" : "Ingin menyimpan riwayat sebelum pergi?"}
                      </div>
                      <div>
                        {currentLang === "en"
                          ? "You can download your data archive anytime using the \"Request your personal data\" option above."
                          : "Anda dapat mengunduh salinan berkas riwayat reservasi Anda terlebih dahulu melalui opsi \"Minta data pribadi Anda\" di atas."}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeactivateModal(false)}
                        className="rounded-full text-xs font-semibold px-4 cursor-pointer"
                      >
                        {currentLang === "en" ? "Cancel" : "Batal"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          alert(currentLang === "en" ? "Deactivation request received. If you have no active bookings, support will finalize your request." : "Permintaan deaktivasi diterima. Akun akan dinonaktifkan setelah verifikasi riwayat transaksi.")
                          setShowDeactivateModal(false)
                        }}
                        className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 cursor-pointer"
                      >
                        {currentLang === "en" ? "Confirm Deactivation" : "Konfirmasi Deaktivasi"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: NOTIFIKASI INTERAKTIF & ROLE-BASED ALERTS         */}
          {/* ======================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {currentLang === "en" ? "Notifications" : "Notifikasi"}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {currentLang === "en"
                      ? "Choose which updates, stay reminders, and marketing messages you want to receive."
                      : "Pilih pembaruan tiket, jadwal menginap, dan pemberitahuan transaksi yang ingin Anda terima."}
                  </p>
                </div>

                {notifySuccessMsg && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{notifySuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Seksi 1: Perjalanan & Reservasi Tamu */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Travel & Guest Updates" : "Perjalanan & Reservasi Tamu"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
                  {/* Row 1: Pengingat Menginap & Kode Check-In */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Trip reminders & check-in details" : "Pengingat jadwal menginap & panduan check-in"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "Receive automatic reminders 24 hours prior to check-in with your digital boarding pass, property address, and door access instructions."
                            : "Pemberitahuan otomatis H-1 sebelum waktu check-in lengkap dengan tautan e-voucher tiket digital, alamat lengkap akomodasi, dan instruksi akses pintu."}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifyTrip}
                        disabled={savingNotify}
                        onClick={() => handleToggleNotify("trip", !notifyTrip)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                          notifyTrip ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            notifyTrip ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Promo & Diskon Khusus */}
                  <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 max-w-xl">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {currentLang === "en" ? "Promotions, deals & inspiration" : "Promo khusus, kupon & diskon musiman"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {currentLang === "en"
                            ? "Get notified about seasonal discounts, exclusive coupons, and destination inspiration."
                            : "Dapatkan penawaran kupon diskon musiman, promo liburan hemat, dan rekomendasi destinasi favorit."}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifyPromo}
                        disabled={savingNotify}
                        onClick={() => handleToggleNotify("promo", !notifyPromo)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                          notifyPromo ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            notifyPromo ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seksi 2: Operasional Tuan Rumah & Finansial (Hanya tampil untuk Host & Admin) */}
              {(isHost || isAdmin) && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                      {currentLang === "en" ? "Host & Payout Alerts" : "Pemberitahuan Tuan Rumah & Finansial"}
                    </span>
                    <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                  </div>

                  <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
                    {/* Row 1: Pemesanan Masuk & Reservasi Tamu */}
                    <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="space-y-1 max-w-xl">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "New bookings & guest requests" : "Pemesanan baru & permintaan tamu"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Instant notifications whenever a guest completes a paid reservation or requests a date change."
                              : "Pemberitahuan instan saat ada tamu yang berhasil membayar reservasi kamar atau mengajukan perubahan tanggal."}
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifyHostBook}
                          disabled={savingNotify}
                          onClick={() => handleToggleNotify("hostBook", !notifyHostBook)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                            notifyHostBook ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              notifyHostBook ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Pencairan Dana & Payout BI-FAST */}
                    <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="space-y-1 max-w-xl">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "Payout disbursement receipts" : "Bukti transfer pencairan dana sewa"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Receipts and reference numbers when rental proceeds are transferred to your destination bank account."
                              : "Bukti transfer dan nomor referensi transaksi saat dana sewa dicairkan ke rekening bank penerima Anda."}
                          </p>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={notifyPayout}
                          disabled={savingNotify}
                          onClick={() => handleToggleNotify("payout", !notifyPayout)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                            notifyPayout ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                              notifyPayout ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seksi 3: Kanal Pengiriman Pemberitahuan */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Delivery Channels" : "Kanal Pengiriman Notifikasi"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-4.5 shadow-2xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150 dark:border-gray-800/60">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-rose-500" />
                        <span>{currentLang === "en" ? "Registered Email" : "Alamat Email Terdaftar"}</span>
                      </span>
                      <p className="text-xs text-gray-500 font-mono">{currentEmail}</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 self-start sm:self-center">
                      {currentLang === "en" ? "Primary Delivery" : "Kanal Utama"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-rose-500" />
                        <span>{currentLang === "en" ? "In-App Dashboard Alerts" : "Notifikasi Dashboard Platform"}</span>
                      </span>
                      <p className="text-xs text-gray-500">
                        {currentLang === "en" ? "Real-time badge counter and stay updates" : "Pemberitahuan langsung pada navigasi dan dashboard"}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 self-start sm:self-center">
                      {currentLang === "en" ? "Always On" : "Selalu Aktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PEMBAYARAN, PENAGIHAN BISNIS & REFUND MATRIX      */}
          {/* ======================================================== */}
          {activeTab === "payments" && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {isHost
                      ? (currentLang === "en" ? "Payouts, billing & refund policies" : "Pencairan, faktur & kebijakan refund")
                      : (currentLang === "en" ? "Payments, billing & refund policies" : "Pembayaran, faktur & kebijakan refund")}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {isHost
                      ? (currentLang === "en" ? "Manage bank destination accounts, business billing, and guest cancellation standards." : "Kelola nomor rekening penerima, data faktur bisnis, dan standar pembatalan tamu.")
                      : (currentLang === "en" ? "Review booking receipts, configure business travel billing, and understand transparent refund policies." : "Tinjau bukti sewa, atur faktur perjalanan dinas perusahaan, dan pahami aturan pengembalian dana.")}
                  </p>
                </div>

                {billingSuccessMsg && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{billingSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Seksi 1: Riwayat Transaksi & Rekening Payout (Sesuai Peran) */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {isHost
                      ? (currentLang === "en" ? "Host Banking & Trips" : "Rekening Bank & Riwayat")
                      : (currentLang === "en" ? "Transaction & Escrow Safety" : "Transaksi & Jaminan Escrow")}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
                  {isHost ? (
                    <>
                      {/* Host: Rekening Payout */}
                      <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 max-w-xl">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {currentLang === "en" ? "Host payout destination bank account" : "Rekening pencairan dana Tuan Rumah (BI-FAST)"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {currentLang === "en"
                                ? "Configure destination bank accounts to receive rental proceeds automatically via BI-FAST settlement."
                                : "Atur nomor rekening bank Anda untuk menerima hasil sewa akomodasi secara otomatis via transfer BI-FAST."}
                            </p>
                          </div>
                          <Link
                            href="/dashboard?tab=payouts"
                            className="rounded-full text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                          >
                            <span>{currentLang === "en" ? "Manage Payouts" : "Kelola Rekening"}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          </Link>
                        </div>
                      </div>

                      {/* Host: Riwayat Menginap Pribadi */}
                      <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 max-w-xl">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {currentLang === "en" ? "Personal stay history & receipts" : "Riwayat perjalanan liburan pribadi"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {user.stats.totalBookings} {currentLang === "en" ? "vacation bookings recorded on your account." : "pesanan liburan pribadi tercatat pada akun Anda."}
                            </p>
                          </div>
                          <Link
                            href="/dashboard?tab=trips"
                            className="rounded-full text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                          >
                            <span>{currentLang === "en" ? "View Stays" : "Lihat Perjalanan"}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest: Tiket & E-Voucher */}
                      <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 max-w-xl">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {currentLang === "en" ? "Stay receipts & digital e-vouchers" : "Riwayat bukti sewa & tiket e-voucher"}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {user.stats.totalBookings > 0
                                ? (currentLang === "en"
                                    ? `You have ${user.stats.totalBookings} reservation trip tickets and invoices ready.`
                                    : `Anda memiliki ${user.stats.totalBookings} tiket reservasi aktif dan bukti pelunasan sewa.`)
                                : (currentLang === "en"
                                    ? "No bookings recorded yet. Your digital boarding passes and tax receipts will appear here."
                                    : "Belum ada pesanan aktif. Bukti boarding pass dan e-voucher tiket akan tersimpan di sini.")}
                            </p>
                          </div>
                          <Link
                            href="/dashboard?tab=trips"
                            className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>{currentLang === "en" ? "View Vouchers" : "Buka E-Voucher"}</span>
                          </Link>
                        </div>
                      </div>

                      {/* Guest: Midtrans Escrow Protection */}
                      <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {currentLang === "en" ? "SafeStay Escrow Protection" : "Jaminan Rekening Penampung (SafeStay Escrow)"}
                              </h4>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                                {currentLang === "en" ? "Bank-Grade Secure" : "Terproteksi Bank"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                              {currentLang === "en"
                                ? "All payments are safeguarded in an escrow account powered by Midtrans. Funds are released to hosts only 24 hours after your successful check-in."
                                : "Seluruh pembayaran pesanan ditampung secara aman pada rekening escrow Midtrans (BCA/Mandiri/BRI Virtual Account, QRIS GoPay, & Kartu Kredit) dan baru diteruskan ke tuan rumah 24 jam setelah Anda sukses check-in."}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/50 shrink-0 self-start sm:self-center">
                            {currentLang === "en" ? "Escrow Active" : "Escrow Aktif"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Seksi 2: Informasi Penagihan Bisnis & Faktur Perusahaan (Business Billing) */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Business Travel & Invoicing" : "Penagihan Bisnis & Faktur Perusahaan"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="space-y-1 max-w-xl">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-rose-500" />
                        <span>{currentLang === "en" ? "Corporate Billing & Tax Details" : "Data Perusahaan & NPWP Penagihan"}</span>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {currentLang === "en"
                          ? "Add your company name, tax ID (NPWP), and official address to automatically generate valid tax invoices for business travel reimbursements."
                          : "Cantumkan nama perusahaan, NPWP, dan alamat resmi untuk dicetak secara otomatis pada bukti pelunasan dan e-voucher perjalanan dinas kantor."}
                      </p>
                    </div>

                    {!isEditingBilling && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingBilling(true)}
                        className="rounded-full text-xs font-bold border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs gap-1.5 cursor-pointer self-start sm:self-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>{billingCompany ? (currentLang === "en" ? "Edit Details" : "Ubah Data") : (currentLang === "en" ? "Add Business Info" : "Tambah Data Bisnis")}</span>
                      </Button>
                    )}
                  </div>

                  {billingError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{billingError}</span>
                    </div>
                  )}

                  {!isEditingBilling ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {currentLang === "en" ? "Company Name" : "Nama Perusahaan"}
                        </span>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {billingCompany || (currentLang === "en" ? "Not set" : "Belum diisi")}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {currentLang === "en" ? "Tax ID / NPWP" : "NPWP / Tax ID"}
                        </span>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">
                          {billingTax || (currentLang === "en" ? "Not set" : "Belum diisi")}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                          {currentLang === "en" ? "Billing Address" : "Alamat Penagihan"}
                        </span>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {billingAddr || (currentLang === "en" ? "Not set" : "Belum diisi")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveBilling} className="pt-2 space-y-3 border-t border-gray-150 dark:border-gray-800 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {currentLang === "en" ? "Company / Institution Name" : "Nama Perusahaan / Instansi"}
                          </label>
                          <input
                            type="text"
                            value={billingCompany}
                            onChange={(e) => setBillingCompany(e.target.value)}
                            placeholder={currentLang === "en" ? "e.g. Acme Corporation Ltd" : "contoh: PT Ruang Rehat Indonesia"}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {currentLang === "en" ? "Tax Identification Number (NPWP)" : "NPWP Perusahaan (15/16 Digit)"}
                          </label>
                          <input
                            type="text"
                            value={billingTax}
                            onChange={(e) => setBillingTax(e.target.value)}
                            placeholder="01.234.567.8-901.000"
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {currentLang === "en" ? "Official Corporate Address" : "Alamat Penagihan Resmi Perusahaan"}
                        </label>
                        <textarea
                          rows={2}
                          value={billingAddr}
                          onChange={(e) => setBillingAddr(e.target.value)}
                          placeholder={currentLang === "en" ? "Street address, building, city, postal code" : "Nama gedung, jalan, kota, kode pos"}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="submit"
                          disabled={savingBilling}
                          className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 cursor-pointer shadow-xs"
                        >
                          {savingBilling ? (currentLang === "en" ? "Saving..." : "Menyimpan...") : (currentLang === "en" ? "Save Billing Info" : "Simpan Informasi Penagihan")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingBilling(false)
                            setBillingCompany(user.billingCompanyName || "")
                            setBillingTax(user.billingTaxId || "")
                            setBillingAddr(user.billingAddress || "")
                          }}
                          className="rounded-full text-xs font-semibold px-4 py-2 cursor-pointer"
                        >
                          {currentLang === "en" ? "Cancel" : "Batal"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Seksi 3: Matriks Kebijakan Pengembalian Dana Transparan (Refund Matrix) */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
                    {currentLang === "en" ? "Transparent Refund Matrix" : "Matriks Kebijakan Pengembalian Dana Transparan"}
                  </span>
                  <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Kartu 1: Fleksibel */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {currentLang === "en" ? "Flexible" : "Fleksibel"}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                          100% Refund
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "Up to 24h before check-in" : "Hingga 24 jam sebelum check-in"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {currentLang === "en"
                          ? "Full refund of accommodation rate if cancelled at least 24 hours before 14:00 check-in time. First night is non-refundable if cancelled within 24h."
                          : "Pengembalian dana penuh (100%) jika dibatalkan sekurang-kurangnya 24 jam sebelum waktu check-in. Pembatalan setelah 24 jam dikenakan potongan malam pertama."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{currentLang === "en" ? "Instant Automated Refund" : "Refund Otomatis Instan"}</span>
                    </div>
                  </div>

                  {/* Kartu 2: Moderat */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          {currentLang === "en" ? "Moderate" : "Moderat"}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60">
                          100% / 50%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "Up to 5 days before check-in" : "Hingga 5 hari sebelum check-in"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {currentLang === "en"
                          ? "Full refund if cancelled 5 full days before check-in. Cancellations after that receive 50% refund minus the first night and service fees."
                          : "Pengembalian dana penuh (100%) jika dibatalkan 5 hari sebelum tanggal check-in. Pembatalan setelah batas tersebut berhak atas pengembalian 50%."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{currentLang === "en" ? "Balanced Protection" : "Perlindungan Seimbang"}</span>
                    </div>
                  </div>

                  {/* Kartu 3: Ketat */}
                  <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {currentLang === "en" ? "Strict" : "Ketat"}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                          50% / 0%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {currentLang === "en" ? "Up to 7 days before check-in" : "Hingga 7 hari sebelum check-in"}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {currentLang === "en"
                          ? "50% refund if cancelled at least 7 days before check-in. Cancellations less than 7 days prior are non-refundable (0%) to protect host readiness."
                          : "Pengembalian dana 50% jika dibatalkan 7 hari sebelum waktu menginap. Pembatalan kurang dari 7 hari tidak dapat di-refund (0%) demi proteksi komitmen tuan rumah."}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{currentLang === "en" ? "Host Commitment Guard" : "Proteksi Komitmen Host"}</span>
                    </div>
                  </div>
                </div>

                {/* Baris Proteksi Tanggal Check-in Tiba */}
                <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {currentLang === "en" ? "Check-In Date Absolute Deadline" : "Batas Mutlak Tanggal Check-In"}
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                      {currentLang === "en"
                        ? "Regardless of policy tier, booking cancellation is strictly disabled once your scheduled check-in time arrives. Please coordinate directly with your host for unexpected emergencies."
                        : "Apapun kategori kebijakan pembatalan, tombol pembatalan mandiri otomatis dinonaktifkan tepat saat waktu check-in tiba demi kepastian operasional akomodasi."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: BAHASA, MATA UANG & TEMA [BARU]                   */}
          {/* ======================================================== */}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                      {currentLang === "en" ? "Global preferences" : "Bahasa & terjemahan"}
                    </h2>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                      {currentLang === "en" ? "New" : "Baru"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentLang === "en" ? "Personalize your language, display currency, and theme appearance." : "Sesuaikan bahasa tampilan, mata uang, dan tema antarmuka."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                
                {/* 1. Bahasa Pilihan */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "lang" ? "md:col-span-2 lg:col-span-3" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Preferred language" : "Bahasa pilihan"}
                      </span>
                      {editingSection !== "lang" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pt-0.5">
                          <span>{lang === "en" ? "🇺🇸 English (United States)" : "🇮🇩 Bahasa Indonesia (ID)"}</span>
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "lang" ? null : "lang")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "lang" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "lang" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Select your preferred interface language across the platform."
                          : "Pilih bahasa tampilan antarmuka yang paling nyaman untuk Anda."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setLang("id")}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            lang === "id"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🇮🇩</span>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Bahasa Indonesia</div>
                              <div className="text-xs text-muted-foreground">Default Indonesia (ID)</div>
                            </div>
                          </div>
                          {lang === "id" && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setLang("en")}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            lang === "en"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🇺🇸</span>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">English</div>
                              <div className="text-xs text-muted-foreground">United States / Global</div>
                            </div>
                          </div>
                          {lang === "en" && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </div>

                      <div className="pt-1">
                        <Button
                          type="button"
                          onClick={() => handleSaveProfile()}
                          disabled={loadingProfile}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Mata Uang Pilihan */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "currency" ? "md:col-span-2 lg:col-span-3" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Preferred currency" : "Mata uang pilihan"}
                      </span>
                      {editingSection !== "currency" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 pt-0.5">
                          {currency === "USD" ? "USD ($) - US Dollar" : "IDR (Rp) - Indonesian Rupiah"}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "currency" ? null : "currency")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "currency" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "currency" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Prices will be formatted according to your selected currency."
                          : "Harga sewa penginapan akan dikonversi sesuai dengan mata uang pilihan Anda."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrency("IDR")}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            currency === "IDR"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">IDR - Indonesian Rupiah</div>
                            <div className="text-xs text-muted-foreground">Format Rp (1 USD ≈ Rp 15.000)</div>
                          </div>
                          {currency === "IDR" && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setCurrency("USD")}
                          className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                            currency === "USD"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">USD - US Dollar</div>
                            <div className="text-xs text-muted-foreground">Standard symbol $ (USD)</div>
                          </div>
                          {currency === "USD" && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </div>

                      <div className="pt-1">
                        <Button
                          type="button"
                          onClick={() => handleSaveProfile()}
                          disabled={loadingProfile}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Tema Tampilan */}
                <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "theme" ? "md:col-span-2 lg:col-span-3" : "col-span-1"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {currentLang === "en" ? "Appearance theme" : "Tema tampilan"}
                      </span>
                      {editingSection !== "theme" && (
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 pt-0.5">
                          {theme === "dark"
                            ? (currentLang === "en" ? "Dark mode" : "Tema gelap")
                            : theme === "light"
                            ? (currentLang === "en" ? "Light mode" : "Tema terang")
                            : (currentLang === "en" ? "System default" : "Sistem otomatis")}
                        </h4>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingSection(editingSection === "theme" ? null : "theme")}
                      className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      {editingSection === "theme" ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingSection === "theme" && (
                    <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {currentLang === "en"
                          ? "Choose light, dark, or sync with your system preferences."
                          : "Pilih tampilan visual yang nyaman untuk mata Anda saat menjelajah properti."}
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setTheme("light")}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            theme === "light"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <span className="text-sm font-bold">{t.lightTheme}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme("dark")}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            theme === "dark"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <span className="text-sm font-bold">{t.darkTheme}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTheme("system")}
                          className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            theme === "system"
                              ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
                          }`}
                        >
                          <span className="text-sm font-bold">{t.systemTheme}</span>
                        </button>
                      </div>

                      <div className="pt-1">
                        <Button
                          type="button"
                          onClick={() => setEditingSection(null)}
                          className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          {currentLang === "en" ? "Done" : "Selesai"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: ROLE OPERATIONAL CENTER (ADMIN / HOST / GUEST)    */}
          {/* ======================================================== */}
          {activeTab === "hosting" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800/80">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                    {hostingItem.label}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {isAdmin
                      ? (currentLang === "en" ? "Super-Admin authority for KYC review, BI-FAST payouts, user role management, and ecosystem health." : "Pusat wewenang Super-Admin untuk peninjauan KYC, otorisasi pencairan BI-FAST, manajemen pengguna, dan integritas platform.")
                      : isHost
                      ? (currentLang === "en" ? "Operational control hub, availability calendar, and hospitality listing defaults." : "Pusat kendali operasional, kalender ketersediaan, dan standar listing properti Tuan Rumah.")
                      : (currentLang === "en" ? "Start hosting on Ruang Rehat to earn flexible income with complete protection." : "Mulai sewakan properti Anda dan dapatkan penghasilan sewa fleksibel dengan proteksi menyeluruh.")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {isAdmin ? (
                  /* ======================================================= */
                  /* Tampilan untuk Super-Admin: Pusat Tata Kelola & Kontrol */
                  /* ======================================================= */
                  <div className="space-y-5">
                    {/* Ringkasan 4 Kartu Tata Kelola */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Kartu 1: Verifikasi KYC Identitas */}
                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span>{currentLang === "en" ? "Identity KYC" : "Verifikasi Identitas (KYC)"}</span>
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              (adminStats?.pendingKyc ?? 0) > 0
                                ? "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300/60"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}>
                              {adminStats?.pendingKyc ?? 0} {currentLang === "en" ? "Pending Queue" : "Antrean Menunggu"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "User Identity Review Queue" : "Peninjauan Dokumen KTP & Paspor"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Inspect uploaded KTP ID card photos, validate NIK compliance with UU PDP, and issue verified host badges."
                              : "Periksa kejelasan foto KTP/Paspor yang diunggah host, validasi NIK sesuai regulasi UU PDP, dan terbitkan lencana terverifikasi."}
                          </p>
                        </div>
                        <Link
                          href="/admin/kyc"
                          className="pt-2 border-t border-gray-150 dark:border-gray-800 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center justify-between group"
                        >
                          <span>{currentLang === "en" ? "Open KYC Review Center" : "Buka Antrean Verifikasi KYC"}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>

                      {/* Kartu 2: Persetujuan Pencairan Dana (Payouts) */}
                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{currentLang === "en" ? "Payout Authorization" : "Persetujuan Pencairan"}</span>
                            </span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              (adminStats?.pendingPayouts ?? 0) > 0
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}>
                              {adminStats?.pendingPayouts ?? 0} {currentLang === "en" ? "Pending Transfer" : "Menunggu Transfer"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "Host Payout BI-FAST Settlements" : "Pelepasan Dana Sewa BI-FAST"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Authorize bank transfers for host earnings once the 24-hour post-check-in escrow protection period clears."
                              : "Otorisasi transfer hasil sewa ke rekening bank host setelah masa perlindungan escrow 24 jam check-in terpenuhi tanpa sengketa."}
                          </p>
                        </div>
                        <Link
                          href="/admin/payouts"
                          className="pt-2 border-t border-gray-150 dark:border-gray-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between group"
                        >
                          <span>{currentLang === "en" ? "Authorize Host Payouts" : "Otorisasi Pencairan Dana"}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>

                      {/* Kartu 3: Manajemen Akun & Hak Akses Pengguna */}
                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              <span>{currentLang === "en" ? "User Management" : "Manajemen Pengguna"}</span>
                            </span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              {adminStats?.totalUsers ?? 0} {currentLang === "en" ? "Accounts" : "Akun Terdaftar"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "Role Assignment & Account Audit" : "Eskalasi Role & Audit Akun"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Manage user roles (GUEST, HOST, ADMIN), inspect account standing, and investigate suspicious activity logs."
                              : "Ubah peran pengguna (GUEST, HOST, ADMIN), pantau status kredensial, dan investigasi anomali aktivitas pengguna."}
                          </p>
                        </div>
                        <Link
                          href="/admin"
                          className="pt-2 border-t border-gray-150 dark:border-gray-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-between group"
                        >
                          <span>{currentLang === "en" ? "Manage User Accounts" : "Kelola Pengguna Platform"}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>

                      {/* Kartu 4: Moderasi Listing & Integritas Penginapan */}
                      <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                              <Home className="w-3.5 h-3.5" />
                              <span>{currentLang === "en" ? "Listing Moderation" : "Moderasi Listing"}</span>
                            </span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              {adminStats?.totalProperties ?? 0} {currentLang === "en" ? "Properties" : "Listing Aktif"}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {currentLang === "en" ? "Listing Quality & Policy Compliance" : "Kualitas Listing & Kepatuhan"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Supervise published property photos, description accuracy, pricing standards, and suspend non-compliant listings."
                              : "Awasi foto properti, keakuratan fasilitas, transparansi harga, serta tangguhkan penginapan yang melanggar ketentuan."}
                          </p>
                        </div>
                        <Link
                          href="/admin"
                          className="pt-2 border-t border-gray-150 dark:border-gray-800 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-between group"
                        >
                          <span>{currentLang === "en" ? "Moderate Listings" : "Buka Moderasi Properti"}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>

                    {/* Banner Regulasi Tata Kelola Platform */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/40 dark:from-purple-950/30 dark:via-gray-900 dark:to-indigo-950/20 border border-purple-200/70 dark:border-purple-900/50 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-200">
                          {currentLang === "en" ? "Platform Governance & Legal Safeguards" : "Pedoman Tata Kelola Hukum & Kepatuhan"}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-purple-100 dark:border-gray-800 space-y-1">
                          <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-purple-500" />
                            <span>{currentLang === "en" ? "UU PDP No. 27/2022 & GDPR" : "Kepatuhan UU PDP No. 27/2022"}</span>
                          </span>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "All user data exports and deletions must adhere to UU PDP Article 40 standards with end-to-end encryption."
                              : "Seluruh ekspor dan penghapusan data akun dilindungi standar UU PDP Pasal 40 dengan enkripsi database terproteksi."}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-purple-100 dark:border-gray-800 space-y-1">
                          <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{currentLang === "en" ? "SafeStay 24h Escrow Guard" : "Jaminan Escrow 24 Jam"}</span>
                          </span>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en"
                              ? "Midtrans escrow funds are non-disbursable until 24 hours after check-in, preventing unauthorized host withdrawals."
                              : "Dana penampungan Midtrans tidak dapat ditarik host sebelum 24 jam check-in berlalu tanpa komplain dari pihak tamu."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isHost ? (
                  /* ======================================================= */
                  /* Tampilan untuk Host: Pusat Kendali & Listing Defaults   */
                  /* ======================================================= */
                  <div className="space-y-5">
                    {/* Seksi A: Pintasan Operasional Host */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Link
                        href="/dashboard"
                        className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-rose-400 transition-all shadow-2xs group flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                          <Home className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-500 transition-colors truncate">
                            {currentLang === "en" ? "Host Dashboard" : "Dashboard Host"}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {currentLang === "en" ? "Incoming bookings" : "Reservasi tamu"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard?tab=calendar"
                        className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-sky-400 transition-all shadow-2xs group flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-500 shrink-0 group-hover:scale-105 transition-transform">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-sky-500 transition-colors truncate">
                            {currentLang === "en" ? "Calendar & Rates" : "Kalender Sewa"}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {currentLang === "en" ? "Block dates & sync" : "Atur ketersediaan"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/dashboard?tab=payouts"
                        className="p-3.5 rounded-xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 hover:border-emerald-400 transition-all shadow-2xs group flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 shrink-0 group-hover:scale-105 transition-transform">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 transition-colors truncate">
                            {currentLang === "en" ? "BI-FAST Payouts" : "Rekening Payout"}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {currentLang === "en" ? "Bank destination" : "Pencairan sewa"}
                          </p>
                        </div>
                      </Link>

                      <Link
                        href="/properties/new"
                        className="p-3.5 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-2xs hover:from-rose-600 hover:to-rose-700 transition-all group flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-white/20 text-white shrink-0 group-hover:scale-105 transition-transform">
                          <Plus className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {currentLang === "en" ? "Create Listing" : "Tambah Unit"}
                          </h4>
                          <p className="text-[11px] text-rose-100 truncate">
                            {currentLang === "en" ? "Publish in 5 min" : "Daftarkan kamar"}
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Seksi B: Standar Operasional Listing Bawaan (Host Operational Listing Defaults) */}
                    <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                            <span>{currentLang === "en" ? "Operational Listing Standards & Defaults" : "Standar & Parameter Operasional Listing"}</span>
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {currentLang === "en"
                              ? "Baseline operational hours, turnaround buffers, and hospitality protocols applied across your properties."
                              : "Standar jam operasional, waktu pembersihan kamar, dan protokol keramahtamahan pada seluruh listing Anda."}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 self-start sm:self-center shrink-0">
                          {currentLang === "en" ? "Host Standards Active" : "Standar Host Aktif"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                        {/* 1. Jam Check-in & Check-out */}
                        <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            <span>{currentLang === "en" ? "Check-In / Out Hours" : "Waktu Check-In / Out"}</span>
                          </div>
                          <div className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                            14:00 - 12:00 WIB
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en" ? "Standard check-in starts at 14:00. Check-out cutoff is 12:00 sharp." : "Check-in dibuka jam 14:00. Batas check-out maksimal jam 12:00 siang."}
                          </p>
                        </div>

                        {/* 2. Jeda Sanitasi Kamar */}
                        <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>{currentLang === "en" ? "Turnaround Buffer" : "Jeda Sanitasi Kamar"}</span>
                          </div>
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                            2 {currentLang === "en" ? "Hours Window" : "Jam Sanitasi"}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en" ? "Reserved 2-hour window (12:00 - 14:00) for deep cleaning and linen reset." : "Jeda 2 jam (12:00 - 14:00) untuk pembersihan menyeluruh dan ganti linen."}
                          </p>
                        </div>

                        {/* 3. Standar Kebijakan Batal */}
                        <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{currentLang === "en" ? "Default Policy" : "Kebijakan Bawaan"}</span>
                          </div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            FLEXIBLE
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en" ? "100% refund up to 24h prior. Adjustable to MODERATE or STRICT per listing." : "Refund 100% hingga H-1. Dapat diubah ke MODERATE atau STRICT per unit."}
                          </p>
                        </div>

                        {/* 4. Protokol Akses Tamu */}
                        <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
                            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{currentLang === "en" ? "Access Method" : "Metode Akses Kamar"}</span>
                          </div>
                          <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                            SELF CHECK-IN
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                            {currentLang === "en" ? "PIN Smart Lock or keylock box code shared via digital voucher upon payment." : "Kode PIN Smart Lock / Keybox otomatis dibagikan di e-voucher setelah lunas."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ======================================================= */
                  /* Tampilan untuk Tamu: Onboarding Inspiratif Menjadi Host */
                  /* ======================================================= */
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-pink-50/50 dark:from-rose-950/40 dark:via-gray-900 dark:to-pink-950/20 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-5">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{currentLang === "en" ? "Host Opportunity" : "Peluang Tuan Rumah"}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                        {t.becomeHostTitle}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {t.becomeHostDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-rose-500" />
                          <span>{t.benefitIncome}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {t.benefitIncomeDesc}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>{t.benefitProtection}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {t.benefitProtectionDesc}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                          <span>{currentLang === "en" ? "Zero Signup Fee" : "Tanpa Biaya Daftar"}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {currentLang === "en"
                            ? "Your account automatically upgrades to Host once your first listing is published."
                            : "Akun Anda otomatis beralih menjadi Tuan Rumah begitu listing pertama selesai dibuat."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
                      <div>
                        <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                          {currentLang === "en" ? "Ready to welcome your first guests?" : "Sudah siap menyambut tamu pertama Anda?"}
                        </h4>
                        <p className="text-[11px] text-rose-700 dark:text-rose-400">
                          {currentLang === "en" ? "Takes only 5 minutes to set up." : "Hanya butuh 5 menit untuk mendaftarkan penginapan."}
                        </p>
                      </div>

                      <Link
                        href="/properties/new"
                        className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.startHostingBtn}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>

      </div>

      {/* KYC Modal for Profile */}
      <KycModal
        open={showKycModal}
        onOpenChange={setShowKycModal}
        user={user}
        currentLang={currentLang}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
