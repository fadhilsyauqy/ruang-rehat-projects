import type { 
  Prisma, 
  Property, 
  CancellationPolicy, 
  BlockedDate, 
  Favorite 
} from "@prisma/client";

export type { 
  Property, 
  CancellationPolicy, 
  BlockedDate, 
  Favorite 
};

/**
 * Tipe data Properti untuk Portal Audit Admin
 * (Termasuk data identitas host dan ringkasan status booking)
 */
export type AdminPropertyItem = Prisma.PropertyGetPayload<{
  include: {
    host: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    bookings: {
      select: {
        id: true;
        status: true;
        paymentStatus: true;
        totalPrice: true;
        totalPriceIdr: true;
      };
    };
  };
}>;

/**
 * Tipe data Properti milik Host di Dasbor
 * (Termasuk relasi ke seluruh booking dan jadwal blokir tanggal)
 */
export type HostPropertyItem = Prisma.PropertyGetPayload<{
  include: {
    bookings: true;
    blockedDates: true;
  };
}>;

/**
 * Tipe data Favorit Properti Pengguna
 */
export type UserFavoriteItem = Prisma.FavoriteGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        title: true;
        price: true;
        pricePerNight?: true;
        address: true;
        imageUrls: true;
        category: true;
      };
    };
  };
}>;

/**
 * Tipe data Blokir Tanggal Properti
 */
export type BlockedDateItem = Prisma.BlockedDateGetPayload<{
  include: {
    property: {
      select: {
        id: true;
        title: true;
      };
    };
  };
}>;

/**
 * Payload data formulir Properti (Create / Edit)
 */
export interface PropertyFormData {
  id?: string;
  category: string;
  title: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number;
  cleaningFee: number;
  price?: number; // legacy USD estimate
  cancellationPolicy: CancellationPolicy | "FLEXIBLE" | "MODERATE" | "STRICT";
  amenities: string[];
  imageUrls: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
}
