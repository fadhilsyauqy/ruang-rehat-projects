import React from "react";
import { ALL_AMENITIES } from "@/lib/amenities";
import { Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";

export interface PropertyAmenitiesSectionProps {
  selectedAmenities: string[];
  onToggleAmenity: (id: string) => void;
  currentLang?: string;
  t: Dictionary;
}

export function PropertyAmenitiesSection({
  selectedAmenities,
  onToggleAmenity,
  currentLang = "id",
  t,
}: PropertyAmenitiesSectionProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-150 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {t.amenitiesCardTitle}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.amenitiesCardDesc}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full">
          {selectedAmenities.length} {t.amenitiesSelected}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pt-0.5">
        {ALL_AMENITIES.map((a) => {
          const isChecked = selectedAmenities.includes(a.id);
          const IconComp = a.icon;
          const labelText = a.label[currentLang as "id" | "en"] || a.label.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggleAmenity(a.id)}
              className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isChecked
                  ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                  : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50/40 dark:bg-gray-900/40"
              }`}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{labelText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PropertyAmenitiesSection;
