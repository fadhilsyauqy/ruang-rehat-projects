"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, Building2, CreditCard, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import type { AdminPayoutItem } from "@/types"

export interface PayoutConfirmDialogProps {
  payout: AdminPayoutItem | null
  onClose: () => void
  onConfirmPayout: (
    payoutId: string,
    referenceNumber: string,
    notes?: string
  ) => Promise<void>
  loading: boolean
  currentCurrency?: string
  currentLang?: string
}

export default function PayoutConfirmDialog({
  payout,
  onClose,
  onConfirmPayout,
  loading,
  currentCurrency = "IDR",
  currentLang = "id",
}: PayoutConfirmDialogProps) {
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (payout) {
      setReferenceNumber("")
      setNotes("")
      setErrorMsg("")
    }
  }, [payout])

  if (!payout) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanRef = referenceNumber.trim()
    if (!cleanRef) {
      setErrorMsg(
        currentLang === "en"
          ? "Bank transfer reference number is required."
          : "Nomor referensi transfer mutasi bank wajib diisi."
      )
      return
    }
    setErrorMsg("")
    onConfirmPayout(payout.id, cleanRef, notes.trim() || undefined)
  }

  return (
    <Dialog open={!!payout} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-lg p-6 sm:p-7 rounded-3xl">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentLang === "en"
              ? "Confirm Host Payout Transfer"
              : "Konfirmasi Pencairan Dana Host"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Permohonan #{payout.id.slice(0, 8).toUpperCase()} · Pemohon:{" "}
            {payout.user?.name || payout.user?.email || "Host"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Detail Rekening Penerima */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-semibold">
                {currentLang === "en" ? "Disbursement Amount:" : "Nominal Pencairan:"}
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                {formatPrice(payout.amount, currentCurrency)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60 space-y-1 text-gray-800 dark:text-gray-200">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Bank Tujuan:</strong> {payout.bankName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>No. Rekening:</strong>{" "}
                  <span className="font-mono font-bold tracking-wider">
                    {payout.accountNumber}
                  </span>
                </span>
              </div>
              <p className="pl-5">
                <strong>Atas Nama:</strong> {payout.accountHolder}
              </p>
            </div>
          </div>

          {/* Input Nomor Referensi Transfer Bank */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>
                {currentLang === "en"
                  ? "Transfer Reference / Bank Mutation No. *"
                  : "Nomor Referensi Transfer / Mutasi Bank *"}
              </span>
              <span className="text-[10px] text-rose-500 font-semibold">
                {currentLang === "en" ? "Required" : "Wajib"}
              </span>
            </label>
            <Input
              type="text"
              disabled={loading}
              placeholder={
                currentLang === "en"
                  ? "e.g., BIFAST-20261026-98124 or BCA Ref 882910"
                  : "Contoh: BIFAST-20261026-98124 atau Ref BCA 882910"
              }
              value={referenceNumber}
              onChange={(e) => {
                setReferenceNumber(e.target.value)
                if (errorMsg) setErrorMsg("")
              }}
              required
              className="rounded-xl text-xs bg-white dark:bg-gray-900 font-mono disabled:opacity-60"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {currentLang === "en"
                ? "This reference number will be saved to audit notes and included in the host's email confirmation."
                : "Nomor ini disimpan permanen pada sistem dan dicantumkan pada email bukti transfer ke Host."}
            </p>
            {errorMsg && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
              {currentLang === "en"
                ? "Additional Admin Notes (Optional):"
                : "Catatan Tambahan Admin (Opsional):"}
            </label>
            <Input
              type="text"
              disabled={loading}
              placeholder={
                currentLang === "en"
                  ? "e.g., Transferred via corporate internet banking"
                  : "Contoh: Ditransfer via KlikBCA Bisnis (sukses)"
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl text-xs bg-white dark:bg-gray-900 disabled:opacity-60"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentLang === "en" ? "Cancel" : "Batal"}
            </Button>
            <Button
              type="submit"
              disabled={loading || !referenceNumber.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentLang === "en" ? "Processing..." : "Menyimpan..."}</span>
                </>
              ) : currentLang === "en" ? (
                "Confirm Transfer Completed"
              ) : (
                "Konfirmasi & Selesaikan Payout"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
