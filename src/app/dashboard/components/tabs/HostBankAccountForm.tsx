import React, { useState } from "react"
import { Landmark, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"
import type { HostBankAccount } from "@prisma/client"

export interface HostBankAccountFormProps {
  initialBankAccount: HostBankAccount | null
  onBankAccountSaved: (account: HostBankAccount) => void
  currentLang?: string
  t: Partial<Dictionary>
}

export default function HostBankAccountForm({
  initialBankAccount,
  onBankAccountSaved,
  currentLang = "id",
  t,
}: HostBankAccountFormProps) {
  const [bankNameInput, setBankNameInput] = useState(
    initialBankAccount?.bankName || "BCA"
  )
  const [accountNumberInput, setAccountNumberInput] = useState(
    initialBankAccount?.accountNumber || ""
  )
  const [accountHolderInput, setAccountHolderInput] = useState(
    initialBankAccount?.accountHolder || ""
  )
  const [savingBankLoading, setSavingBankLoading] = useState(false)
  const [bankSuccessMsg, setBankSuccessMsg] = useState("")
  const [checkingBank, setCheckingBank] = useState(false)
  const [inquiryResult, setInquiryResult] = useState<{
    network?: string
    accountHolder: string
  } | null>(null)
  const [inquiryError, setInquiryError] = useState("")

  const handleCheckBankAccount = async () => {
    if (!accountNumberInput) {
      setInquiryError("Masukkan nomor rekening terlebih dahulu.")
      return
    }

    setCheckingBank(true)
    setInquiryError("")
    setInquiryResult(null)

    try {
      const res = await fetch("/api/host/bank-account/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: accountNumberInput,
          accountHolder: accountHolderInput,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memeriksa rekening bank.")
      }

      setInquiryResult(data.data)
      setAccountHolderInput(data.data.accountHolder)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memeriksa rekening bank."
      setInquiryError(message)
      setAccountHolderInput("")
    } finally {
      setCheckingBank(false)
    }
  }

  const handleSaveBankAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inquiryResult && !initialBankAccount) {
      alert(
        "Harap klik 'Periksa Rekening' untuk memvalidasi nomor rekening Anda terlebih dahulu."
      )
      return
    }

    setSavingBankLoading(true)
    setBankSuccessMsg("")

    try {
      const res = await fetch("/api/host/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          accountNumber: accountNumberInput,
          accountHolder: accountHolderInput,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error ||
            (currentLang === "en"
              ? "Failed to save bank account"
              : "Gagal menyimpan rekening bank")
        )
      }

      onBankAccountSaved(data.bankAccount)
      setBankSuccessMsg(
        t.bankVerifiedSuccess ||
          "Rekening bank terverifikasi dan berhasil disimpan!"
      )
      setInquiryResult(null)
      setTimeout(() => setBankSuccessMsg(""), 4000)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan rekening bank"
      alert(message)
    } finally {
      setSavingBankLoading(false)
    }
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
          <Landmark className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {t.bankAccountTitle}
          </h4>
          <p className="text-xs text-muted-foreground">{t.bankAccountDesc}</p>
        </div>
      </div>

      {bankSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{bankSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveBankAccount} className="space-y-4">
        {/* Pilihan Bank */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.bankName}
          </label>
          <select
            value={bankNameInput}
            onChange={(e) => setBankNameInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
          >
            <option value="BCA">Bank BCA (Bank Central Asia)</option>
            <option value="Mandiri">Bank Mandiri</option>
            <option value="BNI">Bank BNI (Bank Negara Indonesia)</option>
            <option value="BRI">Bank BRI (Bank Rakyat Indonesia)</option>
            <option value="CIMB Niaga">Bank CIMB Niaga</option>
            <option value="BSI">Bank Syariah Indonesia (BSI)</option>
            <option value="Permata">Bank Permata</option>
            <option value="Jago">Bank Jago</option>
          </select>
        </div>

        {/* Nomor Rekening + Tombol Cek Rekening (Inquiry) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.accountNumber}
            </label>
            <span className="text-[10px] text-muted-foreground">
              {bankNameInput === "Mandiri"
                ? "13 digit"
                : bankNameInput === "BRI"
                ? "15 digit"
                : "10 digit"}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Contoh: 8820192381"
              value={accountNumberInput}
              onChange={(e) => {
                setAccountNumberInput(e.target.value.replace(/\D/g, ""))
                setInquiryResult(null)
                setInquiryError("")
              }}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors font-mono"
            />
            <button
              type="button"
              onClick={handleCheckBankAccount}
              disabled={checkingBank || !accountNumberInput}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {checkingBank ? "Memeriksa..." : "Periksa Rekening"}
            </button>
          </div>
        </div>

        {/* Pesan Kesalahan Inquiry */}
        {inquiryError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{inquiryError}</span>
          </div>
        )}

        {/* Hasil Inquiry Terverifikasi */}
        {inquiryResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Rekening Valid & Ditemukan ({inquiryResult.network})</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              Atas Nama:{" "}
              <strong className="font-semibold text-emerald-950 dark:text-emerald-100">
                {inquiryResult.accountHolder}
              </strong>
            </p>
          </div>
        )}

        {/* Nama Pemilik Rekening */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.accountHolder} (Sesuai Buku Tabungan)
          </label>
          <input
            type="text"
            required
            placeholder="Nama terverifikasi otomatis setelah periksa rekening"
            value={accountHolderInput}
            onChange={(e) => setAccountHolderInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors uppercase font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={
            savingBankLoading || !accountNumberInput || !accountHolderInput
          }
          className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          {savingBankLoading ? t.savingBankAccount : t.saveBankAccount}
        </button>
      </form>
    </div>
  )
}
