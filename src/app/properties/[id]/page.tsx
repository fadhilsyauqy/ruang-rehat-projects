import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import BookingClient from "./BookingClient"
import { auth } from "@/auth"
import { MapPin, Users, Star, ShieldAlert } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import FavoriteButton from "@/components/FavoriteButton"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import { getAmenityById } from "@/lib/amenities"

export default async function PropertyDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth()
  const cookieStore = await cookies()
  const currentLang = cookieStore.get('lang')?.value || 'id'
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR'
  const t = getDictionary(currentLang)

  // Otomatis batalkan pemesanan PENDING yang telah melewati batas 60 menit
  const now = new Date()
  await prisma.booking.updateMany({
    where: {
      propertyId: resolvedParams.id,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      expiresAt: { lt: now }
    },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'EXPIRED',
      cancelReason: 'Waktu pembayaran telah kedaluwarsa (60 menit)'
    }
  })

  const property = await prisma.property.findUnique({
    where: { id: resolvedParams.id },
    include: {
      host: true,
      bookings: {
        where: { 
          status: { not: 'CANCELLED' },
          paymentStatus: { notIn: ['FAILED', 'CANCELLED', 'EXPIRED'] }
        },
        select: { startDate: true, endDate: true }
      },
      blockedDates: {
        select: { startDate: true, endDate: true, reason: true }
      },
      reviews: {
        include: { guest: true }
      },
      favorites: {
        where: { userId: session?.user?.id || 'none' }
      }
    }
  })

  if (!property) notFound()

  const isOwner = session?.user?.id === property.hostId
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  // Proteksi Konsumen: Listing berstatus draft / belum publish hanya dapat dilihat oleh host pemilik dan admin
  if (!property.isPublished && !isOwner && !isAdmin) {
    notFound()
  }
  
  const isFavorited = property.favorites.length > 0
  const isGuest = session?.user && (session.user as any).role === 'GUEST'

  // Avg rating
  const avgRating = property.reviews.length > 0 
    ? (property.reviews.reduce((acc, r) => acc + r.rating, 0) / property.reviews.length).toFixed(1)
    : t.newListing || (currentLang === "en" ? "New" : "Baru")

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      {!property.isPublished && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {currentLang === "en" ? "Draft Mode - Pending Host KYC Verification" : "Mode Draft - Menunggu Verifikasi KYC Host"}
            </p>
            <p className="text-amber-700 dark:text-amber-300/80 leading-relaxed">
              {currentLang === "en"
                ? "This property is currently hidden from public search and cannot be booked by guests until the host's identity (KTP) is approved by Admin."
                : "Properti ini saat ini disembunyikan dari pencarian publik dan belum bisa dipesan oleh tamu hingga identitas KTP host disetujui oleh Admin."}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{property.title}</h1>
        <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100"><Star className="h-3.5 w-3.5 fill-current text-yellow-400" /> {avgRating} ({property.reviews.length} {t.reviewsCount})</span>
          <span>•</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {property.address}</span>
        </div>
      </div>

      <div className="w-full aspect-video sm:h-[420px] lg:h-[480px] xl:h-[520px] rounded-2xl overflow-hidden relative shadow-2xs">
        {isGuest && (
          <FavoriteButton propertyId={property.id} initialIsFavorited={isFavorited} isLoggedIn={!!session?.user} className="absolute top-3 right-3 z-10" />
        )}
        {property.imageUrls.length > 0 ? (
          <div className="flex h-full gap-2">
             <img src={property.imageUrls[0]} alt={property.title} className="object-cover w-2/3 h-full rounded-l-2xl" />
             <div className="flex flex-col gap-2 w-1/3 h-full">
               <img src={property.imageUrls[1] || property.imageUrls[0]} className="object-cover w-full h-1/2 rounded-tr-2xl" />
               <img src={property.imageUrls[2] || property.imageUrls[0]} className="object-cover w-full h-1/2 rounded-br-2xl" />
             </div>
          </div>
        ) : (
          <img 
            src={`https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200`} 
            alt={property.title}
            className="object-cover w-full h-full"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <section className="flex justify-between items-center pb-4 border-b border-gray-150 dark:border-gray-800">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t.hostedBy} {property.host.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> 
                <span>{property.maxGuests} {t.guests}</span>
              </div>
            </div>
            <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
              <AvatarImage src={property.host.image || ""} />
              <AvatarFallback>{property.host.name?.charAt(0) || "H"}</AvatarFallback>
            </Avatar>
          </section>

          <section className="pb-4 border-b border-gray-150 dark:border-gray-800 space-y-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.aboutSpace}</h3>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{property.description}</p>
          </section>

          {/* Amenities & Facilities Section */}
          <section className="pb-4 border-b border-gray-150 dark:border-gray-800 space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.amenities}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.amenitiesDesc}</p>
            </div>

            {property.amenities && property.amenities.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-1">
                {property.amenities.map((amenityId: string) => {
                  const item = getAmenityById(amenityId)
                  const IconComp = item.icon
                  const label = (item.label as any)[currentLang] || item.label.id
                  return (
                    <div 
                      key={amenityId} 
                      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 hover:border-gray-200 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t.noAmenitiesListed}</p>
            )}
          </section>

          {/* Cancellation Policy Section */}
          <section className="pb-4 border-b border-gray-150 dark:border-gray-800 space-y-2.5">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t.cancellationPolicyLabel || "Kebijakan Pembatalan"}</h3>
            <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded">
                  {property.cancellationPolicy || "FLEXIBLE"}
                </span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {property.cancellationPolicy === "MODERATE" ? "Moderate Policy" : property.cancellationPolicy === "STRICT" ? "Strict Policy" : "Flexible Policy"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {property.cancellationPolicy === "MODERATE" 
                  ? t.policyModerateDesc 
                  : property.cancellationPolicy === "STRICT" 
                    ? t.policyStrictDesc 
                    : t.policyFlexibleDesc}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-yellow-400" /> 
              <span>{avgRating} · {property.reviews.length} {t.reviewsCount}</span>
            </h3>
            
            {property.reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-150 dark:border-gray-800">{t.noReviews}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {property.reviews.map(review => {
                  const getDisplayName = (guest: any) => {
                    if (!guest?.name) return currentLang === "en" ? "Guest Traveler" : "Tamu Ruang Rehat"
                    if (guest.hideLastNameReview) {
                      const parts = guest.name.trim().split(/\s+/)
                      if (parts.length > 1) {
                        return `${parts[0]} ${parts[parts.length - 1][0]}.`
                      }
                      return parts[0]
                    }
                    return guest.name
                  }

                  return (
                    <Card key={review.id} className="border border-gray-150 dark:border-gray-800 shadow-2xs bg-gray-50/70 dark:bg-gray-800/40 rounded-xl">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.guest.image || ""} />
                            <AvatarFallback>{review.guest.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-gray-100">{getDisplayName(review.guest)}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID")}</p>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{review.comment}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20">
          <BookingClient 
            property={property} 
            sessionUser={session?.user} 
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            t={t}
          />
        </div>
      </div>
    </div>
  )
}
