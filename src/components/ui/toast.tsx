"use client"

import * as React from "react"
import { useToast, type ToastData, type ToastVariant } from "./use-toast"
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

function getToastIcon(variant?: ToastVariant) {
  switch (variant) {
    case "success":
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )
    case "destructive":
      return (
        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
      )
    case "warning":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      )
    case "info":
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
      )
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
      )
  }
}

function getToastBorder(variant?: ToastVariant) {
  switch (variant) {
    case "success":
      return "border-emerald-200/80 dark:border-emerald-900/60"
    case "destructive":
      return "border-rose-200/80 dark:border-rose-900/60"
    case "warning":
      return "border-amber-200/80 dark:border-amber-900/60"
    case "info":
      return "border-blue-200/80 dark:border-blue-900/60"
    default:
      return "border-gray-200 dark:border-gray-800"
  }
}

export function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastData
  onDismiss: () => void
}) {
  const isClosing = toast.open === false

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto relative flex w-full items-start gap-3 p-4 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border transition-all duration-300 ease-out",
        getToastBorder(toast.variant),
        isClosing
          ? "opacity-0 translate-y-[-8px] scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-2"
      )}
    >
      {getToastIcon(toast.variant)}

      <div className="flex-1 min-w-0 pr-2 pt-0.5 space-y-1">
        {toast.title && (
          <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
            {toast.title}
          </h5>
        )}
        {toast.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words">
            {toast.description}
          </p>
        )}
        {toast.action && <div className="mt-2">{toast.action}</div>}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-3 sm:px-0 sm:top-5 sm:right-5"
    >
      {toasts.map((t) => (
        <ToastItemComponent
          key={t.id}
          toast={t}
          onDismiss={() => dismiss(t.id)}
        />
      ))}
    </div>
  )
}

export { ToastProvider as Toaster }
