"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react"

interface SignInClientProps {
  currentLang?: string
  t?: any
}

export default function SignInClient({
  currentLang = "id",
  t = {},
}: SignInClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  // Mode: "login" atau "register"
  const [mode, setMode] = useState<"login" | "register">("login")

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Baca Remember Me dari localStorage saat komponen dimuat di browser
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("ruangrehat_remember_email")
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch {
      // Abaikan jika localStorage tidak diizinkan di browser
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const emailClean = email.trim().toLowerCase()
      const res = await signIn("credentials", {
        email: emailClean,
        password,
        redirect: false,
        callbackUrl,
      })

      if (res?.error) {
        setError(t.loginInvalidError || (currentLang === "en" ? "Invalid email or password." : "Email atau password tidak sesuai."))
      } else {
        // Kelola Remember Me di localStorage
        try {
          if (rememberMe) {
            localStorage.setItem("ruangrehat_remember_email", emailClean)
          } else {
            localStorage.removeItem("ruangrehat_remember_email")
          }
        } catch {
          // ignore
        }

        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || (currentLang === "en" ? "An error occurred during sign in." : "Terjadi kesalahan saat masuk."))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError(currentLang === "en" ? "Please fill in all registration fields." : "Harap lengkapi semua data pendaftaran.")
      return
    }

    if (password.length < 8) {
      setError(t.passwordMinLengthError || (currentLang === "en" ? "Password must be at least 8 characters." : "Kata sandi minimal harus terdiri dari 8 karakter."))
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordMismatchError || (currentLang === "en" ? "Passwords do not match." : "Konfirmasi kata sandi tidak cocok."))
      return
    }

    setLoading(true)
    setError("")
    setSuccessMsg("")

    try {
      const emailClean = email.trim().toLowerCase()
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: emailClean,
          password,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || (currentLang === "en" ? "Registration failed." : "Gagal melakukan pendaftaran."))
      }

      // Langsung login otomatis setelah pendaftaran akun berhasil
      const loginRes = await signIn("credentials", {
        email: emailClean,
        password,
        redirect: false,
        callbackUrl,
      })

      if (loginRes?.error) {
        setSuccessMsg(t.registerSuccessMsg || (currentLang === "en" ? "Registration successful! Please sign in." : "Pendaftaran berhasil! Silakan masuk dengan akun Anda."))
        setMode("login")
      } else {
        if (rememberMe) {
          localStorage.setItem("ruangrehat_remember_email", emailClean)
        }
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err: any) {
      setError(err?.message || (currentLang === "en" ? "An error occurred during registration." : "Terjadi kesalahan saat pendaftaran."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all">
        {/* Header Logo & Title */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <img
              src="/logo-light.png"
              alt="Ruang Rehat"
              className="h-11 w-auto mx-auto object-contain dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="Ruang Rehat"
              className="h-11 w-auto mx-auto object-contain hidden dark:block"
            />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {mode === "login" 
                ? (t.signInTitle || (currentLang === "en" ? "Welcome Back" : "Selamat Datang Kembali"))
                : (t.registerTitle || (currentLang === "en" ? "Create Account" : "Daftar Akun Baru"))}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login"
                ? (t.signInSubtitle || (currentLang === "en" ? "Sign in to access your reservations and stays" : "Masuk untuk mengakses reservasi dan penginapan Anda"))
                : (t.registerSubtitle || (currentLang === "en" ? "Sign up to start booking villas & stays" : "Daftar sebagai Tamu untuk mulai memesan villa & penginapan"))}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Masuk | Daftar */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError("")
              setSuccessMsg("")
              setPassword("")
              setConfirmPassword("")
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {t.login || (currentLang === "en" ? "Sign In" : "Masuk")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError("")
              setSuccessMsg("")
              setPassword("")
              setConfirmPassword("")
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === "register"
                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {currentLang === "en" ? "Register Guest" : "Daftar Tamu"}
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            {successMsg}
          </div>
        )}

        {/* Form Input */}
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t.fullNameLabel || (currentLang === "en" ? "Full Name" : "Nama Lengkap")}
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type="text"
                  required
                  placeholder={t.fullNamePlaceholder || (currentLang === "en" ? "Your full name" : "Nama Anda")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.emailLabel || (currentLang === "en" ? "Email Address" : "Alamat Email")}
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.passwordLabel || (currentLang === "en" ? "Password" : "Kata Sandi")}
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={mode === "register" 
                  ? (currentLang === "en" ? "Minimum 8 characters" : "Minimal 8 karakter") 
                  : (currentLang === "en" ? "Enter your password" : "Masukkan kata sandi")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent text-sm outline-none focus:border-rose-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi Kata Sandi (Khusus Pendaftaran Tamu) */}
          {mode === "register" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t.confirmPasswordLabel || (currentLang === "en" ? "Confirm Password" : "Konfirmasi Kata Sandi")}
                </label>
                {confirmPassword && password && (
                  <span className={`text-[10px] font-bold ${password === confirmPassword ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
                    {password === confirmPassword 
                      ? (currentLang === "en" ? "✓ Matches" : "✓ Cocok") 
                      : (currentLang === "en" ? "✕ Does not match" : "✕ Tidak cocok")}
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder={t.confirmPasswordPlaceholder || (currentLang === "en" ? "Re-enter your password" : "Ulangi kata sandi Anda")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-transparent text-sm outline-none transition-colors ${
                    confirmPassword && password !== confirmPassword 
                      ? "border-rose-400 focus:border-rose-500" 
                      : "border-gray-200 dark:border-gray-800 focus:border-rose-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Opsi Remember Me */}
          {mode === "login" && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 accent-rose-500 cursor-pointer"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {t.rememberMe || (currentLang === "en" ? "Remember me" : "Ingat email saya")}
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || (mode === "register" && (!name || !confirmPassword || password.length < 8 || password !== confirmPassword))}
            className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-md hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading 
              ? (currentLang === "en" ? "Processing..." : "Memproses...") 
              : mode === "login" 
                ? (t.signInBtn || (currentLang === "en" ? "Sign In Now" : "Masuk ke Akun")) 
                : (t.registerBtn || (currentLang === "en" ? "Register Now" : "Daftar Sekarang"))}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Keamanan & Informasi Akun */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {currentLang === "en" 
                ? "Secure session encrypted with NextAuth JWT & Bcrypt" 
                : "Sesi aman terenkripsi dengan NextAuth JWT & Bcrypt"}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            {currentLang === "en"
              ? "Instant registration — explore and make stays without email delays"
              : "Pendaftaran instan langsung aktif tanpa hambatan verifikasi"}
          </p>
        </div>
      </div>
    </div>
  )
}
