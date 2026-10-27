import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') // in km

  try {
    let properties;

    if (lat && lng && radius) {
      // Basic bounding box search for simplicity
      const latFloat = parseFloat(lat);
      const lngFloat = parseFloat(lng);
      const radiusFloat = parseFloat(radius);
      // Rough conversion: 1 degree is ~111km
      const latDelta = radiusFloat / 111.0;
      const lngDelta = radiusFloat / (111.0 * Math.cos(latFloat * (Math.PI / 180)));

      properties = await prisma.property.findMany({
        where: {
          isPublished: true, // Proteksi Konsumen: Hanya properti terverifikasi yang tampil
          latitude: {
            gte: latFloat - latDelta,
            lte: latFloat + latDelta,
          },
          longitude: {
            gte: lngFloat - lngDelta,
            lte: lngFloat + lngDelta,
          }
        },
        include: {
          reviews: true
        }
      });
    } else {
      properties = await prisma.property.findMany({
        where: {
          isPublished: true // Proteksi Konsumen
        },
        include: {
          reviews: true
        }
      });
    }

    return NextResponse.json(properties)
  } catch {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
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

    if (!title || !description || !address) {
      return NextResponse.json({ error: "Judul, deskripsi, dan alamat properti wajib diisi." }, { status: 400 })
    }

    // Cek status KYC user saat ini
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true, role: true }
    })

    const isHostVerified = currentUser?.kycStatus === 'VERIFIED'

    const finalPricePerNight = pricePerNight !== undefined
      ? Math.round(Number(pricePerNight))
      : Math.round(Number(price || 0) * 18051)
    const finalCleaningFee = Math.round(Number(cleaningFee || 0))
    const priceUsd = Math.round((finalPricePerNight / 18051) * 100) / 100
    const finalMaxStayNights = Number(maxStayNights) || 28
    const finalImages = Array.isArray(imageUrls) 
      ? imageUrls.filter((img): img is string => typeof img === "string") 
      : (Array.isArray(images) ? images.filter((img): img is string => typeof img === "string") : [])
    const finalAmenities = Array.isArray(amenities)
      ? amenities.filter((a): a is string => typeof a === "string")
      : []
    const finalPolicy = cancellationPolicy && ["FLEXIBLE", "MODERATE", "STRICT"].includes(cancellationPolicy)
      ? cancellationPolicy
      : "FLEXIBLE"

    const property = await prisma.property.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        category: String(category || "Villa").trim(),
        address: String(address).trim(),
        latitude: typeof latitude === "number" && !isNaN(latitude) ? latitude : 0,
        longitude: typeof longitude === "number" && !isNaN(longitude) ? longitude : 0,
        maxGuests: Math.max(1, Math.round(Number(maxGuests) || 1)),
        amenities: finalAmenities,
        imageUrls: finalImages,
        cancellationPolicy: finalPolicy,
        pricePerNight: finalPricePerNight,
        cleaningFee: finalCleaningFee,
        price: priceUsd,
        maxStayNights: finalMaxStayNights,
        hostId: session.user.id,
        // Model Hybrid: Jika host belum terverifikasi KYC, properti disimpan sebagai DRAFT (isPublished: false)
        isPublished: isHostVerified
      }
    })
    
    // Otomatis upgrade role pengguna menjadi HOST begitu mendaftarkan properti pertama
    if (currentUser?.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: 'HOST' }
      })
    }

    return NextResponse.json({
      ...property,
      hostKycStatus: currentUser?.kycStatus || 'UNVERIFIED',
      isDraft: !isHostVerified
    })
  } catch (error) {
    console.error("Create property error:", error)
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
  }
}
