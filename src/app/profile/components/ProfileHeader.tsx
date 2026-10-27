"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Home,
  Compass
} from "lucide-react"
import { updateProfile } from "@/app/actions/preferences"
import ProfileActivityMetrics from "./ProfileActivityMetrics"
import type { ProfileUser, AdminStats } from "../types"
import type { Dictionary } from "@/lib/dictionary"
import { toast } from "@/components/ui/use-toast"
import { validateImageFile } from "@/lib/file-validation"

interface ProfileHeaderProps {
  user: ProfileUser
  currentLang: string
  t: Partial<Dictionary>
  adminStats?: AdminStats
  image: string
  setImage: (url: string) => void
  profileSuccess?: boolean
}

export default function ProfileHeader({
  user,
  currentLang,
  t,
  adminStats,
  image,
  setImage,
  profileSuccess
}: ProfileHeaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file, currentLang)
    if (!validation.valid) {
      toast({
        variant: "destructive",
        title: validation.errorTitle || (currentLang === "en" ? "Format Not Supported" : "Format Tidak Didukung"),
        description: validation.errorMessage || "",
      })
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "avatars")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (currentLang === "en" ? "Failed to upload photo" : "Gagal mengunggah foto"))
      }

      const updateData = new FormData()
      updateData.set("image", data.url)
      await updateProfile(updateData)

      setImage(data.url)
      toast({
        variant: "success",
        title: currentLang === "en" ? "Photo Updated" : "Foto Diperbarui",
        description: t.photoUploadedSuccess || (currentLang === "en" ? "Profile photo updated successfully!" : "Foto profil berhasil diperbarui!"),
      })
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Upload Failed" : "Gagal Mengunggah",
        description: error.message || (currentLang === "en" ? "Failed to upload image. Please check file format." : "Gagal mengunggah gambar. Pastikan format file sesuai."),
      })
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP BAR */}
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

      {/* 2. DUAL-ROLE HERO BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-rose-50/20 to-indigo-50/10 dark:from-gray-900 dark:via-gray-900/90 dark:to-gray-950 border border-gray-200/80 dark:border-gray-800 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4.5">
            <div className="relative shrink-0">
              <Avatar className="h-16 w-16 sm:h-18 sm:w-18 ring-2 ring-rose-500/20 ring-offset-2 dark:ring-offset-gray-900 shadow-sm">
                <AvatarImage src={image || ""} alt={user.name || "User"} className="object-cover" />
                <AvatarFallback className="text-xl sm:text-2xl font-black bg-gradient-to-tr from-rose-500 to-rose-400 text-white">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

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
                  {user.name || "User"}
                </h2>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t.verifiedIdentity}</span>
                </span>

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

          {/* Sisi Kanan: Metrik Aktivitas yang Relevan */}
          <ProfileActivityMetrics
            user={user}
            isAdmin={isAdmin}
            isHost={isHost}
            adminStats={adminStats}
            currentLang={currentLang}
            t={t}
          />
        </div>
      </div>

      {profileSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{t.saveSuccess}</span>
        </div>
      )}
    </div>
  )
}
