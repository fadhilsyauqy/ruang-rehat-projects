import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import AdminDashboardClient from "./AdminDashboardClient"

export const metadata = {
  title: "Admin Governance & Audit Portal - Ruang Rehat",
  description: "Platform oversight, host KYC audit, escrow liquidity monitoring, and payout approvals.",
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/signin?callbackUrl=/admin")
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/dashboard")
  }

  const resolvedSearch = searchParams ? await searchParams : {}
  const validTabs = ["overview", "kyc", "payouts", "disputes", "refunds", "bookings", "users", "settings"]
  const initialTab = (resolvedSearch.tab && validTabs.includes(resolvedSearch.tab))
    ? (resolvedSearch.tab as any)
    : "overview"

  const cookieStore = await cookies()
  const currentLang = cookieStore.get("lang")?.value || "id"
  const currentCurrency = cookieStore.get("currency")?.value || "IDR"
  const t = getDictionary(currentLang)

  // Ambil seluruh data ekosistem marketplace untuk audit
  const [users, bookings, payouts, properties, disputes, systemSetting] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        preferredName: true,
        email: true,
        emailVerified: true,
        image: true,
        phoneNumber: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        kycStatus: true,
        idCardUrl: true,
        idCardNumber: true,
        kycRejectReason: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        hideLastNameReview: true,
        hideSearchEngines: true,
        readReceipts: true,
        notifyTripReminder: true,
        notifyPromoMarketing: true,
        notifyHostBooking: true,
        notifyHostPayout: true,
        billingCompanyName: true,
        billingTaxId: true,
        billingAddress: true,
        bankAccount: true,
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.booking.findMany({
      include: {
        property: {
          select: { id: true, title: true, address: true, price: true, pricePerNight: true, hostId: true }
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            address: true,
            emergencyContactName: true,
            emergencyContactPhone: true,
            emergencyContactRelation: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.payout.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.property.findMany({
      include: {
        host: {
          select: { id: true, name: true, email: true }
        },
        bookings: {
          select: { id: true, status: true, paymentStatus: true, totalPrice: true, totalPriceIdr: true }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.dispute.findMany({
      include: {
        booking: {
          include: {
            property: {
              select: { id: true, title: true, address: true, hostId: true }
            },
            guest: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.systemSetting.upsert({
      where: { id: "global" },
      update: {},
      create: { id: "global" }
    })
  ])

  return (
    <div className="w-full px-3 sm:px-6 lg:px-8 2xl:px-12 py-6 min-h-screen">
      <AdminDashboardClient
        initialUsers={users}
        initialBookings={bookings}
        initialPayouts={payouts}
        initialProperties={properties}
        initialDisputes={disputes}
        initialSetting={systemSetting}
        initialTab={initialTab}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
        t={t}
      />
    </div>
  )
}
