"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import FavoriteButton from "@/components/FavoriteButton"
import { formatPrice } from "@/lib/format"

export interface PropertyCardProps {
  property: {
    id: string
    title: string
    address?: string | null
    description?: string | null
    maxGuests?: number | null
    pricePerNight?: number | null
    price?: number | null
    imageUrls?: string[]
    [key: string]: unknown
  }
  currentCurrency?: string
  isGuest?: boolean
  isFavorited?: boolean
  avgRating?: string | null
  t?: {
    guestFavorite?: string
    maxGuestsLabel?: string
    guests?: string
    newListing?: string
    night?: string
    [key: string]: unknown
  }
  cardHref: string
  isFeatured?: boolean
  isRecommendation?: boolean
  disableCarousel?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function PropertyCard({ 
  property, 
  currentCurrency = "IDR", 
  isGuest = false, 
  isFavorited = false, 
  avgRating, 
  t = {}, 
  cardHref,
  isFeatured = false,
  isRecommendation = false,
  disableCarousel = false,
  onMouseEnter,
  onMouseLeave
}: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0)
  
  // Provide 3 fallback images if dummy data only has 1, so swipe is testable
  const baseImages = property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400&h=400']
  const images = baseImages.length === 1 
    ? [baseImages[0], 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=400&h=400', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=400&h=400'] 
    : baseImages;

  const nextImg = (e: React.MouseEvent) => {
    e.preventDefault()
    setImgIndex((prev) => (prev + 1) % images.length)
  }

  const prevImg = (e: React.MouseEvent) => {
    e.preventDefault()
    setImgIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const carouselElement = (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-200 group/carousel">
      {isGuest && (
        <FavoriteButton propertyId={property.id} initialIsFavorited={isFavorited} isLoggedIn={true} className="absolute top-3 right-3" />
      )}

      {avgRating && parseFloat(avgRating) >= 4.5 && (
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold shadow-sm z-20 text-gray-900">
          {t?.guestFavorite || "Guest favorite"}
        </div>
      )}

      <img 
        src={images[disableCarousel ? 0 : imgIndex]} 
        alt={property.title}
        className="object-cover h-full w-full transition-transform duration-500 group-hover:scale-105"
      />

      {/* Navigation Arrows (Visible on hover) */}
      {!disableCarousel && (
        <>
          <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10">
            <button onClick={prevImg} className="bg-white/90 hover:bg-white text-black rounded-full p-1 shadow-sm transition-transform hover:scale-110">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextImg} className="bg-white/90 hover:bg-white text-black rounded-full p-1 shadow-sm transition-transform hover:scale-110">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, idx: number) => (
              <div key={idx} className={`rounded-full transition-all ${idx === imgIndex ? 'bg-white w-2 h-2' : 'bg-white/60 w-1.5 h-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )

  if (isFeatured) {
    return (
      <Link 
        href={cardHref} 
        className="flex flex-col sm:flex-row gap-5 w-full bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group" 
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave}
        style={{ width: '100%', maxWidth: '875.55px', height: '271px' }}
      >
        <div className="relative h-full shrink-0" style={{ width: '318px' }}>
          {carouselElement}
        </div>
        <div className="flex flex-col flex-1 py-1 pr-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{property.address}</p>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 leading-tight mb-2">{property.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-1">{property.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t?.maxGuestsLabel ? `${t.maxGuestsLabel}: ${property.maxGuests}` : `Max ${property.maxGuests} ${t?.guests || "guests"}`}
              </p>
            </div>
            {isGuest && (
              <FavoriteButton propertyId={property.id} initialIsFavorited={isFavorited} isLoggedIn={true} className="text-gray-400 hover:text-rose-500 [&_svg]:fill-gray-200/50" />
            )}
          </div>
          
          <div className="mt-auto pt-4 flex justify-between items-end">
            <div className="flex items-center gap-1 font-semibold text-sm">
              <Star className="h-4 w-4 fill-current" />
              <span>{avgRating || t?.newListing || "New"}</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-bold text-lg">{formatPrice(property.pricePerNight || (property.price ? property.price * 18051 : 0), currentCurrency)}</span>
              <span className="text-gray-500 text-sm mb-0.5"> / {t.night}</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Normal Vertical Card
  const cardStyle = isRecommendation
    ? { width: '100%', maxWidth: '424.77px', height: '404.47px' }
    : { width: '100%', height: '282px' }

  return (
    <Link 
      href={cardHref} 
      className="block cursor-pointer group" 
      onMouseEnter={onMouseEnter} 
      onMouseLeave={onMouseLeave}
      style={cardStyle}
    >
      <div className="flex flex-col gap-1.5 w-full h-full">
        <div 
          className="w-full relative shrink-0 overflow-hidden rounded-xl" 
          style={{ height: isRecommendation ? '315px' : '200px' }}
        >
          {carouselElement}
        </div>
        <div className="flex justify-between items-start mt-0.5">
          <div className="flex flex-col min-w-0 pr-1 flex-1">
            <span className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 truncate w-full">
              {property.title}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs truncate w-full">
              {property.address}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">{formatPrice(property.pricePerNight || (property.price ? property.price * 18051 : 0), currentCurrency)}</span>
              <span className="font-light text-gray-500 dark:text-gray-400 text-xs"> / {t.night}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-xs text-gray-900 dark:text-gray-100 shrink-0">
            <Star className="h-3 w-3 fill-current" />
            <span>{avgRating || t?.newListing || "New"}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
