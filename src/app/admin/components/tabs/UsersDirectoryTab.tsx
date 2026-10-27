import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { AdminUserItem } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

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
  const [isExporting, setIsExporting] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string
    userName: string
    newRole: "GUEST" | "HOST" | "ADMIN"
  } | null>(null)

  const promoSubscribersCount = initialUsers.filter(
    (u) => u.notifyPromoMarketing
  ).length

  const handleExportSubscribers = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/admin/marketing/subscribers?format=csv")
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.error || "Gagal mengunduh CSV subscriber promo"
        )
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Subscriber_Promo_RuangRehat_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        variant: "success",
        title: currentLang === "en" ? "Export Completed" : "Ekspor Berhasil",
        description: currentLang === "en" ? "Subscriber CSV exported successfully." : "Berkas CSV pelanggan promo berhasil diunduh.",
      })
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Export Failed" : "Gagal Mengunduh CSV",
        description: error.message,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleUpdateRole = (
    userId: string,
    userName: string,
    newRole: "GUEST" | "HOST" | "ADMIN"
  ) => {
    setPendingRoleChange({ userId, userName, newRole })
  }

  const executeRoleUpdate = async () => {
    if (!pendingRoleChange) return
    const { userId, newRole, userName } = pendingRoleChange
    setLoadingAction(`role-${userId}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role")

      toast({
        variant: "success",
        title: currentLang === "en" ? "Role Updated" : "Peran Diperbarui",
        description:
          currentLang === "en"
            ? `Role for ${userName} changed to ${newRole}.`
            : `Peran akun ${userName} berhasil diubah menjadi ${newRole}.`,
      })
      setPendingRoleChange(null)
      router.refresh()
    } catch (err: unknown) {
      const error = err as Error
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Role Update Failed" : "Gagal Mengubah Peran",
        description: error.message,
      })
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
      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={
              currentLang === "en"
                ? "Search name, user email..."
                : "Cari nama, email user..."
            }
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-9 rounded-2xl text-xs"
          />
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <p className="text-xs text-muted-foreground hidden md:block">
            {initialUsers.length} pengguna terdaftar
          </p>
          <Button
            onClick={handleExportSubscribers}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="rounded-2xl text-xs font-semibold h-9 px-3.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? currentLang === "en"
                  ? "Exporting..."
                  : "Mengekspor..."
                : currentLang === "en"
                ? `Export Promo Subscribers (${promoSubscribersCount})`
                : `Unduh CSV Subscriber Promo (${promoSubscribersCount})`}
            </span>
          </Button>
        </div>
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
                <div className="flex items-center gap-2 flex-wrap">
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
                  {u.notifyPromoMarketing && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      Promo Opt-in
                    </span>
                  )}
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
                    u.name || u.email || "Pengguna",
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

      <ConfirmDialog
        open={!!pendingRoleChange}
        onOpenChange={(open: boolean) => !open && setPendingRoleChange(null)}
        title={currentLang === "en" ? "Change User Role" : "Ubah Peran Pengguna"}
        description={
          pendingRoleChange
            ? currentLang === "en"
              ? `Are you sure you want to change the role of ${pendingRoleChange.userName} to ${pendingRoleChange.newRole}?`
              : `Apakah Anda yakin ingin mengubah peran akun ${pendingRoleChange.userName} menjadi ${pendingRoleChange.newRole}?`
            : ""
        }
        confirmLabel={currentLang === "en" ? "Change Role" : "Ubah Peran"}
        cancelLabel={currentLang === "en" ? "Cancel" : "Batal"}
        variant={pendingRoleChange?.newRole === "ADMIN" ? "warning" : "default"}
        loading={!!loadingAction?.startsWith("role-")}
        onConfirm={executeRoleUpdate}
      />
    </div>
  )
}
