"use client";

import React from "react";
import PropertyForm from "@/components/properties/PropertyForm";
import type { Property } from "@/types";
import type { Dictionary } from "@/lib/dictionary";

interface EditPropertyClientProps {
  initialData: Property;
  currentLang?: string;
  currentCurrency?: string;
  t: Dictionary;
}

export default function EditPropertyClient({
  initialData,
  currentLang = "id",
  currentCurrency = "IDR",
  t,
}: EditPropertyClientProps) {
  return (
    <PropertyForm
      mode="edit"
      initialData={initialData}
      currentLang={currentLang}
      currentCurrency={currentCurrency}
      t={t}
    />
  );
}
