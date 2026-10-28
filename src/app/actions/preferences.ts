"use server"

import { cookies } from "next/headers"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const name = formData.get("name") as string | null
  const preferredName = formData.get("preferredName") as string | null
  const image = formData.get("image") as string | null
  const phoneNumber = formData.get("phoneNumber") as string | null
  const address = formData.get("address") as string | null
  const emergencyContactName = formData.get("emergencyContactName") as string | null
  const emergencyContactPhone = formData.get("emergencyContactPhone") as string | null
  const emergencyContactRelation = formData.get("emergencyContactRelation") as string | null
  const lang = formData.get("lang") as string | null
  const currency = formData.get("currency") as string | null

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name !== null ? (name || null) : undefined,
      preferredName: preferredName !== null ? (preferredName || null) : undefined,
      image: image !== null ? (image || null) : undefined,
      phoneNumber: phoneNumber !== null ? (phoneNumber || null) : undefined,
      address: address !== null ? (address || null) : undefined,
      emergencyContactName: emergencyContactName !== null ? (emergencyContactName || null) : undefined,
      emergencyContactPhone: emergencyContactPhone !== null ? (emergencyContactPhone || null) : undefined,
      emergencyContactRelation: emergencyContactRelation !== null ? (emergencyContactRelation || null) : undefined,
    }
  })

  const cookieStore = await cookies()
  if (lang) cookieStore.set("lang", lang, { path: "/" })
  if (currency) cookieStore.set("currency", currency, { path: "/" })

  revalidatePath("/", "layout")
  return { success: true }
}

export async function changeEmail(newEmail: string, currentPassword: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const cleanEmail = newEmail ? newEmail.trim().toLowerCase() : ""
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    throw new Error("Format alamat email tidak valid")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true }
  })

  if (!user) {
    throw new Error("Pengguna tidak ditemukan")
  }

  if (user.email && user.email.toLowerCase() === cleanEmail) {
    throw new Error("Alamat email baru sama dengan alamat email saat ini")
  }

  // Cek apakah email baru sudah terdaftar pada akun lain
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true }
  })

  if (existingUser && existingUser.id !== user.id) {
    throw new Error("Alamat email ini sudah digunakan oleh akun lain")
  }

  // Verifikasi kata sandi saat ini untuk keamanan
  if (user.password) {
    if (!currentPassword) {
      throw new Error("Silakan masukkan kata sandi akun saat ini untuk konfirmasi keamanan")
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      throw new Error("Kata sandi akun saat ini tidak sesuai")
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: cleanEmail }
  })

  revalidatePath("/", "layout")
  revalidatePath("/profile")
  return { success: true, email: cleanEmail }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error("Kata sandi baru minimal 6 karakter")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true }
  })

  if (!user) {
    throw new Error("Pengguna tidak ditemukan")
  }

  if (user.password) {
    if (!currentPassword) {
      throw new Error("Silakan masukkan kata sandi saat ini")
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      throw new Error("Kata sandi saat ini tidak sesuai")
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  })

  return { success: true }
}

export async function updatePrivacySettings(data: {
  hideLastNameReview?: boolean
  hideSearchEngines?: boolean
  readReceipts?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const updateData: Prisma.UserUpdateInput = {}
  if (data.hideLastNameReview !== undefined) updateData.hideLastNameReview = Boolean(data.hideLastNameReview)
  if (data.hideSearchEngines !== undefined) updateData.hideSearchEngines = Boolean(data.hideSearchEngines)
  if (data.readReceipts !== undefined) updateData.readReceipts = Boolean(data.readReceipts)

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData
  })

  revalidatePath("/profile")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateNotificationSettings(data: {
  notifyTripReminder?: boolean
  notifyPromoMarketing?: boolean
  notifyHostBooking?: boolean
  notifyHostPayout?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const updateData: Prisma.UserUpdateInput = {}
  if (data.notifyTripReminder !== undefined) updateData.notifyTripReminder = Boolean(data.notifyTripReminder)
  if (data.notifyPromoMarketing !== undefined) updateData.notifyPromoMarketing = Boolean(data.notifyPromoMarketing)
  if (data.notifyHostBooking !== undefined) updateData.notifyHostBooking = Boolean(data.notifyHostBooking)
  if (data.notifyHostPayout !== undefined) updateData.notifyHostPayout = Boolean(data.notifyHostPayout)

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData
  })

  revalidatePath("/profile")
  revalidatePath("/", "layout")
  return { success: true }
}

export async function updateBusinessBilling(data: {
  billingCompanyName?: string
  billingTaxId?: string
  billingAddress?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      billingCompanyName: data.billingCompanyName ? data.billingCompanyName.trim() : null,
      billingTaxId: data.billingTaxId ? data.billingTaxId.trim() : null,
      billingAddress: data.billingAddress ? data.billingAddress.trim() : null
    }
  })

  revalidatePath("/profile")
  revalidatePath("/", "layout")
  return { success: true }
}
