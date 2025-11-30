"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export function ProgressBar() {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Start loading when route changes
    setIsLoading(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        // Accelerate progress, then slow down
        const increment = prev < 50 ? 10 : prev < 80 ? 5 : 2
        return Math.min(prev + increment, 90)
      })
    }, 100)

    // Complete progress when page is loaded
    const handleComplete = () => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }

    // Use requestAnimationFrame to detect when page is ready
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handleComplete()
      })
    })

    return () => {
      clearInterval(interval)
      cancelAnimationFrame(rafId)
    }
  }, [pathname, searchParams])

  if (!isLoading && progress === 0) return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent transition-opacity duration-200",
        isLoading ? "opacity-100" : "opacity-0"
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading progress"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 shadow-lg transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
        }}
      >
        {/* Shimmer effect */}
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      </div>
    </div>
  )
}

