import React from "react"
import { ShieldAlert, ShieldCheck, Clock } from "lucide-react"

export interface HostKycBannerProps {
  currentUser: {
    kycStatus?: string | null
    idCardNumber?: string | null
    [key: string]: unknown
  } | null
  currentLang?: string
  onOpenKycModal: () => void
}

export default function HostKycBanner({
  currentUser,
  currentLang = "id",
  onOpenKycModal,
}: HostKycBannerProps) {
  if (!currentUser) return null

  if (currentUser.kycStatus === "UNVERIFIED") {
    return (
      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
              {currentLang === "en"
                ? "Host Identity Verification Required (KYC)"
                : "Verifikasi Identitas Host Diperlukan (KYC)"}
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
          onClick={onOpenKycModal}
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold px-3.5 py-2 shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>
            {currentLang === "en" ? "Verify ID (KTP) Now" : "Verifikasi KTP Sekarang"}
          </span>
        </button>
      </div>
    )
  }

  if (currentUser.kycStatus === "PENDING") {
    return (
      <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-200">
              {currentLang === "en"
                ? "ID Documents Under Admin Review"
                : "Dokumen Identitas Sedang Ditinjau Admin"}
            </h4>
            <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80 leading-relaxed max-w-3xl">
              {currentLang === "en"
                ? "Your KTP verification is currently being audited by Admin. Properties will be published automatically once approved."
                : "Pengajuan verifikasi KTP sedang diproses tim Admin (maks 1x24 jam). Listing otomatis tayang begitu disetujui."}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200 shrink-0 self-start sm:self-center">
          {currentLang === "en" ? "IN REVIEW" : "SEDANG DITINJAU"}
        </span>
      </div>
    )
  }

  if (currentUser.kycStatus === "VERIFIED") {
    return (
      <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-xs">
            {currentLang === "en"
              ? "Official Verified Host Account"
              : "Akun Host Terverifikasi Resmi"}
          </span>
          {currentUser.idCardNumber && (
            <span className="text-[11px] text-muted-foreground">
              · NIK: {currentUser.idCardNumber.substring(0, 6)}******
            </span>
          )}
        </div>
        <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
          ACTIVE
        </span>
      </div>
    )
  }

  return null
}
