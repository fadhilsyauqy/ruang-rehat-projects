import { 
  Wifi, 
  Waves, 
  Utensils, 
  Wind, 
  Car, 
  Clock, 
  PawPrint, 
  Tv, 
  Dumbbell, 
  Sparkles,
  Coffee,
  Bath
} from "lucide-react"

import type { LucideIcon } from "lucide-react"

export interface AmenityDefinition {
  id: string
  label: {
    id: string
    en: string
  }
  icon: LucideIcon
}

export const ALL_AMENITIES: AmenityDefinition[] = [
  {
    id: "wifi",
    label: { id: "Wi-Fi Cepat", en: "Fast Wi-Fi" },
    icon: Wifi,
  },
  {
    id: "pool",
    label: { id: "Kolam Renang", en: "Swimming Pool" },
    icon: Waves,
  },
  {
    id: "breakfast",
    label: { id: "Sarapan Gratis", en: "Free Breakfast" },
    icon: Utensils,
  },
  {
    id: "ac",
    label: { id: "AC / Pendingin Ruangan", en: "Air Conditioning" },
    icon: Wind,
  },
  {
    id: "parking",
    label: { id: "Parkir Gratis", en: "Free Parking" },
    icon: Car,
  },
  {
    id: "reception",
    label: { id: "Resepsionis 24 Jam", en: "24h Reception" },
    icon: Clock,
  },
  {
    id: "pets",
    label: { id: "Ramah Hewan", en: "Pet Friendly" },
    icon: PawPrint,
  },
  {
    id: "tv",
    label: { id: "Smart TV & Streaming", en: "Smart TV & Streaming" },
    icon: Tv,
  },
  {
    id: "gym",
    label: { id: "Pusat Kebugaran / Gym", en: "Fitness Center" },
    icon: Dumbbell,
  },
  {
    id: "kitchen",
    label: { id: "Dapur Lengkap", en: "Kitchen" },
    icon: Coffee,
  },
  {
    id: "bathtub",
    label: { id: "Bathtub Mewah", en: "Luxury Bathtub" },
    icon: Bath,
  },
  {
    id: "cleaning",
    label: { id: "Layanan Kebersihan", en: "Daily Housekeeping" },
    icon: Sparkles,
  },
]

export function getAmenityById(id: string): AmenityDefinition {
  const found = ALL_AMENITIES.find(a => a.id.toLowerCase() === id.toLowerCase())
  if (found) return found
  return {
    id,
    label: { id, en: id },
    icon: Sparkles
  }
}
