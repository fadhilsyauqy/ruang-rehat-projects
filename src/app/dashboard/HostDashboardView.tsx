"use client"

import { useState } from "react"
import Link from "next/link"
import { PlusCircle, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { getBookingHostPayoutIdr, getBookingPriceIdr } from "@/lib/format"
import { toCheckOutDateTimeWIB } from "@/lib/date-standards"
import KycModal from "@/components/KycModal"
import DashboardStatsHeader from "./components/DashboardStatsHeader"
import PropertiesTab from "./components/tabs/PropertiesTab"
import HostBookingsTab from "./components/tabs/HostBookingsTab"
import AvailabilityTab from "./components/tabs/AvailabilityTab"
import HostPayoutsTab from "./components/tabs/HostPayoutsTab"
import GuestTripsTab from "./components/tabs/GuestTripsTab"
import { exportHostFinancialReportCsv } from "./utils/exportCsv"
import type { Dictionary } from "@/lib/dictionary"
import type {
  HostPropertyItem,
  HostIncomingBooking,
  GuestTripBooking,
  BlockedDateItem,
  HostBankAccount,
  Payout,
} from "@/types"

export interface HostDashboardViewProps {
  role: string
  currentUser?: {
    id?: string
    name?: string | null
    email?: string | null
    phoneNumber?: string | null
    address?: string | null
    kycStatus?: string | null
    idCardNumber?: string | null
    idCardUrl?: string | null
    [key: string]: unknown
  } | null
  myProperties: HostPropertyItem[]
  incomingBookings: HostIncomingBooking[]
  myBookings: GuestTripBooking[]
  userFavorites?: Array<{
    id: string
    property?: {
      id: string
      title: string
      address: string
      imageUrls: string[]
      price?: number | null
      pricePerNight?: number | null
    } | null
  }>
  initialBlockedDates?: BlockedDateItem[]
  initialBankAccount?: HostBankAccount | null
  initialPayouts?: Payout[]
  currentCurrency: string
  currentLang?: string
  t: Partial<Dictionary>
  defaultTab?: string
  targetPropertyId?: string
}

export type DashboardTab =
  | "properties"
  | "bookings"
  | "availability"
  | "payouts"
  | "trips"

export type TripFilter = "ALL" | "UPCOMING" | "COMPLETED" | "PENDING" | "CANCELLED"

export default function HostDashboardView({
  role,
  currentUser = null,
  myProperties,
  incomingBookings,
  myBookings,
  userFavorites = [],
  initialBlockedDates = [],
  initialBankAccount = null,
  initialPayouts = [],
  currentCurrency,
  currentLang = "id",
  t,
  defaultTab,
}: HostDashboardViewProps) {
  const getInitialTab = (): DashboardTab => {
    if (role === "HOST") {
      if (
        defaultTab &&
        ["properties", "bookings", "availability", "payouts", "trips"].includes(
          defaultTab
        )
      ) {
        return defaultTab as DashboardTab
      }
      return "properties"
    }
    return "trips"
  }

  const [activeTab, setActiveTab] = useState<DashboardTab>(getInitialTab())
  const [tripFilter, setTripFilter] = useState<TripFilter>("ALL")
  const [showKycModal, setShowKycModal] = useState(false)

  // State Collections
  const [blockedDatesList, setBlockedDatesList] =
    useState<BlockedDateItem[]>(initialBlockedDates)
  const [bankAccount, setBankAccount] =
    useState<HostBankAccount | null>(initialBankAccount)
  const [payoutsList, setPayoutsList] = useState<Payout[]>(initialPayouts)

  // Financial Metrics
  const paidIncomingBookings = incomingBookings.filter(
    (b) => b.paymentStatus === "PAID"
  )
  const totalRevenue = paidIncomingBookings.reduce(
    (acc, b) => acc + getBookingPriceIdr(b),
    0
  )

  const nowTime = new Date().getTime()
  const availablePayoutBookings = incomingBookings.filter((b) => {
    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    return (
      b.paymentStatus === "PAID" &&
      (b.escrowStatus === "RELEASED" || isPastCheckOut) &&
      b.escrowStatus !== "REFUNDED_TO_GUEST"
    )
  })
  const grossAvailableIdr = availablePayoutBookings.reduce(
    (acc, b) => acc + getBookingHostPayoutIdr(b),
    0
  )

  const totalWithdrawnIdr = payoutsList
    .filter((p) => p.status === "COMPLETED")
    .reduce((acc, p) => acc + p.amount, 0)

  const availablePayoutIdr = Math.max(0, grossAvailableIdr - totalWithdrawnIdr)

  const escrowBookings = incomingBookings.filter((b) => {
    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    return (
      b.paymentStatus === "PAID" &&
      b.escrowStatus === "HELD" &&
      !isPastCheckOut
    )
  })
  const escrowIdr = escrowBookings.reduce(
    (acc, b) => acc + getBookingHostPayoutIdr(b),
    0
  )

  // Guest Persona Trip Metrics
  const upcomingTrips = myBookings.filter((b) => {
    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    return b.status !== "CANCELLED" && !isPastCheckOut
  })

  const completedTrips = myBookings.filter((b) => {
    const isPastCheckOut = nowTime >= toCheckOutDateTimeWIB(b.endDate).getTime()
    return (
      b.status === "COMPLETED" ||
      (b.paymentStatus === "PAID" && b.status !== "CANCELLED" && isPastCheckOut)
    )
  })

  const pendingTrips = myBookings.filter(
    (b) => b.paymentStatus === "PENDING" && b.status !== "CANCELLED"
  )
  const cancelledTrips = myBookings.filter((b) => b.status === "CANCELLED")

  const handleExportCSV = () => {
    exportHostFinancialReportCsv({
      incomingBookings,
      currentCurrency,
      currentLang,
      t,
    })
  }

  return (
    <div className="space-y-6">
      {/* KPI & Status Overview Bar */}
      <DashboardStatsHeader
        role={role}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tripFilter={tripFilter}
        onTripFilterChange={setTripFilter}
        myPropertiesCount={myProperties.length}
        incomingBookingsCount={incomingBookings.length}
        paidBookingsCount={paidIncomingBookings.length}
        blockedDatesCount={blockedDatesList.length}
        totalRevenue={totalRevenue}
        hasBankAccount={Boolean(bankAccount)}
        myBookingsCount={myBookings.length}
        upcomingTripsCount={upcomingTrips.length}
        completedTripsCount={completedTrips.length}
        pendingTripsCount={pendingTrips.length}
        cancelledTripsCount={cancelledTrips.length}
        currentCurrency={currentCurrency}
        currentLang={currentLang}
        t={t}
        onOpenKycModal={() => setShowKycModal(true)}
      />

      {/* Host Sub-Header Navigation */}
      {role === "HOST" && (
        <div className="flex items-center justify-between pt-2 border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
              {activeTab === "properties" && t.tabProperties}
              {activeTab === "bookings" && t.tabBookings}
              {activeTab === "availability" && t.tabAvailability}
              {activeTab === "payouts" && t.tabPayouts}
              {activeTab === "trips" && t.tabTrips}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === "bookings" && (
              <button
                type="button"
                onClick={handleExportCSV}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-xs rounded-xl shadow-xs px-3.5 py-2 flex items-center gap-2 cursor-pointer transition-colors"
                )}
                title={t.exportReportDesc}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.exportReport}</span>
              </button>
            )}

            {activeTab === "properties" && (
              <Link
                href="/properties/new"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-500/20 px-4 py-2 flex items-center gap-2 cursor-pointer transition-all"
                )}
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.addProperty || "Tambah Properti"}</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Module 1: Properties Tab */}
      {activeTab === "properties" && role === "HOST" && (
        <PropertiesTab
          properties={myProperties}
          currentCurrency={currentCurrency}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Module 2: Incoming Host Bookings Tab */}
      {activeTab === "bookings" && role === "HOST" && (
        <HostBookingsTab
          incomingBookings={incomingBookings}
          currentCurrency={currentCurrency}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Module 3: Calendar & Blocked Dates Tab */}
      {activeTab === "availability" && role === "HOST" && (
        <AvailabilityTab
          properties={myProperties}
          blockedDatesList={blockedDatesList}
          onBlockedDateCreated={(newBlocked) =>
            setBlockedDatesList((prev) => [...prev, newBlocked])
          }
          onBlockedDateRemoved={(id) =>
            setBlockedDatesList((prev) => prev.filter((b) => b.id !== id))
          }
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Module 4: Payouts & Host Bank Account Tab */}
      {activeTab === "payouts" && role === "HOST" && (
        <HostPayoutsTab
          availablePayoutIdr={availablePayoutIdr}
          escrowIdr={escrowIdr}
          totalWithdrawnIdr={totalWithdrawnIdr}
          bankAccount={bankAccount}
          onBankAccountSaved={setBankAccount}
          payoutsList={payoutsList}
          onPayoutCreated={(newPayout) =>
            setPayoutsList((prev) => [newPayout, ...prev])
          }
          currentUser={currentUser}
          onOpenKycModal={() => setShowKycModal(true)}
          currentCurrency={currentCurrency}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Module 5: My Trips Tab */}
      {activeTab === "trips" && (
        <GuestTripsTab
          myBookings={myBookings}
          currentUser={currentUser}
          userFavorites={userFavorites}
          tripFilter={tripFilter}
          onTripFilterChange={setTripFilter}
          currentCurrency={currentCurrency}
          currentLang={currentLang}
          t={t}
        />
      )}

      {/* Reusable KYC Verification Modal for Host */}
      {currentUser && (
        <KycModal
          open={showKycModal}
          onOpenChange={setShowKycModal}
          user={currentUser}
          currentLang={currentLang}
        />
      )}
    </div>
  )
}
