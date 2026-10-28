import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user || session.user.role !== 'GUEST') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { propertyId } = await req.json()

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }

    const userId = session.user.id!

    // Check if favorite exists
    const existingFav = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: { userId, propertyId }
      }
    })

    if (existingFav) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existingFav.id }
      })
      return NextResponse.json({ isFavorited: false })
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: { userId, propertyId }
      })
      return NextResponse.json({ isFavorited: true })
    }
  } catch {
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 })
  }
}
