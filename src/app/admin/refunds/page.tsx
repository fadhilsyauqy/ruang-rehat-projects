import { redirect } from "next/navigation"

export default function AdminRefundsRedirect() {
  redirect("/admin?tab=refunds")
}
