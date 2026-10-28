"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { AlertOctagon, RotateCw, Home } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Critical root application error caught by GlobalError:", error)
  }, [error])

  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full text-center space-y-6 p-8 bg-white rounded-3xl border border-gray-200 shadow-md">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-gray-900">
              Terjadi Kesalahan Sistem Kritis
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Platform mengalami gangguan fatal sementara. Silakan coba muat
              ulang aplikasi atau kembali ke beranda utama.
            </p>
            {error?.digest && (
              <p className="text-[10px] font-mono text-gray-400">
                Ref: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold px-4 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
