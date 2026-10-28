"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, CalendarDays, Lock, Clock, Users, ArrowLeft, RotateCw } from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/format"
import { calculateStayNights, formatWibDate } from "@/lib/date-standards"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import type { Dictionary } from "@/lib/dictionary"
import type { Prisma } from "@prisma/client"

export type CheckoutBooking = Prisma.BookingGetPayload<{
  include: { property: true }
}>

export default function CheckoutClient({ 
  booking, 
  token,
  currentCurrency = 'IDR',
  currentLang = 'id',
  t
}: { 
  booking: CheckoutBooking, 
  token: string,
  currentCurrency?: string,
  currentLang?: string,
  t: Dictionary
}) {
  const router = useRouter()
  const [isPaid, setIsPaid] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [isExpired, setIsExpired] = useState(() => {
    return (
      booking.status === 'CANCELLED' || 
      booking.paymentStatus === 'EXPIRED' ||
      (booking.expiresAt ? new Date(booking.expiresAt).getTime() <= Date.now() : false)
    )
  })
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!booking.expiresAt) return 3600
    const diff = Math.floor((new Date(booking.expiresAt).getTime() - Date.now()) / 1000)
    return diff > 0 ? diff : 0
  })

  // Timer countdown 60-menit
  useEffect(() => {
    if (isExpired || isPaid) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isExpired, isPaid])

  const handleSyncStatus = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/payment/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || (currentLang === "en" ? "Failed to verify status" : "Gagal memverifikasi status pembayaran"))
      }

      if (data.paymentStatus === "PAID") {
        setIsPaid(true)
        toast({
          variant: "success",
          title: t.paymentSuccess || (currentLang === "en" ? "Payment Successful" : "Pembayaran Berhasil!"),
          description: data.message || (currentLang === "en" ? "Your payment has been verified successfully." : "Pembayaran Anda berhasil diverifikasi."),
        })
        setTimeout(() => {
          router.push("/dashboard?tab=trips")
          router.refresh()
        }, 2000)
      } else {
        toast({
          variant: "info",
          title: t.paymentPendingTitle || (currentLang === "en" ? "Payment Pending" : "Status Pembayaran"),
          description: data.message || (currentLang === "en" ? "Payment not yet detected. Please finish your transfer." : "Pembayaran belum terdeteksi. Silakan selesaikan pembayaran."),
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Status Check Failed" : "Gagal Memeriksa Pembayaran",
        description: error.message || (currentLang === "en" ? "Could not verify payment status." : "Terjadi kesalahan saat memeriksa pembayaran."),
      })
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    if (isExpired) return
    let snapInstance: { hide?: () => void } | null = null

    // Inisialisasi Midtrans Snap "Embed" mode (Bukan pop-up)
    const initSnap = () => {
      if (window.snap && !snapInstance) {
        snapInstance = window.snap.embed(token, {
          embedId: 'snap-container',
          onSuccess: async function () {
            setIsPaid(true)
            try {
              await fetch('/api/payment/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking.id }),
              })
            } catch (syncErr) {
              console.error('Auto sync error:', syncErr)
            }
            setTimeout(() => {
              router.push('/dashboard?tab=trips')
              router.refresh()
            }, 2500)
          },
          onPending: function () {
            setSyncing(false)
            toast({
              variant: "info",
              title: t.paymentPendingTitle || (currentLang === "en" ? "Payment Pending" : "Menunggu Pembayaran"),
              description: t.paymentPendingDesc || (currentLang === "en"
                ? "Your booking is saved. Please complete payment according to instructions before time expires."
                : "Pesanan Anda tersimpan. Silakan selesaikan pembayaran sesuai petunjuk metode yang dipilih sebelum batas waktu berakhir."),
            })
            router.push('/dashboard?tab=trips')
          },
          onError: function () {
            setSyncing(false)
            toast({
              variant: "destructive",
              title: t.paymentFailed || (currentLang === "en" ? "Payment Failed" : "Pembayaran Gagal"),
              description: currentLang === "en"
                ? "Payment could not be completed. Please choose another payment method or retry."
                : "Pembayaran tidak dapat diselesaikan. Silakan coba metode pembayaran lain atau ulangi proses.",
            })
          },
          onClose: function () {
            setSyncing(false)
            toast({
              variant: "warning",
              title: t.paymentIncompleteTitle || (currentLang === "en" ? "Payment Incomplete" : "Pembayaran Belum Selesai"),
              description: t.paymentIncompleteDesc || (currentLang === "en"
                ? "Payment has not been completed. You can resume payment within 60 minutes via this page or My Trips in Dashboard."
                : "Pembayaran belum diselesaikan. Anda dapat melanjutkan pembayaran dalam 60 menit melalui halaman ini atau menu Perjalanan Saya di Dasbor."),
            })
          }
        })
      }
    }

    if (window.snap) {
      initSnap()
    } else {
      const timer = setTimeout(initSnap, 1000)
      return () => clearTimeout(timer)
    }

    return () => {
      if (window.snap && typeof window.snap.hide === 'function') {
        try {
          window.snap.hide()
        } catch {}
      }
    }
  }, [token, router, t, isExpired, currentLang, booking.id])

  // Format detik menjadi mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (isPaid) {
    return (
      <div className="max-w-3xl mx-auto p-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t.paymentSuccess}</h1>
        <p className="text-muted-foreground">{t.paymentConfirmedFor} <strong>{booking.property.title}</strong>.</p>
        <p className="text-sm text-gray-500 animate-pulse">{t.redirectingDashboard}</p>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="max-w-xl mx-auto p-6 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-rose-200 dark:border-rose-900">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t.paymentExpired || "Waktu Pembayaran Telah Habis"}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t.paymentExpiredDesc || "Batas waktu pembayaran 60 menit telah kedaluwarsa dan slot tanggal telah dibuka kembali untuk pemesan lain."}
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/properties/${booking.propertyId}`}>
            <Button className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.rebookProperty || "Pesan Ulang Properti"}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              {t.dashboard || "Ke Dashboard"}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const diffDays = booking.totalNights || calculateStayNights(booking.startDate, booking.endDate)
  const nightlyRate = booking.nightlyRateIdr || (booking.property.pricePerNight || Math.round((booking.property.price || 0) * 18051))
  const cleaningFee = (booking.cleaningFeeIdr ?? 0) > 0 ? booking.cleaningFeeIdr! : 0
  const serviceFee = (booking.guestServiceFeeIdr ?? 0) > 0 ? booking.guestServiceFeeIdr! : Math.round((nightlyRate * diffDays + cleaningFee) * 0.10)
  const finalTotalPrice = booking.totalPriceIdr || (booking.totalPrice ? Math.round(booking.totalPrice * 18051) : (nightlyRate * diffDays + cleaningFee + serviceFee))
  const policy = booking.property.cancellationPolicy || "FLEXIBLE"

  const getPolicyDescription = () => {
    if (policy === "FLEXIBLE") return t.policyFlexibleDesc
    if (policy === "MODERATE") return t.policyModerateDesc
    if (policy === "STRICT") return t.policyStrictDesc
    return t.policyFlexibleDesc
  }

  return (
    <div className="max-w-5xl mx-auto p-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Kolom Kiri: Rincian Booking */}
        <div className="space-y-8">
          <div>
            <Link href={`/properties/${booking.propertyId}`} className="text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-2 mb-6">
              ← {t.back}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t.confirmAndPay}</h1>
            <p className="text-muted-foreground flex items-center gap-2"><Lock className="h-4 w-4" /> {t.paymentSecure}</p>
          </div>

          {/* Sisa Waktu Pembayaran Banner */}
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  {t.paymentTimeRemaining || "Sisa Waktu Pembayaran"}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {currentLang === "en" ? "Hold duration: 60 minutes" : "Kunci tanggal berlaku 60 menit"}
                </p>
              </div>
            </div>
            <div className="text-2xl font-mono font-bold tracking-tight bg-white dark:bg-amber-900/60 px-3 py-1 rounded-lg border border-amber-300 dark:border-amber-700">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Quick Payment Status Check */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {t.alreadyTransferredPrompt || (currentLang === "en" ? "Already transferred via ATM or m-Banking?" : "Sudah transfer lewat ATM atau m-Banking?")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {currentLang === "en" ? "Check real-time payment status immediately." : "Periksa pembaruan status pembayaran secara instan."}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={handleSyncStatus}
              className="rounded-xl text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1.5 h-9 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
              <span>{syncing ? (t.checkingPaymentStatus || (currentLang === "en" ? "Checking..." : "Memeriksa...")) : (t.checkPaymentStatus || (currentLang === "en" ? "Check Status" : "Cek Status"))}</span>
            </Button>
          </div>

          <Card className="overflow-hidden border-gray-200 dark:border-gray-800">
            <div className="flex gap-4 p-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <img 
                src={booking.property.imageUrls[0] || `https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=200`} 
                alt={booking.property.title} 
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex flex-col justify-center">
                <h3 className="font-bold text-lg">{booking.property.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {booking.property.address}</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-lg">{t.tripDetails}</h4>
                <div className="flex items-start gap-4">
                  <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t.dates}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatWibDate(booking.startDate, currentLang === "en" ? "en" : "id")} (14:00) – {formatWibDate(booking.endDate, currentLang === "en" ? "en" : "id")} (12:00 WIB)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{t.who || "Tamu"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.guestsCount || 1} {t.guests}
                    </p>
                  </div>
                </div>
              </div>

              {/* Kebijakan Pembatalan Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-900/70 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded">
                    {policy}
                  </span>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {t.cancellationPolicyLabel || "Kebijakan Pembatalan"}
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {getPolicyDescription()}
                </p>
              </div>

              <div className="border-t dark:border-gray-800 pt-6 space-y-3">
                <h4 className="font-bold text-lg">{t.orderBreakdown}</h4>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{formatPrice(nightlyRate, currentCurrency)} x {diffDays} {t.night}</span>
                  <span>{formatPrice(nightlyRate * diffDays, currentCurrency)}</span>
                </div>
                {cleaningFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{t.cleaningFee || "Biaya Kebersihan"}</span>
                    <span>{formatPrice(cleaningFee, currentCurrency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{t.serviceFee}</span>
                  <span>{formatPrice(serviceFee, currentCurrency)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl text-gray-900 dark:text-gray-100 border-t dark:border-gray-800 pt-4">
                  <span>{t.totalPayment}</span>
                  <span>{formatPrice(finalTotalPrice, currentCurrency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Container Pembayaran Midtrans (Embed) */}
        <div>
          <h2 className="text-2xl font-bold mb-6">{t.paymentMethod}</h2>
          <div 
            id="snap-container" 
            className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden min-h-[500px]"
          >
            {/* Midtrans UI akan di-inject ke dalam div ini */}
          </div>
        </div>

      </div>
    </div>
  )
}
