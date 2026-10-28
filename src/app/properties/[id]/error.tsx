"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw, Home } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function PropertyErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error loading property detail:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
          <AlertTriangle className="w-10 h-10 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gagal Memuat Detail Penginapan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Terjadi kendala saat mengambil informasi akomodasi ini dari peladen.
            Silakan coba muat ulang halaman.
          </p>
          {error?.digest && (
            <p className="text-[11px] font-mono text-gray-400 mt-1">
              Kode Error: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-5 py-2.5 h-auto cursor-pointer shadow-xs inline-flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            <span>Coba Lagi</span>
          </Button>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto rounded-xl text-xs font-semibold px-5 py-2.5 h-auto cursor-pointer text-gray-700 dark:text-gray-300 inline-flex items-center justify-center gap-2"
            )}
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
