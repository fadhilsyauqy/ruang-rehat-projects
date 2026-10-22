"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ImageUpload";
import KycModal from "@/components/KycModal";
import { Building2, ImageIcon } from "lucide-react";
import { USD_TO_IDR_EXCHANGE_RATE } from "@/lib/constants";
import type { Property } from "@/types";
import type { Dictionary } from "@/lib/dictionary";
import { PropertyPricingSection } from "./PropertyPricingSection";
import { PropertyLocationSection } from "./PropertyLocationSection";
import { PropertyAmenitiesSection } from "./PropertyAmenitiesSection";
import { PropertyFormActions } from "./PropertyFormActions";
import { PropertyKycDraftDialog } from "./PropertyKycDraftDialog";

export interface PropertyFormProps {
  mode: "create" | "edit";
  initialData?: Property | null;
  currentLang?: string;
  currentCurrency?: string;
  t: Dictionary;
}

export function PropertyForm({
  mode,
  initialData,
  currentLang = "id",
  currentCurrency = "IDR",
  t,
}: PropertyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<{ id: string; isDraft?: boolean } | null>(null);
  const [showKycModal, setShowKycModal] = useState(false);

  const defaultCurrency = (currentCurrency === "USD" ? "USD" : "IDR") as "IDR" | "USD";
  const [inputCurrency, setInputCurrency] = useState<"IDR" | "USD">(defaultCurrency);

  const rawIdrPrice = initialData?.pricePerNight && initialData.pricePerNight > 0
    ? initialData.pricePerNight
    : Math.round((initialData?.price || 0) * USD_TO_IDR_EXCHANGE_RATE);
  const rawIdrCleaningFee = initialData?.cleaningFee || 0;

  const initialDisplayPrice = mode === "edit"
    ? (defaultCurrency === "IDR" ? rawIdrPrice : Math.round((rawIdrPrice / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100)
    : "";
  const initialDisplayCleaningFee = mode === "edit"
    ? (defaultCurrency === "IDR" ? (rawIdrCleaningFee || "") : (rawIdrCleaningFee > 0 ? Math.round((rawIdrCleaningFee / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100 : ""))
    : "";

  const [displayPrice, setDisplayPrice] = useState<number | string>(initialDisplayPrice);
  const [displayCleaningFee, setDisplayCleaningFee] = useState<number | string>(initialDisplayCleaningFee);

  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "Villa",
    cancellationPolicy: (initialData?.cancellationPolicy as string) || "FLEXIBLE",
    address: initialData?.address || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    maxGuests: initialData?.maxGuests || 1,
    amenities: (initialData?.amenities || []) as string[],
    imageUrls: (initialData?.imageUrls || []) as string[],
  });

  const handleCurrencySwitch = (newCurrency: "IDR" | "USD") => {
    if (newCurrency === inputCurrency) return;
    if (newCurrency === "IDR") {
      if (displayPrice !== "" && !isNaN(Number(displayPrice))) {
        setDisplayPrice(Math.round(Number(displayPrice) * USD_TO_IDR_EXCHANGE_RATE));
      }
      if (displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee))) {
        setDisplayCleaningFee(Math.round(Number(displayCleaningFee) * USD_TO_IDR_EXCHANGE_RATE));
      }
    } else {
      if (displayPrice !== "" && !isNaN(Number(displayPrice))) {
        setDisplayPrice(Math.round((Number(displayPrice) / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100);
      }
      if (displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee))) {
        setDisplayCleaningFee(Math.round((Number(displayCleaningFee) / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100);
      }
    }
    setInputCurrency(newCurrency);
  };

  const toggleAmenity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.imageUrls.length === 0) {
      alert(currentLang === "en" ? "Please upload at least one property photo." : "Harap unggah minimal satu foto properti.");
      return;
    }

    const pricePerNightIdr = inputCurrency === "USD"
      ? Math.round((Number(displayPrice) || 0) * USD_TO_IDR_EXCHANGE_RATE)
      : Math.round(Number(displayPrice) || 0);

    const cleaningFeeIdr = inputCurrency === "USD"
      ? Math.round((Number(displayCleaningFee) || 0) * USD_TO_IDR_EXCHANGE_RATE)
      : Math.round(Number(displayCleaningFee) || 0);

    const priceInUSD = Math.round((pricePerNightIdr / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100;

    const submitPayload = {
      ...form,
      pricePerNight: pricePerNightIdr,
      cleaningFee: cleaningFeeIdr,
      price: priceInUSD,
      ...(mode === "create" ? { maxStayNights: 28 } : {}),
    };

    setLoading(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || (currentLang === "en" ? "Failed to create property" : "Gagal menerbitkan properti"));

        if (data.isDraft) {
          setCreatedProperty(data);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        const res = await fetch(`/api/properties/${initialData?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitPayload),
        });
        if (!res.ok) throw new Error(currentLang === "en" ? "Failed to update property" : "Gagal memperbarui properti");

        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !confirm(t.deletePropertyConfirm)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${initialData.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(currentLang === "en" ? "Failed to delete property" : "Gagal menghapus properti");

      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || "An error occurred");
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI (7 Kolom): Informasi Pokok, Lokasi & Fasilitas */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-2.5 border-b border-gray-150 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.basicInfoTitle}</h3>
                <p className="text-xs text-muted-foreground">{t.basicInfoDesc}</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.propertyTitleLabel}</label>
                <Input
                  required
                  placeholder={t.propertyTitlePlaceholder}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.propertyDescLabel}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.propertyDescPlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-rose-500 bg-white dark:bg-gray-900 transition-colors"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <PropertyPricingSection
                inputCurrency={inputCurrency}
                displayPrice={displayPrice}
                displayCleaningFee={displayCleaningFee}
                category={form.category}
                maxGuests={form.maxGuests}
                cancellationPolicy={form.cancellationPolicy}
                currentLang={currentLang}
                onCurrencySwitch={handleCurrencySwitch}
                onPriceChange={setDisplayPrice}
                onCleaningFeeChange={setDisplayCleaningFee}
                onCategoryChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                onMaxGuestsChange={(val) => setForm((prev) => ({ ...prev, maxGuests: val }))}
                onCancellationPolicyChange={(val) => setForm((prev) => ({ ...prev, cancellationPolicy: val }))}
                t={t}
              />
            </div>
          </div>

          <PropertyLocationSection
            address={form.address}
            latitude={form.latitude}
            longitude={form.longitude}
            onAddressChange={(val) => setForm((prev) => ({ ...prev, address: val }))}
            onLatitudeChange={(val) => setForm((prev) => ({ ...prev, latitude: val }))}
            onLongitudeChange={(val) => setForm((prev) => ({ ...prev, longitude: val }))}
            t={t}
          />

          <PropertyAmenitiesSection
            selectedAmenities={form.amenities}
            onToggleAmenity={toggleAmenity}
            currentLang={currentLang}
            t={t}
          />
        </div>

        {/* KOLOM KANAN (5 Kolom): Upload Foto & Panel Aksi */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5 lg:sticky lg:top-20">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3 pb-2.5 border-b border-gray-150 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t.photosCardTitle}</h3>
                <p className="text-xs text-muted-foreground">{t.photosCardDesc}</p>
              </div>
            </div>
            <ImageUpload value={form.imageUrls} onChange={(urls) => setForm({ ...form, imageUrls: urls })} />
          </div>

          <PropertyFormActions
            mode={mode}
            loading={loading}
            deleting={deleting}
            onDelete={handleDelete}
            t={t}
          />
        </div>
      </div>

      {mode === "create" && (
        <>
          <PropertyKycDraftDialog
            open={!!createdProperty}
            onOpenChange={(open) => !open && router.push("/dashboard")}
            currentLang={currentLang}
            onVerifyNow={() => setShowKycModal(true)}
            onLater={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          />

          <KycModal
            open={showKycModal}
            onOpenChange={setShowKycModal}
            currentLang={currentLang}
            onSuccess={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          />
        </>
      )}
    </form>
  );
}

export default PropertyForm;
