import SignInClient from "./SignInClient"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"

export const metadata = {
  title: "Masuk ke Akun - Ruang Rehat",
  description: "Masuk ke akun Ruang Rehat Anda untuk reservasi penginapan dan villa.",
}

export default async function SignInPage() {
  const cookieStore = await cookies()
  const currentLang = cookieStore.get("lang")?.value || "id"
  const t = getDictionary(currentLang)

  return <SignInClient currentLang={currentLang} t={t} />
}
