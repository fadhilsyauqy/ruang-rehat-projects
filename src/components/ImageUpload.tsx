"use client"

import { useState, useRef } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

    setIsUploading(true)
    const newUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!ALLOWED_TYPES.includes(file.type)) {
          toast({
            variant: "destructive",
            title: "Format Tidak Didukung",
            description: `File "${file.name}" tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.`,
          })
          continue
        }

        if (file.size > MAX_SIZE) {
          toast({
            variant: "destructive",
            title: "Ukuran Terlalu Besar",
            description: `File "${file.name}" melebihi batas ukuran maksimal 5 MB.`,
          })
          continue
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", "properties")

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || "Upload failed")
        }
        
        const data = await res.json()
        newUrls.push(data.url)
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls])
        toast({
          variant: "success",
          title: "Berhasil",
          description: `${newUrls.length} gambar berhasil diunggah.`,
        })
      }
    } catch (error: unknown) {
      const err = error as Error
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah",
        description: err.message,
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Reset input
      }
    }
  }

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  return (
    <div className="space-y-4">
      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden group border bg-gray-100">
              <img src={url} alt={`Property ${index}`} className="object-cover w-full h-full" />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemove(url)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-10"
                title="Hapus gambar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUpload} 
          multiple 
          accept="image/jpeg,image/png,image/webp" 
          className="hidden" 
        />
        {isUploading ? (
          <Loader2 className="h-10 w-10 animate-spin mb-2 text-rose-500" />
        ) : (
          <ImagePlus className="h-10 w-10 mb-2" />
        )}
        <p className="font-medium text-sm">{isUploading ? "Mengunggah..." : "Klik untuk mengunggah gambar"}</p>
        <p className="text-xs mt-1">PNG, JPG, WEBP (Max 5MB)</p>
      </div>
    </div>
  )
}
