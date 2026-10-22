import React from "react"
import Link from "next/link"
import { BadgeCheck, User, Heart, ArrowRight, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"

export interface GuestTravelerSidebarProps {
  currentUser: {
    name?: string | null
    email?: string | null
    [key: string]: unknown
  } | null
  completedTripsCount: number
  reviewedTripsCount: number
  userFavorites: Array<{
    id: string
    property?: {
      id: string
      title: string
      address: string
      imageUrls: string[]
      price?: number | null
      pricePerNight?: number | null
    } | null
  }>
  currentCurrency?: string
  currentLang?: string
}

export default function GuestTravelerSidebar({
  currentUser,
  completedTripsCount,
  reviewedTripsCount,
  userFavorites,
  currentCurrency = "IDR",
  currentLang = "id",
}: GuestTravelerSidebarProps) {
  return (
    <div className="space-y-5">
      {/* Widget 1: Kartu Profil Pelancong (Traveler Passport) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "T"}
          </div>
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {currentUser?.name ||
                  (currentLang === "en" ? "Guest Traveler" : "Tamu Ruang Rehat")}
              </h4>
              <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {currentUser?.email || ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              {currentLang === "en" ? "Completed Stays" : "Selesai Menginap"}
            </span>
            <span className="text-lg font-black text-gray-900 dark:text-gray-100">
              {completedTripsCount}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              {currentLang === "en" ? "Reviews Given" : "Ulasan Diberi"}
            </span>
            <span className="text-lg font-black text-amber-500">
              {reviewedTripsCount}
            </span>
          </div>
        </div>

        <Link
          href="/profile"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full rounded-2xl text-xs font-bold border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-1.5"
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span>
            {currentLang === "en"
              ? "Manage Profile & Security"
              : "Kelola Profil & Keamanan"}
          </span>
        </Link>
      </div>

      {/* Widget 2: Destinasi Impian Tersimpan (Wishlist Preview) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Wishlist Destinasi" : "Destinasi Favorit"}
            </h4>
          </div>
          <Link
            href="/wishlists"
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
          >
            <span>{currentLang === "en" ? "View all" : "Semua"}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {userFavorites && userFavorites.length > 0 ? (
          <div className="space-y-3">
            {userFavorites.slice(0, 3).map((fav) => {
              const priceVal =
                fav.property?.pricePerNight && fav.property.pricePerNight > 0
                  ? fav.property.pricePerNight
                  : fav.property?.price
                  ? fav.property.price * 18051
                  : 0

              return (
                <Link
                  key={fav.id}
                  href={`/properties/${fav.property?.id}`}
                  className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <img
                    src={
                      fav.property?.imageUrls?.[0] ||
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=200"
                    }
                    alt={fav.property?.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-rose-500 transition-colors">
                      {fav.property?.title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {fav.property?.address}
                    </p>
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200 mt-0.5 block">
                      {formatPrice(priceVal, currentCurrency)}{" "}
                      <span className="font-normal text-muted-foreground">
                        / malam
                      </span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 text-center space-y-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              {currentLang === "en"
                ? "Save places you love by clicking the heart icon on listings."
                : "Simpan vila impian Anda dengan menekan ikon hati pada listing properti."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600"
            >
              <span>
                {currentLang === "en" ? "Explore listings" : "Jelajahi Properti"}
              </span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Widget 3: Perlindungan SafeStay & Escrow Midtrans */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-rose-500/5 via-transparent to-indigo-500/5 border border-rose-500/20 dark:border-rose-500/10 space-y-3.5">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <ShieldCheck className="w-5 h-5" />
          <h4 className="text-sm font-bold">
            {currentLang === "en"
              ? "Ruang Rehat SafeStay™"
              : "Jaminan Perlindungan Tamu"}
          </h4>
        </div>

        <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-gray-900 dark:text-gray-100 font-semibold">
                {currentLang === "en"
                  ? "Escrow Protection:"
                  : "Rekening Escrow Aman:"}
              </strong>{" "}
              {currentLang === "en"
                ? "Your payment is held securely by Midtrans and only released to the host 24 hours after successful check-in."
                : "Dana sewa ditahan aman di penampungan resmi Midtrans dan baru diteruskan ke Host 24 jam setelah Anda sukses check-in."}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-gray-900 dark:text-gray-100 font-semibold">
                {currentLang === "en"
                  ? "Transparent Cancellation:"
                  : "Kepastian Kebijakan Refund:"}
              </strong>{" "}
              {currentLang === "en"
                ? "Guaranteed refunds based on property policy before the check-in deadline."
                : "Pengembalian dana otomatis sesuai matriks kebijakan pembatalan properti sebelum jadwal check-in."}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-gray-900 dark:text-gray-100 font-semibold">
                {currentLang === "en" ? "24/7 Support:" : "Bantuan Tamu 24 Jam:"}
              </strong>{" "}
              {currentLang === "en"
                ? "Contact customer support if host is unreachable during check-in."
                : "Tim dukungan pelanggan siap sedia membantu jika Anda mengalami kendala saat tiba di lokasi."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
