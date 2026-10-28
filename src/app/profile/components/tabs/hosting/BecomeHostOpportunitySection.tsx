"use client"

import Link from "next/link"
import { Sparkles, CheckCircle2, Plus, ArrowRight } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"

interface BecomeHostOpportunitySectionProps {
  currentLang: string
  t: Dictionary
}

export default function BecomeHostOpportunitySection({
  currentLang,
  t
}: BecomeHostOpportunitySectionProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-pink-50/50 dark:from-rose-950/40 dark:via-gray-900 dark:to-pink-950/20 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentLang === "en" ? "Host Opportunity" : "Peluang Tuan Rumah"}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {t.becomeHostTitle}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {t.becomeHostDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <span>{t.benefitIncome}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {t.benefitIncomeDesc}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{t.benefitProtection}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {t.benefitProtectionDesc}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-rose-100 dark:border-gray-800">
          <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>{currentLang === "en" ? "Zero Signup Fee" : "Tanpa Biaya Daftar"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {currentLang === "en"
              ? "Your account automatically upgrades to Host once your first listing is published."
              : "Akun Anda otomatis beralih menjadi Tuan Rumah begitu listing pertama selesai dibuat."}
          </p>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
        <div>
          <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
            {currentLang === "en"
              ? "Ready to welcome your first guests?"
              : "Sudah siap menyambut tamu pertama Anda?"}
          </h4>
          <p className="text-[11px] text-rose-700 dark:text-rose-400">
            {currentLang === "en"
              ? "Takes only 5 minutes to set up."
              : "Hanya butuh 5 menit untuk mendaftarkan penginapan."}
          </p>
        </div>

        <Link
          href="/properties/new"
          className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.startHostingBtn}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}
