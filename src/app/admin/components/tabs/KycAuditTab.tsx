import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Eye,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AdminUserItem } from "@/types"
import type { Dictionary } from "@/lib/dictionary"
import KycRejectDialog from "../dialogs/KycRejectDialog"
import KtpPreviewDialog from "../dialogs/KtpPreviewDialog"
import { toast } from "@/components/ui/use-toast"

export interface KycAuditTabProps {
  initialUsers: AdminUserItem[]
  currentLang?: string
  t: Partial<Dictionary>
}

export default function KycAuditTab({
  initialUsers,
  currentLang = "id",
  t,
}: KycAuditTabProps) {
  const router = useRouter()
  const [userSearch, setUserSearch] = useState("")
  const [kycRoleFilter, setKycRoleFilter] = useState<
    "AUDIT_QUEUE" | "HOST_ONLY" | "ALL_USERS"
  >("AUDIT_QUEUE")
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [selectedKycUser, setSelectedKycUser] = useState<AdminUserItem | null>(null)
  const [previewKtpUrl, setPreviewKtpUrl] = useState<string | null>(null)

  const handleUpdateKyc = async (
    userId: string,
    status: "VERIFIED" | "REJECTED",
    notes?: string
  ) => {
    setLoadingAction(`kyc-${userId}`)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status KYC")
      toast({
        variant: "success",
        title: currentLang === "en" ? "KYC Status Updated" : "Status KYC Diperbarui",
        description:
          currentLang === "en"
            ? `KYC status updated to ${status}.`
            : `Status verifikasi KYC berhasil diperbarui menjadi ${status}.`,
      })
      setSelectedKycUser(null)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "KYC Update Failed" : "Gagal Memperbarui KYC",
        description: error.message,
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredKycUsers = initialUsers.filter((u) => {
    if (u.role === "ADMIN") return false

    if (kycRoleFilter === "HOST_ONLY" && u.role !== "HOST") return false
    if (kycRoleFilter === "AUDIT_QUEUE") {
      const isHost = u.role === "HOST"
      const hasSubmitted = u.kycStatus === "PENDING" || Boolean(u.idCardUrl)
      if (!isHost && !hasSubmitted) return false
    }

    if (kycStatusFilter !== "ALL" && u.kycStatus !== kycStatusFilter) return false

    const q = userSearch.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.toLowerCase().includes(q) ||
      u.idCardNumber?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={
              currentLang === "en"
                ? "Search host name, email, phone, NIK..."
                : "Cari nama host, email, telp, NIK..."
            }
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              {currentLang === "en" ? "Scope:" : "Kategori:"}
            </span>
            <select
              value={kycRoleFilter}
              onChange={(e) =>
                setKycRoleFilter(
                  e.target.value as "AUDIT_QUEUE" | "HOST_ONLY" | "ALL_USERS"
                )
              }
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
            >
              <option value="AUDIT_QUEUE">
                {currentLang === "en"
                  ? "Audit Queue & Hosts (Recommended)"
                  : "Antrean Audit & Host (Rekomendasi)"}
              </option>
              <option value="HOST_ONLY">
                {currentLang === "en" ? "Hosts Only" : "Hanya Akun Host"}
              </option>
              <option value="ALL_USERS">
                {currentLang === "en" ? "All Non-Admin Users" : "Semua Pengguna"}
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              {currentLang === "en" ? "Status:" : "Status KYC:"}
            </span>
            <select
              value={kycStatusFilter}
              onChange={(e) => setKycStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-medium cursor-pointer"
            >
              <option value="ALL">
                {currentLang === "en" ? "All Statuses" : "Semua Status"}
              </option>
              <option value="PENDING">
                {currentLang === "en"
                  ? "PENDING (Needs Audit)"
                  : "PENDING (Menunggu Audit)"}
              </option>
              <option value="UNVERIFIED">
                {currentLang === "en"
                  ? "UNVERIFIED (No ID)"
                  : "UNVERIFIED (Belum Ajukan)"}
              </option>
              <option value="VERIFIED">
                {currentLang === "en"
                  ? "VERIFIED (Approved)"
                  : "VERIFIED (Disetujui)"}
              </option>
              <option value="REJECTED">
                {currentLang === "en"
                  ? "REJECTED (Denied)"
                  : "REJECTED (Ditolak)"}
              </option>
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
          filteredKycUsers.map((user) => {
            const nameMatchesBank =
              user.bankAccount?.accountHolder && user.name
                ? user.bankAccount.accountHolder.trim().toLowerCase() ===
                  user.name.trim().toLowerCase()
                : true

            return (
              <div
                key={user.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-6"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                  <Avatar className="w-14 h-14 rounded-2xl shrink-0 border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="font-bold text-base">
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {user.name || "Tanpa Nama"}
                      </h4>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          user.kycStatus === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : user.kycStatus === "PENDING"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 animate-pulse"
                            : user.kycStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        )}
                      >
                        KYC: {user.kycStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        {user.role}
                      </span>
                      {user.role === "GUEST" &&
                        (user.kycStatus === "PENDING" || user.idCardUrl) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300">
                            {currentLang === "en"
                              ? "Prospective Host"
                              : "Calon Host"}
                          </span>
                        )}
                    </div>

                    {/* NIK & Legal Identitas */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        NIK:{" "}
                        {user.idCardNumber || (
                          <span className="text-muted-foreground italic font-sans font-normal">
                            Belum diisi
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />{" "}
                        {user.phoneNumber || "-"}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />{" "}
                        {user.email}
                      </span>
                    </div>

                    {/* Alamat Domisili */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {user.address || "Belum ada alamat domisili terdaftar"}
                      </span>
                    </p>

                    {/* Bank Account Consistency Check */}
                    {user.bankAccount && (
                      <div className="pt-1">
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>
                                Bank {user.bankAccount.bankName}:{" "}
                                <strong>
                                  {user.bankAccount.accountNumber}
                                </strong>{" "}
                                a.n{" "}
                                <strong>
                                  {user.bankAccount.accountHolder}
                                </strong>
                              </span>
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
                          <span className="font-bold">
                            Catatan Penolakan Terakhir:{" "}
                          </span>
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
                      <span>
                        {currentLang === "en"
                          ? "No ID uploaded yet"
                          : "Belum unggah foto KTP"}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateKyc(user.id, "VERIFIED")}
                      disabled={
                        loadingAction === `kyc-${user.id}` ||
                        user.kycStatus === "VERIFIED" ||
                        !user.idCardUrl
                      }
                      title={
                        !user.idCardUrl
                          ? currentLang === "en"
                            ? "Cannot approve: ID document not uploaded"
                            : "Tidak dapat menyetujui: Dokumen KTP belum diunggah"
                          : user.kycStatus === "VERIFIED"
                          ? currentLang === "en"
                            ? "Already verified"
                            : "Akun sudah terverifikasi"
                          : currentLang === "en"
                          ? "Approve KYC and publish listings"
                          : "Setujui verifikasi identitas dan publikasikan listing"
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
                        ? currentLang === "en"
                          ? "Verified"
                          : "Terverifikasi"
                        : currentLang === "en"
                        ? "Approve & Publish"
                        : "Setujui & Publikasikan"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedKycUser(user)
                      }}
                      disabled={
                        loadingAction === `kyc-${user.id}` ||
                        user.kycStatus === "REJECTED" ||
                        (!user.idCardUrl && user.kycStatus === "UNVERIFIED")
                      }
                      title={
                        !user.idCardUrl && user.kycStatus === "UNVERIFIED"
                          ? currentLang === "en"
                            ? "User has not submitted KYC"
                            : "Pengguna belum mengajukan dokumen KYC"
                          : user.kycStatus === "REJECTED"
                          ? currentLang === "en"
                            ? "Already rejected"
                            : "Pengajuan sebelumnya sudah ditolak"
                          : currentLang === "en"
                          ? "Reject KYC submission"
                          : "Tolak pengajuan KYC dengan catatan alasan"
                      }
                      className={cn(
                        "rounded-xl text-xs font-semibold h-9 transition-all",
                        user.kycStatus === "REJECTED"
                          ? "border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-600 cursor-not-allowed opacity-90"
                          : !user.idCardUrl && user.kycStatus === "UNVERIFIED"
                          ? "border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      )}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      {user.kycStatus === "REJECTED"
                        ? currentLang === "en"
                          ? "Rejected"
                          : "Ditolak"
                        : currentLang === "en"
                        ? "Reject"
                        : "Tolak"}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Penolakan KYC */}
      <KycRejectDialog
        user={selectedKycUser}
        onClose={() => setSelectedKycUser(null)}
        onConfirmReject={(userId, reason) =>
          handleUpdateKyc(userId, "REJECTED", reason)
        }
        loading={loadingAction === `kyc-${selectedKycUser?.id}`}
        currentLang={currentLang}
        t={t}
      />

      {/* Modal Lightbox Dokumen KTP */}
      <KtpPreviewDialog
        previewUrl={previewKtpUrl}
        onClose={() => setPreviewKtpUrl(null)}
        currentLang={currentLang}
      />
    </div>
  )
}
