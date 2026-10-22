import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as any)?.role

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/signin", nextUrl.origin)
      signInUrl.searchParams.set("callbackUrl", nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin))
    }
  }

  if (nextUrl.pathname.startsWith("/api/admin")) {
    if (!isLoggedIn || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
