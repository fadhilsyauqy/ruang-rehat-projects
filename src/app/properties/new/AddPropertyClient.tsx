"use client";

import React from "react";
import PropertyForm from "@/components/properties/PropertyForm";
import type { Dictionary } from "@/lib/dictionary";

interface AddPropertyClientProps {
  currentLang?: string;
  currentCurrency?: string;
  t: Dictionary;
}

export default function AddPropertyClient({
  currentLang = "id",
  currentCurrency = "IDR",
  t,
}: AddPropertyClientProps) {
  return (
    <PropertyForm
      mode="create"
      currentLang={currentLang}
      currentCurrency={currentCurrency}
      t={t}
    />
  );
}
