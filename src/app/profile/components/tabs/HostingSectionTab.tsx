"use client"

import AdminHostingSection from "./hosting/AdminHostingSection"
import HostOperationsSection from "./hosting/HostOperationsSection"
import BecomeHostOpportunitySection from "./hosting/BecomeHostOpportunitySection"
import type { ProfileUser, AdminStats } from "../../types"

interface HostingSectionTabProps {
  user: ProfileUser
  currentLang: string
  t: any
  adminStats?: AdminStats
  hostingTitle: string
}

export default function HostingSectionTab({
  user,
  currentLang,
  t,
  adminStats,
  hostingTitle
}: HostingSectionTabProps) {
  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-gray-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {hostingTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAdmin
              ? currentLang === "en"
                ? "Super-Admin authority for KYC review, BI-FAST payouts, user role management, and ecosystem health."
                : "Pusat wewenang Super-Admin untuk peninjauan KYC, otorisasi pencairan BI-FAST, manajemen pengguna, dan integritas platform."
              : isHost
              ? currentLang === "en"
                ? "Operational control hub, availability calendar, and hospitality listing defaults."
                : "Pusat kendali operasional, kalender ketersediaan, dan standar listing properti Tuan Rumah."
              : currentLang === "en"
              ? "Start hosting on Ruang Rehat to earn flexible income with complete protection."
              : "Mulai sewakan properti Anda dan dapatkan penghasilan sewa fleksibel dengan proteksi menyeluruh."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isAdmin ? (
          <AdminHostingSection
            adminStats={adminStats}
            currentLang={currentLang}
          />
        ) : isHost ? (
          <HostOperationsSection currentLang={currentLang} />
        ) : (
          <BecomeHostOpportunitySection currentLang={currentLang} t={t} />
        )}
      </div>
    </div>
  )
}
