"use client"

import Link from "next/link"
import {
  BadgeCheck,
  CreditCard,
  Users,
  Home,
  ShieldAlert,
  Database,
  Clock,
  ArrowRight
} from "lucide-react"
import type { AdminStats } from "../../../types"

interface AdminHostingSectionProps {
  adminStats?: AdminStats
  currentLang: string
}

export default function AdminHostingSection({
  adminStats,
  currentLang
}: AdminHostingSectionProps) {
  return (
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
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  (adminStats?.pendingKyc ?? 0) > 0
                    ? "bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300/60"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {adminStats?.pendingKyc ?? 0}{" "}
                {currentLang === "en" ? "Pending Queue" : "Antrean Menunggu"}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en"
                ? "User Identity Review Queue"
                : "Peninjauan Dokumen KTP & Paspor"}
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
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  (adminStats?.pendingPayouts ?? 0) > 0
                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {adminStats?.pendingPayouts ?? 0}{" "}
                {currentLang === "en" ? "Pending Transfer" : "Menunggu Transfer"}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en"
                ? "Host Payout BI-FAST Settlements"
                : "Pelepasan Dana Sewa BI-FAST"}
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
              {currentLang === "en"
                ? "Role Assignment & Account Audit"
                : "Eskalasi Role & Audit Akun"}
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
                {adminStats?.totalProperties ?? 0}{" "}
                {currentLang === "en" ? "Properties" : "Listing Aktif"}
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en"
                ? "Listing Quality & Policy Compliance"
                : "Kualitas Listing & Kepatuhan"}
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
            {currentLang === "en"
              ? "Platform Governance & Legal Safeguards"
              : "Pedoman Tata Kelola Hukum & Kepatuhan"}
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-purple-100 dark:border-gray-800 space-y-1">
            <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-purple-500" />
              <span>
                {currentLang === "en" ? "UU PDP No. 27/2022 & GDPR" : "Kepatuhan UU PDP No. 27/2022"}
              </span>
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
              <span>
                {currentLang === "en" ? "SafeStay 24h Escrow Guard" : "Jaminan Escrow 24 Jam"}
              </span>
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
  )
}
