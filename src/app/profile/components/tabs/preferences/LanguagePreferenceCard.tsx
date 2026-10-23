"use client"

import { Button } from "@/components/ui/button"
import { Check, Pencil, X } from "lucide-react"

interface LanguagePreferenceCardProps {
  lang: string
  setLang: (lang: string) => void
  isOpen: boolean
  onToggle: () => void
  onSave: () => void
  loading: boolean
  currentLang: string
  t: any
}

export default function LanguagePreferenceCard({
  lang,
  setLang,
  isOpen,
  onToggle,
  onSave,
  loading,
  currentLang,
  t
}: LanguagePreferenceCardProps) {
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
        isOpen ? "md:col-span-2 lg:col-span-3" : "col-span-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {currentLang === "en" ? "Preferred language" : "Bahasa pilihan"}
          </span>
          {!isOpen && (
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pt-0.5">
              <span>
                {lang === "en" ? "🇺🇸 English (United States)" : "🇮🇩 Bahasa Indonesia (ID)"}
              </span>
            </h4>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
        >
          {isOpen ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
            </>
          ) : (
            <>
              <Pencil className="w-3 h-3" />
              <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
            </>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "Select your preferred interface language across the platform."
              : "Pilih bahasa tampilan antarmuka yang paling nyaman untuk Anda."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLang("id")}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                lang === "id"
                  ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇮🇩</span>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Bahasa Indonesia
                  </div>
                  <div className="text-xs text-muted-foreground">Default Indonesia (ID)</div>
                </div>
              </div>
              {lang === "id" && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => setLang("en")}
              className={`p-4 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                lang === "en"
                  ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇺🇸</span>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">English</div>
                  <div className="text-xs text-muted-foreground">United States / Global</div>
                </div>
              </div>
              {lang === "en" && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
          </div>

          <div className="pt-1">
            <Button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {loading ? t.saving : currentLang === "en" ? "Save changes" : "Simpan perubahan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
