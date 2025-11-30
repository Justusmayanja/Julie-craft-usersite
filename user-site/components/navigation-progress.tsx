"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavigationProgressProps {
  color?: string
  height?: number
  showSpinner?: boolean
}

function NavigationProgressInner({
  color = "bg-blue-600",
  height = 2,
  showSpinner = false,
}: NavigationProgressProps = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true)
    progressRef.current = 10
    setProgress(10)

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Simulate realistic progress
    timerRef.current = setInterval(() => {
      // Fast initial progress
      if (progressRef.current < 30) {
        progressRef.current += 15
      }
      // Medium progress
      else if (progressRef.current < 70) {
        progressRef.current += 8
      }
      // Slow progress near completion
      else if (progressRef.current < 90) {
        progressRef.current += 3
      }
      // Very slow near end
      else if (progressRef.current < 95) {
        progressRef.current += 1
      }

      setProgress(Math.min(progressRef.current, 95))
    }, 50)

    // Complete when navigation is done
    const completeProgress = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      progressRef.current = 100
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        progressRef.current = 0
        setProgress(0)
      }, 300)
    }

    // Complete after a short delay to ensure page is ready
    // Use requestAnimationFrame for better timing
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        completeProgress()
      })
    })

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      cancelAnimationFrame(rafId)
    }
  }, [pathname, searchParams])

  // Listen for link clicks to start progress earlier
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href) {
        const url = new URL(link.href)
        const currentUrl = window.location
        
        // Only start progress if navigating to a different page
        if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
          setIsLoading(true)
          progressRef.current = 5
          setProgress(5)
        }
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    return () => {
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [])

  if (!isLoading && progress === 0) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{ height: `${height}px` }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading progress"
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out shadow-lg",
          color
        )}
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5), 0 0 5px rgba(59, 130, 246, 0.3)",
        }}
      >
        {/* Shimmer animation */}
        <div
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
          style={{
            animation: "shimmer 1.5s infinite",
          }}
        />
      </div>
      
      {/* Optional spinner in corner */}
      {showSpinner && isLoading && (
        <div className="absolute top-2 right-4">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export function NavigationProgress(props: NavigationProgressProps) {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner {...props} />
    </Suspense>
  )
}
