"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { Star } from "lucide-react";

interface Property {
  id: string;
  title: string;
  price?: number | null;
  pricePerNight?: number;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  reviews?: any[];
}

interface MapProps {
  properties: Property[];
  onBoundsChange?: (lat: number, lng: number, radius: number) => void;
  hoveredId?: string | null;
  currentCurrency?: string;
  t?: any;
}

function MapEvents({ onBoundsChange, properties }: { onBoundsChange?: (lat: number, lng: number, radius: number) => void, properties: Property[] }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const center = map.getCenter();
        const bounds = map.getBounds();
        const radius = center.distanceTo(bounds.getNorthEast()) / 1000; // in km
        onBoundsChange(center.lat, center.lng, radius);
      }
    },
  });

  // Fit bounds to all properties whenever properties change
  useEffect(() => {
    if (properties && properties.length > 0) {
      const bounds = L.latLngBounds(properties.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [properties, map]);

  return null;
}

export default function Map({ properties, onBoundsChange, hoveredId, currentCurrency = 'IDR', t = {} }: MapProps) {
  
  // Custom Icon factory based on hover state
  const createPriceIcon = (price: number, isHovered: boolean) => {
    const formattedPrice = formatPrice(price, currentCurrency);
    const bgClass = isHovered 
      ? 'bg-gray-900 text-white scale-110 z-50' 
      : 'bg-white text-gray-900 shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:scale-110';
      
    const htmlString = `
      <div class="relative flex items-center justify-center px-3 py-1.5 rounded-full font-bold text-[13px] transition-all duration-200 border border-gray-200 ${bgClass}" style="min-width: max-content;">
        ${formattedPrice}
      </div>
    `;

    return L.divIcon({
      html: htmlString,
      className: 'bg-transparent border-none', // Override default leaflet class
      iconSize: [0, 0], // Let the div dictate size
      iconAnchor: [40, 15], // Approximate center anchoring
      popupAnchor: [0, -20]
    });
  };

  const centerLat = properties.length > 0 ? properties[0].latitude : -6.2;
  const centerLng = properties.length > 0 ? properties[0].longitude : 106.8;

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={11} className="w-full h-full z-0">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapEvents onBoundsChange={onBoundsChange} properties={properties} />
      {properties.map((p) => {
        const isHovered = hoveredId === p.id;
        
        const avgRating = p.reviews && p.reviews.length > 0 
          ? (p.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / p.reviews.length).toFixed(2)
          : null;

        const rawPriceIdr = p.pricePerNight || (p.price ? p.price * 18051 : 0);
        return (
          <Marker 
            key={p.id} 
            position={[p.latitude, p.longitude]}
            icon={createPriceIcon(rawPriceIdr, isHovered)}
            zIndexOffset={isHovered ? 1000 : 0}
          >
            <Popup className="custom-popup" minWidth={260} maxWidth={260}>
              <Link href={`/properties/${p.id}`} className="block group !text-inherit !no-underline">
                <div className="flex flex-col gap-0 w-full overflow-hidden rounded-xl">
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-200 rounded-t-xl">
                    <img 
                      src={p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=400&h=300'} 
                      alt={p.title}
                      className="object-cover h-full w-full"
                    />
                  </div>
                  <div className="p-3 bg-white">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-[15px] truncate mr-2 leading-tight text-gray-900">{p.title}</h3>
                      <div className="flex items-center gap-1 text-[13px] font-semibold text-gray-900">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{avgRating || t?.newListing || "New"}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1 text-gray-900">
                      <span className="font-bold text-[15px]">{formatPrice(rawPriceIdr, currentCurrency)}</span>
                      <span className="font-normal text-gray-500 text-[13px]"> / {t?.night || 'night'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  );
}
