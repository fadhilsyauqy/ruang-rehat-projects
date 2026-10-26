import React, { useState } from "react"
import { ArrowDownToLine, CreditCard, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPrice } from "@/lib/format"
import PayoutBalanceCards from "./PayoutBalanceCards"
import HostBankAccountForm from "./HostBankAccountForm"
import PayoutHistoryTable from "./PayoutHistoryTable"
import WithdrawConfirmDialog from "../dialogs/WithdrawConfirmDialog"
import PayoutReceiptDialog, { type PayoutReceiptData } from "../dialogs/PayoutReceiptDialog"
import type { Dictionary } from "@/lib/dictionary"
import type { HostBankAccount, Payout } from "@/types"

export interface HostPayoutsTabProps {
  availablePayoutIdr: number
  escrowIdr: number
  totalWithdrawnIdr: number
  bankAccount: HostBankAccount | null
  onBankAccountSaved: (account: HostBankAccount) => void
  payoutsList: Payout[]
  onPayoutCreated: (payout: Payout) => void
  currentUser: {
    kycStatus?: string | null
    [key: string]: unknown
  } | null
  onOpenKycModal: () => void
  currentCurrency?: string
  currentLang?: string
  t: Partial<Dictionary>
}

export default function HostPayoutsTab({
  availablePayoutIdr,
  escrowIdr,
  totalWithdrawnIdr,
  bankAccount,
  onBankAccountSaved,
  payoutsList,
  onPayoutCreated,
  currentUser,
  onOpenKycModal,
  currentCurrency = "IDR",
  currentLang = "id",
  t,
}: HostPayoutsTabProps) {
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("")
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutErrorMsg, setPayoutErrorMsg] = useState("")
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState("")
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [completedReceipt, setCompletedReceipt] = useState<PayoutReceiptData | null>(null)

  const availablePayoutInCurrentCurrency =
    currentCurrency === "USD"
      ? Math.round((availablePayoutIdr / 18051) * 100) / 100
      : availablePayoutIdr

  const formatCurrencyInput = (val: string | number) => {
    if (!val) return ""
    const num = String(val).replace(/\D/g, "")
    if (!num) return ""
    return new Intl.NumberFormat(
      currentCurrency === "USD" ? "en-US" : "id-ID"
    ).format(Number(num))
  }

  const handleWithdrawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "")
    setWithdrawAmountInput(rawVal)
    if (payoutErrorMsg) setPayoutErrorMsg("")
  }

  const currentWithdrawNum = Number(withdrawAmountInput) || 0
  const isOverBalance = currentWithdrawNum > availablePayoutInCurrentCurrency

  const handleOpenConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutErrorMsg("")

    const amount = Number(withdrawAmountInput)
    if (!amount || amount <= 0) {
      setPayoutErrorMsg(
        t.enterValidPayoutAmount || "Masukkan nominal penarikan yang valid"
      )
      return
    }

    if (amount > availablePayoutInCurrentCurrency) {
      setPayoutErrorMsg(
        currentLang === "en"
          ? `Amount exceeds available payout balance (${formatPrice(
              availablePayoutIdr,
              currentCurrency
            )})`
          : `Nominal melebihi saldo siap ditarik (${formatPrice(
              availablePayoutIdr,
              currentCurrency
            )})`
      )
      return
    }

    if (!bankAccount) {
      setPayoutErrorMsg(
        t.noBankAccountSavedAlert ||
          "Rekening bank belum terdaftar. Silakan verifikasi rekening terlebih dahulu."
      )
      return
    }

    setIsConfirmModalOpen(true)
  }

  const handleExecutePayout = async () => {
    setPayoutLoading(true)
    setPayoutErrorMsg("")
    setPayoutSuccessMsg("")

    const amount = Number(withdrawAmountInput)
    const amountInIdr =
      currentCurrency === "USD" ? Math.round(amount * 18051) : amount

    try {
      const res = await fetch("/api/host/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInIdr,
          notes: `Penarikan dana oleh host ke ${bankAccount?.bankName} - ${bankAccount?.accountNumber}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses penarikan dana")
      }

      onPayoutCreated(data.payout)
      setIsConfirmModalOpen(false)
      setPayoutSuccessMsg(
        data.message ||
          "Permintaan penarikan dana berhasil diajukan dan sedang menunggu verifikasi admin."
      )
      setCompletedReceipt({
        ...data.payout,
        displayAmount: formatPrice(amountInIdr, currentCurrency),
      })
      setWithdrawAmountInput("")
    } catch (err: unknown) {
      setIsConfirmModalOpen(false)
      const message =
        err instanceof Error ? err.message : "Gagal memproses penarikan dana"
      setPayoutErrorMsg(message)
    } finally {
      setPayoutLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 3 Financial Summary Cards */}
      <PayoutBalanceCards
        availablePayoutIdr={availablePayoutIdr}
        escrowIdr={escrowIdr}
        totalWithdrawnIdr={totalWithdrawnIdr}
        currentCurrency={currentCurrency}
        t={t}
      />

      {/* Grid: Bank Form & Payout Request */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HostBankAccountForm
          initialBankAccount={bankAccount}
          onBankAccountSaved={onBankAccountSaved}
          currentLang={currentLang}
          t={t}
        />

        {/* Form Permintaan Penarikan Dana */}
        <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t.requestPayout}
              </h4>
              <p className="text-xs text-muted-foreground">
                Cairkan penghasilan sewa langsung ke rekening bank Anda.
              </p>
            </div>
          </div>

          {payoutErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{payoutErrorMsg}</span>
            </div>
          )}

          {payoutSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{payoutSuccessMsg}</span>
            </div>
          )}

          {currentUser && currentUser.kycStatus !== "VERIFIED" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Verifikasi Identitas Host Diperlukan</span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                Demi kepatuhan regulasi finansial dan anti-fraud, penarikan dana
                hanya dapat diproses setelah dokumen KTP Anda disetujui oleh tim
                Admin.
              </p>
              <button
                type="button"
                onClick={onOpenKycModal}
                className="text-[11px] font-bold text-amber-900 dark:text-amber-100 underline cursor-pointer"
              >
                Lengkapi Verifikasi KTP Sekarang →
              </button>
            </div>
          )}

          <form onSubmit={handleOpenConfirmPayout} className="space-y-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-1">
              <span className="text-[11px] text-muted-foreground font-medium">
                {currentLang === "en"
                  ? "Registered Payout Destination:"
                  : "Tujuan Transfer Terdaftar:"}
              </span>
              {bankAccount ? (
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>
                    {bankAccount.bankName} - {bankAccount.accountNumber} (
                    {bankAccount.accountHolder})
                  </span>
                </p>
              ) : (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>
                    {t.noBankAccountSavedAlert ||
                      "Belum ada rekening bank yang tersimpan. Periksa dan simpan rekening di form samping terlebih dahulu."}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.payoutAmount} ({currentCurrency})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawAmountInput(
                      String(availablePayoutInCurrentCurrency)
                    )
                    setPayoutErrorMsg("")
                  }}
                  disabled={availablePayoutInCurrentCurrency <= 0}
                  className="text-[11px] text-rose-500 hover:underline font-bold cursor-pointer disabled:opacity-40"
                >
                  {currentLang === "en" ? "Withdraw All" : "Tarik Semua"} (
                  {formatPrice(availablePayoutIdr, currentCurrency)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  {currentCurrency === "USD" ? "$" : "Rp"}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formatCurrencyInput(withdrawAmountInput)}
                  onChange={handleWithdrawInputChange}
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-gray-900 text-xs font-semibold outline-none transition-colors",
                    isOverBalance
                      ? "border-rose-500 focus:border-rose-600 text-rose-600"
                      : "border-gray-200 dark:border-gray-800 focus:border-rose-500 text-gray-900 dark:text-gray-100"
                  )}
                />
              </div>

              {isOverBalance && (
                <p className="text-[11px] text-rose-500 font-medium">
                  Nominal melebihi saldo siap ditarik (Maksimal:{" "}
                  {formatPrice(availablePayoutIdr, currentCurrency)})
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                payoutLoading ||
                !bankAccount ||
                availablePayoutInCurrentCurrency <= 0 ||
                !withdrawAmountInput ||
                currentWithdrawNum <= 0 ||
                isOverBalance ||
                Boolean(currentUser && currentUser.kycStatus !== "VERIFIED")
              }
              className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Lanjutkan Penarikan</span>
            </button>
          </form>
        </div>
      </div>

      {/* Payout History Ledger */}
      <PayoutHistoryTable
        payoutsList={payoutsList}
        currentCurrency={currentCurrency}
        t={t}
      />

      <WithdrawConfirmDialog
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecutePayout}
        loading={payoutLoading}
        bankAccount={bankAccount}
        withdrawAmount={withdrawAmountInput}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
        t={t}
      />

      <PayoutReceiptDialog
        receipt={completedReceipt}
        onClose={() => setCompletedReceipt(null)}
        currentLang={currentLang}
        t={t}
      />
    </div>
  )
}
