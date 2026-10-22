import React from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";

export interface PropertyLocationSectionProps {
  address: string;
  latitude: number | string;
  longitude: number | string;
  onAddressChange: (val: string) => void;
  onLatitudeChange: (val: number) => void;
  onLongitudeChange: (val: number) => void;
  t: Dictionary;
}

export function PropertyLocationSection({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLatitudeChange,
  onLongitudeChange,
  t,
}: PropertyLocationSectionProps) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-4">
      <div className="flex items-center gap-3 pb-2.5 border-b border-gray-150 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {t.locationCardTitle}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t.locationCardDesc}
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.addressLabel}
          </label>
          <Input
            required
            placeholder={t.addressPlaceholder}
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            className="rounded-xl border-gray-200 dark:border-gray-800 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.latitudeLabel}
            </label>
            <Input
              type="number"
              step="any"
              required
              placeholder="-8.7667"
              value={latitude || ""}
              onChange={(e) => onLatitudeChange(parseFloat(e.target.value) || 0)}
              className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.longitudeLabel}
            </label>
            <Input
              type="number"
              step="any"
              required
              placeholder="115.1667"
              value={longitude || ""}
              onChange={(e) => onLongitudeChange(parseFloat(e.target.value) || 0)}
              className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyLocationSection;
