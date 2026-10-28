"use client"

import { useState } from "react"
import { SearchX } from "lucide-react"
import MapWrapper from "@/components/MapWrapper"
import PropertyCard from "@/components/PropertyCard"
import EmptyState from "@/components/ui/EmptyState"
import type { Session } from "next-auth"
import type { Dictionary } from "@/lib/dictionary"

export interface ExplorePropertyItem {
  id: string
  title: string
  address: string
  description?: string | null
  maxGuests?: number | null
  price?: number | null
  pricePerNight?: number | null
  latitude?: number | null
  longitude?: number | null
  imageUrls: string[]
  favorites?: Array<{ id: string }>
  reviews?: Array<{ rating: number }>
  [key: string]: unknown
}

export default function ExploreView({ 
  properties, 
  currentCurrency, 
  session, 
  t,
  isSearch = false,
  selectedId
}: { 
  properties: ExplorePropertyItem[], 
  currentCurrency: string, 
  session: Session | null, 
  t: Dictionary,
  isSearch?: boolean,
  selectedId?: string,
  currentLang?: string
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  
  const featuredProperty = selectedId ? properties.find(p => p.id === selectedId) : null;
  const otherProperties = featuredProperty ? properties.filter(p => p.id !== selectedId) : properties;

  if (isSearch) {
    return (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Kiri: List of Properties (Mengalir secara normal dengan scrollbar utama di sisi kanan layar) */}
        <div className="w-full flex-1 min-w-[350px]">
          {properties.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t.noProps}
              description={t.noPropsDesc}
              actionLabel={t.resetFilters || (t.clearAll ? `${t.clearAll} (Reset)` : "Hapus Filter & Tampilkan Semua")}
              actionHref="/"
            />
          ) : (
            <div className="flex flex-col gap-6 pb-16">
              {/* Featured Property (if any) */}
              {featuredProperty && (
                <div className="w-full">
                  <PropertyCard 
                    property={featuredProperty}
                    currentCurrency={currentCurrency}
                    isGuest={session?.user && session.user.role === 'GUEST'}
                    isFavorited={Boolean(featuredProperty.favorites?.length)}
                    avgRating={featuredProperty.reviews && featuredProperty.reviews.length > 0 ? (featuredProperty.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / featuredProperty.reviews.length).toFixed(2) : null}
                    t={t}
                    cardHref={`/properties/${featuredProperty.id}`}
                    isFeatured={true}
                    onMouseEnter={() => setHoveredId(featuredProperty.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                </div>
              )}

              {/* Grid for normal properties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
                {otherProperties.map(p => {
                  const isFavorited = Boolean(p.favorites?.length);
                  const isGuest = session?.user && session.user.role === 'GUEST';
                  const avgRating = p.reviews && p.reviews.length > 0 
                    ? (p.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / p.reviews.length).toFixed(2)
                    : null;

                  const cardHref = `/properties/${p.id}`;

                  return (
                    <div key={p.id} className="col-span-1">
                      <PropertyCard 
                        property={p}
                        currentCurrency={currentCurrency}
                        isGuest={isGuest}
                        isFavorited={isFavorited}
                        avgRating={avgRating}
                        t={t}
                        cardHref={cardHref}
                        isFeatured={false}
                        isRecommendation={true}
                        disableCarousel={false}
                        onMouseEnter={() => setHoveredId(p.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Kanan: Map Pinned / Sticky (Menempel di viewport saat scroll halaman) */}
        <div 
          className="hidden lg:block shrink-0 sticky top-40 h-[calc(100vh-180px)] self-start"
          style={{ width: '885.45px', maxWidth: '48vw' }}
        >
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm border dark:border-gray-800 relative z-0">
            <MapWrapper 
              properties={properties} 
              hoveredId={hoveredId} 
              currentCurrency={currentCurrency}
              t={t}
            />
          </div>
        </div>
      </div>
    )
  }

  // Tampilan Default Beranda (Landing Page sebelum search / klik wilayah)
  return (
    <div className="flex flex-col gap-6">
      <div className="w-full">
        {properties.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t.noProps}
            description={t.noPropsDesc}
            actionLabel={t.resetFilters || (t.clearAll ? `${t.clearAll} (Reset)` : "Hapus Filter & Tampilkan Semua")}
            actionHref="/"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {properties.map(p => {
              const isFavorited = Boolean(p.favorites?.length);
              const isGuest = session?.user && session.user.role === 'GUEST';
              const avgRating = p.reviews && p.reviews.length > 0 
                ? (p.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / p.reviews.length).toFixed(2)
                : null;

              const searchLocation = p.address.split(',').pop()?.trim() || p.address;
              const cardHref = `/?location=${encodeURIComponent(searchLocation)}&selected=${p.id}`;

              return (
                <div key={p.id} className="shrink-0">
                  <PropertyCard 
                    property={p}
                    currentCurrency={currentCurrency}
                    isGuest={isGuest}
                    isFavorited={isFavorited}
                    avgRating={avgRating}
                    t={t}
                    cardHref={cardHref}
                    isFeatured={false}
                    isRecommendation={false}
                    disableCarousel={true}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
