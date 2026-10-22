import React from "react"
import { Minus, Plus, Info } from "lucide-react"

export interface GuestCounterLabels {
  adultsLabel?: string
  adultsDesc?: string
  childrenLabel?: string
  childrenDesc?: string
  infantsLabel?: string
  infantsDesc?: string
  petsLabel?: string
  petsDesc?: string
  maxGuestsLimitAlert?: string
  guestUnit?: string
  infantUnit?: string
  petUnit?: string
  closeBtn?: string
  addGuests?: string
}

export interface GuestCounterDropdownProps {
  adults: number
  childrenCount: number
  infants: number
  pets?: number
  onAdultsChange: (val: number) => void
  onChildrenChange: (val: number) => void
  onInfantsChange: (val: number) => void
  onPetsChange?: (val: number) => void
  maxGuests?: number
  minAdults?: number
  showPets?: boolean
  currentLang?: string
  dict?: GuestCounterLabels
  onClose?: () => void
  className?: string
}

export function formatGuestSummary({
  adults,
  childrenCount = 0,
  infants = 0,
  pets = 0,
  currentLang = "id",
  labels = {},
}: {
  adults: number
  childrenCount?: number
  infants?: number
  pets?: number
  currentLang?: string
  labels?: GuestCounterLabels
}): string {
  const totalGuests = adults + childrenCount
  if (totalGuests === 0 && infants === 0 && pets === 0) {
    return (
      labels.addGuests ||
      (currentLang === "en" ? "Add guests" : "Tambah tamu")
    )
  }

  const parts: string[] = []
  if (totalGuests > 0) {
    const unit =
      currentLang === "en"
        ? totalGuests === 1
          ? "guest"
          : "guests"
        : labels.guestUnit || "tamu"
    parts.push(`${totalGuests} ${unit}`)
  }

  if (infants > 0) {
    const unit =
      currentLang === "en"
        ? infants === 1
          ? "infant"
          : "infants"
        : labels.infantUnit || "bayi"
    parts.push(`${infants} ${unit}`)
  }

  if (pets > 0) {
    const unit =
      currentLang === "en"
        ? pets === 1
          ? "pet"
          : "pets"
        : labels.petUnit || "hewan"
    parts.push(`${pets} ${unit}`)
  }

  return parts.join(", ")
}

function CounterRow({
  label,
  desc,
  value,
  onDecrement,
  onIncrement,
  canDecrement,
  canIncrement,
}: {
  label: string
  desc: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  canDecrement: boolean
  canIncrement: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </h4>
        <p className="text-[11px] sm:text-xs text-muted-foreground">{desc}</p>
      </div>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={!canDecrement}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
        >
          <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
        <span className="text-xs sm:text-sm font-semibold w-4 sm:w-5 text-center">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={!canIncrement}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function GuestCounterDropdown({
  adults,
  childrenCount,
  infants,
  pets = 0,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  onPetsChange,
  maxGuests,
  minAdults = 0,
  showPets = false,
  currentLang = "id",
  dict = {},
  onClose,
  className = "space-y-4",
}: GuestCounterDropdownProps) {
  const totalGuests = adults + childrenCount
  const isMaxGuestsReached =
    typeof maxGuests === "number" && totalGuests >= maxGuests

  return (
    <div className={className}>
      {/* 1. Adults */}
      <CounterRow
        label={dict.adultsLabel || (currentLang === "en" ? "Adults" : "Dewasa")}
        desc={
          dict.adultsDesc ||
          (currentLang === "en" ? "Ages 13 or above" : "Usia 13 tahun ke atas")
        }
        value={adults}
        onDecrement={() => onAdultsChange(Math.max(minAdults, adults - 1))}
        onIncrement={() => onAdultsChange(adults + 1)}
        canDecrement={adults > minAdults}
        canIncrement={!isMaxGuestsReached}
      />

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* 2. Children */}
      <CounterRow
        label={
          dict.childrenLabel || (currentLang === "en" ? "Children" : "Anak-anak")
        }
        desc={
          dict.childrenDesc ||
          (currentLang === "en" ? "Ages 2 – 12" : "Usia 2 – 12 tahun")
        }
        value={childrenCount}
        onDecrement={() => onChildrenChange(Math.max(0, childrenCount - 1))}
        onIncrement={() => {
          if (adults === 0) onAdultsChange(1)
          onChildrenChange(childrenCount + 1)
        }}
        canDecrement={childrenCount > 0}
        canIncrement={!isMaxGuestsReached}
      />

      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* 3. Infants */}
      <CounterRow
        label={dict.infantsLabel || (currentLang === "en" ? "Infants" : "Bayi")}
        desc={
          dict.infantsDesc ||
          (currentLang === "en" ? "Under 2" : "Di bawah 2 tahun")
        }
        value={infants}
        onDecrement={() => onInfantsChange(Math.max(0, infants - 1))}
        onIncrement={() => {
          if (adults === 0) onAdultsChange(1)
          onInfantsChange(infants + 1)
        }}
        canDecrement={infants > 0}
        canIncrement={infants < 5}
      />

      {/* 4. Pets (Optional) */}
      {showPets && onPetsChange && (
        <>
          <div className="border-t border-gray-100 dark:border-gray-800" />
          <CounterRow
            label={
              dict.petsLabel ||
              (currentLang === "en" ? "Pets" : "Hewan Peliharaan")
            }
            desc={
              dict.petsDesc ||
              (currentLang === "en"
                ? "Bringing a service animal?"
                : "Membawa hewan pemandu / peliharaan?")
            }
            value={pets}
            onDecrement={() => onPetsChange(Math.max(0, pets - 1))}
            onIncrement={() => {
              if (adults === 0) onAdultsChange(1)
              onPetsChange(pets + 1)
            }}
            canDecrement={pets > 0}
            canIncrement={true}
          />
        </>
      )}

      {/* Max guests limit notification */}
      {isMaxGuestsReached && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 font-medium">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            {dict.maxGuestsLimitAlert ||
              "Mencapai kapasitas maksimal penginapan"}{" "}
            ({maxGuests} {dict.guestUnit || "tamu"}).
          </span>
        </div>
      )}

      {onClose && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            {dict.closeBtn || (currentLang === "en" ? "Close" : "Tutup")}
          </button>
        </div>
      )}
    </div>
  )
}
