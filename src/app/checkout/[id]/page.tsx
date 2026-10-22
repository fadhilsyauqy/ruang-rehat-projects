import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CheckoutClient from "./CheckoutClient"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"

export default async function CheckoutPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ token: string }>
}) {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/signin")
  }

  const resolvedParams = await params
  const resolvedSearch = await searchParams

  const booking = await prisma.booking.findUnique({
    where: { id: resolvedParams.id },
    include: { property: true }
  })

  if (!booking || booking.guestId !== session.user.id || !resolvedSearch.token) {
    redirect("/")
  }

  // Jika booking berstatus PENDING dan batas waktu 60 menit telah lewat, ubah status menjadi CANCELLED/EXPIRED
  if (
    booking.status === 'PENDING' &&
    booking.paymentStatus === 'PENDING' &&
    booking.expiresAt &&
    new Date(booking.expiresAt) < new Date()
  ) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: 'EXPIRED',
        cancelReason: 'Waktu pembayaran telah kedaluwarsa (60 menit)'
      }
    })
    booking.status = 'CANCELLED'
    booking.paymentStatus = 'EXPIRED'
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get('lang')?.value || 'id'
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR'
  const t = getDictionary(currentLang)

  return (
    <CheckoutClient 
      booking={booking} 
      token={resolvedSearch.token} 
      currentCurrency={currentCurrency}
      currentLang={currentLang}
      t={t}
    />
  )
}
