import type { 
  Prisma, 
  Payout, 
  PayoutStatus, 
  Dispute, 
  DisputeStatus, 
  RefundStatus, 
  EscrowStatus, 
  HostPenalty 
} from "@prisma/client";

export type { 
  Payout, 
  PayoutStatus, 
  Dispute, 
  DisputeStatus, 
  RefundStatus, 
  EscrowStatus, 
  HostPenalty 
};

/**
 * Tipe data Penarikan Saldo (Payout) untuk Portal Audit Admin
 * (Termasuk data kontak pengguna pemohon penarikan)
 */
export type AdminPayoutItem = Prisma.PayoutGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phoneNumber: true;
      };
    };
  };
}>;

/**
 * Tipe data Sengketa Garansi 24 Jam (Dispute) untuk Portal Audit Admin
 * (Termasuk data booking, properti, dan identitas tamu penuntut)
 */
export type AdminDisputeItem = Prisma.DisputeGetPayload<{
  include: {
    booking: {
      include: {
        property: {
          select: {
            id: true;
            title: true;
            address: true;
            hostId: true;
          };
        };
        guest: {
          select: {
            id: true;
            name: true;
            email: true;
            image: true;
          };
        };
      };
    };
  };
}>;

/**
 * Tipe data Penarikan Saldo untuk Dasbor Host
 */
export type HostPayoutItem = Payout;

/**
 * Payload putusan sengketa oleh Admin
 */
export interface DisputeResolutionPayload {
  disputeId: string;
  resolution: DisputeStatus;
  adminNotes?: string;
  refundAmountIdr?: number;
}
