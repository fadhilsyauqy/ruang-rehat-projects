"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import KycModal from "@/components/KycModal"
import ProfileHeader from "./components/ProfileHeader"
import ProfileSidebar from "./components/ProfileSidebar"
import PersonalInfoTab from "./components/tabs/personal/PersonalInfoTab"
import SecurityTab from "./components/tabs/SecurityTab"
import PrivacyTab from "./components/tabs/PrivacyTab"
import NotificationsTab from "./components/tabs/NotificationsTab"
import BusinessBillingTab from "./components/tabs/BusinessBillingTab"
import PreferencesTab from "./components/tabs/PreferencesTab"
import HostingSectionTab from "./components/tabs/HostingSectionTab"
import type { ProfileUser, TabType, AdminStats } from "./types"
import type { Dictionary } from "@/lib/dictionary"

export type { ProfileUser, TabType, AdminStats }

interface ProfileClientProps {
  user: ProfileUser
  currentLang: string
  currentCurrency: string
  t: Dictionary
  adminStats?: AdminStats
}

export default function ProfileClient({
  user,
  currentLang,
  currentCurrency,
  t,
  adminStats
}: ProfileClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>("personal")
  const [image, setImage] = useState(user.image || "")
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [showKycModal, setShowKycModal] = useState(false)

  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

  const handleProfileSuccess = () => {
    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 4000)
  }

  const hostingTitle = isAdmin
    ? currentLang === "en"
      ? "Admin governance & oversight"
      : "Tata kelola & pengawasan admin"
    : isHost
    ? currentLang === "en"
      ? "Professional hosting tools"
      : "Fitur menerima tamu profesional"
    : currentLang === "en"
    ? "Become a Host"
    : "Jadikan ruang Anda Ruang Rehat"

  return (
    <div className="w-full space-y-6">
      {/* 1. Header & Hero Banner */}
      <ProfileHeader
        user={user}
        currentLang={currentLang}
        t={t}
        adminStats={adminStats}
        image={image}
        setImage={setImage}
        profileSuccess={profileSuccess}
      />

      {/* 2. Dua Kolom: Sidebar Navigasi & Konten Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start pt-2">
        <ProfileSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentLang={currentLang}
          isHost={isHost}
          isAdmin={isAdmin}
          user={user}
        />

        <main className="lg:col-span-8 xl:col-span-8.5 space-y-6 min-w-0" id="profile-content">
          {activeTab === "personal" && (
            <PersonalInfoTab
              user={user}
              currentLang={currentLang}
              t={t}
              image={image}
              setImage={setImage}
              onOpenKycModal={() => setShowKycModal(true)}
              onProfileSuccess={handleProfileSuccess}
            />
          )}

          {activeTab === "security" && (
            <SecurityTab
              user={user}
              currentLang={currentLang}
              t={t}
            />
          )}

          {activeTab === "privacy" && (
            <PrivacyTab
              user={user}
              currentLang={currentLang}
            />
          )}

          {activeTab === "notifications" && (
            <NotificationsTab
              user={user}
              currentLang={currentLang}
            />
          )}

          {activeTab === "payments" && (
            <BusinessBillingTab
              user={user}
              currentLang={currentLang}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesTab
              currentLang={currentLang}
              currentCurrency={currentCurrency}
              t={t}
              onProfileSuccess={handleProfileSuccess}
            />
          )}

          {activeTab === "hosting" && (
            <HostingSectionTab
              user={user}
              currentLang={currentLang}
              t={t}
              adminStats={adminStats}
              hostingTitle={hostingTitle}
            />
          )}
        </main>
      </div>

      {/* 3. Modal KYC untuk Verifikasi Identitas */}
      <KycModal
        open={showKycModal}
        onOpenChange={setShowKycModal}
        user={user}
        currentLang={currentLang}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
