import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !session.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const resolvedParams = await params
    const { status, notes } = await req.json()

    if (!status || !["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payout status" }, { status: 400 })
    }

    const existingPayout = await prisma.payout.findUnique({
      where: { id: resolvedParams.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    })

    if (!existingPayout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 })
    }

    const updateData: any = {
      status: status as any
    }

    if (notes) {
      updateData.notes = existingPayout.notes 
        ? `${existingPayout.notes} | [Admin]: ${notes}` 
        : `[Admin]: ${notes}`
    }

    if (status === "COMPLETED") {
      updateData.processedAt = new Date()
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: resolvedParams.id },
      data: updateData
    })

    return NextResponse.json({
      message: `Status payout #${resolvedParams.id} diubah menjadi ${status}`,
      payout: updatedPayout
    })
  } catch (error: any) {
    console.error("Admin Payout update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update payout status" }, { status: 500 })
  }
}
