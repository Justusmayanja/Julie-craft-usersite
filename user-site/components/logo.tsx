"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "default" | "compact" | "full" | "text-only"
  className?: string
  showTagline?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  dark?: boolean
}

/**
 * Logo Component
 * 
 * Displays the Julie Crafts logo with support for:
 * - Script-style logos with taglines
 * - Black background logos
 * - Responsive sizing
 * - Fallback to text if image fails
 */
export function Logo({ 
  variant = "default", 
  className,
  showTagline = true,
  size = "md",
  dark = false
}: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string>('/julie-logo.jpeg')
  const [imageError, setImageError] = useState(false)

  // Load logo from site settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/site-content/settings')
        const data = await response.json()
        const logoValue = data.settings?.logo_url?.value
        if (logoValue && typeof logoValue === 'string' && logoValue.trim() !== '') {
          setLogoUrl(logoValue)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    fetchLogo()
  }, [])

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-8 w-8 sm:h-10 sm:w-10",
      image: "p-0.5 sm:p-1",
      text: "text-base sm:text-lg",
      tagline: "text-[8px] sm:text-[10px]"
    },
    md: {
      container: "h-10 w-10 sm:h-12 sm:w-12",
      image: "p-1 sm:p-1.5",
      text: "text-lg sm:text-xl",
      tagline: "text-[10px] sm:text-xs"
    },
    lg: {
      container: "h-12 w-12 sm:h-16 sm:w-16",
      image: "p-1.5 sm:p-2",
      text: "text-xl sm:text-2xl",
      tagline: "text-xs sm:text-sm"
    },
    xl: {
      container: "h-16 w-16 sm:h-20 sm:w-20",
      image: "p-2 sm:p-2.5",
      text: "text-2xl sm:text-3xl",
      tagline: "text-sm sm:text-base"
    }
  }

  const config = sizeConfig[size]

  // Compact variant (icon only)
  if (variant === "compact") {
    return (
      <div className={cn("relative rounded-xl overflow-hidden", config.container, className)}>
        {!imageError ? (
          <Image
            src={logoUrl}
            alt="Julie Crafts Logo"
            fill
            sizes="(max-width: 640px) 32px, 40px"
            className={cn("object-contain", config.image, dark ? "bg-white/80" : "bg-white/10")}
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center font-bold",
            dark ? "bg-white/80 text-orange-500" : "bg-primary/20 text-primary"
          )}>
            JC
          </div>
        )}
      </div>
    )
  }

  // Text-only variant (for when logo image isn't suitable)
  if (variant === "text-only") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <span className={cn(
          "font-serif font-bold tracking-wide",
          config.text,
          dark ? "text-orange-500" : "text-slate-900"
        )}>
          Julie Crafts
        </span>
        {showTagline && (
          <span className={cn(
            "font-sans uppercase tracking-wider font-semibold",
            config.tagline,
            dark ? "text-blue-500" : "text-blue-600"
          )}>
            HANDMADE EXCELLENCE
          </span>
        )}
      </div>
    )
  }

  // Full variant (logo with text and tagline)
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className={cn("relative rounded-xl overflow-hidden flex-shrink-0", config.container)}>
          {!imageError ? (
            <Image
              src={logoUrl}
              alt="Julie Crafts Logo"
              fill
              sizes="(max-width: 640px) 48px, 64px"
              className={cn("object-contain", config.image, dark ? "bg-white/80" : "bg-white/10")}
              onError={() => setImageError(true)}
              priority
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center font-bold",
              dark ? "bg-white/80 text-orange-500" : "bg-primary/20 text-primary"
            )}>
              JC
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className={cn(
            "font-serif font-bold tracking-wide leading-tight",
            config.text,
            dark ? "text-orange-500" : "text-white"
          )}>
            Julie Crafts
          </span>
          {showTagline && (
            <span className={cn(
              "font-sans uppercase tracking-wider font-semibold leading-tight",
              config.tagline,
              dark ? "text-blue-500" : "text-blue-400"
            )}>
              HANDMADE EXCELLENCE
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default variant (logo image that adapts to script-style logos)
  return (
    <div className={cn("relative rounded-xl overflow-hidden", config.container, className)}>
      {!imageError ? (
        <Image
          src={logoUrl}
          alt="Julie Crafts Logo"
          fill
          sizes="(max-width: 640px) 40px, 48px"
          className={cn(
            "object-contain",
            config.image,
            // Support for semi-transparent white background logos
            dark ? "bg-white/80" : "bg-transparent"
          )}
          style={{
            // Ensure script fonts and taglines are visible
            objectFit: "contain",
            objectPosition: "center"
          }}
          onError={() => setImageError(true)}
          priority
        />
      ) : (
        <div className={cn(
          "w-full h-full flex flex-col items-center justify-center font-bold",
          dark ? "bg-white/80 text-orange-500" : "bg-primary/20 text-primary"
        )}>
          <span className={cn(config.text)}>JC</span>
        </div>
      )}
    </div>
  )
}

