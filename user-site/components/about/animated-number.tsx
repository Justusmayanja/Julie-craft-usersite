"use client"

import { useState, useEffect, useRef } from "react"
import { useInView } from "framer-motion"
import { useReducedMotion } from "framer-motion"

interface AnimatedNumberProps {
  value: string
  duration?: number
  className?: string
}

/**
 * Extracts numeric value and suffix from a string like "500+" or "15%"
 */
function parseValue(value: string): { number: number; suffix: string } {
  // Match number with optional decimal, followed by optional suffix
  const match = value.match(/^([\d,]+\.?\d*)(.*)$/)
  if (!match) {
    return { number: 0, suffix: "" }
  }
  
  const numberStr = match[1].replace(/,/g, "")
  const number = parseFloat(numberStr) || 0
  const suffix = match[2] || ""
  
  return { number, suffix }
}

export function AnimatedNumber({ value, duration = 2000, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<string>("0")
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const prefersReducedMotion = useReducedMotion()
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startValueRef = useRef<number>(0)

  useEffect(() => {
    if (!isInView || hasAnimated) {
      // Show final value if not animating
      if (!hasAnimated && !isInView) {
        setDisplayValue(value)
      }
      return
    }

    // Check for reduced motion preference
    if (prefersReducedMotion) {
      // Skip animation, show final value immediately
      setDisplayValue(value)
      setHasAnimated(true)
      return
    }

    const { number: targetValue, suffix } = parseValue(value)
    startValueRef.current = 0
    startTimeRef.current = performance.now()

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValueRef.current + (targetValue - startValueRef.current) * easeOut

      // Format number (handle decimals if needed)
      const formattedValue = targetValue % 1 === 0
        ? Math.floor(currentValue).toLocaleString()
        : currentValue.toFixed(1)

      setDisplayValue(`${formattedValue}${suffix}`)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value) // Ensure final value is exact
        setHasAnimated(true)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isInView, value, duration, hasAnimated, prefersReducedMotion])

  return (
    <span 
      ref={ref} 
      className={`${className} inline-block max-w-full`}
    >
      {displayValue}
    </span>
  )
}

