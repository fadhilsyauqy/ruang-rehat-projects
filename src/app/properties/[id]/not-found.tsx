import Link from "next/link"
import { Building2, Home, MapPin, Search } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function PropertyNotFound() {
  const popularDestinations = [
    { name: "Bali", query: "Bali" },
    { name: "Bandung", query: "Bandung" },
    { name: "Yogyakarta", query: "Yogyakarta" },
    { name: "Jakarta", query: "Jakarta" },
  ]

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shadow-sm">
          <Building2 className="w-10 h-10 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            Akomodasi Tidak Ditemukan
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Penginapan Ini Tidak Lagi Tersedia
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Listing penginapan ini mungkin telah dihapus oleh pemiliknya, sedang
            dinonaktifkan sementara, atau tautan yang Anda buka tidak valid.
          </p>
        </div>

        {/* Destinasi Populer */}
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-left space-y-2.5 shadow-xs">
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Cari Penginapan Menarik di Destinasi Populer:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {popularDestinations.map((dest) => (
              <Link
                key={dest.name}
                href={`/?location=${encodeURIComponent(dest.query)}`}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                {dest.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-5 py-2.5 h-auto cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
            )}
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>

          <Link
            href="/?search=all"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto rounded-xl text-xs font-semibold px-5 py-2.5 h-auto cursor-pointer text-gray-700 dark:text-gray-300 inline-flex items-center justify-center gap-2"
            )}
          >
            <Search className="w-4 h-4" />
            <span>Jelajahi Semua Penginapan</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
