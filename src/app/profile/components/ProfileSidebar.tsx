"use client"

import Link from "next/link"
import {
  User,
  Shield,
  Eye,
  Bell,
  CreditCard,
  Globe,
  Building2,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  Home
} from "lucide-react"
import type { ProfileUser, TabType } from "../types"

interface ProfileSidebarProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  currentLang: string
  isHost: boolean
  isAdmin: boolean
  user: ProfileUser
}

export default function ProfileSidebar({
  activeTab,
  setActiveTab,
  currentLang,
  isHost,
  isAdmin,
}: ProfileSidebarProps) {
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

  const HostingIcon = hostingItem.icon
  const isHostingActive = activeTab === hostingItem.id

  return (
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
                onClick={() => setActiveTab(item.id)}
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

          <div className="pt-2 pb-1 px-2">
            <div className="h-px bg-gray-150 dark:bg-gray-800" />
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(hostingItem.id)}
            className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer group ${
              isHostingActive
                ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950 font-bold shadow-md scale-[1.01]"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 font-medium"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                isHostingActive
                  ? "bg-white/15 dark:bg-black/10 text-white dark:text-black"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40"
              }`}>
                <HostingIcon className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs sm:text-sm tracking-tight truncate ${isHostingActive ? "font-bold" : "font-semibold"}`}>
                    {hostingItem.label}
                  </span>
                  {hostingItem.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider shrink-0 ${
                      isHostingActive 
                        ? "bg-rose-500 text-white" 
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                    }`}>
                      {hostingItem.badge}
                    </span>
                  )}
                </div>
                <p className={`text-[10px] truncate mt-0.5 ${isHostingActive ? "opacity-80" : "text-muted-foreground"}`}>
                  {hostingItem.sub}
                </p>
              </div>
            </div>

            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
              isHostingActive ? "opacity-100 translate-x-0.5" : "opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5"
            }`} />
          </button>
        </nav>
      </div>

      {/* Mini Card Pintasan Bawah Sidebar */}
      {isAdmin ? (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-950 via-purple-950/70 to-gray-900 text-white shadow-sm space-y-2.5 border border-purple-900/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">
              {currentLang === "en" ? "Super-Admin Authority" : "Otoritas Super-Admin"}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {currentLang === "en"
              ? "You possess access to audit KYC, oversee escrow settlements, and govern user accounts."
              : "Anda memiliki akses pengawasan identitas, pencairan escrow, dan tata kelola akun platform."}
          </p>
          <Link
            href="/admin"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>{currentLang === "en" ? "Open Admin Portal" : "Buka Portal Admin"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : isHost ? (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-rose-950 text-white shadow-sm space-y-2.5 border border-gray-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Home className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-300">
              {currentLang === "en" ? "Host Fast Operations" : "Operasional Tuan Rumah"}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            {currentLang === "en"
              ? "Quick access to manage your active listings, upcoming guest reservations, and BI-FAST earnings."
              : "Akses cepat untuk mengelola kamar, reservasi tamu yang akan datang, dan saldo sewa."}
          </p>
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>{currentLang === "en" ? "Go to Host Dashboard" : "Buka Dashboard Host"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-50/50 to-transparent dark:from-rose-950/30 dark:via-gray-900 dark:to-transparent border border-rose-200/60 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Need a getaway?" : "Butuh liburan tenang?"}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {currentLang === "en"
              ? "Explore unique stays across Indonesia with guaranteed check-in escrow protection."
              : "Jelajahi vila, apartemen, dan penginapan terbaik di Indonesia dengan garansi escrow aman."}
          </p>
          <Link
            href="/"
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 pt-1"
          >
            <span>{currentLang === "en" ? "Explore stays now" : "Cari penginapan"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </aside>
  )
}
