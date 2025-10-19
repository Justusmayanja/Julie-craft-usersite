"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  onClick?: () => void
  editable?: boolean
  className?: string
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm", 
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg"
}

const imageSizeClasses = {
  sm: { width: 24, height: 24 },
  md: { width: 32, height: 32 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 }
}

export function Avatar({ 
  src, 
  alt = "Avatar", 
  fallback = "U", 
  size = "md", 
  onClick, 
  editable = false,
  className,
  ...props 
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false)
  const [imageLoading, setImageLoading] = React.useState(true)

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayFallback = imageError || !src || src === ""
  const initials = fallback !== "U" ? getInitials(fallback) : fallback

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold select-none transition-all duration-200",
        sizeClasses[size],
        editable && "cursor-pointer hover:shadow-lg hover:scale-105",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {!displayFallback && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={size === "sm" ? "24px" : size === "md" ? "32px" : size === "lg" ? "48px" : "64px"}
          className={cn(
            "rounded-full object-cover transition-opacity duration-200",
            imageLoading ? "opacity-0" : "opacity-100"
          )}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      
      {displayFallback && (
        <span className="font-bold">
          {initials}
        </span>
      )}

      {editable && (
        <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}
    </div>
  )
}
