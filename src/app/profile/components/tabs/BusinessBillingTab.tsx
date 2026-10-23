"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import PaymentsBankingSection from "./payments/PaymentsBankingSection"
import CorporateBillingSection from "./payments/CorporateBillingSection"
import RefundPolicyMatrix from "./payments/RefundPolicyMatrix"
import type { ProfileUser } from "../../types"

interface BusinessBillingTabProps {
  user: ProfileUser
  currentLang: string
}

export default function BusinessBillingTab({
  user,
  currentLang
}: BusinessBillingTabProps) {
  const [billingSuccessMsg, setBillingSuccessMsg] = useState("")
  const isHost = user.role === "HOST"

  const handleBillingSuccess = () => {
    setBillingSuccessMsg(
      currentLang === "en"
        ? "Business billing details updated!"
        : "Informasi penagihan bisnis berhasil disimpan!"
    )
    setTimeout(() => setBillingSuccessMsg(""), 3500)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {isHost
              ? currentLang === "en"
                ? "Payouts, billing & refund policies"
                : "Pencairan, faktur & kebijakan refund"
              : currentLang === "en"
              ? "Payments, billing & refund policies"
              : "Pembayaran, faktur & kebijakan refund"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isHost
              ? currentLang === "en"
                ? "Manage bank destination accounts, business billing, and guest cancellation standards."
                : "Kelola nomor rekening penerima, data faktur bisnis, dan standar pembatalan tamu."
              : currentLang === "en"
              ? "Review booking receipts, configure business travel billing, and understand transparent refund policies."
              : "Tinjau bukti sewa, atur faktur perjalanan dinas perusahaan, dan pahami aturan pengembalian dana."}
          </p>
        </div>

        {billingSuccessMsg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{billingSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Seksi 1: Riwayat Transaksi & Rekening Payout (Sesuai Peran) */}
      <PaymentsBankingSection
        user={user}
        isHost={isHost}
        currentLang={currentLang}
      />

      {/* Seksi 2: Informasi Penagihan Bisnis & Faktur Perusahaan (Corporate Billing) */}
      <CorporateBillingSection
        user={user}
        currentLang={currentLang}
        onSuccess={handleBillingSuccess}
      />

      {/* Seksi 3: Matriks Kebijakan Pengembalian Dana Transparan (Refund Matrix) */}
      <RefundPolicyMatrix currentLang={currentLang} />
    </div>
  )
}
