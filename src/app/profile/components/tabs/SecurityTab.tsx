"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  X
} from "lucide-react"
import { changePassword } from "@/app/actions/preferences"
import type { ProfileUser } from "../../types"

interface SecurityTabProps {
  user: ProfileUser
  currentLang: string
  t: any
}

export default function SecurityTab({
  user,
  currentLang,
  t
}: SecurityTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState("")

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwSuccess(false)

    if (newPassword.length < 6) {
      setPwError(
        currentLang === "en"
          ? "New password must be at least 6 characters"
          : "Kata sandi baru minimal 6 karakter"
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError(
        currentLang === "en"
          ? "New passwords do not match"
          : "Konfirmasi kata sandi baru tidak cocok"
      )
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {currentLang === "en" ? "Login & security" : "Log masuk & keamanan"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentLang === "en"
              ? "Update your password and protect your account."
              : "Perbarui kata sandi dan lindungi akses akun Anda."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Kata Sandi */}
        <div
          className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
            editingSection === "password" ? "md:col-span-2" : "col-span-1"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.currentPassword || (currentLang === "en" ? "Password" : "Kata sandi")}
              </span>
              {editingSection !== "password" && (
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {user.hasPassword
                    ? currentLang === "en"
                      ? "Password configured • Protected"
                      : "Kata sandi telah dikonfigurasi • Aman"
                    : currentLang === "en"
                    ? "No password configured"
                    : "Belum mengatur kata sandi"}
                </h4>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setEditingSection(editingSection === "password" ? null : "password")
              }
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
            <form
              onSubmit={handleChangePassword}
              className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in"
            >
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
                      {showCurrentPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
                      {showNewPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
                      {showConfirmPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
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
  )
}
