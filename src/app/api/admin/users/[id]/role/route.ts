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
    const { role } = await req.json()

    if (!role || !["GUEST", "HOST", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Hindari admin mencopot role admin dirinya sendiri secara tidak sengaja
    if (resolvedParams.id === session.user.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Anda tidak dapat mencabut akses ADMIN untuk akun Anda sendiri." },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: resolvedParams.id },
      data: { role: role as any },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        kycStatus: true
      }
    })

    return NextResponse.json({
      message: `Role untuk ${updatedUser.name || updatedUser.email} berhasil diubah menjadi ${role}`,
      user: updatedUser
    })
  } catch (error: any) {
    console.error("Admin Role update error:", error)
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 })
  }
}
