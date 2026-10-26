import type { 
  Prisma, 
  Booking, 
  BookingStatus, 
  PaymentStatus, 
  EscrowStatus, 
  RefundStatus 
} from "@prisma/client";

export type { 
  Booking, 
  BookingStatus, 
  PaymentStatus, 
  EscrowStatus, 
  RefundStatus 
};

/**
 * Tipe data Booking untuk Portal Audit Admin
 * (Termasuk data ringkas properti & informasi kontak tamu)
 */
export type AdminBookingItem = Prisma.BookingGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        title: true;
        address: true;
        price: true;
        pricePerNight: true;
        hostId: true;
      };
    };
    guest: {
      select: {
        id: true;
        name: true;
        email: true;
        phoneNumber: true;
        address: true;
        emergencyContactName: true;
        emergencyContactPhone: true;
        emergencyContactRelation: true;
      };
    };
  };
}>;

/**
 * Tipe data Booking masuk untuk Dasbor Host
 * (Termasuk data lengkap properti dan akun tamu)
 */
export type HostIncomingBooking = Prisma.BookingGetPayload<{
  include: {
    property: true;
    guest: true;
  };
}>;

/**
 * Tipe data Riwayat Perjalanan Tamu
 * (Termasuk data properti dan ulasan yang telah diberikan)
 */
export type GuestTripBooking = Prisma.BookingGetPayload<{
  include: {
    property: true;
    reviews: true;
  };
}>;

/**
 * Tipe data generik untuk kalkulasi harga atau ringkasan pesanan
 */
export interface BookingSummaryItem {
  id: string;
  code?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  totalNights?: number | null;
  totalPrice?: number | null;
  totalPriceIdr?: number | null;
  nightlyRateIdr?: number | null;
  netHostPayoutIdr?: number | null;
  status: BookingStatus | string;
  paymentStatus: PaymentStatus | string;
  escrowStatus?: EscrowStatus | string;
}
