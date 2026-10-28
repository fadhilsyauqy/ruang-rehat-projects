"use client"

import { Button } from "@/components/ui/button"
import { Pencil, X } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"

interface ResidentialAddressCardProps {
  address: string
  setAddress: (addr: string) => void
  isOpen: boolean
  onToggle: () => void
  onSave: () => void
  loading: boolean
  currentLang: string
  t: Dictionary
}

export default function ResidentialAddressCard({
  address,
  setAddress,
  isOpen,
  onToggle,
  onSave,
  loading,
  currentLang,
  t
}: ResidentialAddressCardProps) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
        isOpen ? "md:col-span-2" : "col-span-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {currentLang === "en" ? "Residential address" : "Alamat tempat tinggal"}
          </span>
          {!isOpen && (
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {address || (currentLang === "en" ? "Not provided" : "Belum disediakan")}
            </h4>
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
              <span>
                {address
                  ? currentLang === "en"
                    ? "Edit"
                    : "Edit"
                  : currentLang === "en"
                  ? "Add"
                  : "Tambahkan"}
              </span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "Your official residential address for billing receipts and account protection."
              : "Alamat tempat tinggal resmi untuk keperluan tanda terima penagihan dan verifikasi akun."}
          </p>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            placeholder={
              currentLang === "en"
                ? "Jl. Sudirman No. 12, Jakarta"
                : "Jl. Jenderal Sudirman No. 10, Jakarta"
            }
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
          />
          <Button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            {loading ? t.saving : currentLang === "en" ? "Save changes" : "Simpan perubahan"}
          </Button>
        </div>
      )}
    </div>
  )
}
