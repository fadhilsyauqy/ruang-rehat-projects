import { redirect } from "next/navigation"

export default function AdminKycRedirect() {
  redirect("/admin?tab=kyc")
}
