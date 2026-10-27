"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, Database } from "lucide-react"
import { updatePrivacySettings } from "@/app/actions/preferences"
import DeactivateAccountModal from "../dialogs/DeactivateAccountModal"
import type { ProfileUser } from "../../types"
import { toast } from "@/components/ui/use-toast"

interface PrivacyTabProps {
  user: ProfileUser
  currentLang: string
}

export default function PrivacyTab({
  user,
  currentLang
}: PrivacyTabProps) {
  const [hideLastName, setHideLastName] = useState(user.hideLastNameReview ?? false)
  const [hideSearch, setHideSearch] = useState(user.hideSearchEngines ?? false)
  const [readReceipts] = useState(user.readReceipts ?? true)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacySuccessMsg, setPrivacySuccessMsg] = useState("")
  const [exportingData, setExportingData] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)

  const isHost = user.role === "HOST" || user.role === "ADMIN" || (user.stats?.totalProperties ?? 0) > 0

  const handleTogglePrivacy = async (
    key: "hideLastName" | "hideSearch",
    newVal: boolean
  ) => {
    const updatedLastName = key === "hideLastName" ? newVal : hideLastName
    const updatedSearch = key === "hideSearch" ? newVal : hideSearch

    if (key === "hideLastName") setHideLastName(newVal)
    if (key === "hideSearch") setHideSearch(newVal)

    setSavingPrivacy(true)
    setPrivacySuccessMsg("")
    try {
      await updatePrivacySettings({
        hideLastNameReview: updatedLastName,
        hideSearchEngines: updatedSearch,
        readReceipts: readReceipts
      })
      const successText =
        currentLang === "en" ? "Privacy settings updated" : "Pengaturan privasi berhasil disimpan"
      setPrivacySuccessMsg(successText)
      toast({
        variant: "success",
        title: currentLang === "en" ? "Privacy Saved" : "Privasi Disimpan",
        description: successText,
      })
      setTimeout(() => setPrivacySuccessMsg(""), 3000)
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Update Failed" : "Gagal Memperbarui",
        description: error.message || (currentLang === "en" ? "Failed to update privacy settings" : "Gagal memperbarui pengaturan privasi"),
      })
    } finally {
      setSavingPrivacy(false)
    }
  }

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
      toast({
        variant: "success",
        title: currentLang === "en" ? "Data Exported" : "Data Diekspor",
        description: currentLang === "en" ? "Your personal data archive has been downloaded." : "Arsip data pribadi Anda berhasil diunduh.",
      })
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Export Failed" : "Gagal Mengunduh Data",
        description: error.message || (currentLang === "en" ? "Failed to download personal data archive" : "Gagal mengunduh arsip data pribadi"),
      })
    } finally {
      setExportingData(false)
    }
  }

  return (
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
                    ? currentLang === "en" ? "Preparing..." : "Menyiapkan..."
                    : currentLang === "en" ? "Download data (.JSON)" : "Unduh data"}
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
          {/* Row: Mesin Pencari (Hanya ditampilkan untuk Host yang memiliki listing publik) */}
          {isHost && (
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {currentLang === "en"
                        ? "Include accommodation listings in search engines"
                        : "Sertakan listing properti dalam mesin pencari"}
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                      {currentLang === "en" ? "Host listing" : "Listing Tuan Rumah"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentLang === "en"
                      ? "Allow search engines like Google and Bing to index and display your public accommodation listings in web search results to reach more guests."
                      : "Izinkan mesin pencari seperti Google dan Bing untuk mengindeks dan menampilkan listing akomodasi publik Anda di hasil pencarian web guna menjangkau lebih banyak calon tamu."}
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
          )}

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
                    ? 'Show only your first name and last initial (e.g. "Bryan S.") rather than your full legal name on public property reviews.'
                    : 'Samarkan nama belakang menjadi inisial (contoh: "Bryan S.") pada ulasan properti publik untuk kenyamanan privasi Anda.'}
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
        </div>
      </div>

      {/* Modal Deaktivasi Akun Protektif */}
      <DeactivateAccountModal
        open={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        currentLang={currentLang}
      />
    </div>
  )
}
