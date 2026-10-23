"use client"

import Link from "next/link"
import { BadgeCheck, ShieldCheck, Clock, ShieldAlert } from "lucide-react"
import type { ProfileUser } from "../../../types"

interface PersonalKycCardProps {
  user: ProfileUser
  isAdmin: boolean
  isHost: boolean
  currentLang: string
  t: any
  joinDate: string
  onOpenKycModal: () => void
}

export default function PersonalKycCard({
  user,
  isAdmin,
  isHost,
  currentLang,
  t,
  joinDate,
  onOpenKycModal
}: PersonalKycCardProps) {
  if (isAdmin) {
    return (
      <div className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-purple-200/80 dark:border-purple-900/60 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              {currentLang === "en" ? "Identity KYC Authority & Review" : "Otoritas Verifikasi Identitas (KYC)"}
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {currentLang === "en"
                    ? "Platform Administrator Authority"
                    : "Wewenang Administrator Platform"}
                </span>
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
    )
  }

  if (isHost) {
    return (
      <div className="col-span-1 md:col-span-2 p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {currentLang === "en"
                ? "Host identity verification (KYC)"
                : "Verifikasi identitas Tuan Rumah (KTP/Paspor)"}
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                  user.kycStatus === "VERIFIED"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : user.kycStatus === "PENDING"
                    ? "text-purple-600 dark:text-purple-400"
                    : user.kycStatus === "REJECTED"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {user.kycStatus === "VERIFIED" ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : user.kycStatus === "PENDING" ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
                <span>
                  {user.kycStatus === "VERIFIED"
                    ? currentLang === "en"
                      ? "Verified Host"
                      : "Host Terverifikasi Resmi"
                    : user.kycStatus === "PENDING"
                    ? currentLang === "en"
                      ? "Verification In Review"
                      : "Sedang Ditinjau Admin"
                    : user.kycStatus === "REJECTED"
                    ? currentLang === "en"
                      ? "Verification Rejected"
                      : "Verifikasi Ditolak"
                    : currentLang === "en"
                    ? "Unverified Host Account"
                    : "Akun Host Belum Terverifikasi"}
                </span>
              </span>
              <span className="text-xs text-gray-300 dark:text-gray-700">•</span>
              <span className="text-xs text-muted-foreground">
                {t.memberSince} {joinDate}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {user.kycStatus === "VERIFIED"
                ? currentLang === "en"
                  ? `Official identity document confirmed. NIK: ${
                      user.idCardNumber ? user.idCardNumber.substring(0, 6) + "******" : "Confirmed"
                    }. Your properties are eligible for public exploration and instant booking.`
                  : `Dokumen identitas resmi terkonfirmasi. NIK: ${
                      user.idCardNumber ? user.idCardNumber.substring(0, 6) + "******" : "Terkonfirmasi"
                    }. Properti Anda otomatis tayang ke publik dan siap menerima tamu.`
                : user.kycStatus === "PENDING"
                ? currentLang === "en"
                  ? "Your ID Card submission is currently being reviewed by Admin. Approval typically takes within 24 hours."
                  : "Foto KTP Anda sedang dalam peninjauan oleh tim Admin (maksimal 1x24 jam). Listing properti akan otomatis tayang begitu disetujui."
                : user.kycStatus === "REJECTED"
                ? currentLang === "en"
                  ? `Reason: "${
                      user.kycRejectReason || "ID document unreadable or mismatched"
                    }". Please re-upload a clear ID Card photo.`
                  : `Alasan penolakan: "${
                      user.kycRejectReason || "Foto KTP buram atau data tidak cocok"
                    }". Silakan unggah ulang foto dokumen Anda.`
                : currentLang === "en"
                ? "Verify your ID Card (KTP) to build trust and ensure your listings are publicly searchable and bookable by guests."
                : "Lengkapi verifikasi KTP untuk memastikan keamanan platform dan mengaktifkan penayangan properti Anda ke publik."}
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
                onClick={onOpenKycModal}
                className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {user.kycStatus === "REJECTED"
                    ? currentLang === "en"
                      ? "Re-upload KTP"
                      : "Unggah Ulang KTP"
                    : currentLang === "en"
                    ? "Verify Now"
                    : "Verifikasi Sekarang"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
