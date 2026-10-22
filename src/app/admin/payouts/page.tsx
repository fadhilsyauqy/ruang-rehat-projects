import { redirect } from "next/navigation"

export default function AdminPayoutsRedirect() {
  redirect("/admin?tab=payouts")
}
