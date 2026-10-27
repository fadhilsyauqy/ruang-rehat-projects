import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Percent,
  ShieldAlert,
  RotateCcw,
  Save,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format"
import { formatWibDate } from "@/lib/date-standards"
import FeeSimulatorCard from "../settings/FeeSimulatorCard"
import { toast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export interface SettingData {
  usdExchangeRate: number
  guestServiceFeePct: number
  hostPlatformFeePct: number
  hostCancelPenaltyIdr: number
  maxStayNights: number
  updatedAt: string | Date
}

export interface SystemSettingsTabProps {
  initialSetting: SettingData | null
  currentLang?: string
  onSettingUpdated?: (updated: SettingData) => void
}

export default function SystemSettingsTab({
  initialSetting,
  currentLang = "id",
  onSettingUpdated,
}: SystemSettingsTabProps) {
  const router = useRouter()
  const [setting, setSetting] = useState<SettingData>({
    usdExchangeRate: initialSetting?.usdExchangeRate || 18051,
    guestServiceFeePct: initialSetting?.guestServiceFeePct ?? 10.0,
    hostPlatformFeePct: initialSetting?.hostPlatformFeePct ?? 3.0,
    hostCancelPenaltyIdr: initialSetting?.hostCancelPenaltyIdr || 250000,
    maxStayNights: initialSetting?.maxStayNights || 28,
    updatedAt: initialSetting?.updatedAt || new Date().toISOString(),
  })
  const [isSavingSetting, setIsSavingSetting] = useState(false)
  const [settingSuccessMsg, setSettingSuccessMsg] = useState("")
  const [settingErrorMsg, setSettingErrorMsg] = useState("")
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSetting(true)
    setSettingSuccessMsg("")
    setSettingErrorMsg("")
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan pengaturan")
      const updated = data.settings || setting
      setSetting(updated)
      if (onSettingUpdated) onSettingUpdated(updated)
      setSettingSuccessMsg(
        currentLang === "en"
          ? "System settings updated successfully!"
          : "Pengaturan sistem berhasil disimpan!"
      )
      toast({
        variant: "success",
        title: currentLang === "en" ? "Settings Saved" : "Pengaturan Disimpan",
        description:
          currentLang === "en"
            ? "System parameters updated successfully!"
            : "Pengaturan parameter sistem berhasil diperbarui!",
      })
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      setSettingErrorMsg(error.message)
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Failed to Save" : "Gagal Menyimpan",
        description: error.message,
      })
    } finally {
      setIsSavingSetting(false)
    }
  }

  const handleResetDefaultSettings = () => {
    setIsResetConfirmOpen(true)
  }

  const executeResetDefaults = () => {
    const defaultSettings: SettingData = {
      usdExchangeRate: 18051,
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
      updatedAt: new Date().toISOString(),
    }
    setSetting(defaultSettings)
    if (onSettingUpdated) onSettingUpdated(defaultSettings)
    setSettingSuccessMsg("")
    setSettingErrorMsg("")
    setIsResetConfirmOpen(false)
    toast({
      variant: "info",
      title: currentLang === "en" ? "Settings Reset" : "Pengaturan Direset",
      description:
        currentLang === "en"
          ? "All parameters reset to system defaults."
          : "Seluruh parameter telah dikembalikan ke nilai standar bawaan sistem.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header Settings Tab */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">
              {currentLang === "en"
                ? "System Parameters & Governance"
                : "Pengaturan Parameter & Tata Kelola Sistem"}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "Configure base exchange rates, split-fee marketplace commission percentages, cancellation penalties, and transaction safety caps."
              : "Kelola kurs konversi USD acuan, skema split-fee komisi dua sisi, penalti pembatalan sepihak, dan batas durasi sewa transaksi."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {currentLang === "en" ? "Synchronized Live" : "Sinkron & Aktif"}
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
            {currentLang === "en" ? "Last updated:" : "Diperbarui:"}{" "}
            <strong className="text-gray-800 dark:text-gray-200">
              {formatWibDate(setting.updatedAt, currentLang === "en" ? "en" : "id")}
            </strong>
          </span>
        </div>
      </div>

      {/* Notification Feedback */}
      {settingSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{settingSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSettingSuccessMsg("")}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {settingErrorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{settingErrorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSettingErrorMsg("")}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Settings Main Layout: Form (Left 2 cols) & Simulator (Right 1 col) */}
      <form
        onSubmit={handleSaveSettings}
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        <div className="xl:col-span-2 space-y-6">
          {/* CARD 1: KURS MATA UANG BASIS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Currency Standard & Exchange Rate"
                      : "Standar Mata Uang & Kurs Konversi"}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentLang === "en"
                    ? "Ruang Rehat uses IDR (Rupiah) as the single source of truth for all ledger balances. This rate drives USD estimation for international travelers."
                    : "Ruang Rehat menggunakan Rupiah (IDR) murni sebagai sumber kebenaran tunggal buku kas. Kurs ini mengontrol estimasi tampilan harga bagi pengguna USD."}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                IDR SSoT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "Mata Uang Basis (Base Currency)"
                    : "Mata Uang Basis Buku Kas"}
                </label>
                <div className="h-10 px-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-mono font-bold text-gray-600 dark:text-gray-300 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                  <span>IDR (Indonesian Rupiah)</span>
                  <span className="text-[10px] bg-white dark:bg-gray-900 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700 font-sans">
                    Terkunci
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "USD to IDR Rate (1 USD = ? IDR)"
                    : "Kurs Konversi 1 USD ke IDR"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="1"
                    max="100000"
                    value={setting.usdExchangeRate}
                    onChange={(e) =>
                      setSetting({
                        ...setting,
                        usdExchangeRate: Number(e.target.value),
                      })
                    }
                    className="pl-10 h-10 rounded-2xl font-mono text-xs font-bold"
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    Pilihan cepat:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSetting({ ...setting, usdExchangeRate: 18051 })
                    }
                    className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    18.051 (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSetting({ ...setting, usdExchangeRate: 16500 })
                    }
                    className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    16.500
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSetting({ ...setting, usdExchangeRate: 17000 })
                    }
                    className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-[10px] font-semibold text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    17.000
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: MODEL KOMISI SPLIT-FEE */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Two-Sided Marketplace Split-Fee"
                      : "Struktur Komisi Platform (Split-Fee)"}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentLang === "en"
                    ? "Platform monetization combines guest checkout service fee with host escrow release commission."
                    : "Monetisasi marketplace menggabungkan biaya layanan tamu saat pemesanan dengan potongan platform dari payout host."}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                Take-Rate:{" "}
                {(
                  Number(setting.guestServiceFeePct || 0) +
                  Number(setting.hostPlatformFeePct || 0)
                ).toFixed(1)}
                %
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Guest Service Fee"
                      : "Biaya Layanan Tamu"}
                  </label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    + Ditambahkan
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={setting.guestServiceFeePct}
                    onChange={(e) =>
                      setSetting({
                        ...setting,
                        guestServiceFeePct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="pr-8 h-10 rounded-2xl font-mono text-xs font-bold"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {currentLang === "en"
                    ? "Added on top of property rental price during guest payment checkout."
                    : "Ditambahkan di atas subtotal harga kamar saat tamu melakukan pembayaran checkout."}
                </p>
              </div>

              <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Host Platform Fee"
                      : "Potongan Komisi Host"}
                  </label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    - Dipotong
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={setting.hostPlatformFeePct}
                    onChange={(e) =>
                      setSetting({
                        ...setting,
                        hostPlatformFeePct: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="pr-8 h-10 rounded-2xl font-mono text-xs font-bold"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {currentLang === "en"
                    ? "Deducted from property earnings when escrow is unlocked for host withdrawal."
                    : "Dipotong dari hasil sewa host ketika dana escrow berhasil dilepaskan ke saldo pencairan."}
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: KEBIJAKAN & PROTEKSI PASAR */}
          <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentLang === "en"
                  ? "Marketplace Safeguards & Governance Rules"
                  : "Ketentuan Proteksi Transaksi & Operasional"}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "Host Cancellation Penalty"
                    : "Denda Pembatalan Sepihak Host"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="number"
                    step="10000"
                    min="0"
                    value={setting.hostCancelPenaltyIdr}
                    onChange={(e) =>
                      setSetting({
                        ...setting,
                        hostCancelPenaltyIdr: Number(e.target.value),
                      })
                    }
                    className="pl-10 h-10 rounded-2xl font-mono text-xs font-bold"
                    required
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentLang === "en"
                    ? `Penalty charged to host: ${formatPrice(
                        setting.hostCancelPenaltyIdr,
                        "IDR"
                      )}. Calendar dates are also locked by system.`
                    : `Nominal sanksi wajib: ${formatPrice(
                        setting.hostCancelPenaltyIdr,
                        "IDR"
                      )}. Kalender tanggal tersebut otomatis dikunci sistem.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {currentLang === "en"
                    ? "Max Stay Duration"
                    : "Batas Maksimum Durasi Menginap"}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={setting.maxStayNights}
                    onChange={(e) =>
                      setSetting({
                        ...setting,
                        maxStayNights: Number(e.target.value),
                      })
                    }
                    className="pr-16 h-10 rounded-2xl font-mono text-xs font-bold"
                    required
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {currentLang === "en" ? "Nights" : "Malam"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {currentLang === "en"
                    ? "Maximum consecutive nights allowed per booking checkout transaction."
                    : "Batas durasi menginap maksimal dalam satu transaksi pemesanan (default 28 malam)."}
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefaultSettings}
              disabled={isSavingSetting}
              className="rounded-2xl h-11 px-4 text-xs font-bold border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-gray-500" />
              <span>
                {currentLang === "en"
                  ? "Reset to Defaults"
                  : "Kembalikan ke Default"}
              </span>
            </Button>

            <Button
              type="submit"
              disabled={isSavingSetting}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-11 px-6 text-xs font-extrabold shadow-md shadow-purple-600/20 cursor-pointer flex items-center gap-2"
            >
              {isSavingSetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {currentLang === "en"
                      ? "Saving Changes..."
                      : "Menyimpan..."}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>
                    {currentLang === "en"
                      ? "Save System Parameters"
                      : "Simpan Pengaturan Sistem"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Marketplace Financial Simulator */}
        <FeeSimulatorCard
          usdExchangeRate={setting.usdExchangeRate}
          guestServiceFeePct={setting.guestServiceFeePct}
          hostPlatformFeePct={setting.hostPlatformFeePct}
          currentLang={currentLang}
        />
      </form>

      <ConfirmDialog
        open={isResetConfirmOpen}
        onOpenChange={setIsResetConfirmOpen}
        title={currentLang === "en" ? "Reset System Parameters" : "Reset Parameter Sistem"}
        description={
          currentLang === "en"
            ? "Are you sure you want to reset all platform fees, thresholds, and penalty rates to system defaults? This cannot be undone."
            : "Apakah Anda yakin ingin mengembalikan seluruh fee platform, ambang batas, dan tarif penalti ke nilai standar bawaan sistem? Tindakan ini tidak dapat dibatalkan."
        }
        confirmLabel={currentLang === "en" ? "Reset to Defaults" : "Kembalikan ke Default"}
        cancelLabel={currentLang === "en" ? "Cancel" : "Batal"}
        variant="warning"
        onConfirm={executeResetDefaults}
      />
    </div>
  )
}
