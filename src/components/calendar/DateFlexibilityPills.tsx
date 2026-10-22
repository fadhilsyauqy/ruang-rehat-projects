import React from "react"

export interface DateFlexibilityPillsProps {
  dateFlexibility: number | null
  onSelectFlexibility: (val: number) => void
  currentLang?: string
  exactDatesText?: string
}

export default function DateFlexibilityPills({
  dateFlexibility,
  onSelectFlexibility,
  currentLang = "id",
  exactDatesText,
}: DateFlexibilityPillsProps) {
  const flexibilityOptions = [
    {
      label:
        exactDatesText ||
        (currentLang === "en" ? "Exact dates" : "Tanggal pas"),
      val: 0,
    },
    { label: currentLang === "en" ? "± 1 day" : "± 1 hari", val: 1 },
    { label: currentLang === "en" ? "± 2 days" : "± 2 hari", val: 2 },
    { label: currentLang === "en" ? "± 3 days" : "± 3 hari", val: 3 },
    { label: currentLang === "en" ? "± 7 days" : "± 7 hari", val: 7 },
    { label: currentLang === "en" ? "± 14 days" : "± 14 hari", val: 14 },
  ]

  return (
    <div className="flex items-center justify-center gap-2 pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 overflow-x-auto">
      {flexibilityOptions.map((opt) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onSelectFlexibility(opt.val)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            dateFlexibility === opt.val
              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900 font-semibold text-gray-900 dark:text-gray-100"
              : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
