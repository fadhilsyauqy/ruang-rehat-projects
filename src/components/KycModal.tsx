"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  CreditCard,
  Loader2,
  X
} from "lucide-react"

interface KycModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    name?: string | null
    phoneNumber?: string | null
    address?: string | null
    idCardNumber?: string | null
    idCardUrl?: string | null
    kycStatus?: string | null
    kycRejectReason?: string | null
  }
  currentLang?: string
  triggerButton?: React.ReactNode
  onSuccess?: () => void
}

export default function KycModal({
  open,
  onOpenChange,
  user,
  currentLang = "id",
  triggerButton,
  onSuccess
}: KycModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [legalName, setLegalName] = useState(user?.name || "")
  const [idCardNumber, setIdCardNumber] = useState(user?.idCardNumber || "")
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "")
  const [address, setAddress] = useState(user?.address || "")
  const [idCardUrl, setIdCardUrl] = useState(user?.idCardUrl || "")
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setErrorMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto KTP")

      setIdCardUrl(data.url)
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengunggah dokumen KTP")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!idCardUrl) {
      setErrorMessage(currentLang === "en" ? "Please upload your ID Card photo." : "Harap unggah foto KTP atau Paspor Anda.")
      return
    }

    if (!idCardNumber || idCardNumber.trim().length < 6) {
      setErrorMessage(currentLang === "en" ? "Valid ID Number (NIK) is required." : "Nomor KTP (NIK) minimal 6 digit.")
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCardUrl,
          idCardNumber: idCardNumber.trim(),
          legalName: legalName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengirimkan verifikasi")

      setSuccessMessage(
        currentLang === "en"
          ? "KYC Submitted! Documents are being reviewed by Admin."
          : "Dokumen berhasil diajukan! Verifikasi sedang ditinjau oleh tim Admin."
      )

      setTimeout(() => {
        onOpenChange(false)
        if (onSuccess) onSuccess()
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menyimpan")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger render={triggerButton as any} />}
      <DialogContent className="max-w-lg p-6 sm:p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {currentLang === "en" ? "Host Identity Verification (KYC)" : "Verifikasi Identitas Host (KYC)"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en"
              ? "Ensure platform trust and guest safety. Once verified by Admin, your listings will automatically become public and eligible for payouts."
              : "Menjaga keamanan transaksi dan kepercayaan tamu. Setelah disetujui Admin, listing Anda akan otomatis tayang ke publik dan siap menerima pencairan dana."}
          </DialogDescription>
        </DialogHeader>

        {user?.kycRejectReason && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {currentLang === "en" ? "Previous Verification Rejected" : "Pengajuan Sebelumnya Ditolak"}
            </p>
            <p className="text-[11px] leading-relaxed pl-5 italic">
              &ldquo;{user.kycRejectReason}&rdquo;
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* 1. Upload Foto KTP */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
              <span>{currentLang === "en" ? "ID Card / Passport Photo" : "Foto KTP Asli / Paspor"} *</span>
              <span className="text-[10px] text-muted-foreground">Maksimal 5MB (JPG/PNG)</span>
            </label>

            {idCardUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 group">
                <img 
                  src={idCardUrl} 
                  alt="KTP Document Preview" 
                  className="w-full h-44 object-cover object-center"
                />
                <button
                  type="button"
                  onClick={() => setIdCardUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer"
                  title="Hapus foto"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Foto Dokumen Terunggah
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-purple-500 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:bg-purple-50/20"
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-xs text-purple-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Mengunggah dokumen KTP...</span>
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {currentLang === "en" ? "Click to upload ID Card photo" : "Klik untuk unggah foto KTP"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {currentLang === "en" ? "Ensure text and NIK are sharp and readable" : "Pastikan foto jelas, tidak silau, dan NIK terbaca"}
                    </p>
                  </>
                )}
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
          </div>

          {/* 2. Nomor NIK / KTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "ID Card Number (NIK)" : "Nomor Induk Kependudukan (NIK)"} *
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                required
                placeholder="Contoh: 3171012345670001"
                value={idCardNumber}
                onChange={e => setIdCardNumber(e.target.value.replace(/\D/g, ""))}
                maxLength={20}
                className="pl-10 rounded-xl text-xs font-mono font-semibold"
              />
            </div>
          </div>

          {/* 3. Nama Legal sesuai KTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Legal Name (matches ID Card)" : "Nama Lengkap Sesuai KTP"} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                required
                placeholder="Nama lengkap resmi"
                value={legalName}
                onChange={e => setLegalName(e.target.value)}
                className="pl-10 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* 4. Nomor Telepon & WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Active Phone Number (WhatsApp)" : "Nomor Telepon / WhatsApp Aktif"} *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                required
                placeholder="+628123456789"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className="pl-10 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* 5. Alamat Domisili KTP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {currentLang === "en" ? "Residential Address on ID Card" : "Alamat Lengkap Sesuai KTP"} *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-white dark:bg-gray-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              {currentLang === "en" ? "Cancel / Later" : "Nanti Saja"}
            </Button>
            <Button
              type="submit"
              disabled={submitting || uploadingImage}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {currentLang === "en" ? "Submitting..." : "Mengirim Dokumen..."}
                </>
              ) : (
                currentLang === "en" ? "Submit Verification" : "Kirim Verifikasi"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
