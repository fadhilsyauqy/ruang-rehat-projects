import { auth } from "@/auth"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import ExploreView from "@/components/ExploreView"
import { toCheckInDateTimeWIB, toCheckOutDateTimeWIB } from "@/lib/date-standards"

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await auth()
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const currentLang = cookieStore.get('lang')?.value || 'id';
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR';
  const t = getDictionary(currentLang);

  const location = resolvedSearchParams.location
  const checkIn = resolvedSearchParams.checkIn
  const checkOut = resolvedSearchParams.checkOut
  const guests = resolvedSearchParams.guests
  const minPrice = resolvedSearchParams.minPrice
  const maxPrice = resolvedSearchParams.maxPrice
  const selectedId = resolvedSearchParams.selected
  const amenitiesParam = resolvedSearchParams.amenities

  // Build Prisma Where Clause dynamically
  // Proteksi Konsumen: Hanya tampilkan properti yang telah lolos verifikasi KYC (isPublished: true)
  const whereClause: Prisma.PropertyWhereInput = {
    isPublished: true
  }

  if (location) {
    whereClause.OR = [
      { address: { contains: location, mode: "insensitive" } },
      { title: { contains: location, mode: "insensitive" } }
    ]
  }

  if (guests) {
    whereClause.maxGuests = { gte: parseInt(guests) }
  }

  if (amenitiesParam) {
    const amenitiesList = amenitiesParam.split(",").filter(Boolean)
    if (amenitiesList.length > 0) {
      whereClause.amenities = {
        hasEvery: amenitiesList
      }
    }
  }

  if (minPrice || maxPrice) {
    const priceFilter: Prisma.IntFilter = {}
    if (minPrice) priceFilter.gte = Math.round(parseFloat(minPrice))
    if (maxPrice) priceFilter.lte = Math.round(parseFloat(maxPrice))
    whereClause.pricePerNight = priceFilter
  }

  // CRITICAL: Anti-Overlap Date Filter Logic (Standar Check-in 14:00 WIB & Check-out 12:00 WIB)
  if (checkIn && checkOut) {
    const checkInDate = toCheckInDateTimeWIB(checkIn)
    const checkOutDate = toCheckOutDateTimeWIB(checkOut)
    
    // We want properties where NONE of their bookings overlap with the requested dates.
    // An overlap happens if: (existing.startDate < requested.endDate) AND (existing.endDate > requested.startDate)
    whereClause.bookings = {
      none: {
        status: { not: 'CANCELLED' },
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate }
      }
    }

    // Task 3.3: Sinkronkan dengan tanggal yang diblokir oleh host (BlockedDate)
    whereClause.blockedDates = {
      none: {
        startDate: { lt: checkOutDate },
        endDate: { gt: checkInDate }
      }
    }
  }

  const properties = await prisma.property.findMany({
    where: whereClause,
    include: { 
      favorites: { where: { userId: session?.user?.id || 'none' } },
      reviews: { select: { rating: true } }
    }
  })

  const isSearchActive = !!(location || checkIn || checkOut || guests || minPrice || maxPrice || amenitiesParam);

  return (
    <div className={`mx-auto max-w-[2520px] ${isSearchActive ? 'xl:px-6 md:px-6 pt-4 pb-2' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
      <section>
        <ExploreView 
          properties={properties} 
          currentCurrency={currentCurrency} 
          session={session} 
          t={t} 
          isSearch={isSearchActive}
          selectedId={selectedId}
          currentLang={currentLang}
        />
      </section>
    </div>
  )
}
