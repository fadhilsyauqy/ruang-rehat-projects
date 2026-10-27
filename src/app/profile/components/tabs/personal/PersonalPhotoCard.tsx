"use client"

import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Pencil, X, Upload } from "lucide-react"

import type { Dictionary } from "@/lib/dictionary"

interface PersonalPhotoCardProps {
  image: string
  setImage: (url: string) => void
  userName: string
  isOpen: boolean
  onToggle: () => void
  onSave: () => void
  loading: boolean
  currentLang: string
  t: Partial<Dictionary>
}

export default function PersonalPhotoCard({
  image,
  setImage,
  userName,
  isOpen,
  onToggle,
  onSave,
  loading,
  currentLang,
  t
}: PersonalPhotoCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(
        currentLang === "en"
          ? "Only JPEG, PNG, or WebP images are allowed."
          : "Format file tidak didukung. Hanya JPEG, PNG, atau WebP yang diperbolehkan."
      )
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(
        currentLang === "en"
          ? "File size exceeds 5 MB limit."
          : "Ukuran file melebihi batas maksimal 5 MB."
      )
      return
    }

    setUploading(true)
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

      setImage(data.url)
    } catch (err: unknown) {
      const error = err as Error
      alert(error.message || (currentLang === "en" ? "Failed to upload image. Please check file format." : "Gagal mengunggah gambar. Pastikan format file sesuai."))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
        isOpen ? "md:col-span-2" : "col-span-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {currentLang === "en" ? "Profile photo" : "Foto profil"}
          </span>
          {!isOpen && (
            <div className="flex items-center gap-3 pt-0.5">
              <Avatar className="h-11 w-11 border border-rose-500/20 shadow-2xs">
                <AvatarImage src={image || ""} alt={userName || "User"} className="object-cover" />
                <AvatarFallback className="font-bold text-sm bg-rose-50 text-rose-600">
                  {userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                {image
                  ? currentLang === "en"
                    ? "Custom photo uploaded"
                    : "Foto kustom terpasang"
                  : currentLang === "en"
                  ? "Default profile avatar"
                  : "Avatar bawaan"}
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
        <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "A clear photo helps hosts and guests recognize you upon check-in."
              : "Foto wajah yang jelas memudahkan tuan rumah dan tamu saling mengenali saat check-in."}
          </p>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <Avatar className="h-16 w-16 border-2 border-rose-500/20 shrink-0">
              <AvatarImage src={image || ""} alt={userName || "User"} className="object-cover" />
              <AvatarFallback className="font-bold text-lg bg-rose-50 text-rose-600">
                {userName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl text-xs font-bold gap-2 cursor-pointer h-10 px-4"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {uploading
                    ? t.uploadingPhoto
                    : currentLang === "en"
                    ? "Upload photo"
                    : "Pilih file"}
                </span>
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setImage("")}
                  className="rounded-xl text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold cursor-pointer h-10 px-3"
                >
                  {currentLang === "en" ? "Remove" : "Hapus"}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Or image URL" : "Atau tautan URL foto"}
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            />
          </div>

          <div className="pt-1">
            <Button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {loading ? t.saving : currentLang === "en" ? "Save changes" : "Simpan perubahan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
