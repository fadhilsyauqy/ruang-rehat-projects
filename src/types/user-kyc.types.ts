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
 * (Termasuk data tata kelola audit dan relasi rekening bank host, password hash secara tegas dikecualikan)
 */
export type AdminUserItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    preferredName: true;
    email: true;
    emailVerified: true;
    image: true;
    phoneNumber: true;
    address: true;
    emergencyContactName: true;
    emergencyContactPhone: true;
    emergencyContactRelation: true;
    kycStatus: true;
    idCardUrl: true;
    idCardNumber: true;
    kycRejectReason: true;
    role: true;
    createdAt: true;
    updatedAt: true;
    hideLastNameReview: true;
    hideSearchEngines: true;
    readReceipts: true;
    notifyTripReminder: true;
    notifyPromoMarketing: true;
    notifyHostBooking: true;
    notifyHostPayout: true;
    billingCompanyName: true;
    billingTaxId: true;
    billingAddress: true;
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

/**
 * Tipe data Pengguna lengkap untuk Halaman Akun & Profil (/profile)
 */
export interface ProfileUser {
  id: string;
  name: string | null;
  preferredName?: string | null;
  email: string | null;
  image: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  idCardUrl?: string | null;
  idCardNumber?: string | null;
  kycRejectReason?: string | null;
  role: string;
  createdAt: string;
  hasPassword: boolean;
  hideLastNameReview?: boolean;
  hideSearchEngines?: boolean;
  readReceipts?: boolean;
  notifyTripReminder?: boolean;
  notifyPromoMarketing?: boolean;
  notifyHostBooking?: boolean;
  notifyHostPayout?: boolean;
  billingCompanyName?: string;
  billingTaxId?: string;
  billingAddress?: string;
  stats: {
    totalBookings: number;
    totalProperties: number;
    totalReviews: number;
    totalFavorites: number;
  };
}
