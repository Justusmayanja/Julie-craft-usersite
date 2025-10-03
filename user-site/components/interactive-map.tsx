"use client"

import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"

declare const google: any

export function InteractiveMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize Google Maps
    const initMap = () => {
      if (!mapRef.current) return

      // Ntinda View Apartments coordinates (approximate)
      const ntindaLocation = { lat: 0.3476, lng: 32.6052 }

      const map = new google.maps.Map(mapRef.current, {
        zoom: 15,
        center: ntindaLocation,
        styles: [
          {
            featureType: "all",
            elementType: "geometry.fill",
            stylers: [{ color: "#f0fdf4" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#84cc16" }, { lightness: 17 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f0fdf4" }, { lightness: 20 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.fill",
            stylers: [{ color: "#15803d" }, { lightness: 17 }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#15803d" }, { lightness: 29 }, { weight: 0.2 }],
          },
          {
            featureType: "road.arterial",
            elementType: "geometry",
            stylers: [{ color: "#15803d" }, { lightness: 18 }],
          },
          {
            featureType: "road.local",
            elementType: "geometry",
            stylers: [{ color: "#15803d" }, { lightness: 16 }],
          },
          {
            featureType: "poi",
            elementType: "geometry",
            stylers: [{ color: "#f0fdf4" }, { lightness: 21 }],
          },
        ],
      })

      // Custom marker for Julie Crafts
      const marker = new google.maps.Marker({
        position: ntindaLocation,
        map: map,
        title: "Julie Crafts - Ntinda View Apartments",
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#15803d" stroke="#ffffff" strokeWidth="4"/>
              <text x="20" y="26" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">JC</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
        },
      })

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #15803d; font-size: 16px; font-weight: bold;">Julie Crafts</h3>
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">Ntinda View Apartments<br>Ntinda, Kampala, Uganda</p>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Authentic Ugandan Handmade Crafts</p>
            <div style="margin-top: 8px;">
              <a href="https://maps.google.com/?q=0.3476,32.6052" target="_blank" style="color: #15803d; text-decoration: none; font-size: 12px;">Get Directions →</a>
            </div>
          </div>
        `,
      })

      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      // Open info window by default
      infoWindow.open(map, marker)
    }

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`
      script.async = true
      script.defer = true
      window.initMap = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-96 rounded-lg" />

      {/* Fallback for when Google Maps is not available */}
      <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center">
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Julie Crafts Location</h3>
          <p className="text-muted-foreground mb-4">
            Ntinda View Apartments
            <br />
            Ntinda, Kampala, Uganda
          </p>
          <a
            href="https://maps.google.com/?q=Ntinda+View+Apartments+Kampala+Uganda"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <MapPin className="h-4 w-4" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}

// Extend the Window interface to include initMap
declare global {
  interface Window {
    initMap: () => void
    google: any
  }
}
