import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import VoucherClient from "./VoucherClient"

export const metadata = {
  title: "E-Voucher Reservasi - Ruang Rehat",
  description: "Tiket digital dan bukti reservasi resmi Ruang Rehat",
}

export default async function VoucherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/signin")
  }

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      property: {
        include: {
          host: {
            select: {
              id: true,
              name: true,
              preferredName: true,
              email: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
      },
      guest: {
        select: {
          id: true,
          name: true,
          preferredName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  })

  if (!booking) {
    notFound()
  }

  // Hak akses: Eksklusif HANYA untuk Tamu yang memesan (mencegah penyalahgunaan)
  const isGuest = booking.guestId === session.user.id

  if (!isGuest) {
    redirect("/dashboard")
  }

  // Hanya booking yang sudah PAID yang memiliki e-voucher resmi
  if (booking.paymentStatus !== "PAID") {
    redirect(`/dashboard`)
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get("lang")?.value || "id"
  const currentCurrency = cookieStore.get("currency")?.value || "IDR"
  const t = getDictionary(currentLang)

  return (
    <VoucherClient
      booking={booking}
      currentCurrency={currentCurrency}
      currentLang={currentLang}
      t={t}
    />
  )
}
