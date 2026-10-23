import React, { useState } from "react"
import { Sparkles, Info } from "lucide-react"
import { formatPrice } from "@/lib/format"

export interface FeeSimulatorCardProps {
  usdExchangeRate: number
  guestServiceFeePct: number
  hostPlatformFeePct: number
  currentLang?: string
}

export default function FeeSimulatorCard({
  usdExchangeRate,
  guestServiceFeePct,
  hostPlatformFeePct,
  currentLang = "id",
}: FeeSimulatorCardProps) {
  const [simulatedBasePrice, setSimulatedBasePrice] = useState<number>(1000000)

  const basePrice = Math.max(0, simulatedBasePrice || 0)
  const guestFee = Math.round(
    basePrice * ((guestServiceFeePct || 0) / 100)
  )
  const totalGuestPays = basePrice + guestFee
  const hostFee = Math.round(
    basePrice * ((hostPlatformFeePct || 0) / 100)
  )
  const netHostPayout = Math.max(0, basePrice - hostFee)
  const totalPlatformTake = guestFee + hostFee
  const effectiveTakeRate =
    basePrice > 0 ? ((totalPlatformTake / basePrice) * 100).toFixed(1) : "0.0"
  const estUsdGuestPays = (
    totalGuestPays / (usdExchangeRate || 18051)
  ).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Interactive Marketplace Financial Simulator */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-900/90 via-indigo-900/80 to-gray-900 text-white shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-200 flex items-center justify-center border border-purple-400/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold tracking-tight">
              {currentLang === "en"
                ? "Live Fee Simulator"
                : "Simulasi Finansial Real-time"}
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Interaktif
          </span>
        </div>

        <p className="text-xs text-purple-200/80 leading-relaxed">
          {currentLang === "en"
            ? "Test how parameter changes impact guest invoice breakdown, host payout, and platform gross revenue."
            : "Uji dampak perubahan parameter terhadap tagihan tamu, penghasilan host, dan margin platform secara instan."}
        </p>

        {/* Simulator Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
            {currentLang === "en"
              ? "Sample Property Rate (Base IDR)"
              : "Contoh Subtotal Sewa Properti"}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-300">
              Rp
            </span>
            <input
              type="number"
              step="50000"
              min="50000"
              value={simulatedBasePrice}
              onChange={(e) =>
                setSimulatedBasePrice(Number(e.target.value) || 0)
              }
              className="w-full h-10 pl-10 pr-3 rounded-2xl bg-white/10 border border-white/20 text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
        </div>

        {/* Simulator Breakdown */}
        <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
          <div className="flex items-center justify-between text-purple-200">
            <span>Harga Dasar Kamar</span>
            <span className="font-mono font-bold text-white">
              {formatPrice(basePrice, "IDR")}
            </span>
          </div>

          <div className="flex items-center justify-between text-purple-300">
            <span>Biaya Layanan Tamu (+{guestServiceFeePct}%)</span>
            <span className="font-mono font-bold text-emerald-300">
              +{formatPrice(guestFee, "IDR")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 border border-white/10 font-bold">
            <div className="flex flex-col">
              <span className="text-white text-xs">Total Tagihan Tamu</span>
              <span className="text-[10px] text-purple-300 font-normal">
                Est. ${estUsdGuestPays} USD
              </span>
            </div>
            <span className="font-mono text-sm text-emerald-400">
              {formatPrice(totalGuestPays, "IDR")}
            </span>
          </div>

          <div className="flex items-center justify-between text-purple-300 pt-1">
            <span>Komisi Platform Host (-{hostPlatformFeePct}%)</span>
            <span className="font-mono font-bold text-rose-300">
              -{formatPrice(hostFee, "IDR")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-purple-100 font-semibold">
              Net Payout Diterima Host
            </span>
            <span className="font-mono font-bold text-white">
              {formatPrice(netHostPayout, "IDR")}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-purple-500/20 border border-emerald-400/30 pt-2">
            <div className="space-y-0.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                Margin Platform
              </div>
              <div className="text-[10px] text-purple-200">
                Take-Rate: {effectiveTakeRate}%
              </div>
            </div>
            <div className="font-mono font-extrabold text-base text-emerald-300">
              {formatPrice(totalPlatformTake, "IDR")}
            </div>
          </div>
        </div>
      </div>

      {/* System Constants & SLA Widget */}
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-bold">
          <Info className="w-4 h-4 text-purple-600" />
          <span>Konstanta Operasional Baku (SLA)</span>
        </div>

        <div className="space-y-2 text-[11px] text-muted-foreground">
          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span>Check-in Resmi</span>
            <strong className="text-gray-800 dark:text-gray-200 font-mono">
              14:00 WIB
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span>Check-out Resmi</span>
            <strong className="text-gray-800 dark:text-gray-200 font-mono">
              12:00 WIB
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span>Jeda Pembersihan Kamar</span>
            <strong className="text-gray-800 dark:text-gray-200">
              2 Jam (12:00 - 14:00 WIB)
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
            <span>Garansi Komplain Tamu</span>
            <strong className="text-gray-800 dark:text-gray-200">
              24 Jam sejak Check-in
            </strong>
          </div>
          <div className="flex justify-between py-1">
            <span>Cron Pelepasan Escrow</span>
            <strong className="text-purple-600 dark:text-purple-400 font-mono">
              Setiap 60 Menit
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
