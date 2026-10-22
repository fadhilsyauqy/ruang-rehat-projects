import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

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
  
  if (!session || !session.user || (session.user as any).role !== 'HOST') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check ownership
    const existing = await prisma.property.findUnique({ where: { id: resolvedParams.id } })
    if (!existing || existing.hostId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const { price, pricePerNight, cleaningFee, maxStayNights, ...rest } = data

    const finalPricePerNight = pricePerNight !== undefined
      ? Math.round(Number(pricePerNight))
      : (price !== undefined ? Math.round(Number(price) * 18051) : undefined)
    const finalCleaningFee = cleaningFee !== undefined ? Math.round(Number(cleaningFee)) : undefined
    const finalPriceUsd = finalPricePerNight !== undefined ? Math.round((finalPricePerNight / 18051) * 100) / 100 : undefined

    const updatePayload: any = {
      ...rest,
      ...(finalPricePerNight !== undefined ? { pricePerNight: finalPricePerNight, price: finalPriceUsd } : {}),
      ...(finalCleaningFee !== undefined ? { cleaningFee: finalCleaningFee } : {}),
      ...(maxStayNights !== undefined ? { maxStayNights: Number(maxStayNights) } : {}),
    }

    const property = await prisma.property.update({
      where: { id: resolvedParams.id },
      data: updatePayload
    })
    
    return NextResponse.json(property)
  } catch {
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await auth()
  
  if (!session || !session.user || (session.user as any).role !== 'HOST') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check ownership
    const existing = await prisma.property.findUnique({ where: { id: resolvedParams.id } })
    if (!existing || existing.hostId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.property.delete({
      where: { id: resolvedParams.id }
    })
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 })
  }
}
