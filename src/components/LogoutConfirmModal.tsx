"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function LogoutConfirmModal({
  triggerLabel = "Keluar",
  title = "Konfirmasi Keluar Akun",
  description = "Apakah Anda yakin ingin keluar dari sesi akun Anda saat ini?",
  cancelLabel = "Batal",
  loadingLabel,
}: {
  triggerLabel?: string
  title?: string
  description?: string
  cancelLabel?: string
  loadingLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut({ callbackUrl: "/" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="cursor-pointer flex w-full items-center text-red-600 dark:text-red-400 text-sm py-1.5 px-2 hover:bg-red-50/60 dark:hover:bg-red-950/30 rounded-md transition-colors outline-none"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>{triggerLabel}</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
            <LogOut className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {loading ? (loadingLabel || "...") : triggerLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
