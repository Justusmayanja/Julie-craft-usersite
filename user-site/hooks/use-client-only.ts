import { useState, useEffect } from 'react'

/**
 * Hook to prevent hydration mismatches by only rendering content on the client
 * Useful for components that depend on localStorage, window object, or other client-only APIs
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}
