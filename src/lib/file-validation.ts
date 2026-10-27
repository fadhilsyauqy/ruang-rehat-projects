/**
 * Ruang Rehat - Client & Server Unified File Validation Helper
 *
 * Standarisasi validasi berkas upload gambar:
 * - MIME types: image/jpeg, image/png, image/webp
 * - Max file size: 5 MB (5 * 1024 * 1024 bytes)
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export interface ImageValidationResult {
  valid: boolean
  errorTitle?: string
  errorMessage?: string
}

export function validateImageFile(
  file: File,
  currentLang: string = "id"
): ImageValidationResult {
  const isEn = currentLang === "en"

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      valid: false,
      errorTitle: isEn ? "Unsupported File Format" : "Format Tidak Didukung",
      errorMessage: isEn
        ? `File "${file.name}" is not supported. Only JPEG, PNG, and WebP images are allowed.`
        : `File "${file.name}" tidak didukung. Hanya gambar dengan format JPEG, PNG, atau WebP yang diperbolehkan.`,
    }
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return {
      valid: false,
      errorTitle: isEn ? "File Too Large" : "Ukuran Terlalu Besar",
      errorMessage: isEn
        ? `File "${file.name}" exceeds the maximum 5 MB file size limit.`
        : `File "${file.name}" melebihi batas ukuran maksimal 5 MB.`,
    }
  }

  return { valid: true }
}
