"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  propertyId: string
  initialIsFavorited: boolean
  isLoggedIn: boolean
  className?: string
}

export default function FavoriteButton({ propertyId, initialIsFavorited, isLoggedIn, className }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if wrapped in a Link
    
    if (!isLoggedIn) {
      router.push('/signin')
      return
    }

    if (loading) return
    setLoading(true)

    // Optimistic UI update
    const previousState = isFavorited
    setIsFavorited(!previousState)

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId })
      })

      if (!res.ok) throw new Error("Failed")
      
      const data = await res.json()
      setIsFavorited(data.isFavorited)
      router.refresh()
    } catch {
      setIsFavorited(previousState) // Revert on failure
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={toggleFavorite}
      className={cn("p-2 rounded-full hover:bg-black/10 transition-colors z-10", className)}
      aria-label="Save to Wishlist"
    >
      <Heart 
        className={cn(
          "h-6 w-6 transition-all duration-300", 
          isFavorited ? "fill-rose-500 text-rose-500 scale-110" : "fill-black/30 text-white"
        )} 
      />
    </button>
  )
}
