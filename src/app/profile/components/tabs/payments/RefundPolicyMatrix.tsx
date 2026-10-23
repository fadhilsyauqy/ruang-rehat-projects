"use client"

import { CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react"

interface RefundPolicyMatrixProps {
  currentLang: string
}

export default function RefundPolicyMatrix({
  currentLang
}: RefundPolicyMatrixProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">
          {currentLang === "en" ? "Transparent Refund Matrix" : "Matriks Kebijakan Pengembalian Dana Transparan"}
        </span>
        <div className="h-px flex-1 bg-gray-150 dark:bg-gray-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Kartu 1: Fleksibel */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {currentLang === "en" ? "Flexible" : "Fleksibel"}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                100% Refund
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Up to 24h before check-in" : "Hingga 24 jam sebelum check-in"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "Full refund of accommodation rate if cancelled at least 24 hours before 14:00 check-in time. First night is non-refundable if cancelled within 24h."
                : "Pengembalian dana penuh (100%) jika dibatalkan sekurang-kurangnya 24 jam sebelum waktu check-in. Pembatalan setelah 24 jam dikenakan potongan malam pertama."}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{currentLang === "en" ? "Instant Automated Refund" : "Refund Otomatis Instan"}</span>
          </div>
        </div>

        {/* Kartu 2: Moderat */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                {currentLang === "en" ? "Moderate" : "Moderat"}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60">
                100% / 50%
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Up to 5 days before check-in" : "Hingga 5 hari sebelum check-in"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "Full refund if cancelled 5 full days before check-in. Cancellations after that receive 50% refund minus the first night and service fees."
                : "Pengembalian dana penuh (100%) jika dibatalkan 5 hari sebelum tanggal check-in. Pembatalan setelah batas tersebut berhak atas pengembalian 50%."}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{currentLang === "en" ? "Balanced Protection" : "Perlindungan Seimbang"}</span>
          </div>
        </div>

        {/* Kartu 3: Ketat */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-xs border border-gray-200/80 dark:border-gray-800/80 shadow-2xs space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {currentLang === "en" ? "Strict" : "Ketat"}
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60">
                50% / 0%
              </span>
            </div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Up to 7 days before check-in" : "Hingga 7 hari sebelum check-in"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {currentLang === "en"
                ? "50% refund if cancelled at least 7 days before check-in. Cancellations less than 7 days prior are non-refundable (0%) to protect host readiness."
                : "Pengembalian dana 50% jika dibatalkan 7 hari sebelum waktu menginap. Pembatalan kurang dari 7 hari tidak dapat di-refund (0%) demi proteksi komitmen tuan rumah."}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{currentLang === "en" ? "Host Commitment Guard" : "Proteksi Komitmen Host"}</span>
          </div>
        </div>
      </div>

      {/* Baris Proteksi Tanggal Check-in Tiba */}
      <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-0.5">
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Check-In Date Absolute Deadline" : "Batas Mutlak Tanggal Check-In"}
          </span>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {currentLang === "en"
              ? "Regardless of policy tier, booking cancellation is strictly disabled once your scheduled check-in time arrives. Please coordinate directly with your host for unexpected emergencies."
              : "Apapun kategori kebijakan pembatalan, tombol pembatalan mandiri otomatis dinonaktifkan tepat saat waktu check-in tiba demi kepastian operasional akomodasi."}
          </p>
        </div>
      </div>
    </div>
  )
}
