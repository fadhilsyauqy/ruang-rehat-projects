import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const property = await prisma.property.findUnique({
      where: { id: resolvedParams.id },
      include: {
        host: {
          select: { name: true, image: true }
        },
        reviews: {
          include: { guest: { select: { name: true, image: true } } }
        },
        bookings: {
          select: { startDate: true, endDate: true } // For availability calendar
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch {
    return NextResponse.json({ error: "Failed to fetch property" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth()
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRole = (session.user as { role?: string }).role
  const isAdmin = userRole === "ADMIN"

  try {
    // Check ownership
    const existing = await prisma.property.findUnique({ where: { id: resolvedParams.id } })
    if (!existing) {
      return NextResponse.json({ error: "Properti tidak ditemukan" }, { status: 404 })
    }

    if (existing.hostId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki hak akses untuk mengubah properti ini." }, { status: 403 })
    }

    const data = await req.json()
    // Task 6.1: Explicit destructuring & whitelist field (Hapus spread operator ...rest)
    // Cegah manipulasi field terproteksi seperti hostId, cancellationCount, isPublished, dan id
    const {
      title,
      description,
      category,
      address,
      latitude,
      longitude,
      maxGuests,
      amenities,
      imageUrls,
      images,
      cancellationPolicy,
      pricePerNight,
      price,
      cleaningFee,
      maxStayNights,
    } = data

    const updatePayload: Prisma.PropertyUpdateInput = {}

    if (typeof title === "string" && title.trim()) {
      updatePayload.title = title.trim()
    }

    if (typeof description === "string" && description.trim()) {
      updatePayload.description = description.trim()
    }

    if (typeof category === "string" && category.trim()) {
      updatePayload.category = category.trim()
    }

    if (typeof address === "string" && address.trim()) {
      updatePayload.address = address.trim()
    }

    if (typeof latitude === "number" && !isNaN(latitude)) {
      updatePayload.latitude = latitude
    }

    if (typeof longitude === "number" && !isNaN(longitude)) {
      updatePayload.longitude = longitude
    }

    if (maxGuests !== undefined) {
      const parsedGuests = Math.round(Number(maxGuests))
      if (parsedGuests >= 1) {
        updatePayload.maxGuests = parsedGuests
      }
    }

    if (Array.isArray(amenities)) {
      updatePayload.amenities = amenities.filter((a): a is string => typeof a === "string")
    }

    const finalImages = Array.isArray(imageUrls) ? imageUrls : (Array.isArray(images) ? images : undefined)
    if (finalImages) {
      updatePayload.imageUrls = finalImages.filter((img): img is string => typeof img === "string")
    }

    if (cancellationPolicy && ["FLEXIBLE", "MODERATE", "STRICT"].includes(cancellationPolicy)) {
      updatePayload.cancellationPolicy = cancellationPolicy as "FLEXIBLE" | "MODERATE" | "STRICT"
    }

    if (pricePerNight !== undefined || price !== undefined) {
      const finalPricePerNight = pricePerNight !== undefined
        ? Math.round(Number(pricePerNight))
        : Math.round(Number(price) * 18051)

      if (finalPricePerNight > 0) {
        updatePayload.pricePerNight = finalPricePerNight
        updatePayload.price = Math.round((finalPricePerNight / 18051) * 100) / 100
      }
    }

    if (cleaningFee !== undefined) {
      const finalCleaningFee = Math.round(Number(cleaningFee))
      if (finalCleaningFee >= 0) {
        updatePayload.cleaningFee = finalCleaningFee
      }
    }

    if (maxStayNights !== undefined) {
      const finalMaxStay = Math.round(Number(maxStayNights))
      if (finalMaxStay >= 1) {
        updatePayload.maxStayNights = finalMaxStay
      }
    }

    const property = await prisma.property.update({
      where: { id: resolvedParams.id },
      data: updatePayload
    })
    
    return NextResponse.json(property)
  } catch (error) {
    console.error("Update property error:", error)
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth()
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userRole = (session.user as { role?: string }).role
  const isAdmin = userRole === "ADMIN"

  try {
    // Check ownership
    const existing = await prisma.property.findUnique({ where: { id: resolvedParams.id } })
    if (!existing) {
      return NextResponse.json({ error: "Properti tidak ditemukan" }, { status: 404 })
    }

    if (existing.hostId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki hak akses untuk menghapus properti ini." }, { status: 403 })
    }

    // Task 6.3: Validasi Kepemilikan pada Operasi Hapus Properti (DELETE)
    // Pastikan properti yang memiliki pemesanan aktif berstatus CONFIRMED atau PAID di masa mendatang tidak dapat dihapus
    const now = new Date()
    const activeBooking = await prisma.booking.findFirst({
      where: {
        propertyId: resolvedParams.id,
        status: { in: ["CONFIRMED", "PENDING"] },
        paymentStatus: "PAID",
        endDate: { gte: now }
      }
    })

    if (activeBooking) {
      return NextResponse.json({ 
        error: "Properti tidak dapat dihapus karena masih memiliki pesanan aktif atau mendatang yang telah dibayar tamu." 
      }, { status: 400 })
    }

    const disputedBooking = await prisma.booking.findFirst({
      where: {
        propertyId: resolvedParams.id,
        OR: [
          { status: "DISPUTED" },
          { escrowStatus: "DISPUTED" }
        ]
      }
    })

    if (disputedBooking) {
      return NextResponse.json({ 
        error: "Properti tidak dapat dihapus karena masih memiliki transaksi yang sedang dalam proses sengketa (Dispute)." 
      }, { status: 400 })
    }

    await prisma.property.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ success: true, message: "Properti berhasil dihapus." })
  } catch (error) {
    console.error("Delete property error:", error)
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 })
  }
}
