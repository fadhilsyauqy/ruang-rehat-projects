"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil, X } from "lucide-react"
import { updateProfile } from "@/app/actions/preferences"
import LegalNameCard from "./LegalNameCard"
import PersonalPhotoCard from "./PersonalPhotoCard"
import EmailChangeSection from "./EmailChangeSection"
import PersonalKycCard from "./PersonalKycCard"
import ResidentialAddressCard from "./ResidentialAddressCard"
import EmergencyContactCard from "./EmergencyContactCard"
import type { ProfileUser } from "../../../types"

interface PersonalInfoTabProps {
  user: ProfileUser
  currentLang: string
  t: any
  image: string
  setImage: (url: string) => void
  onOpenKycModal: () => void
  onProfileSuccess?: () => void
}

export default function PersonalInfoTab({
  user,
  currentLang,
  t,
  image,
  setImage,
  onOpenKycModal,
  onProfileSuccess
}: PersonalInfoTabProps) {
  const router = useRouter()

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [name, setName] = useState(user.name || "")
  const [preferredName, setPreferredName] = useState(user.preferredName || "")
  const [phone, setPhone] = useState(user.phoneNumber || "")
  const [address, setAddress] = useState(user.address || "")
  const [emergencyName, setEmergencyName] = useState(user.emergencyContactName || "")
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContactPhone || "")
  const [emergencyRelation, setEmergencyRelation] = useState(user.emergencyContactRelation || "")

  const [currentEmail, setCurrentEmail] = useState(user.email || "")
  const [loadingProfile, setLoadingProfile] = useState(false)

  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

  const joinDate = (() => {
    try {
      const date = new Date(user.createdAt)
      return date.toLocaleDateString(currentLang === "en" ? "en-US" : "id-ID", {
        month: "long",
        year: "numeric"
      })
    } catch {
      return "-"
    }
  })()

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoadingProfile(true)

    try {
      const formData = new FormData()
      formData.set("name", name)
      formData.set("preferredName", preferredName)
      formData.set("image", image)
      formData.set("phoneNumber", phone)
      formData.set("address", address)
      formData.set("emergencyContactName", emergencyName)
      formData.set("emergencyContactPhone", emergencyPhone)
      formData.set("emergencyContactRelation", emergencyRelation)

      await updateProfile(formData)
      setEditingSection(null)
      if (onProfileSuccess) onProfileSuccess()
      router.refresh()
    } catch (err: any) {
      alert(err.message || (currentLang === "en" ? "Failed to update profile" : "Gagal memperbarui profil"))
    } finally {
      setLoadingProfile(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {currentLang === "en" ? "Personal info" : "Informasi pribadi"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentLang === "en" 
              ? "Manage how your identity appears to hosts and guests upon reservation." 
              : "Kelola data resmi dan bagaimana identitas Anda ditampilkan saat bertransaksi."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Nama Resmi (Subkomponen) */}
        <LegalNameCard
          name={name}
          setName={setName}
          isOpen={editingSection === "name"}
          onToggle={() => setEditingSection(editingSection === "name" ? null : "name")}
          onSave={handleSaveProfile}
          loading={loadingProfile}
          currentLang={currentLang}
          t={t}
        />

        {/* 2. Foto Profil (Subkomponen) */}
        <PersonalPhotoCard
          image={image}
          setImage={setImage}
          userName={name}
          isOpen={editingSection === "photo"}
          onToggle={() => setEditingSection(editingSection === "photo" ? null : "photo")}
          onSave={() => handleSaveProfile()}
          loading={loadingProfile}
          currentLang={currentLang}
          t={t}
        />

        {/* 3. Nama Depan Pilihan */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "prefName" ? "md:col-span-2" : "col-span-1"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {currentLang === "en" ? "Preferred first name" : "Nama depan pilihan"}
              </span>
              {editingSection !== "prefName" && (
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {preferredName || (name ? name.split(" ")[0] : (currentLang === "en" ? "Not provided" : "Tidak disediakan"))}
                </h4>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditingSection(editingSection === "prefName" ? null : "prefName")}
              className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              {editingSection === "prefName" ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" />
                  <span>{currentLang === "en" ? "Edit" : "Edit"}</span>
                </>
              )}
            </button>
          </div>

          {editingSection === "prefName" && (
            <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentLang === "en"
                  ? "This name will be displayed across reservations, reviews, and e-voucher confirmations."
                  : "Nama panggilan ini yang akan disapa oleh tuan rumah dan tamu pada bukti reservasi, e-voucher, dan ulasan."}
              </p>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              <Button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={loadingProfile}
                className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
              </Button>
            </div>
          )}
        </div>

        {/* 4. Alamat Email (Subkomponen) */}
        <EmailChangeSection
          currentEmail={currentEmail}
          currentLang={currentLang}
          isOpen={editingSection === "email"}
          onToggle={() => setEditingSection(editingSection === "email" ? null : "email")}
          onCancel={() => setEditingSection(null)}
          onEmailUpdated={(newEmail) => setCurrentEmail(newEmail)}
        />

        {/* 5. Nomor Telepon */}
        <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs hover:border-gray-300 dark:hover:border-gray-700 transition-all ${editingSection === "phone" ? "md:col-span-2" : "col-span-1"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {currentLang === "en" ? "Phone number" : "Nomor telepon"}
              </span>
              {editingSection !== "phone" && (
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {phone || (currentLang === "en" ? "Not provided" : "Belum disediakan")}
                </h4>
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditingSection(editingSection === "phone" ? null : "phone")}
              className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
            >
              {editingSection === "phone" ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "Cancel" : "Batal"}</span>
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" />
                  <span>{phone ? (currentLang === "en" ? "Edit" : "Edit") : (currentLang === "en" ? "Add" : "Tambahkan")}</span>
                </>
              )}
            </button>
          </div>

          {editingSection === "phone" && (
            <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-800/80 space-y-4 max-w-xl animate-in fade-in">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentLang === "en"
                  ? "We'll send you stay updates, reservation receipts, and check-in door codes."
                  : "Nomor telepon digunakan untuk mengirimkan konfirmasi check-in, e-voucher, dan kode akses penginapan."}
              </p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62 812-3456-7890"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              />
              <Button
                type="button"
                onClick={() => handleSaveProfile()}
                disabled={loadingProfile}
                className="px-6 py-2.5 h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {loadingProfile ? t.saving : (currentLang === "en" ? "Save changes" : "Simpan perubahan")}
              </Button>
            </div>
          )}
        </div>

        {/* 6. Verifikasi Identitas KYC (Subkomponen) */}
        <PersonalKycCard
          user={user}
          isAdmin={isAdmin}
          isHost={isHost}
          currentLang={currentLang}
          t={t}
          joinDate={joinDate}
          onOpenKycModal={onOpenKycModal}
        />

        {/* 7. Alamat Tempat Tinggal (Subkomponen) */}
        <ResidentialAddressCard
          address={address}
          setAddress={setAddress}
          isOpen={editingSection === "address"}
          onToggle={() => setEditingSection(editingSection === "address" ? null : "address")}
          onSave={() => handleSaveProfile()}
          loading={loadingProfile}
          currentLang={currentLang}
          t={t}
        />

        {/* 8. Kontak Darurat (Subkomponen) */}
        <EmergencyContactCard
          emergencyName={emergencyName}
          setEmergencyName={setEmergencyName}
          emergencyRelation={emergencyRelation}
          setEmergencyRelation={setEmergencyRelation}
          emergencyPhone={emergencyPhone}
          setEmergencyPhone={setEmergencyPhone}
          isOpen={editingSection === "emergency"}
          onToggle={() => setEditingSection(editingSection === "emergency" ? null : "emergency")}
          onSave={() => handleSaveProfile()}
          loading={loadingProfile}
          currentLang={currentLang}
          t={t}
        />
      </div>
    </div>
  )
}
