"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

/**
 * SessionGuard component that monitors authentication state
 * and redirects users away from admin pages if they log out
 */
export function SessionGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only check if we're on an admin page
    if (!pathname?.startsWith('/admin')) {
      return
    }

    // Wait for auth to finish loading
    if (isLoading) {
      return
    }

    // Check if user is logged out (no token in localStorage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null

    // If user is not authenticated or token is missing, redirect to login
    if (!isAuthenticated || !token) {
      console.log('SessionGuard: User logged out, redirecting to login')
      router.push('/login?redirect=/admin&message=session_expired')
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // This component doesn't render anything
  return null
}

