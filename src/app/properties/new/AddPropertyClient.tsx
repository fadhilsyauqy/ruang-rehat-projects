"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ImageUpload from "@/components/ImageUpload"
import { ALL_AMENITIES } from "@/lib/amenities"
import { Building2, Sparkles, MapPin, Image as ImageIcon, PlusCircle, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import KycModal from "@/components/KycModal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { USD_TO_IDR_EXCHANGE_RATE } from "@/lib/currency"

interface AddPropertyClientProps {
  currentLang?: string
  currentCurrency?: string
  t: any
}

export default function AddPropertyClient({
  currentLang = "id",
  currentCurrency = "IDR",
  t,
}: AddPropertyClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdProperty, setCreatedProperty] = useState<any | null>(null)
  const [showKycModal, setShowKycModal] = useState(false)

  // Dynamic currency selector state (defaults to user's active currency)
  const defaultCurrency = (currentCurrency === "USD" ? "USD" : "IDR") as "IDR" | "USD"
  const [inputCurrency, setInputCurrency] = useState<"IDR" | "USD">(defaultCurrency)
  const [displayPrice, setDisplayPrice] = useState<number | string>("")
  const [displayCleaningFee, setDisplayCleaningFee] = useState<number | string>("")

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Villa",
    cancellationPolicy: "FLEXIBLE",
    address: "",
    latitude: 0,
    longitude: 0,
    maxGuests: 1,
    amenities: [] as string[],
    imageUrls: [] as string[],
  })

  // Handle switching currency with real-time conversion
  const handleCurrencySwitch = (newCurrency: "IDR" | "USD") => {
    if (newCurrency === inputCurrency) return
    if (newCurrency === "IDR") {
      // USD -> IDR: multiply by USD_TO_IDR_EXCHANGE_RATE (18.051)
      if (displayPrice !== "" && !isNaN(Number(displayPrice))) {
        setDisplayPrice(Math.round(Number(displayPrice) * USD_TO_IDR_EXCHANGE_RATE))
      }
      if (displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee))) {
        setDisplayCleaningFee(Math.round(Number(displayCleaningFee) * USD_TO_IDR_EXCHANGE_RATE))
      }
    } else {
      // IDR -> USD: divide by USD_TO_IDR_EXCHANGE_RATE (18.051)
      if (displayPrice !== "" && !isNaN(Number(displayPrice))) {
        setDisplayPrice(Math.round((Number(displayPrice) / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100)
      }
      if (displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee))) {
        setDisplayCleaningFee(Math.round((Number(displayCleaningFee) / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100)
      }
    }
    setInputCurrency(newCurrency)
  }

  const toggleAmenity = (id: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.imageUrls.length === 0) {
      alert(currentLang === "en" ? "Please upload at least one property photo." : "Harap unggah minimal satu foto properti.")
      return
    }

    // Convert input price to Single Source of Truth IDR for database storage
    const pricePerNightIdr = inputCurrency === "USD"
      ? Math.round((Number(displayPrice) || 0) * USD_TO_IDR_EXCHANGE_RATE)
      : Math.round(Number(displayPrice) || 0)

    const cleaningFeeIdr = inputCurrency === "USD"
      ? Math.round((Number(displayCleaningFee) || 0) * USD_TO_IDR_EXCHANGE_RATE)
      : Math.round(Number(displayCleaningFee) || 0)

    const priceInUSD = Math.round((pricePerNightIdr / USD_TO_IDR_EXCHANGE_RATE) * 100) / 100

    const submitPayload = {
      ...form,
      pricePerNight: pricePerNightIdr,
      cleaningFee: cleaningFeeIdr,
      price: priceInUSD,
      maxStayNights: 28,
    }

    setLoading(true)
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitPayload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || (currentLang === "en" ? "Failed to create property" : "Gagal menerbitkan properti"))

      // Jika listing berstatus draft (karena host belum lolos verifikasi KYC), tampilkan dialog panduan KYC
      if (data.isDraft) {
        setCreatedProperty(data)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Grid 2 Kolom Melebar Responsif (Sama Persis Halaman Edit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* KOLOM KIRI (7 Kolom): Informasi Pokok, Lokasi & Fasilitas */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Card 1: Informasi Dasar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-4">
            <div className="flex items-center gap-3 pb-2.5 border-b border-gray-150 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t.basicInfoTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t.basicInfoDesc}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.propertyTitleLabel}
                </label>
                <Input
                  required
                  placeholder={t.propertyTitlePlaceholder}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.propertyDescLabel}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.propertyDescPlaceholder}
                  className="w-full border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-rose-500 bg-white dark:bg-gray-900 transition-colors"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Currency Selector Pill */}
              <div className="p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                    {currentLang === "en" ? "Pricing Currency" : "Mata Uang Penetapan Harga"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {currentLang === "en" 
                      ? `Currently entering prices in ${inputCurrency}. Prices convert automatically for global guests.`
                      : `Memasukkan harga dalam ${inputCurrency}. Otomatis dikonversi bagi tamu internasional.`}
                  </span>
                </div>
                <div className="inline-flex items-center p-0.5 rounded-lg bg-gray-200/70 dark:bg-gray-800 border border-gray-300/70 dark:border-gray-700 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleCurrencySwitch("IDR")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      inputCurrency === "IDR"
                        ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-2xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    🇮🇩 IDR (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencySwitch("USD")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      inputCurrency === "USD"
                        ? "bg-white dark:bg-gray-900 text-rose-600 dark:text-rose-400 shadow-2xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    🇺🇸 USD ($)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.pricePerNightLabel} ({inputCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {inputCurrency === "IDR" ? "Rp" : "$"}
                    </span>
                    <Input
                      type="number"
                      required
                      min={0}
                      step={inputCurrency === "IDR" ? "1000" : "1"}
                      placeholder={inputCurrency === "IDR" ? "1500000" : "100"}
                      value={displayPrice}
                      onChange={(e) => setDisplayPrice(e.target.value)}
                      className={`${inputCurrency === "IDR" ? "pl-11" : "pl-8"} rounded-xl border-gray-200 dark:border-gray-800 text-xs font-bold font-mono`}
                    />
                  </div>
                  {displayPrice !== "" && !isNaN(Number(displayPrice)) && Number(displayPrice) > 0 ? (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>
                        {inputCurrency === "IDR"
                          ? `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayPrice))} • ≈ $${(Number(displayPrice) / 15000).toFixed(2)} USD`
                          : `$${Number(displayPrice).toFixed(2)} USD • ≈ ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayPrice) * 15000)}`}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.cleaningFee || "Biaya Kebersihan"} ({inputCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      {inputCurrency === "IDR" ? "Rp" : "$"}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={inputCurrency === "IDR" ? "1000" : "1"}
                      placeholder="0"
                      value={displayCleaningFee}
                      onChange={(e) => setDisplayCleaningFee(e.target.value)}
                      className={`${inputCurrency === "IDR" ? "pl-11" : "pl-8"} rounded-xl border-gray-200 dark:border-gray-800 text-xs font-bold font-mono`}
                    />
                  </div>
                  {displayCleaningFee !== "" && !isNaN(Number(displayCleaningFee)) && Number(displayCleaningFee) > 0 ? (
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>
                        {inputCurrency === "IDR"
                          ? `${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayCleaningFee))} • ≈ $${(Number(displayCleaningFee) / 15000).toFixed(2)} USD`
                          : `$${Number(displayCleaningFee).toFixed(2)} USD • ≈ ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(displayCleaningFee) * 15000)}`}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {currentLang === "en" ? "Category" : "Kategori Properti"}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 border border-gray-200 dark:border-gray-800 rounded-xl px-3 text-xs bg-white dark:bg-gray-900 font-medium focus:outline-none focus:border-rose-500"
                  >
                    <option value="Villa">Villa</option>
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="House">Rumah / House</option>
                    <option value="Resort">Resort & Cottage</option>
                    <option value="Cabin">Kabin / Cabin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t.maxGuestsLabel}
                  </label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={form.maxGuests || ""}
                    onChange={(e) => setForm({ ...form, maxGuests: parseInt(e.target.value) || 1 })}
                    className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.cancellationPolicyLabel || "Kebijakan Pembatalan"}
                </label>
                <select
                  value={form.cancellationPolicy}
                  onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                  className="w-full h-9 border border-gray-200 dark:border-gray-800 rounded-xl px-3 text-xs bg-white dark:bg-gray-900 font-medium focus:outline-none focus:border-rose-500"
                >
                  <option value="FLEXIBLE">FLEXIBLE (Refund 100% jika batal &gt; 24 jam sebelum check-in)</option>
                  <option value="MODERATE">MODERATE (Refund 100% jika batal &gt; 5 hari sebelum check-in)</option>
                  <option value="STRICT">STRICT (Refund 50% jika batal &gt; 7 hari sebelum check-in)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Lokasi & Koordinat */}
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
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
                    value={form.latitude || ""}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
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
                    value={form.longitude || ""}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl border-gray-200 dark:border-gray-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Fasilitas Properti (Amenities) */}
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
                {form.amenities.length} {t.amenitiesSelected}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pt-0.5">
              {ALL_AMENITIES.map((a) => {
                const isChecked = form.amenities.includes(a.id)
                const IconComp = a.icon
                const labelText = a.label[currentLang as "id" | "en"] || a.label.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      isChecked
                        ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shadow-xs font-semibold"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 bg-gray-50/40 dark:bg-gray-900/40"
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{labelText}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (5 Kolom): Upload Foto & Panel Aksi Terbitkan */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5 lg:sticky lg:top-20">
          {/* Card Foto Properti */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-3 pb-2.5 border-b border-gray-150 dark:border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t.photosCardTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t.photosCardDesc}
                </p>
              </div>
            </div>

            <ImageUpload
              value={form.imageUrls}
              onChange={(urls) => setForm({ ...form, imageUrls: urls })}
            />
          </div>

          {/* Card Aksi Terbitkan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t.publishActionsTitle}
            </h4>

            <div className="space-y-2.5">
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? t.publishingProperty : t.publishPropertyBtn}</span>
              </Button>

              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs text-center transition-colors flex items-center justify-center gap-1.5 block"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.cancel}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Sukses Pembuatan Properti & Prompt KYC */}
      <Dialog open={!!createdProperty} onOpenChange={(open) => !open && router.push("/dashboard")}>
        <DialogContent className="max-w-md p-6 rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <DialogHeader className="space-y-1.5 text-center">
            <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">
              {currentLang === "en" ? "Property Draft Created!" : "Properti Berhasil Didaftarkan!"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-center">
              {currentLang === "en"
                ? "Your property is saved safely as DRAFT. To protect guests and publish your listing live for bookings, please complete your Host KYC verification."
                : "Properti Anda berhasil disimpan sebagai DRAFT. Demi keamanan tamu dan kecepatan penarikan hasil sewa, lengkapi verifikasi identitas (KTP) agar listing langsung tayang."}
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 text-left text-xs space-y-1 text-purple-900 dark:text-purple-200">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              {currentLang === "en" ? "Why verify now?" : "Keuntungan Verifikasi KYC:"}
            </p>
            <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-purple-800 dark:text-purple-300">
              <li>Listing otomatis dipublikasikan ke halaman pencarian</li>
              <li>Mendapatkan lencana Host Terverifikasi Resmi</li>
              <li>Pencairan dana sewa (Payout) dapat langsung diproses</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              type="button"
              onClick={() => {
                setShowKycModal(true)
              }}
              className="w-full h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {currentLang === "en" ? "Verify ID (KTP) Now" : "Verifikasi KTP Sekarang (Rekomendasi)"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                router.push("/dashboard")
                router.refresh()
              }}
              className="text-xs text-muted-foreground"
            >
              {currentLang === "en" ? "I'll do it later (Go to Dashboard)" : "Nanti Saja (Buka Dashboard)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Komponen KycModal */}
      <KycModal
        open={showKycModal}
        onOpenChange={setShowKycModal}
        currentLang={currentLang}
        onSuccess={() => {
          router.push("/dashboard")
          router.refresh()
        }}
      />
    </form>
  )
}
