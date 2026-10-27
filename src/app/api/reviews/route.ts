import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { propertyId, bookingId, rating, comment } = data
    
    if (!propertyId || !bookingId || rating === undefined || rating === null || !comment) {
      return NextResponse.json({ error: "Semua kolom ulasan wajib diisi (propertyId, bookingId, rating, comment)." }, { status: 400 })
    }

    // Task 6.2: Validasi Integer Rating (1–5)
    const numericRating = Number(rating)
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ 
        error: "Rating harus berupa bilangan bulat antara 1 dan 5 (bintang 1 s/d 5)." 
      }, { status: 400 })
    }

    const cleanComment = typeof comment === "string" ? comment.trim() : ""
    if (!cleanComment) {
      return NextResponse.json({ error: "Komentar ulasan tidak boleh kosong." }, { status: 400 })
    }

    // Validasi data booking: verifikasi kepemilikan dan status menginap selesai
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 })
    }

    if (booking.guestId !== session.user.id) {
      return NextResponse.json({ error: "Anda tidak memiliki hak untuk mengulas pesanan ini." }, { status: 403 })
    }

    if (booking.propertyId !== propertyId) {
      return NextResponse.json({ error: "ID properti tidak cocok dengan reservasi terkait." }, { status: 400 })
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ 
        error: "Ulasan hanya dapat diberikan setelah masa menginap selesai (berstatus COMPLETED)." 
      }, { status: 400 })
    }

    // Task 6.2: Pencegahan Duplikasi Review untuk bookingId yang sama
    const existingReview = await prisma.review.findFirst({
      where: { bookingId: booking.id }
    })

    if (existingReview) {
      return NextResponse.json({ 
        error: "Anda sudah pernah mengirimkan ulasan untuk pesanan ini. Ulasan tidak dapat diduplikasi." 
      }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        propertyId: booking.propertyId,
        bookingId: booking.id,
        guestId: session.user.id,
        rating: numericRating,
        comment: cleanComment
      }
    })
    
    return NextResponse.json(review)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("Failed to create review error:", error)
    return NextResponse.json({ error: err?.message || "Failed to create review" }, { status: 500 })
  }
}
