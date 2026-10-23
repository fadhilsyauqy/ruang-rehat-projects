"use client"

import { useState } from "react"
import { CheckCircle2, Mail, Bell } from "lucide-react"
import { updateNotificationSettings } from "@/app/actions/preferences"
import type { ProfileUser } from "../../types"

interface NotificationsTabProps {
  user: ProfileUser
  currentLang: string
}

export default function NotificationsTab({
  user,
  currentLang
}: NotificationsTabProps) {
  const [notifyTrip, setNotifyTrip] = useState(user.notifyTripReminder ?? true)
  const [notifyPromo, setNotifyPromo] = useState(user.notifyPromoMarketing ?? false)
  const [notifyHostBook, setNotifyHostBook] = useState(user.notifyHostBooking ?? true)
  const [notifyPayout, setNotifyPayout] = useState(user.notifyHostPayout ?? true)
  const [savingNotify, setSavingNotify] = useState(false)
  const [notifySuccessMsg, setNotifySuccessMsg] = useState("")

  const isHost = user.role === "HOST"
  const isAdmin = user.role === "ADMIN"

  const handleToggleNotify = async (
    key: "trip" | "promo" | "hostBook" | "payout",
    newVal: boolean
  ) => {
    const upTrip = key === "trip" ? newVal : notifyTrip
    const upPromo = key === "promo" ? newVal : notifyPromo
    const upHostBook = key === "hostBook" ? newVal : notifyHostBook
    const upPayout = key === "payout" ? newVal : notifyPayout

    if (key === "trip") setNotifyTrip(newVal)
    if (key === "promo") setNotifyPromo(newVal)
    if (key === "hostBook") setNotifyHostBook(newVal)
    if (key === "payout") setNotifyPayout(newVal)

    setSavingNotify(true)
    setNotifySuccessMsg("")
    try {
      await updateNotificationSettings({
        notifyTripReminder: upTrip,
        notifyPromoMarketing: upPromo,
        notifyHostBooking: upHostBook,
        notifyHostPayout: upPayout
      })
      setNotifySuccessMsg(
        currentLang === "en" ? "Notification settings updated" : "Pengaturan notifikasi berhasil disimpan"
      )
      setTimeout(() => setNotifySuccessMsg(""), 3000)
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui pengaturan notifikasi")
    } finally {
      setSavingNotify(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-150 dark:border-gray-800/80">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {currentLang === "en" ? "Notifications" : "Notifikasi"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {currentLang === "en"
              ? "Choose which updates, stay reminders, and marketing messages you want to receive."
              : "Pilih pembaruan tiket, jadwal menginap, dan pemberitahuan transaksi yang ingin Anda terima."}
          </p>
        </div>

        {notifySuccessMsg && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{notifySuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Seksi 1: Perjalanan & Reservasi Tamu */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
            {currentLang === "en" ? "Travel & Guest Updates" : "Perjalanan & Reservasi Tamu"}
          </span>
          <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
          {/* Row 1: Pengingat Menginap */}
          <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-1 max-w-xl">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {currentLang === "en" ? "Trip reminders & check-in details" : "Pengingat jadwal menginap & panduan check-in"}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {currentLang === "en"
                    ? "Receive automatic reminders 24 hours prior to check-in with your digital boarding pass, property address, and door access instructions."
                    : "Pemberitahuan otomatis H-1 sebelum waktu check-in lengkap dengan tautan e-voucher tiket digital, alamat lengkap akomodasi, dan instruksi akses pintu."}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifyTrip}
                disabled={savingNotify}
                onClick={() => handleToggleNotify("trip", !notifyTrip)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                  notifyTrip ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    notifyTrip ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Row 2: Promo & Diskon Khusus */}
          <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-1 max-w-xl">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {currentLang === "en" ? "Promotions, deals & inspiration" : "Promo khusus, kupon & diskon musiman"}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {currentLang === "en"
                    ? "Get notified about seasonal discounts, exclusive coupons, and destination inspiration."
                    : "Dapatkan penawaran kupon diskon musiman, promo liburan hemat, dan rekomendasi destinasi favorit."}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifyPromo}
                disabled={savingNotify}
                onClick={() => handleToggleNotify("promo", !notifyPromo)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                  notifyPromo ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    notifyPromo ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seksi 2: Operasional Tuan Rumah & Finansial */}
      {(isHost || isAdmin) && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
              {currentLang === "en" ? "Host & Payout Alerts" : "Pemberitahuan Tuan Rumah & Finansial"}
            </span>
            <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
          </div>

          <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
            {/* Row 1: Pemesanan Masuk */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en" ? "New bookings & guest requests" : "Pemesanan baru & permintaan tamu"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentLang === "en"
                      ? "Instant notifications whenever a guest completes a paid reservation or requests a date change."
                      : "Pemberitahuan instan saat ada tamu yang berhasil membayar reservasi kamar atau mengajukan perubahan tanggal."}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyHostBook}
                  disabled={savingNotify}
                  onClick={() => handleToggleNotify("hostBook", !notifyHostBook)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                    notifyHostBook ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notifyHostBook ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Row 2: Pencairan Dana */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en" ? "Payout disbursement receipts" : "Bukti transfer pencairan dana sewa"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentLang === "en"
                      ? "Receipts and reference numbers when rental proceeds are transferred to your destination bank account."
                      : "Bukti transfer dan nomor referensi transaksi saat dana sewa dicairkan ke rekening bank penerima Anda."}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={notifyPayout}
                  disabled={savingNotify}
                  onClick={() => handleToggleNotify("payout", !notifyPayout)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${
                    notifyPayout ? "bg-rose-500" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      notifyPayout ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seksi 3: Kanal Pengiriman Pemberitahuan */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
            {currentLang === "en" ? "Delivery Channels" : "Kanal Pengiriman Notifikasi"}
          </span>
          <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs p-4 sm:p-4.5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-150 dark:border-gray-800/60">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-500" />
                <span>{currentLang === "en" ? "Registered Email" : "Alamat Email Terdaftar"}</span>
              </span>
              <p className="text-xs text-gray-500 font-mono">{user.email}</p>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 self-start sm:self-center">
              {currentLang === "en" ? "Primary Delivery" : "Kanal Utama"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-rose-500" />
                <span>{currentLang === "en" ? "In-App Dashboard Alerts" : "Notifikasi Dashboard Platform"}</span>
              </span>
              <p className="text-xs text-gray-500">
                {currentLang === "en"
                  ? "Real-time badge counter and stay updates"
                  : "Pemberitahuan langsung pada navigasi dan dashboard"}
              </p>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 self-start sm:self-center">
              {currentLang === "en" ? "Always On" : "Selalu Aktif"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
