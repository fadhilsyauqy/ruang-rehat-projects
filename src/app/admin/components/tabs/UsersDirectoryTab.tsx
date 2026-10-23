import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AdminUserItem } from "@/types"

export interface UsersDirectoryTabProps {
  initialUsers: AdminUserItem[]
  currentLang?: string
}

export default function UsersDirectoryTab({
  initialUsers,
  currentLang = "id",
}: UsersDirectoryTabProps) {
  const router = useRouter()
  const [userSearch, setUserSearch] = useState("")
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleUpdateRole = async (
    userId: string,
    newRole: "GUEST" | "HOST" | "ADMIN"
  ) => {
    if (
      !confirm(
        currentLang === "en"
          ? `Change role to ${newRole}?`
          : `Ubah role akun ini menjadi ${newRole}?`
      )
    )
      return
    setLoadingAction(`role-${userId}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role")
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      alert(error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredUsers = initialUsers.filter((u) => {
    const q = userSearch.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari nama, email user..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Total {initialUsers.length} pengguna terdaftar di platform
        </p>
      </div>

      {/* Users Table */}
      <div className="space-y-3">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full">
                <AvatarImage src={u.image || ""} />
                <AvatarFallback>{u.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                    {u.name || "Tanpa Nama"}
                  </h4>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      u.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : u.role === "HOST"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {u.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) =>
                  handleUpdateRole(
                    u.id,
                    e.target.value as "GUEST" | "HOST" | "ADMIN"
                  )
                }
                disabled={loadingAction === `role-${u.id}`}
                className="h-8 px-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="GUEST">GUEST</option>
                <option value="HOST">HOST</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
