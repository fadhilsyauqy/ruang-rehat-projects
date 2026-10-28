import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location')

  try {
    const where: Prisma.PropertyWhereInput = {
      isPublished: true
    }
    if (location && location.trim()) {
      where.OR = [
        { address: { contains: location.trim(), mode: "insensitive" } },
        { title: { contains: location.trim(), mode: "insensitive" } }
      ]
    }

    const properties = await prisma.property.findMany({
      where,
      select: { price: true, pricePerNight: true }
    })

    const prices = properties.map(p => p.pricePerNight > 0 ? p.pricePerNight : (p.price ?? 0))
    const count = prices.length

    const min = count > 0 ? Math.min(...prices) : 0
    const max = count > 0 ? Math.max(...prices) : 1000

    return NextResponse.json({
      min,
      max,
      count,
      prices
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch price range" }, { status: 500 })
  }
}
