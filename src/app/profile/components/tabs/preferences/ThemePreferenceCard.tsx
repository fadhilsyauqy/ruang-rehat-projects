"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Pencil, X } from "lucide-react"
import type { Dictionary } from "@/lib/dictionary"

interface ThemePreferenceCardProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  currentLang: string
  t: Dictionary
}

export default function ThemePreferenceCard({
  isOpen,
  onToggle,
  onClose,
  currentLang,
  t
}: ThemePreferenceCardProps) {
  const { theme, setTheme } = useTheme()

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${
        isOpen ? "md:col-span-2 lg:col-span-3" : "col-span-1"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {currentLang === "en" ? "Appearance theme" : "Tema tampilan"}
          </span>
          {!isOpen && (
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 pt-0.5">
              {theme === "dark"
                ? currentLang === "en"
                  ? "Dark mode"
                  : "Tema gelap"
                : theme === "light"
                ? currentLang === "en"
                  ? "Light mode"
                  : "Tema terang"
                : currentLang === "en"
                ? "System default"
                : "Sistem otomatis"}
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
              ? "Choose light, dark, or sync with your system preferences."
              : "Pilih tampilan visual yang nyaman untuk mata Anda saat menjelajah properti."}
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                theme === "light"
                  ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
              }`}
            >
              <span className="text-sm font-bold">{t.lightTheme}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
              }`}
            >
              <span className="text-sm font-bold">{t.darkTheme}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                theme === "system"
                  ? "border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold ring-2 ring-rose-500/20"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-400"
              }`}
            >
              <span className="text-sm font-bold">{t.systemTheme}</span>
            </button>
          </div>

          <div className="pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {currentLang === "en" ? "Done" : "Selesai"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
