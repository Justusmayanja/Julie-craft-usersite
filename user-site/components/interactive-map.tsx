"use client"

import { MapPin } from "lucide-react"

export function InteractiveMap() {
  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      {/* Google Maps Embed - No API key required */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.7488!2d32.6052!3d0.3476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177db1b1b1b1b1b1%3A0x1b1b1b1b1b1b1b1b!2sNtinda%2C%20Kampala%2C%20Uganda!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Julie Crafts Location - Ntinda, Kampala"
        className="rounded-lg"
      />

      {/* Overlay with business information */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary rounded-full flex-shrink-0">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-primary mb-1">Julie Crafts</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ntinda View Apartments
              <br />
              Ntinda, Kampala, Uganda
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Authentic Ugandan Handmade Crafts
            </p>
          </div>
        </div>
      </div>

      {/* Get Directions Button */}
      <div className="absolute bottom-4 right-4">
        <a
          href="https://maps.google.com/?q=Ntinda+View+Apartments+Kampala+Uganda"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg"
        >
          <MapPin className="h-4 w-4" />
          Get Directions
        </a>
      </div>
    </div>
  )
}