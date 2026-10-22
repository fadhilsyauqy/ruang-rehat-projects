import React from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import { USD_TO_IDR_EXCHANGE_RATE } from "@/lib/constants";
import type { Dictionary } from "@/lib/dictionary";

export interface PropertyPricingSectionProps {
  inputCurrency: "IDR" | "USD";
  displayPrice: number | string;
  displayCleaningFee: number | string;
  category: string;
  maxGuests: number;
  cancellationPolicy: string;
  currentLang?: string;
  onCurrencySwitch: (currency: "IDR" | "USD") => void;
  onPriceChange: (val: string) => void;
  onCleaningFeeChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onMaxGuestsChange: (val: number) => void;
  onCancellationPolicyChange: (val: string) => void;
  t: Dictionary;
}

export function PropertyPricingSection({
  inputCurrency,
  displayPrice,
  displayCleaningFee,
  category,
  maxGuests,
  cancellationPolicy,
  currentLang = "id",
  onCurrencySwitch,
  onPriceChange,
  onCleaningFeeChange,
  onCategoryChange,
  onMaxGuestsChange,
  onCancellationPolicyChange,
  t,
}: PropertyPricingSectionProps) {
  const isEn = currentLang === "en";

  return (
    <div className="space-y-3.5">
      {/* Currency Selector Pill */}
      <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
            {isEn ? "Pricing Currency" : "Mata Uang Penetapan Harga"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isEn
              ? `Currently entering prices in ${inputCurrency}. Prices convert automatically for global guests.`
              : `Memasukkan harga dalam ${inputCurrency}. Otomatis dikonversi bagi tamu internasional.`}
          </span>
        </div>
        <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-200/70 dark:bg-gray-800 border border-gray-300/70 dark:border-gray-700 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onCurrencySwitch("IDR")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              inputCurrency === "IDR"
                ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            🇮🇩 IDR (Rp)
          </button>
          <button
            type="button"
            onClick={() => onCurrencySwitch("USD")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              inputCurrency === "USD"
                ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            🇺🇸 USD ($)
          </button>
        </div>
      </div>

      {/* Input Harga & Biaya Kebersihan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.pricePerNightLabel} ({inputCurrency})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {inputCurrency === "IDR" ? "Rp" : "$"}
            </span>
            <Input
              type="number"
              required
              min={0}
              step={inputCurrency === "IDR" ? "1000" : "1"}
              placeholder={inputCurrency === "IDR" ? "1500000" : "100"}
              value={displayPrice}
              onChange={(e) => onPriceChange(e.target.value)}
              className={`${inputCurrency === "IDR" ? "pl-11" : "pl-8"} rounded-xl border-gray-200 dark:border-gray-800 text-xs font-bold font-mono`}
            />
          </div>
          {displayPrice !== "" && !isNaN(Number(displayPrice)) && Number(displayPrice) > 0 ? (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>
                {inputCurrency === "IDR"
                  ? `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayPrice))} • ≈ $${(Number(displayPrice) / USD_TO_IDR_EXCHANGE_RATE).toFixed(2)} USD`
                  : `$${Number(displayPrice).toFixed(2)} USD • ≈ ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayPrice) * USD_TO_IDR_EXCHANGE_RATE)}`}
              </span>
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.cleaningFee || "Biaya Kebersihan"} ({inputCurrency})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
              {inputCurrency === "IDR" ? "Rp" : "$"}
            </span>
            <Input
              type="number"
              min={0}
              step={inputCurrency === "IDR" ? "1000" : "1"}
              placeholder="0"
              value={displayCleaningFee}
              onChange={(e) => onCleaningFeeChange(e.target.value)}
              className={`${inputCurrency === "IDR" ? "pl-11" : "pl-8"} rounded-xl border-gray-200 dark:border-gray-800 text-xs font-bold font-mono`}
            />
          </div>
          {displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee)) && Number(displayCleaningFee) > 0 ? (
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>
                {inputCurrency === "IDR"
                  ? `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayCleaningFee))} • ≈ $${(Number(displayCleaningFee) / USD_TO_IDR_EXCHANGE_RATE).toFixed(2)} USD`
                  : `$${Number(displayCleaningFee).toFixed(2)} USD • ≈ ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayCleaningFee) * USD_TO_IDR_EXCHANGE_RATE)}`}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Kategori & Kapasitas Tamu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {isEn ? "Category" : "Kategori Properti"}
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full h-9 border border-gray-200 dark:border-gray-800 rounded-xl px-3 text-xs bg-white dark:bg-gray-900 font-medium focus:outline-none focus:border-rose-500"
          >
            <option value="Villa">Villa</option>
            <option value="Apartment">Apartment / Flat</option>
            <option value="House">Rumah / House</option>
            <option value="Resort">Resort & Cottage</option>
            <option value="Cabin">Kabin / Cabin</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.maxGuestsLabel}
          </label>
          <Input
            type="number"
            required
            min={1}
            value={maxGuests || ""}
            onChange={(e) => onMaxGuestsChange(parseInt(e.target.value, 10) || 1)}
            className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-semibold"
          />
        </div>
      </div>

      {/* Kebijakan Pembatalan */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {t.cancellationPolicyLabel || "Kebijakan Pembatalan"}
        </label>
        <select
          value={cancellationPolicy}
          onChange={(e) => onCancellationPolicyChange(e.target.value)}
          className="w-full h-9 border border-gray-200 dark:border-gray-800 rounded-xl px-3 text-xs bg-white dark:bg-gray-900 font-medium focus:outline-none focus:border-rose-500"
        >
          <option value="FLEXIBLE">FLEXIBLE (Refund 100% jika batal &gt; 24 jam sebelum check-in)</option>
          <option value="MODERATE">MODERATE (Refund 100% jika batal &gt; 5 hari sebelum check-in)</option>
          <option value="STRICT">STRICT (Refund 50% jika batal &gt; 7 hari sebelum check-in)</option>
        </select>
      </div>
    </div>
  );
}

export default PropertyPricingSection;
