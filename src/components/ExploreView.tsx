"use client"

import { useState } from "react"
import MapWrapper from "@/components/MapWrapper"
import PropertyCard from "@/components/PropertyCard"

export default function ExploreView({ 
  properties, 
  currentCurrency, 
  session, 
  t,
  isSearch = false,
  selectedId
}: { 
  properties: any[], 
  currentCurrency: string, 
  session: any, 
  t: any,
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
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.noProps}</h3>
              <p className="text-muted-foreground mt-2">{t.noPropsDesc}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-16">
              {/* Featured Property (if any) */}
              {featuredProperty && (
                <div className="w-full">
                  <PropertyCard 
                    property={featuredProperty}
                    currentCurrency={currentCurrency}
                    isGuest={session?.user && session.user.role === 'GUEST'}
                    isFavorited={featuredProperty.favorites?.length > 0}
                    avgRating={featuredProperty.reviews?.length > 0 ? (featuredProperty.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / featuredProperty.reviews.length).toFixed(2) : null}
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
                  const isFavorited = p.favorites?.length > 0;
                  const isGuest = session?.user && session.user.role === 'GUEST';
                  const avgRating = p.reviews?.length > 0 
                    ? (p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length).toFixed(2)
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
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-xl border border-dashed">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.noProps}</h3>
            <p className="text-muted-foreground mt-2">{t.noPropsDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {properties.map(p => {
              const isFavorited = p.favorites?.length > 0;
              const isGuest = session?.user && session.user.role === 'GUEST';
              const avgRating = p.reviews?.length > 0 
                ? (p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length).toFixed(2)
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
