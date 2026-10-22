import React from "react"
import {
  Navigation,
  Palmtree,
  Landmark,
  Trees,
  Building2,
  Compass,
  type LucideIcon,
} from "lucide-react"

export interface SuggestedDestination {
  id: string
  title: string
  subtitle: {
    id: string
    en: string
  }
  icon: LucideIcon
  searchValue: string
}

export const SUGGESTED_DESTINATIONS: SuggestedDestination[] = [
  {
    id: "nearby",
    title: "Nearby",
    subtitle: {
      id: "Temukan penginapan terdekat di sekitar Anda",
      en: "Find what's around you",
    },
    icon: Navigation,
    searchValue: "",
  },
  {
    id: "bandung",
    title: "Bandung, Indonesia",
    subtitle: {
      id: "Pilihan favorit untuk liburan akhir pekan",
      en: "Great for a weekend getaway",
    },
    icon: Palmtree,
    searchValue: "Bandung",
  },
  {
    id: "yogyakarta",
    title: "Yogyakarta, Indonesia",
    subtitle: {
      id: "Dekat wisata budaya seperti Candi Borobudur",
      en: "For sights like Borobudur Temple",
    },
    icon: Landmark,
    searchValue: "Yogyakarta",
  },
  {
    id: "bali",
    title: "Bali, Indonesia",
    subtitle: {
      id: "Surga tropis & villa mewah tepi pantai",
      en: "Tropical paradise & luxury villas",
    },
    icon: Palmtree,
    searchValue: "Bali",
  },
  {
    id: "lembang",
    title: "Lembang, Indonesia",
    subtitle: {
      id: "Udara pegunungan sejuk & pemandangan alam",
      en: "Cool mountain breeze & nature retreats",
    },
    icon: Trees,
    searchValue: "Lembang",
  },
  {
    id: "jakarta",
    title: "Jakarta, Indonesia",
    subtitle: {
      id: "Pusat gaya hidup kota, belanja, & kuliner",
      en: "For its bustling city life & dining",
    },
    icon: Building2,
    searchValue: "Jakarta",
  },
  {
    id: "tangerang",
    title: "Tangerang, Indonesia",
    subtitle: {
      id: "Akomodasi modern & kenyamanan perkotaan",
      en: "Urban retreat & modern apartments",
    },
    icon: Compass,
    searchValue: "Tangerang",
  },
]

export interface DestinationSuggestionsProps {
  onSelect: (dest: SuggestedDestination) => void
  currentLang?: string
  title?: string
}

export default function DestinationSuggestions({
  onSelect,
  currentLang = "id",
  title,
}: DestinationSuggestionsProps) {
  const heading =
    title ||
    (currentLang === "en"
      ? "Suggested destinations"
      : "Rekomendasi destinasi")

  return (
    <div>
      <div className="mb-3 px-2">
        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 tracking-wide">
          {heading}
        </h4>
      </div>

      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-1">
        {SUGGESTED_DESTINATIONS.map((dest) => {
          const IconComp = dest.icon
          const subtitleText =
            dest.subtitle[currentLang as "id" | "en"] || dest.subtitle.id
          const displayTitle =
            dest.id === "nearby"
              ? currentLang === "en"
                ? "Nearby"
                : "Sekitar Anda"
              : dest.title

          return (
            <button
              key={dest.id}
              type="button"
              onClick={() => onSelect(dest)}
              className="w-full p-2.5 rounded-2xl flex items-center gap-3.5 hover:bg-gray-100/80 dark:hover:bg-gray-900 transition-colors text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 border border-gray-200/60 dark:border-gray-700 flex items-center justify-center shrink-0 transition-colors text-gray-700 dark:text-gray-300">
                <IconComp className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="truncate">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {displayTitle}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {subtitleText}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
