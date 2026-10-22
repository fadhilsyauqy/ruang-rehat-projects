import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { propertyId, bookingId, rating, comment } = data
    
    if (!propertyId || !bookingId || rating == null || !comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validation logic: verify booking is COMPLETED and belongs to guest
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized to review this booking" }, { status: 403 })
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Review can only be left after a completed stay" }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        propertyId: booking.propertyId,
        bookingId: booking.id,
        guestId: session.user.id!,
        rating,
        comment
      }
    })
    
    return NextResponse.json(review)
  } catch (error: any) {
    console.error("Failed to create review error:", error)
    return NextResponse.json({ error: error.message || "Failed to create review" }, { status: 500 })
  }
}
