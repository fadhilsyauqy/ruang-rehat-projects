import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Heart } from "lucide-react"
import FavoriteButton from "@/components/FavoriteButton"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import { formatPrice } from "@/lib/format"

export default async function WishlistsPage() {
  const session = await auth()
  
  if (!session || !session.user || session.user.role !== 'GUEST') {
    redirect("/dashboard")
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get('lang')?.value || 'id'
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR'
  const t = getDictionary(currentLang)

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id! },
    include: { property: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-150 dark:border-gray-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.wishlists}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t.wishlistsDesc}</p>
        </div>
        {favorites.length > 0 && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 self-start sm:self-center">
            {favorites.length} {currentLang === 'en' ? (favorites.length === 1 ? 'Saved stay' : 'Saved stays') : 'Properti tersimpan'}
          </span>
        )}
      </div>

      {favorites.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <CardContent className="flex flex-col items-center justify-center py-14 sm:py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-400 flex items-center justify-center">
              <Heart className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {currentLang === 'en' ? 'No saved stays yet' : 'Belum ada penginapan tersimpan'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t.wishlistsEmpty}</p>
            </div>
            <Link href="/" className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 shadow-xs transition-all active:scale-95">
              {t.startExplore}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {favorites.map(fav => (
            <Link href={`/properties/${fav.propertyId}`} key={fav.id} className="block relative group">
              <Card className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-2xs hover:shadow-md transition-all">
                <div className="aspect-[16/11] bg-gray-100 dark:bg-gray-800 overflow-hidden relative">
                  <img 
                    src={fav.property.imageUrls[0] || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400&h=300`} 
                    alt={fav.property.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                  <FavoriteButton propertyId={fav.propertyId} initialIsFavorited={true} isLoggedIn={true} className="absolute top-2.5 right-2.5 z-10" />
                </div>
                <CardContent className="p-3.5 space-y-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-rose-500 transition-colors">
                    {fav.property.title}
                  </h3>
                  <div className="flex items-center text-muted-foreground text-xs gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{fav.property.address}</span>
                  </div>
                  <div className="pt-1 flex items-baseline gap-1 border-t border-gray-100 dark:border-gray-800/60">
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-gray-100">{formatPrice(fav.property.pricePerNight || (fav.property.price ? fav.property.price * 18051 : 0), currentCurrency)}</span>
                    <span className="text-muted-foreground text-[10px]">/ {t.night}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
