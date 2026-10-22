import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AddPropertyClient from "./AddPropertyClient"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"

export const metadata = {
  title: "Tambah Properti Baru - Ruang Rehat",
  description: "Daftarkan penginapan atau villa baru Anda di Ruang Rehat.",
}

export default async function NewPropertyPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/signin?callbackUrl=/properties/new")
  }

  const cookieStore = await cookies()
  const currentLang = cookieStore.get("lang")?.value || "id"
  const currentCurrency = cookieStore.get("currency")?.value || "IDR"
  const t = getDictionary(currentLang)

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            {t.addPropertyTitle}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.addPropertyDesc}
          </p>
        </div>
      </div>
      <AddPropertyClient currentLang={currentLang} currentCurrency={currentCurrency} t={t} />
    </div>
  )
}
