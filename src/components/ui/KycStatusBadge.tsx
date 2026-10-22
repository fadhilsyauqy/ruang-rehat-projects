import React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Clock, XCircle } from "lucide-react";
import type { KycStatus } from "@/types";

export interface KycStatusBadgeProps {
  status: KycStatus | "VERIFIED" | "PENDING" | "REJECTED" | "UNVERIFIED" | string;
  label?: string;
  currentLang?: "id" | "en" | string;
  className?: string;
  size?: "sm" | "md";
  showIcon?: boolean;
  prefix?: string;
  pulseOnPending?: boolean;
}

export function KycStatusBadge({
  status,
  label,
  currentLang = "id",
  className,
  size = "sm",
  showIcon = true,
  prefix,
  pulseOnPending = true,
}: KycStatusBadgeProps) {
  const isEn = currentLang === "en";

  let badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80";
  let defaultText = isEn ? "Unverified" : "Belum Verifikasi";
  let IconComponent = ShieldAlert;

  switch (status) {
    case "VERIFIED":
      badgeStyle = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      defaultText = isEn ? "Verified" : "Terverifikasi";
      IconComponent = ShieldCheck;
      break;
    case "PENDING":
      badgeStyle = cn(
        "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        pulseOnPending && "animate-pulse"
      );
      defaultText = isEn ? "Pending Review" : "Menunggu Audit";
      IconComponent = Clock;
      break;
    case "REJECTED":
      badgeStyle = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800";
      defaultText = isEn ? "Rejected" : "Ditolak";
      IconComponent = XCircle;
      break;
    case "UNVERIFIED":
    default:
      badgeStyle = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      defaultText = isEn ? "Unverified" : "Belum Verifikasi";
      IconComponent = ShieldAlert;
      break;
  }

  const sizeClass = size === "md"
    ? "px-3 py-1 text-xs"
    : "px-2.5 py-0.5 text-[10px]";

  const iconSize = size === "md" ? "w-3.5 h-3.5" : "w-3 h-3";

  const rawText = label || defaultText;
  const displayText = prefix ? `${prefix}${rawText}` : rawText;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-colors",
        sizeClass,
        badgeStyle,
        className
      )}
    >
      {showIcon && <IconComponent className={cn(iconSize, "shrink-0")} />}
      <span>{displayText}</span>
    </span>
  );
}

export default KycStatusBadge;
