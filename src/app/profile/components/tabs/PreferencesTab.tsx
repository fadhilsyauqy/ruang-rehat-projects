"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@/app/actions/preferences"
import LanguagePreferenceCard from "./preferences/LanguagePreferenceCard"
import CurrencyPreferenceCard from "./preferences/CurrencyPreferenceCard"
import ThemePreferenceCard from "./preferences/ThemePreferenceCard"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/lib/dictionary"

interface PreferencesTabProps {
  currentLang: string
  currentCurrency: string
  t: Dictionary
  onProfileSuccess?: () => void
}

export default function PreferencesTab({
  currentLang,
  currentCurrency,
  t,
  onProfileSuccess
}: PreferencesTabProps) {
  const router = useRouter()

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [lang, setLang] = useState(currentLang)
  const [currency, setCurrency] = useState(currentCurrency)
  const [loading, setLoading] = useState(false)

  const handleSavePreferences = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.set("lang", lang)
      formData.set("currency", currency)

      await updateProfile(formData)
      setEditingSection(null)
      toast({
        variant: "success",
        title: currentLang === "en" ? "Preferences Saved" : "Preferensi Disimpan",
        description: currentLang === "en" ? "Your language and currency preferences have been updated." : "Preferensi bahasa dan mata uang Anda telah diperbarui.",
      })
      if (onProfileSuccess) onProfileSuccess()
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : ""
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Update Failed" : "Gagal Memperbarui",
        description:
          msg ||
          (currentLang === "en" ? "Failed to update preferences" : "Gagal memperbarui preferensi"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {currentLang === "en" ? "Global preferences" : "Bahasa & terjemahan"}
            </h2>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              {currentLang === "en" ? "New" : "Baru"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentLang === "en"
              ? "Personalize your language, display currency, and theme appearance."
              : "Sesuaikan bahasa tampilan, mata uang, dan tema antarmuka."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* 1. Bahasa Pilihan */}
        <LanguagePreferenceCard
          lang={lang}
          setLang={setLang}
          isOpen={editingSection === "lang"}
          onToggle={() => setEditingSection(editingSection === "lang" ? null : "lang")}
          onSave={handleSavePreferences}
          loading={loading}
          currentLang={currentLang}
          t={t}
        />

        {/* 2. Mata Uang Pilihan */}
        <CurrencyPreferenceCard
          currency={currency}
          setCurrency={setCurrency}
          isOpen={editingSection === "currency"}
          onToggle={() =>
            setEditingSection(editingSection === "currency" ? null : "currency")
          }
          onSave={handleSavePreferences}
          loading={loading}
          currentLang={currentLang}
          t={t}
        />

        {/* 3. Tema Tampilan */}
        <ThemePreferenceCard
          isOpen={editingSection === "theme"}
          onToggle={() => setEditingSection(editingSection === "theme" ? null : "theme")}
          onClose={() => setEditingSection(null)}
          currentLang={currentLang}
          t={t}
        />
      </div>
    </div>
  )
}
