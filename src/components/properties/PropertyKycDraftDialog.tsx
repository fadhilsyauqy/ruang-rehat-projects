import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export interface PropertyKycDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLang?: string;
  onVerifyNow: () => void;
  onLater: () => void;
}

export function PropertyKycDraftDialog({
  open,
  onOpenChange,
  currentLang = "id",
  onVerifyNow,
  onLater,
}: PropertyKycDraftDialogProps) {
  const isEn = currentLang === "en";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto mb-2 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <DialogHeader className="space-y-1.5 text-center">
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">
            {isEn ? "Property Draft Created!" : "Properti Berhasil Didaftarkan!"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed text-center">
            {isEn
              ? "Your property is saved safely as DRAFT. To protect guests and publish your listing live for bookings, please complete your Host KYC verification."
              : "Properti Anda berhasil disimpan sebagai DRAFT. Demi keamanan tamu dan kecepatan penarikan hasil sewa, lengkapi verifikasi identitas (KTP) agar listing langsung tayang."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 text-left text-xs space-y-1 text-purple-900 dark:text-purple-200">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            {isEn ? "Why verify now?" : "Keuntungan Verifikasi KYC:"}
          </p>
          <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-purple-800 dark:text-purple-300">
            <li>{isEn ? "Listing automatically published to search results" : "Listing otomatis dipublikasikan ke halaman pencarian"}</li>
            <li>{isEn ? "Receive official Verified Host badge" : "Mendapatkan lencana Host Terverifikasi Resmi"}</li>
            <li>{isEn ? "Payout withdrawal instantly unlocked" : "Pencairan dana sewa (Payout) dapat langsung diproses"}</li>
          </ul>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            type="button"
            onClick={onVerifyNow}
            className="w-full h-11 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {isEn ? "Verify ID (KTP) Now" : "Verifikasi KTP Sekarang (Rekomendasi)"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onLater}
            className="text-xs text-muted-foreground"
          >
            {isEn ? "I'll do it later (Go to Dashboard)" : "Nanti Saja (Buka Dashboard)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PropertyKycDraftDialog;
