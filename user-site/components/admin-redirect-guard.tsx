"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useRole } from '@/contexts/role-context'

/**
 * Component that redirects admin users away from user-site pages
 * This is a client-side backup to the middleware protection
 */
export function AdminRedirectGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { isAdmin, isLoading: roleLoading } = useRole()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only check if authentication and role loading are complete
    if (!authLoading && !roleLoading) {
      // Only redirect if user is authenticated, is an admin, AND is NOT already on an admin page
      if (isAuthenticated && isAdmin && pathname && !pathname.startsWith('/admin')) {
        console.log('AdminRedirectGuard - Admin user detected on user page, redirecting to /admin')
        router.replace('/admin')
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, roleLoading, pathname, router])

  // Don't render children if admin is being redirected (and not already on admin page)
  if (!authLoading && !roleLoading && isAuthenticated && isAdmin && pathname && !pathname.startsWith('/admin')) {
    return null
  }

  return <>{children}</>
}

