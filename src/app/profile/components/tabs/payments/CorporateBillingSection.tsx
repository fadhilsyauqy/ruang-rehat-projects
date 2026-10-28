"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Building2, Pencil } from "lucide-react"
import { updateBusinessBilling } from "@/app/actions/preferences"
import type { ProfileUser } from "../../../types"

interface CorporateBillingSectionProps {
  user: ProfileUser
  currentLang: string
  onSuccess: () => void
}

export default function CorporateBillingSection({
  user,
  currentLang,
  onSuccess
}: CorporateBillingSectionProps) {
  const [billingCompany, setBillingCompany] = useState(user.billingCompanyName || "")
  const [billingTax, setBillingTax] = useState(user.billingTaxId || "")
  const [billingAddr, setBillingAddr] = useState(user.billingAddress || "")
  const [savingBilling, setSavingBilling] = useState(false)
  const [billingError, setBillingError] = useState("")
  const [isEditingBilling, setIsEditingBilling] = useState(false)

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBilling(true)
    setBillingError("")
    try {
      await updateBusinessBilling({
        billingCompanyName: billingCompany,
        billingTaxId: billingTax,
        billingAddress: billingAddr
      })
      setIsEditingBilling(false)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      setBillingError(
        msg ||
          (currentLang === "en" ? "Failed to save billing info" : "Gagal menyimpan informasi penagihan")
      )
    } finally {
      setSavingBilling(false)
    }
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
          {currentLang === "en"
            ? "Business Travel & Invoicing"
            : "Penagihan Bisnis & Faktur Perusahaan"}
        </span>
        <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
      </div>

      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1 max-w-xl">
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-rose-500" />
              <span>
                {currentLang === "en"
                  ? "Corporate Billing & Tax Details"
                  : "Data Perusahaan & NPWP Penagihan"}
              </span>
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "Add your company name, tax ID (NPWP), and official address to automatically generate valid tax invoices for business travel reimbursements."
                : "Cantumkan nama perusahaan, NPWP, dan alamat resmi untuk dicetak secara otomatis pada bukti pelunasan dan e-voucher perjalanan dinas kantor."}
            </p>
          </div>

          {!isEditingBilling && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditingBilling(true)}
              className="rounded-full text-xs font-bold border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>
                {billingCompany
                  ? currentLang === "en"
                    ? "Edit Details"
                    : "Ubah Data"
                  : currentLang === "en"
                  ? "Add Business Info"
                  : "Tambah Data Bisnis"}
              </span>
            </Button>
          )}
        </div>

        {billingError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{billingError}</span>
          </div>
        )}

        {!isEditingBilling ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {currentLang === "en" ? "Company Name" : "Nama Perusahaan"}
              </span>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                {billingCompany || (currentLang === "en" ? "Not set" : "Belum diisi")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {currentLang === "en" ? "Tax ID / NPWP" : "NPWP / Tax ID"}
              </span>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">
                {billingTax || (currentLang === "en" ? "Not set" : "Belum diisi")}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                {currentLang === "en" ? "Billing Address" : "Alamat Penagihan"}
              </span>
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                {billingAddr || (currentLang === "en" ? "Not set" : "Belum diisi")}
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSaveBilling}
            className="pt-2 space-y-3 border-t border-gray-150 dark:border-gray-800 animate-in fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "Company / Institution Name"
                    : "Nama Perusahaan / Instansi"}
                </label>
                <input
                  type="text"
                  value={billingCompany}
                  onChange={(e) => setBillingCompany(e.target.value)}
                  placeholder={
                    currentLang === "en"
                      ? "e.g. Acme Corporation Ltd"
                      : "contoh: PT Ruang Rehat Indonesia"
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "Tax Identification Number (NPWP)"
                    : "NPWP Perusahaan (15/16 Digit)"}
                </label>
                <input
                  type="text"
                  value={billingTax}
                  onChange={(e) => setBillingTax(e.target.value)}
                  placeholder="01.234.567.8-901.000"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {currentLang === "en"
                  ? "Official Corporate Address"
                  : "Alamat Penagihan Resmi Perusahaan"}
              </label>
              <textarea
                rows={2}
                value={billingAddr}
                onChange={(e) => setBillingAddr(e.target.value)}
                placeholder={
                  currentLang === "en"
                    ? "Street address, building, city, postal code"
                    : "Nama gedung, jalan, kota, kode pos"
                }
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="submit"
                disabled={savingBilling}
                className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 cursor-pointer shadow-xs"
              >
                {savingBilling
                  ? currentLang === "en"
                    ? "Saving..."
                    : "Menyimpan..."
                  : currentLang === "en"
                  ? "Save Billing Info"
                  : "Simpan Informasi Penagihan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditingBilling(false)
                  setBillingCompany(user.billingCompanyName || "")
                  setBillingTax(user.billingTaxId || "")
                  setBillingAddr(user.billingAddress || "")
                }}
                className="rounded-full text-xs font-semibold px-4 py-2 cursor-pointer"
              >
                {currentLang === "en" ? "Cancel" : "Batal"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
