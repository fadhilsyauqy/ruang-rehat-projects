export interface ProfileUser {
  id: string
  name: string | null
  preferredName?: string | null
  email: string | null
  image: string | null
  phoneNumber?: string | null
  address?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelation?: string | null
  kycStatus?: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
  idCardUrl?: string | null
  idCardNumber?: string | null
  kycRejectReason?: string | null
  role: string
  createdAt: string
  hasPassword: boolean
  hideLastNameReview?: boolean
  hideSearchEngines?: boolean
  readReceipts?: boolean
  notifyTripReminder?: boolean
  notifyPromoMarketing?: boolean
  notifyHostBooking?: boolean
  notifyHostPayout?: boolean
  billingCompanyName?: string
  billingTaxId?: string
  billingAddress?: string
  stats: {
    totalBookings: number
    totalProperties: number
    totalReviews: number
    totalFavorites: number
  }
}

export type TabType =
  | "personal"
  | "security"
  | "privacy"
  | "notifications"
  | "payments"
  | "preferences"
  | "hosting"

export interface AdminStats {
  pendingKyc: number
  pendingPayouts: number
  totalUsers: number
  totalProperties: number
}
