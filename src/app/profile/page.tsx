import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import ProfileClient from "./ProfileClient"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/signin")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      preferredName: true,
      email: true,
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
      password: true,
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
      _count: {
        select: {
          bookings: true,
          properties: true,
          reviews: true,
          favorites: true,
        }
      }
    }
  })

  if (!user) {
    redirect("/signin")
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get("lang")?.value || "id"
  const currentCurrency = cookieStore.get("currency")?.value || "IDR"
  const t = getDictionary(currentLang)

  let adminStats = undefined
  if (user.role === "ADMIN") {
    const [pendingKyc, pendingPayouts, totalUsers, totalProperties] = await Promise.all([
      prisma.user.count({ where: { kycStatus: "PENDING" } }),
      prisma.payout.count({ where: { status: "PENDING" } }),
      prisma.user.count(),
      prisma.property.count()
    ])
    adminStats = {
      pendingKyc,
      pendingPayouts,
      totalUsers,
      totalProperties
    }
  }

  const sanitizedUser = {
    id: user.id,
    name: user.name,
    preferredName: user.preferredName,
    email: user.email,
    image: user.image,
    phoneNumber: user.phoneNumber,
    address: user.address,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    emergencyContactRelation: user.emergencyContactRelation,
    kycStatus: user.kycStatus,
    idCardUrl: user.idCardUrl,
    idCardNumber: user.idCardNumber,
    kycRejectReason: user.kycRejectReason,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    hasPassword: Boolean(user.password),
    hideLastNameReview: Boolean(user.hideLastNameReview),
    hideSearchEngines: Boolean(user.hideSearchEngines),
    readReceipts: Boolean(user.readReceipts ?? true),
    notifyTripReminder: Boolean(user.notifyTripReminder ?? true),
    notifyPromoMarketing: Boolean(user.notifyPromoMarketing ?? false),
    notifyHostBooking: Boolean(user.notifyHostBooking ?? true),
    notifyHostPayout: Boolean(user.notifyHostPayout ?? true),
    billingCompanyName: user.billingCompanyName || "",
    billingTaxId: user.billingTaxId || "",
    billingAddress: user.billingAddress || "",
    stats: {
      totalBookings: user._count.bookings,
      totalProperties: user._count.properties,
      totalReviews: user._count.reviews,
      totalFavorites: user._count.favorites,
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50/50 dark:bg-gray-950 py-6 lg:py-8">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileClient 
          user={sanitizedUser} 
          currentLang={currentLang} 
          currentCurrency={currentCurrency} 
          t={t}
          adminStats={adminStats} 
        />
      </div>
    </div>
  )
}
