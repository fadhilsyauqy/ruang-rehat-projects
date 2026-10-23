"use client"

import Link from "next/link"
import { ExternalLink, Ticket } from "lucide-react"
import type { ProfileUser } from "../../../types"

interface PaymentsBankingSectionProps {
  user: ProfileUser
  isHost: boolean
  currentLang: string
}

export default function PaymentsBankingSection({
  user,
  isHost,
  currentLang
}: PaymentsBankingSectionProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
          {isHost
            ? currentLang === "en"
              ? "Host Banking & Trips"
              : "Rekening Bank & Riwayat"
            : currentLang === "en"
            ? "Transaction & Escrow Safety"
            : "Transaksi & Jaminan Escrow"}
        </span>
        <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
      </div>

      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden shadow-2xs">
        {isHost ? (
          <>
            {/* Host: Rekening Payout */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Host payout destination bank account"
                      : "Rekening pencairan dana Tuan Rumah (BI-FAST)"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentLang === "en"
                      ? "Configure destination bank accounts to receive rental proceeds automatically via BI-FAST settlement."
                      : "Atur nomor rekening bank Anda untuk menerima hasil sewa akomodasi secara otomatis via transfer BI-FAST."}
                  </p>
                </div>
                <Link
                  href="/dashboard?tab=payouts"
                  className="rounded-full text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                >
                  <span>{currentLang === "en" ? "Manage Payouts" : "Kelola Rekening"}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </Link>
              </div>
            </div>

            {/* Host: Riwayat Menginap Pribadi */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Personal stay history & receipts"
                      : "Riwayat perjalanan liburan pribadi"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {user.stats.totalBookings}{" "}
                    {currentLang === "en"
                      ? "vacation bookings recorded on your account."
                      : "pesanan liburan pribadi tercatat pada akun Anda."}
                  </p>
                </div>
                <Link
                  href="/dashboard?tab=trips"
                  className="rounded-full text-xs font-bold border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                >
                  <span>{currentLang === "en" ? "View Stays" : "Lihat Perjalanan"}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Guest: Tiket & E-Voucher */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {currentLang === "en"
                      ? "Stay receipts & digital e-vouchers"
                      : "Riwayat bukti sewa & tiket e-voucher"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {user.stats.totalBookings > 0
                      ? currentLang === "en"
                        ? `You have ${user.stats.totalBookings} reservation trip tickets and invoices ready.`
                        : `Anda memiliki ${user.stats.totalBookings} tiket reservasi aktif dan bukti pelunasan sewa.`
                      : currentLang === "en"
                      ? "No bookings recorded yet. Your digital boarding passes and tax receipts will appear here."
                      : "Belum ada pesanan aktif. Bukti boarding pass dan e-voucher tiket akan tersimpan di sini."}
                  </p>
                </div>
                <Link
                  href="/dashboard?tab=trips"
                  className="rounded-full text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 shrink-0 h-9 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 self-start sm:self-center"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{currentLang === "en" ? "View Vouchers" : "Buka E-Voucher"}</span>
                </Link>
              </div>
            </div>

            {/* Guest: Midtrans Escrow Protection */}
            <div className="p-3.5 sm:p-4.5 transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {currentLang === "en"
                        ? "SafeStay Escrow Protection"
                        : "Jaminan Rekening Penampung (SafeStay Escrow)"}
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                      {currentLang === "en" ? "Bank-Grade Secure" : "Terproteksi Bank"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {currentLang === "en"
                      ? "All payments are safeguarded in an escrow account powered by Midtrans. Funds are released to hosts only 24 hours after your successful check-in."
                      : "Seluruh pembayaran pesanan ditampung secara aman pada rekening escrow Midtrans (BCA/Mandiri/BRI Virtual Account, QRIS GoPay, & Kartu Kredit) dan baru diteruskan ke tuan rumah 24 jam setelah Anda sukses check-in."}
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/50 shrink-0 self-start sm:self-center">
                  {currentLang === "en" ? "Escrow Active" : "Escrow Aktif"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
