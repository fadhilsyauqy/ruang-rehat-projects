import React from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus, PaymentStatus, EscrowStatus } from "@/types";

export interface BookingStatusBadgeProps {
  status?: BookingStatus | string;
  paymentStatus?: PaymentStatus | string;
  escrowStatus?: EscrowStatus | string;
  label?: string;
  currentLang?: "id" | "en" | string;
  className?: string;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function BookingStatusBadge({
  status,
  paymentStatus,
  escrowStatus,
  label,
  currentLang = "id",
  className,
  size = "sm",
  showDot = false,
}: BookingStatusBadgeProps) {
  const isEn = currentLang === "en";

  // Evaluasi varian tampilan berdasarkan kombinasi status
  let badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80";
  let dotStyle = "bg-amber-500";
  let defaultText = isEn ? "Awaiting Payment" : "Menunggu Pembayaran";

  if (status === "CANCELLED" || paymentStatus === "CANCELLED") {
    badgeStyle = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    dotStyle = "bg-gray-400";
    defaultText = isEn ? "Cancelled" : "Dibatalkan";
  } else if (status === "DISPUTED" || escrowStatus === "DISPUTED") {
    badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    dotStyle = "bg-rose-500";
    defaultText = isEn ? "Disputed" : "Sengketa";
  } else if (paymentStatus === "REFUNDED" || escrowStatus === "REFUNDED_TO_GUEST") {
    badgeStyle = "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
    dotStyle = "bg-purple-500";
    defaultText = isEn ? "Refunded" : "Dikembalikan";
  } else if (paymentStatus === "EXPIRED") {
    badgeStyle = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    dotStyle = "bg-gray-400";
    defaultText = isEn ? "Expired" : "Kedaluwarsa";
  } else if (paymentStatus === "PAID" || status === "CONFIRMED" || status === "COMPLETED") {
    badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    dotStyle = "bg-emerald-500";
    if (status === "COMPLETED") {
      defaultText = isEn ? "Completed" : "Selesai";
    } else {
      defaultText = isEn ? "Paid" : "Lunas";
    }
  }

  const sizeClass = size === "md" 
    ? "px-3 py-1 text-xs" 
    : "px-2.5 py-0.5 text-[10px]";

  const displayText = label || defaultText;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-colors",
        sizeClass,
        badgeStyle,
        className
      )}
    >
      {showDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyle)} />
      )}
      <span>{displayText}</span>
    </span>
  );
}

export default BookingStatusBadge;
