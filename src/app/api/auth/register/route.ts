import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password, confirmPassword } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      )
    }

    const emailStr = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailStr)) {
      return NextResponse.json(
        { error: "Format alamat email tidak valid." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus terdiri dari 8 karakter." },
        { status: 400 }
      )
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Konfirmasi kata sandi tidak cocok." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: emailStr },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk menggunakan akun Anda." },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailStr,
        password: hashedPassword,
        role: "GUEST",
      },
    })

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat pendaftaran." },
      { status: 500 }
    )
  }
}
