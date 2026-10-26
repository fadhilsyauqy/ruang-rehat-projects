"use client"

import Link from "next/link"
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  MapPin, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Calendar,
  QrCode,
  Building2
} from "lucide-react"
import { formatPrice } from "@/lib/format"
import { calculateStayNights, toCheckInDateTimeWIB, toCheckOutDateTimeWIB } from "@/lib/date-standards"

interface VoucherClientProps {
  booking: any
  currentCurrency: string
  currentLang?: string
  t: any
}

export default function VoucherClient({
  booking,
  currentCurrency,
  currentLang = "id",
  t,
}: VoucherClientProps) {
  const property = booking.property
  const guest = booking.guest
  const host = property.host

  const startDate = toCheckInDateTimeWIB(booking.startDate)
  const endDate = toCheckOutDateTimeWIB(booking.endDate)
  const diffDays = booking.totalNights || calculateStayNights(booking.startDate, booking.endDate)
  const locale = currentLang === "en" ? "en-US" : "id-ID"

  // Kode Tiket Unik Resmi
  const bookingCode = `RR-${booking.id.slice(-8).toUpperCase()}`

  // Data Penagihan Korporat & Faktur Pajak Resmi (Billed To)
  const hasCorporateBilling = Boolean(
    guest?.billingTaxId || guest?.billingCompanyName || guest?.billingAddress
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100/70 dark:bg-gray-950 py-5 sm:py-7 px-3 sm:px-5 lg:px-8 print:p-0 print:bg-white print:min-h-0">
      
      {/* Top Action Bar (Hanya tampil di layar web, disembunyikan total saat print / save PDF) */}
      <div className="w-full max-w-5xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard || (currentLang === "en" ? "Back to Dashboard" : "Kembali ke Dashboard")}</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm shadow-rose-500/25 transition-all cursor-pointer active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printNow || (currentLang === "en" ? "Print / Save PDF" : "Cetak E-Voucher")}</span>
        </button>
      </div>

      {/* Lembar Tiket Resmi (Professional Boarding Pass Style - 2 Kolom Melebar & Print-Safe) */}
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200/90 shadow-xl overflow-hidden print:border print:border-gray-300 print:shadow-none print:rounded-xl text-gray-900 print:max-w-none">
        
        {/* Header Boarding Pass */}
        <div className="bg-[#111827] text-white p-4 sm:p-5 print:p-4 relative border-b-4 border-rose-500">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shrink-0">
                <img
                  src="/logo-light.png"
                  alt="Ruang Rehat"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white leading-none">
                  RUANG REHAT
                </h1>
                <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1">
                  {currentLang === "en" ? "Official Accommodation E-Ticket & Boarding Pass" : "E-Tiket & Boarding Pass Resmi Penginapan"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>CONFIRMED & PAID</span>
              </div>
              <span className="text-[9px] text-gray-400 mt-0.5">Midtrans Instant Escrow</span>
            </div>
          </div>

          {/* Banner Strip Kode Booking */}
          <div className="mt-4 pt-3.5 border-t border-gray-800 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                {t.bookingCode || "Booking Code"}
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-rose-400 tracking-wider">
                {bookingCode}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                {currentLang === "en" ? "Issue Date" : "Tanggal Terbit"}
              </span>
              <span className="font-semibold text-xs text-gray-200">
                {new Date(booking.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                {currentLang === "en" ? "Booker Status" : "Status Pemesan"}
              </span>
              <span className="font-semibold text-xs text-gray-200">
                {currentLang === "en" ? "Verified Guest" : "Tamu Terverifikasi"}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] uppercase font-bold tracking-wider">
                {currentLang === "en" ? "Guarantee" : "Jaminan Reservasi"}
              </span>
              <span className="font-semibold text-xs text-emerald-400">
                100% Guaranteed
              </span>
            </div>
          </div>
        </div>

        {/* Konten Lembar E-Ticket: 2-Kolom Boarding Pass Grid (Print-Safe & Responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x print:divide-y-0 print:divide-x divide-gray-200 divide-dashed">
          
          {/* KOLOM KIRI (7-8 Kolom): Properti, Jadwal Check-In/Out & Pihak Terlibat */}
          <div className="lg:col-span-8 print:col-span-8 p-4 sm:p-5 print:p-4 space-y-4">
            
            {/* Bagian Properti */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-start p-3.5 rounded-xl bg-gray-50/80 border border-gray-150">
              <img
                src={property.imageUrls[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400"}
                alt={property.title}
                className="w-full sm:w-32 h-24 rounded-lg object-cover shrink-0 border border-gray-200"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                  {currentLang === "en" ? "Selected Accommodation" : "Akomodasi Pilihan"}
                </span>
                <h2 className="text-base font-bold text-gray-900 leading-snug truncate">
                  {property.title}
                </h2>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{property.address}</span>
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 pt-0.5">
                  <span>
                    {currentLang === "en" ? "Capacity:" : "Kapasitas:"}{" "}
                    <strong className="text-gray-800">
                      {property.maxGuests} {currentLang === "en" ? (property.maxGuests === 1 ? "Guest" : "Guests") : "Tamu"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    {currentLang === "en" ? "Duration:" : "Durasi:"}{" "}
                    <strong className="text-gray-800">
                      {diffDays} {currentLang === "en" ? (diffDays === 1 ? "Night" : "Nights") : "Malam"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Kotak Jadwal Check-In & Check-Out (Model Tiket Boarding) */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border-2 border-dashed border-gray-300">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-500" />
                  <span>CHECK-IN</span>
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                  {startDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}
                </p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{currentLang === "en" ? "From 2:00 PM (14:00 WIB)" : "Pukul 14:00 WIB"}</span>
                </p>
              </div>

              <div className="space-y-0.5 pl-3 border-l border-gray-200">
                <span className="text-[9px] uppercase font-extrabold text-gray-400 tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-500" />
                  <span>CHECK-OUT</span>
                </span>
                <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                  {endDate.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}
                </p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{currentLang === "en" ? "Until 12:00 PM (12:00 WIB)" : "Pukul 12:00 WIB"}</span>
                </p>
              </div>
            </div>

            {/* Data Pemesan & Kontak Tuan Rumah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                  {currentLang === "en" ? "Ticket Holder (Guest)" : "Pemegang Hak Tiket (Tamu)"}
                </span>
                <p className="text-xs font-bold text-gray-900 truncate">{guest.preferredName || guest.name}</p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{guest.email}</span>
                </p>
                {guest.phoneNumber && (
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>{guest.phoneNumber}</span>
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-1">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider block">
                  {currentLang === "en" ? "Host Contact" : "Kontak Tuan Rumah (Host)"}
                </span>
                <p className="text-xs font-bold text-gray-900 truncate">{host.preferredName || host.name}</p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{host.email}</span>
                </p>
                {host.phoneNumber ? (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <a
                      href={`https://wa.me/${host.phoneNumber.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>WhatsApp</span>
                    </a>
                    <span className="text-[11px] text-gray-500 truncate">{host.phoneNumber}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Informasi Faktur Pajak & Penagihan Korporat Resmi (Billed To) */}
            {hasCorporateBilling && (
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 print:bg-white print:border-gray-300 space-y-2.5">
                <div className="flex items-center justify-between border-b border-blue-200/60 print:border-gray-200 pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 print:text-gray-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 print:text-gray-700" />
                    <span>
                      {currentLang === "en"
                        ? "Tax Invoice & Corporate Billing (Billed To)"
                        : "Informasi Faktur Pajak & Penagihan Resmi (Billed To)"}
                    </span>
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 print:bg-gray-100 print:text-gray-800 print:border-gray-300">
                    {currentLang === "en" ? "Official Business Expense" : "Faktur Pajak Sah"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2.5 text-xs">
                  {guest.billingCompanyName && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-500 block">
                        {currentLang === "en" ? "Company / Entity Name" : "Nama Entitas / Perusahaan"}
                      </span>
                      <p className="font-bold text-gray-900 leading-snug">
                        {guest.billingCompanyName}
                      </p>
                    </div>
                  )}

                  {guest.billingTaxId && (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-gray-500 block">
                        {currentLang === "en" ? "NPWP / Tax Identification" : "NPWP (Tax ID)"}
                      </span>
                      <p className="font-mono font-bold text-blue-950 print:text-gray-900 leading-snug">
                        {guest.billingTaxId}
                      </p>
                    </div>
                  )}

                  {guest.billingAddress && (
                    <div className="sm:col-span-2 print:col-span-2 pt-1 border-t border-blue-150 print:border-gray-200">
                      <span className="text-[9px] uppercase font-bold text-gray-500 block">
                        {currentLang === "en" ? "Registered Billing Address" : "Alamat Resmi Penagihan"}
                      </span>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        {guest.billingAddress}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Syarat & Ketentuan Check-In */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs space-y-0.5">
              <p className="font-bold flex items-center gap-1 text-amber-950 text-[11px]">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{currentLang === "en" ? "Check-In Guidelines:" : "Ketentuan Check-In:"}</span>
              </p>
              <ul className="text-[10px] sm:text-[11px] list-disc list-inside space-y-0.5 text-amber-900/90 leading-relaxed">
                <li>
                  {currentLang === "en"
                    ? "Present this e-voucher (digital or printed) along with your original ID/Passport matching the booker's name."
                    : "Tunjukkan e-voucher ini (digital/cetak) beserta KTP/Paspor asli yang sesuai dengan nama pemesan."}
                </li>
                <li>
                  {currentLang === "en"
                    ? "Standard check-in begins at 2:00 PM and check-out is by 12:00 PM local time."
                    : "Waktu check-in standar mulai pukul 14:00 WIB dan check-out maksimal pukul 12:00 WIB."}
                </li>
              </ul>
            </div>
          </div>

          {/* KOLOM KANAN (4-5 Kolom): "Boarding Pass Stub" / Pelunasan, QR Code & Validasi */}
          <div className="lg:col-span-4 print:col-span-4 p-4 sm:p-5 print:p-4 bg-gray-50/60 print:bg-white flex flex-col space-y-3 print:space-y-3 justify-start">
            
            {/* QR Code Verifikasi */}
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col items-center text-center space-y-2">
              <div className="w-24 h-24 bg-gray-900 rounded-lg flex items-center justify-center p-2.5">
                <QrCode className="w-full h-full text-white" />
              </div>
              <div>
                <span className="text-[9px] font-mono font-bold text-gray-400 tracking-wider uppercase block">
                  DIGITAL PASS TOKEN
                </span>
                <span className="font-mono text-xs font-black text-gray-900 tracking-wider">
                  {bookingCode}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug">
                {currentLang === "en"
                  ? "Scan upon arrival for instant check-in verification"
                  : "Pindai saat tiba di lokasi untuk verifikasi check-in"}
              </p>
            </div>

            {/* Kotak Rincian Pembayaran */}
            <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {currentLang === "en" ? "Payment Settlement" : "Status Pelunasan"}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {currentLang === "en" ? "PAID IN FULL" : "LUNAS"}
                </span>
              </div>

              <div>
                <div className="text-xl font-black text-gray-900 leading-none">
                  {formatPrice(booking.totalPriceIdr || (booking.totalPrice ? Math.round(booking.totalPrice * 18051) : 0), currentCurrency)}
                </div>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                  {currentLang === "en" 
                    ? `${diffDays} ${diffDays === 1 ? "Night" : "Nights"} stay • Taxes & Platform fees included`
                    : `Sewa ${diffDays} Malam • Termasuk pajak & biaya layanan`}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>SafeStay Midtrans Escrow Active</span>
                </div>

                {hasCorporateBilling && (
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold print:text-gray-700 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600 print:text-gray-600" />
                    <span className="truncate">
                      {currentLang === "en" ? "Billed to:" : "Ditagihkan ke:"}{" "}
                      {guest.billingCompanyName || guest.billingTaxId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Kebijakan Operasional Standar (WIB) */}
            <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-[10px] text-gray-600 space-y-2 shadow-2xs">
              <div className="font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-900 font-bold">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    {currentLang === "en" ? "Operating Policy (WIB)" : "Kebijakan Operasional (WIB)"}
                  </span>
                </span>
                <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  UTC+7
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[10px]">
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Check-in</span>
                  <span className="font-bold text-gray-800">14:00 WIB</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Check-out</span>
                  <span className="font-bold text-gray-800">12:00 WIB</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 pt-0.5 leading-relaxed">
                {currentLang === "en"
                  ? "Standard 2-hour cleaning & sanitation buffer is guaranteed between stays."
                  : "Jeda sanitasi & pembersihan standar 2 jam dijamin sebelum waktu check-in tamu."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Lembar Tiket */}
        <div className="bg-gray-50 p-3 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between px-5 print:p-2">
          <span>Ruang Rehat Accommodation Portal</span>
          <span className="font-mono text-[9px]">Token: {booking.id.slice(0, 16)}...</span>
        </div>
      </div>
    </div>
  )
}
