import Link from "next/link"
import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Home, Heart, Luggage, Sparkles, ShieldCheck } from "lucide-react"
import { cookies } from "next/headers"
import { getDictionary } from "@/lib/dictionary"
import SearchFilterBar from "./SearchFilterBar"
import NavbarSubFilters from "./NavbarSubFilters"
import LogoutConfirmModal from "./LogoutConfirmModal"

export default async function Navbar() {
  const session = await auth()
  
  // Baca konfigurasi bahasa & mata uang dari Cookie
  const cookieStore = await cookies()
  const currentLang = cookieStore.get('lang')?.value || 'id'
  const currentCurrency = cookieStore.get('currency')?.value || 'IDR'
  const t = getDictionary(currentLang)

  return (
    <nav className="border-b bg-white dark:bg-gray-950 dark:border-gray-800">
      <div className="max-w-[2520px] mx-auto px-4 sm:px-6 xl:px-8">
        <div className="flex justify-between h-20 items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            {/* Logo untuk Tema Terang (Light Mode) */}
            <img
              src="/logo-light.png"
              alt="Ruang Rehat"
              className="h-10 w-auto object-contain dark:hidden transition-transform group-hover:scale-105"
            />
            {/* Logo untuk Tema Gelap (Dark Mode) */}
            <img
              src="/logo-dark.png"
              alt="Ruang Rehat"
              className="h-10 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105"
            />
          </Link>
          
          {/* Search Bar in Navbar */}
          <div className="flex-1 max-w-[850px] mx-auto hidden md:block">
            <SearchFilterBar 
              dict={{
                where: t.where,
                when: t.when,
                addDates: t.addDates,
                addCheckOut: t.addCheckOut,
                checkIn: t.checkIn,
                checkOut: t.checkOut,
                who: t.who,
                searchDest: t.searchDest,
                addGuests: t.addGuests,
                exactDates: t.exactDates,
                suggestedDestinations: t.suggestedDestinations,
                search: t.search,
                clearAll: t.clearAll,
                adultsLabel: t.adultsLabel,
                adultsDesc: t.adultsDesc,
                childrenLabel: t.childrenLabel,
                childrenDesc: t.childrenDesc,
                infantsLabel: t.infantsLabel,
                infantsDesc: t.infantsDesc,
                petsLabel: t.petsLabel,
                petsDesc: t.petsDesc,
                guestUnit: t.guestUnit,
                infantUnit: t.infantUnit,
                petUnit: t.petUnit,
              }} 
              currentLang={currentLang}
            />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.role === 'ADMIN' && (
                  <Link 
                    href="/admin" 
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Admin Portal</span>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-10 w-10 rounded-full focus:outline-none cursor-pointer">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                      <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="cursor-pointer flex w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t.profile}</span>
                    </Link>
                  </DropdownMenuItem>

                  {session.user?.role === 'ADMIN' && (
                    <DropdownMenuItem>
                      <Link href="/admin" className="cursor-pointer flex w-full font-semibold text-purple-600 dark:text-purple-400">
                        <ShieldCheck className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span>{currentLang === "en" ? "Admin Audit Portal" : "Portal Audit Admin"}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {session.user?.role === 'HOST' ? (
                    <>
                      <DropdownMenuItem>
                        <Link href="/dashboard" className="cursor-pointer flex w-full">
                          <Home className="mr-2 h-4 w-4" />
                          <span>{t.hostDashboard}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/dashboard?tab=trips" className="cursor-pointer flex w-full">
                          <Luggage className="mr-2 h-4 w-4" />
                          <span>{t.myTrips}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem>
                        <Link href="/dashboard" className="cursor-pointer flex w-full">
                          <Luggage className="mr-2 h-4 w-4" />
                          <span>{t.myTrips}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/properties/new" className="cursor-pointer flex w-full">
                          <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                          <span>{t.hostTabGuestTitle || (currentLang === "en" ? "Become a Host" : "Menjadi Tuan Rumah")}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuItem>
                    <Link href="/wishlists" className="cursor-pointer flex w-full">
                      <Heart className="mr-2 h-4 w-4 text-rose-500" />
                      <span>{t.wishlists}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <LogoutConfirmModal
                      triggerLabel={t.logout}
                      title={t.logoutConfirmTitle}
                      description={t.logoutConfirmDesc}
                      cancelLabel={t.cancel}
                      loadingLabel={t.processing}
                    />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/signin" className={cn(buttonVariants({ variant: "default" }), "bg-rose-500 hover:bg-rose-600 text-white rounded-full px-5 font-semibold text-xs transition-all shadow-sm")}>
                  {t.login}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub Filter Bar (Filters Fasilitas & Price Range Wilayah) tepat di bawah Search Bar Navbar */}
      <NavbarSubFilters
        currentLang={currentLang}
        currentCurrency={currentCurrency}
        t={t}
      />
    </nav>
  )
}
