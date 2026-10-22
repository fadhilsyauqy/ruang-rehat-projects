import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import HostDashboardView from "./HostDashboardView"

export const metadata = {
  title: "Dashboard - Ruang Rehat",
  description: "Kelola properti sewa, pantau reservasi masuk, dan riwayat perjalanan Anda.",
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; propertyId?: string }>
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/signin")
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get('lang')?.value || 'id'
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR'
  const t = getDictionary(currentLang)

  const role = (session.user as any).role

  // Pemeliharaan otomatis transaksi:
  // 1. Batalkan booking PENDING yang telah melewati waktu expiresAt (60 menit)
  const now = new Date()
  await prisma.booking.updateMany({
    where: {
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

  // 2. Otomatis rilis escrow (HELD -> RELEASED) setelah 24 jam check-in untuk booking PAID & CONFIRMED/COMPLETED
  const releaseThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  await prisma.booking.updateMany({
    where: {
      paymentStatus: 'PAID',
      escrowStatus: 'HELD',
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      startDate: { lte: releaseThreshold }
    },
    data: {
      escrowStatus: 'RELEASED'
    }
  })

  // 3. Otomatis selesaikan pesanan (CONFIRMED -> COMPLETED) jika tanggal check-out (endDate) telah lewat
  await prisma.booking.updateMany({
    where: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      endDate: { lte: now }
    },
    data: {
      status: 'COMPLETED'
    }
  })

  const myBookings = await prisma.booking.findMany({
    where: { guestId: session.user.id! },
    include: { property: true, reviews: true },
    orderBy: { createdAt: 'desc' }
  })

  const userFavorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          price: true,
          address: true,
          imageUrls: true,
          category: true
        }
      }
    },
    take: 4
  })

  const myProperties = role === 'HOST' ? await prisma.property.findMany({
    where: { hostId: session.user.id },
    include: { bookings: true, blockedDates: true },
    orderBy: { createdAt: 'desc' }
  }) : []

  const initialBlockedDates = role === 'HOST' ? await prisma.blockedDate.findMany({
    where: { property: { hostId: session.user.id } },
    include: { property: { select: { id: true, title: true } } },
    orderBy: { startDate: 'asc' }
  }) : []

  const incomingBookings = role === 'HOST' ? await prisma.booking.findMany({
    where: { property: { hostId: session.user.id } },
    include: { property: true, guest: true },
    orderBy: { createdAt: 'desc' }
  }) : []

  const initialBankAccount = role === 'HOST' ? await prisma.hostBankAccount.findUnique({
    where: { userId: session.user.id }
  }) : null

  const initialPayouts = role === 'HOST' ? await prisma.payout.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  }) : []

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      address: true,
      kycStatus: true,
      idCardUrl: true,
      idCardNumber: true,
      kycRejectReason: true,
      role: true
    }
  })

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100">
            {t.dashboard}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {role === 'HOST' 
              ? t.dashboardHostSubtitle
              : t.dashboardGuestSubtitle
            }
          </p>
        </div>
      </div>

      <HostDashboardView
        role={role}
        currentUser={currentUser}
        myProperties={myProperties}
        incomingBookings={incomingBookings}
        myBookings={myBookings}
        userFavorites={userFavorites}
        initialBlockedDates={initialBlockedDates}
        initialBankAccount={initialBankAccount}
        initialPayouts={initialPayouts}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
        t={t}
        defaultTab={resolvedSearchParams.tab}
        targetPropertyId={resolvedSearchParams.propertyId}
      />
    </div>
  )
}
