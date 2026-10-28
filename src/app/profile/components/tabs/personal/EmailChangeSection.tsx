"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Pencil,
  X
} from "lucide-react"
import { changeEmail } from "@/app/actions/preferences"

interface EmailChangeSectionProps {
  currentEmail: string
  currentLang: string
  isOpen: boolean
  onToggle: () => void
  onCancel: () => void
  onEmailUpdated: (newEmail: string) => void
}

export default function EmailChangeSection({
  currentEmail,
  currentLang,
  isOpen,
  onToggle,
  onCancel,
  onEmailUpdated
}: EmailChangeSectionProps) {
  const router = useRouter()
  const [newEmailInput, setNewEmailInput] = useState("")
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState("")
  const [emailError, setEmailError] = useState("")
  const [showEmailPw, setShowEmailPw] = useState(false)

  const maskedEmail = (() => {
    if (!currentEmail) return currentLang === "en" ? "Not provided" : "Tidak disediakan"
    const parts = currentEmail.split("@")
    if (parts.length !== 2) return currentEmail
    const userPart = parts[0]
    if (userPart.length <= 2) return `${userPart[0]}***@${parts[1]}`
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${parts[1]}`
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")
    setEmailSuccess("")

    const cleanInput = newEmailInput.trim().toLowerCase()
    if (!cleanInput) {
      setEmailError(
        currentLang === "en"
          ? "Please enter a valid new email address."
          : "Silakan masukkan alamat email baru."
      )
      return
    }

    if (cleanInput === currentEmail.toLowerCase()) {
      setEmailError(
        currentLang === "en"
          ? "New email cannot be identical to your current email."
          : "Alamat email baru tidak boleh sama dengan email saat ini."
      )
      return
    }

    if (!emailCurrentPassword) {
      setEmailError(
        currentLang === "en"
          ? "Please enter your current account password for security verification."
          : "Silakan masukkan kata sandi akun saat ini untuk verifikasi keamanan."
      )
      return
    }

    setEmailLoading(true)
    try {
      const res = await changeEmail(cleanInput, emailCurrentPassword)
      if (res.success && res.email) {
        setEmailSuccess(
          currentLang === "en"
            ? "Email address updated successfully!"
            : "Alamat email berhasil diperbarui!"
        )
        onEmailUpdated(res.email)
        setNewEmailInput("")
        setEmailCurrentPassword("")
        setTimeout(() => {
          onCancel()
          setEmailSuccess("")
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setEmailError(
        msg ||
          (currentLang === "en" ? "Failed to update email address" : "Gagal memperbarui alamat email")
      )
    } finally {
      setEmailLoading(false)
    }
  }

  const handleReset = () => {
    onCancel()
    setEmailError("")
    setEmailSuccess("")
    setNewEmailInput("")
    setEmailCurrentPassword("")
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
        isOpen ? "md:col-span-2" : "col-span-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {currentLang === "en" ? "Email address" : "Alamat email"}
          </span>
          {!isOpen && (
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
          onClick={onToggle}
          className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
        >
          {isOpen ? (
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

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in"
        >
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {currentLang === "en"
                  ? "Security Verification Required"
                  : "Verifikasi Keamanan Akun"}
              </span>
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
              {currentLang === "en"
                ? "Current password (Confirmation)"
                : "Kata sandi saat ini (Konfirmasi)"}{" "}
              *
            </label>
            <div className="relative">
              <input
                type={showEmailPw ? "text" : "password"}
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                placeholder={
                  currentLang === "en" ? "Enter your password" : "Masukkan kata sandi saat ini"
                }
                required
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEmailPw(!showEmailPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer p-1"
              >
                {showEmailPw ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="submit"
              disabled={emailLoading || !newEmailInput || !emailCurrentPassword}
              className="rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-xs cursor-pointer px-4 py-2"
            >
              {emailLoading
                ? currentLang === "en"
                  ? "Saving..."
                  : "Menyimpan..."
                : currentLang === "en"
                ? "Save Email Address"
                : "Simpan Email Baru"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="rounded-xl text-xs font-semibold border-gray-200 dark:border-gray-800 cursor-pointer px-4 py-2"
            >
              {currentLang === "en" ? "Cancel" : "Batal"}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
