"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface DeactivateAccountModalProps {
  open: boolean
  onClose: () => void
  currentLang: string
}

export default function DeactivateAccountModal({
  open,
  onClose,
  currentLang
}: DeactivateAccountModalProps) {
  if (!open) return null

  const handleConfirm = () => {
    toast({
      variant: "info",
      title: currentLang === "en" ? "Deactivation Requested" : "Permintaan Deaktivasi",
      description:
        currentLang === "en"
          ? "Deactivation request received. If you have no active bookings, support will finalize your request."
          : "Permintaan deaktivasi diterima. Akun akan dinonaktifkan setelah verifikasi riwayat transaksi.",
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Deactivate your account?" : "Nonaktifkan akun Anda?"}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {currentLang === "en"
              ? "Before deactivating, ensure you have no upcoming confirmed stays or pending host payouts. Once confirmed, your active listings and traveler profile will be hidden."
              : "Sebelum menonaktifkan, pastikan Anda tidak memiliki jadwal menginap aktif atau dana sewa yang belum dicairkan. Profil dan reservasi Anda akan disembunyikan dari sistem."}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Need your data before leaving?" : "Ingin menyimpan riwayat sebelum pergi?"}
          </div>
          <div>
            {currentLang === "en"
              ? 'You can download your data archive anytime using the "Request your personal data" option above.'
              : 'Anda dapat mengunduh salinan berkas riwayat reservasi Anda terlebih dahulu melalui opsi "Minta data pribadi Anda" di atas.'}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full text-xs font-semibold px-4 cursor-pointer"
          >
            {currentLang === "en" ? "Cancel" : "Batal"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 cursor-pointer"
          >
            {currentLang === "en" ? "Confirm Deactivation" : "Konfirmasi Deaktivasi"}
          </Button>
        </div>
      </div>
    </div>
  )
}
