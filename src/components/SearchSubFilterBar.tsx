"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ALL_AMENITIES } from "@/lib/amenities"
import { formatPrice } from "@/lib/format"

export default function SearchSubFilterBar({
  currentLang = "id",
  currentCurrency = "IDR",
  t
}: {
  currentLang?: string
  currentCurrency?: string
  t: any
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const location = searchParams.get("location") || ""
  const amenitiesParam = searchParams.get("amenities")
  const minPriceParam = searchParams.get("minPrice")
  const maxPriceParam = searchParams.get("maxPrice")

  // State untuk fasilitas
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    amenitiesParam ? amenitiesParam.split(",").filter(Boolean) : []
  )
  const [filterOpen, setFilterOpen] = useState(false)

  // State untuk harga & histogram
  const [priceOpen, setPriceOpen] = useState(false)
  const [regionData, setRegionData] = useState<{ min: number; max: number; count: number; prices: number[] }>({
    min: 0,
    max: 1000,
    count: 0,
    prices: []
  })

  // State slider & input (dalam satuan USD basis backend)
  const [minVal, setMinVal] = useState<number>(0)
  const [maxVal, setMaxVal] = useState<number>(1000)

  // Fetch harga terendah, tertinggi & distribusi harga di wilayah
  useEffect(() => {
    async function fetchBounds() {
      try {
        const query = location ? `?location=${encodeURIComponent(location)}` : ""
        const res = await fetch(`/api/properties/price-range${query}`)
        if (res.ok) {
          const data = await res.json()
          const bMin = data.min ?? 0
          const bMax = data.max ?? 1000
          setRegionData({
            min: bMin,
            max: bMax,
            count: data.count ?? 0,
            prices: data.prices ?? []
          })

          // Inisialisasi posisi slider berdasarkan query param jika ada, atau batas wilayah
          const currentMin = minPriceParam ? Math.max(bMin, Number(minPriceParam)) : bMin
          const currentMax = maxPriceParam ? Math.min(bMax, Number(maxPriceParam)) : bMax
          setMinVal(currentMin)
          setMaxVal(currentMax)
        }
      } catch (err) {
        console.error("Failed to load region price bounds", err)
      }
    }
    fetchBounds()
  }, [location, minPriceParam, maxPriceParam])

  // Hitung histogram bar (36 kolom distribusi seperti Airbnb)
  const BARS_COUNT = 36
  const histogramBars = useMemo(() => {
    const bars = new Array(BARS_COUNT).fill(0)
    const { min, max, prices } = regionData

    if (prices.length === 0 || max <= min) {
      // Default distribusi halus jika data sedikit
      for (let i = 0; i < BARS_COUNT; i++) {
        const x = (i - BARS_COUNT / 2) / (BARS_COUNT / 4)
        bars[i] = Math.max(1, Math.round(14 * Math.exp(-0.5 * x * x)))
      }
      return bars
    }

    const step = (max - min) / BARS_COUNT
    prices.forEach(price => {
      let idx = Math.floor((price - min) / (step || 1))
      if (idx >= BARS_COUNT) idx = BARS_COUNT - 1
      if (idx < 0) idx = 0
      bars[idx] += 1
    })

    // Normalisasi tinggi (antara 3 dan 28)
    const maxFreq = Math.max(...bars, 1)
    return bars.map(count => {
      if (count === 0) return 3 // minimum height
      return Math.max(4, Math.round((count / maxFreq) * 28))
    })
  }, [regionData])

  // Menghitung berapa properti yang masuk dalam rentang yang dipilih
  const matchedPlacesCount = useMemo(() => {
    if (regionData.prices.length === 0) return 0
    return regionData.prices.filter(p => p >= minVal && p <= maxVal).length
  }, [regionData.prices, minVal, maxVal])

  const handleMinSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - 5)
    setMinVal(val)
  }

  const handleMaxSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + 5)
    setMaxVal(val)
  }

  // Amenities handlers
  const toggleAmenity = (id: string) => {
    setSelectedAmenities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleApplyAmenities = () => {
    setFilterOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (selectedAmenities.length > 0) {
      params.set("amenities", selectedAmenities.join(","))
    } else {
      params.delete("amenities")
    }
    router.push(`/?${params.toString()}`)
  }

  const handleResetAmenities = () => {
    setSelectedAmenities([])
    setFilterOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("amenities")
    router.push(`/?${params.toString()}`)
  }

  // Price handlers
  const handleApplyPrice = () => {
    setPriceOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    
    // Jika minVal berbeda dari batas min wilayah, set query
    if (minVal > regionData.min) {
      params.set("minPrice", String(minVal))
    } else {
      params.delete("minPrice")
    }

    // Jika maxVal berbeda dari batas max wilayah, set query
    if (maxVal < regionData.max) {
      params.set("maxPrice", String(maxVal))
    } else {
      params.delete("maxPrice")
    }

    router.push(`/?${params.toString()}`)
  }

  const handleResetPrice = () => {
    setMinVal(regionData.min)
    setMaxVal(regionData.max)
    setPriceOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("minPrice")
    params.delete("maxPrice")
    router.push(`/?${params.toString()}`)
  }

  const hasActivePrice = !!(minPriceParam || maxPriceParam)
  const priceButtonText = hasActivePrice
    ? `${formatPrice(minVal, currentCurrency)} - ${formatPrice(maxVal, currentCurrency)}`
    : (currentLang === "id" ? "Harga" : "Price")

  // Posisi persentase slider untuk pewarnaan histogram bar & track slider
  const minPercent = regionData.max > regionData.min 
    ? Math.max(0, Math.min(100, ((minVal - regionData.min) / (regionData.max - regionData.min)) * 100))
    : 0
  const maxPercent = regionData.max > regionData.min
    ? Math.max(0, Math.min(100, ((maxVal - regionData.min) / (regionData.max - regionData.min)) * 100))
    : 100

  return (
    <div className="flex items-center justify-center gap-3">
      {/* 1. Tombol Filter Fasilitas (Amenities) */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogTrigger
          className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 ${
            selectedAmenities.length > 0
              ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{t.filterAmenities || "Filters"}</span>
          {selectedAmenities.length > 0 && (
            <span className="bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {selectedAmenities.length}
            </span>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {t.filterTitle || "Filter Pencarian"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
                {t.selectAmenities || "Pilih Fasilitas Idaman"}
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Pilih fasilitas untuk memfilter penginapan di sekitar wilayah ini.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {ALL_AMENITIES.map((item) => {
                const isSelected = selectedAmenities.includes(item.id)
                const IconComp = item.icon
                const labelText = (item.label as any)[currentLang] || item.label.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAmenity(item.id)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <IconComp className="w-5 h-5" />
                      {isSelected && <Check className="w-3.5 h-3.5 text-rose-500" />}
                    </div>
                    <span className="text-xs leading-tight">{labelText}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t dark:border-gray-800">
            {selectedAmenities.length > 0 ? (
              <button
                type="button"
                onClick={handleResetAmenities}
                className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer px-2 py-1"
              >
                {t.clearFilters || "Reset Semua"}
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleApplyAmenities}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
            >
              {t.applyFilters || "Terapkan Filter"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Tombol & Popover Price Range (Persis Gambar Referensi Airbnb) */}
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger
          className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 ${
            hasActivePrice || priceOpen
              ? "border-black dark:border-white ring-1 ring-black dark:ring-white bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-900 dark:hover:border-gray-300 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
          }`}
        >
          <span>{priceButtonText}</span>
          {priceOpen ? (
            <ChevronUp className="w-3.5 h-3.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          )}
        </PopoverTrigger>

        <PopoverContent
          className="w-[390px] sm:w-[420px] p-6 rounded-3xl shadow-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 space-y-6"
          align="center"
          sideOffset={8}
        >
          {/* Header Title */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {t.tripPriceTitle || (currentLang === "en" ? "Trip price, includes all fees" : "Harga sewa, termasuk semua biaya")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {location 
                ? (currentLang === "en" ? `Price range for stays in ${location}` : `Rentang harga penginapan di wilayah ${location}`)
                : (currentLang === "en" ? "Nightly price for selected stays" : "Harga per malam untuk penginapan pilihan")}
            </p>
          </div>

          {/* Histogram Bar Chart + Dual Thumb Slider */}
          <div className="pt-4 pb-2">
            {/* Visual Histogram Bars */}
            <div className="flex items-end justify-between gap-[2.5px] h-20 px-2">
              {histogramBars.map((height, i) => {
                const barPercent = (i / (BARS_COUNT - 1)) * 100
                const isInRange = barPercent >= minPercent && barPercent <= maxPercent
                return (
                  <div
                    key={i}
                    style={{ height: `${height * 2.6}px` }}
                    className={`w-full rounded-t-xs transition-colors duration-150 ${
                      isInRange
                        ? "bg-rose-500 dark:bg-rose-500"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                )
              })}
            </div>

            {/* Dual Range Sliders Container */}
            <div className="relative w-full h-8 flex items-center">
              {/* Background Track Line */}
              <div className="absolute w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
              {/* Highlighted Track Line */}
              <div
                className="absolute h-1 bg-rose-500 rounded-full"
                style={{
                  left: `${minPercent}%`,
                  width: `${maxPercent - minPercent}%`
                }}
              />

              {/* Slider Input Min */}
              <input
                type="range"
                min={regionData.min}
                max={regionData.max}
                value={minVal}
                onChange={handleMinSlider}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-30
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-7
                  [&::-webkit-slider-thumb]:h-7
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-[1.5px]
                  [&::-webkit-slider-thumb]:border-gray-300
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-webkit-slider-thumb]:active:scale-105
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-7
                  [&::-moz-range-thumb]:h-7
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-[1.5px]
                  [&::-moz-range-thumb]:border-gray-300
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:cursor-grab"
              />

              {/* Slider Input Max */}
              <input
                type="range"
                min={regionData.min}
                max={regionData.max}
                value={maxVal}
                onChange={handleMaxSlider}
                className="absolute w-full h-1 appearance-none bg-transparent pointer-events-none z-30
                  [&::-webkit-slider-thumb]:pointer-events-auto
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-7
                  [&::-webkit-slider-thumb]:h-7
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:border-[1.5px]
                  [&::-webkit-slider-thumb]:border-gray-300
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:active:cursor-grabbing
                  [&::-webkit-slider-thumb]:active:scale-105
                  [&::-moz-range-thumb]:pointer-events-auto
                  [&::-moz-range-thumb]:w-7
                  [&::-moz-range-thumb]:h-7
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-[1.5px]
                  [&::-moz-range-thumb]:border-gray-300
                  [&::-moz-range-thumb]:shadow-md
                  [&::-moz-range-thumb]:cursor-grab"
              />
            </div>
          </div>

          {/* Input Minimum & Maximum Pills (Persis Gambar Referensi) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">
                {t.minimumPrice || (currentLang === "en" ? "Minimum" : "Minimum")}
              </span>
              <div className="w-full py-3 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-2xs">
                {formatPrice(minVal, currentCurrency)}
              </div>
            </div>

            <div className="text-center">
              <span className="text-xs text-muted-foreground block mb-1.5 font-medium">
                {t.maximumPrice || (currentLang === "en" ? "Maximum" : "Maksimum")}
              </span>
              <div className="w-full py-3 px-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-2xs">
                {maxVal >= regionData.max 
                  ? `${formatPrice(maxVal, currentCurrency)}+`
                  : formatPrice(maxVal, currentCurrency)}
              </div>
            </div>
          </div>

          {/* Footer: Clear & Show Places Button */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetPrice}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline cursor-pointer"
            >
              {t.clearPrice || (currentLang === "en" ? "Clear" : "Hapus")}
            </button>
            <button
              type="button"
              onClick={handleApplyPrice}
              className="px-6 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 font-semibold text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              {currentLang === "en"
                ? (matchedPlacesCount > 0 ? `Show ${matchedPlacesCount} places` : "Show places")
                : (matchedPlacesCount > 0 ? `Tampilkan ${matchedPlacesCount} penginapan` : "Tampilkan penginapan")}
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
