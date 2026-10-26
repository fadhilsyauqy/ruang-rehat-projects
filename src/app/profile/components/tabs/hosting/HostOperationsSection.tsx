"use client"

import Link from "next/link"
import {
  Home,
  Calendar,
  CreditCard,
  Plus,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react"

interface HostOperationsSectionProps {
  currentLang: string
}

export default function HostOperationsSection({
  currentLang
}: HostOperationsSectionProps) {
  return (
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

      {/* Seksi B: Kebijakan Operasional Baku Platform Ruang Rehat */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {currentLang === "en"
                  ? "Ruang Rehat Platform Standard Operational Policy"
                  : "Kebijakan Operasional Baku Platform Ruang Rehat"}
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
              {currentLang === "en"
                ? "Check-in (14:00 WIB), Check-out (12:00 WIB), and turnaround buffers (2 Hours) are uniformly standardized by the platform to guarantee cleanliness, safety, and operational excellence without burdening Hosts with custom SOP management."
                : "Waktu Check-in (14:00 WIB), Check-out (12:00 WIB), dan Jeda Sanitasi (2 Jam) diatur seragam oleh sistem platform guna menjamin standar kebersihan dan keamanan tanpa membebani Host mengatur SOP mandiri."}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 self-start sm:self-center shrink-0 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {currentLang === "en"
                ? "Unified Ecosystem Standard (Uniform Across All Properties)"
                : "Standar Ekosistem Terpadu (Seragam untuk Seluruh Properti)"}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* 1. Jam Check-in & Check-out */}
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>{currentLang === "en" ? "Check-In / Out (WIB)" : "Waktu Check-In / Out"}</span>
            </div>
            <div className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
              14:00 - 12:00 WIB
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "Standard check-in starts at 14:00 WIB. Check-out cutoff is 12:00 WIB sharp."
                : "Check-in dibuka jam 14:00 WIB. Batas check-out maksimal jam 12:00 siang WIB."}
            </p>
          </div>

          {/* 2. Jeda Sanitasi Kamar */}
          <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-gray-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{currentLang === "en" ? "Turnaround Buffer" : "Jeda Sanitasi Kamar"}</span>
            </div>
            <div className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
              2 {currentLang === "en" ? "Hours Buffer" : "Jam Sanitasi"}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "Reserved 2-hour window (12:00 - 14:00 WIB) for room turnover, cleaning, and sanitization."
                : "Jeda 2 jam (12:00 - 14:00 WIB) untuk pembersihan menyeluruh dan sterilisasi linen antar tamu."}
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
              {currentLang === "en"
                ? "100% refund up to 24h prior. Adjustable to MODERATE or STRICT per listing."
                : "Refund 100% hingga H-1. Dapat disesuaikan ke MODERATE atau STRICT per unit listing."}
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
              {currentLang === "en"
                ? "PIN Smart Lock or keylock box code shared via digital voucher upon payment."
                : "Kode PIN Smart Lock / Keybox otomatis dibagikan di e-voucher resmi setelah lunas."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
