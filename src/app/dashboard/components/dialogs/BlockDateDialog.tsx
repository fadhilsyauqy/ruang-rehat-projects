import React, { useState } from "react"
import { Lock } from "lucide-react"
import { getWibDateString } from "@/lib/date-standards"
import type { Dictionary } from "@/lib/dictionary"
import type { BlockedDateItem } from "@/types"

export interface BlockDateDialogProps {
  properties: Array<{ id: string; title: string }>
  selectedPropertyId: string
  onPropertySelect: (id: string) => void
  onBlockedDateCreated: (newBlockedDate: BlockedDateItem) => void
  currentLang?: string
  t: Partial<Dictionary>
}

export default function BlockDateDialog({
  properties,
  selectedPropertyId,
  onPropertySelect,
  onBlockedDateCreated,
  currentLang = "id",
  t,
}: BlockDateDialogProps) {
  const [blockStartDate, setBlockStartDate] = useState("")
  const [blockEndDate, setBlockEndDate] = useState("")
  const [blockReason, setBlockReason] = useState("")
  const [blockingLoading, setBlockingLoading] = useState(false)

  const handleCreateBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPropertyId || !blockStartDate || !blockEndDate) {
      alert(
        t.selectPropertyAndDatesAlert ||
          "Harap pilih properti serta tanggal mulai dan tanggal selesai."
      )
      return
    }

    setBlockingLoading(true)
    try {
      const res = await fetch("/api/properties/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          startDate: blockStartDate,
          endDate: blockEndDate,
          reason: blockReason,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error ||
            (currentLang === "en" ? "Failed to block dates" : "Gagal memblokir tanggal")
        )
      }

      const propTitle =
        properties.find((p) => p.id === selectedPropertyId)?.title || "Properti"
      const createdItem: BlockedDateItem = {
        ...data,
        property: { id: selectedPropertyId, title: propTitle },
      }

      onBlockedDateCreated(createdItem)

      setBlockStartDate("")
      setBlockEndDate("")
      setBlockReason("")
      alert(
        t.datesBlockedSuccess ||
          "Tanggal berhasil diblokir! Tamu tidak dapat memesan pada rentang tanggal tersebut."
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memblokir tanggal"
      alert(message)
    } finally {
      setBlockingLoading(false)
    }
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xs space-y-4">
      <div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-500" />
          <span>{t.blockDatesTitle}</span>
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t.blockDatesDesc}</p>
      </div>

      <form onSubmit={handleCreateBlockedDate} className="space-y-3.5">
        {/* Pilih Properti */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.selectProperty}
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => onPropertySelect(e.target.value)}
            required
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium outline-none focus:border-rose-500 transition-colors"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal Mulai & Selesai Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.checkIn} (Mulai)
            </label>
            <input
              type="date"
              required
              value={blockStartDate}
              min={getWibDateString(new Date())}
              onChange={(e) => setBlockStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t.checkOut} (Selesai)
            </label>
            <input
              type="date"
              required
              value={blockEndDate}
              min={blockStartDate || getWibDateString(new Date())}
              onChange={(e) => setBlockEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Alasan Blokir */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {t.blockReason}
          </label>
          <input
            type="text"
            placeholder={t.blockReasonPlaceholder}
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={
              blockingLoading ||
              !selectedPropertyId ||
              !blockStartDate ||
              !blockEndDate
            }
            className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{blockingLoading ? t.blockingDate : t.btnBlockDate}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
