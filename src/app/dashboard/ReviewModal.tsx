"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Star, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function ReviewModal({ 
  bookingId, 
  propertyId, 
  currentLang = "id", 
  t 
}: { 
  bookingId: string
  propertyId: string
  currentLang?: string
  t?: any 
}) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const ratingDescriptions: Record<number, { id: string; en: string }> = {
    1: { id: "Sangat Buruk", en: "Terrible" },
    2: { id: "Kurang Memuaskan", en: "Poor" },
    3: { id: "Cukup Baik", en: "Average" },
    4: { id: "Sangat Bagus", en: "Very Good" },
    5: { id: "Luar Biasa Memuaskan!", en: "Exceptional!" }
  }

  const activeRating = hoverRating !== null ? hoverRating : rating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      toast({
        variant: "warning",
        title: currentLang === "en" ? "Review Incomplete" : "Ulasan Belum Lengkap",
        description: currentLang === "en" ? "Please write your review comment." : "Harap tuliskan ulasan pengalaman Anda.",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, propertyId, rating, comment: comment.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengirimkan ulasan")
      
      setSuccess(true)
      toast({
        variant: "success",
        title: currentLang === "en" ? "Review Submitted" : "Ulasan Terkirim",
        description: t?.reviewSubmittedSuccess || (currentLang === "en" ? "Review submitted successfully!" : "Ulasan berhasil dikirim!"),
      })
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        router.refresh()
      }, 1500)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: currentLang === "en" ? "Review Failed" : "Gagal Mengirim Ulasan",
        description: error.message || (currentLang === "en" ? "Failed to submit review" : "Gagal mengirimkan ulasan"),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Star className="w-3.5 h-3.5 fill-current" />
        <span>{t?.leaveReview || (currentLang === "en" ? "Leave a Review" : "Beri Ulasan Menginap")}</span>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md p-6 sm:p-7">
        <DialogHeader className="space-y-1.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t?.rateYourStay || (currentLang === "en" ? "Rate Your Stay" : "Beri Nilai Pengalaman Menginap")}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            {currentLang === "en" 
              ? "Your honest review helps other travelers discover great places and rewards wonderful hosts."
              : "Ulasan jujur Anda sangat membantu wisatawan lain dan mendukung tuan rumah dalam meningkatkan kualitas layanan."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {currentLang === "en" ? "Thank you for your review!" : "Terima kasih atas ulasan Anda!"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {currentLang === "en" ? "Your feedback has been published successfully." : "Ulasan Anda telah berhasil diterbitkan ke publik."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Interactive Star Rating Selector */}
            <div className="space-y-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-xs font-semibold text-muted-foreground block">
                {currentLang === "en" ? "How would you rate your overall experience?" : "Berapa bintang untuk pengalaman menginap Anda?"}
              </span>
              
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-gray-300 dark:text-gray-600 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= activeRating
                          ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                          : "fill-transparent text-gray-300 dark:text-gray-600"
                      )}
                    />
                  </button>
                ))}
              </div>

              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 h-5">
                {ratingDescriptions[activeRating]?.[currentLang === "en" ? "en" : "id"]} ({activeRating}/5)
              </div>
            </div>

            {/* Review Comment Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {t?.shareExperience || (currentLang === "en" ? "Write your review" : "Tuliskan ulasan Anda")} *
              </label>
              <textarea
                className="w-full border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 text-xs bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all leading-relaxed"
                rows={4}
                placeholder={t?.experiencePlaceholder || (currentLang === "en" ? "Tell us about the cleanliness, amenities, host communication, and location..." : "Ceritakan tentang kebersihan, kenyamanan kamar, keramahan tuan rumah, dan keindahan lokasi...")}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="rounded-xl text-xs"
              >
                {t?.cancel || (currentLang === "en" ? "Cancel" : "Batal")}
              </Button>
              <Button 
                type="submit" 
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 cursor-pointer" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {currentLang === "en" ? "Submitting..." : "Mengirim..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {t?.submitReview || (currentLang === "en" ? "Publish Review" : "Terbitkan Ulasan")}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
