import type { 
  Prisma, 
  User, 
  Role, 
  KycStatus, 
  HostBankAccount 
} from "@prisma/client";

export type { 
  User, 
  Role, 
  KycStatus, 
  HostBankAccount 
};

/**
 * Tipe data Pengguna untuk Portal Audit Admin
 * (Termasuk relasi rekening bank host jika ada)
 */
export type AdminUserItem = Prisma.UserGetPayload<{
  include: {
    bankAccount: true;
  };
}>;

/**
 * Tipe data Profil Pengguna yang sedang login di Dasbor
 */
export type CurrentUserProfile = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    phoneNumber: true;
    address: true;
    kycStatus: true;
    idCardUrl: true;
    idCardNumber: true;
    kycRejectReason: true;
    role: true;
  };
}>;

/**
 * Payload permintaan penolakan verifikasi KYC oleh Admin
 */
export interface KycRejectPayload {
  userId: string;
  reason: string;
}

/**
 * Detail status KYC untuk audit konsistensi rekening & KTP
 */
export interface KycAuditRecord {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  idCardNumber: string | null;
  idCardUrl: string | null;
  kycStatus: KycStatus;
  bankAccount?: HostBankAccount | null;
  isBankNameConsistent: boolean;
}
