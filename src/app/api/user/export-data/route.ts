import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        preferredName: true,
        email: true,
        phoneNumber: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        role: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
        hideLastNameReview: true,
        hideSearchEngines: true,
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            status: true,
            paymentStatus: true,
            cancelReason: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                category: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        favorites: {
          select: {
            id: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true
              }
            }
          }
        },
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            isPublished: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const exportPayload = {
      platform: "Ruang Rehat (Airbnb Clone)",
      exportDate: new Date().toISOString(),
      compliance: "Undang-Undang Perlindungan Data Pribadi (UU PDP) & GDPR Data Portability",
      userProfile: {
        id: user.id,
        name: user.name,
        preferredName: user.preferredName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        emergencyContact: {
          name: user.emergencyContactName,
          phone: user.emergencyContactPhone,
          relation: user.emergencyContactRelation
        },
        role: user.role,
        kycStatus: user.kycStatus,
        privacyPreferences: {
          hideLastNameReview: user.hideLastNameReview,
          hideSearchEngines: user.hideSearchEngines
        },
        accountCreatedAt: user.createdAt,
        accountUpdatedAt: user.updatedAt
      },
      reservations: user.bookings,
      reviewsGiven: user.reviews,
      savedFavorites: user.favorites,
      ownedProperties: user.role === "HOST" ? user.properties : undefined
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="ruang-rehat-data-export-${user.id}.json"`
      }
    })
  } catch (error: any) {
    console.error("Export data error:", error)
    return NextResponse.json({ error: error?.message || "Failed to export data" }, { status: 500 })
  }
}
