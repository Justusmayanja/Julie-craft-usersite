"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hide loading overlay when page is fully loaded
    const handleLoad = () => {
      setIsLoading(false)
    }

    // Show loading overlay when page starts loading
    const handleBeforeUnload = () => {
      setIsLoading(true)
    }

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      setIsLoading(false)
    } else {
      window.addEventListener('load', handleLoad)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-6">
        {/* Logo */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/10">
          <Image 
            src="/julie-logo.jpeg" 
            alt="JulieCraft Logo" 
            fill
            sizes="64px"
            className="object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        
        {/* Loading Spinner */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">JulieCraft Admin</h2>
            <p className="text-sm text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}
