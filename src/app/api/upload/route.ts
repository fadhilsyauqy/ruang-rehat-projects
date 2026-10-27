import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/auth";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_FOLDERS = ["properties", "avatars", "kyc", "refunds"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const FOLDER_MAP: Record<AllowedFolder, string> = {
  properties: "ruang-rehat-properties",
  avatars: "ruang-rehat-avatars",
  kyc: "ruang-rehat-kyc",
  refunds: "ruang-rehat-refunds",
};

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("Cloudinary credentials are not configured in environment variables.");
    return NextResponse.json(
      { error: "Layanan upload file sedang tidak dapat digunakan (konfigurasi server tidak lengkap)." },
      { status: 500 }
    );
  }

  // Konfigurasi Cloudinary murni dari environment variables
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
      return NextResponse.json(
        { error: "File tidak ditemukan atau format payload tidak valid." },
        { status: 400 }
      );
    }

    // Task 8.1: Validasi MIME Type Sisi Server
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Hanya gambar dengan format JPEG, PNG, atau WebP yang diperbolehkan." },
        { status: 400 }
      );
    }

    // Task 8.2: Batasi Ukuran File Maksimal (5 MB Guard sebelum alokasi buffer RAM)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran file melebihi batas maksimal 5 MB." },
        { status: 413 }
      );
    }

    // Task 8.3: Sanitasi dan Kategorisasi Folder Penyimpanan
    const folderInput = formData.get("folder") as string | null;
    let selectedFolder: AllowedFolder = "properties";

    if (folderInput) {
      if (!ALLOWED_FOLDERS.includes(folderInput as AllowedFolder)) {
        return NextResponse.json(
          { error: "Kategori folder tidak valid. Folder yang diizinkan: properties, avatars, kyc, refunds." },
          { status: 400 }
        );
      }
      selectedFolder = folderInput as AllowedFolder;
    }

    const targetCloudinaryFolder = FOLDER_MAP[selectedFolder];

    // Convert file to Buffer setelah lolos validasi ukuran
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload ke Cloudinary menggunakan stream ke folder terisolasi
    const uploadResult = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: targetCloudinaryFolder },
        (error, result) => {
          if (error) reject(error);
          else if (result) resolve(result);
          else reject(new Error("Cloudinary upload returned no result"));
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: uploadResult.secure_url });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Upload Error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
