import Link from "next/link"
import { Compass, Home, Search } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 flex items-center justify-center text-rose-500 shadow-sm">
          <Compass className="w-12 h-12 stroke-[1.5] animate-pulse" />
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-xs">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Maaf, halaman atau penginapan yang Anda tuju tidak tersedia, telah
            dipindahkan, atau tautan yang Anda masukkan salah.
          </p>
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
            <span>Jelajahi Properti</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
