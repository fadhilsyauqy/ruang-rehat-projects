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

    // Cek status KYC user saat ini
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { kycStatus: true, role: true }
    })

    const isHostVerified = currentUser?.kycStatus === 'VERIFIED'

    const pricePerNight = data.pricePerNight !== undefined
      ? Math.round(Number(data.pricePerNight))
      : Math.round(Number(data.price || 0) * 18051)
    const cleaningFee = Math.round(Number(data.cleaningFee || 0))
    const priceUsd = Math.round((pricePerNight / 18051) * 100) / 100
    const maxStayNights = Number(data.maxStayNights) || 28

    const property = await prisma.property.create({
      data: {
        ...data,
        pricePerNight,
        cleaningFee,
        price: priceUsd,
        maxStayNights,
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
