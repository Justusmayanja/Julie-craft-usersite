"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { AdminRedirectGuard } from "@/components/admin-redirect-guard"
import { NotificationProvider } from "@/contexts/notification-context"

interface LayoutContentProps {
  children: React.ReactNode
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname()
  
  // Check if we're on an admin page
  const isAdminPage = pathname?.startsWith('/admin')
  
  // For admin pages, don't render Navigation and Footer
  if (isAdminPage) {
    return <>{children}</>
  }
  
  // Pages that should not have footer (focused user flows)
  const noFooterPages = [
    '/cart',
    '/orders',
    '/profile',
    '/account',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/order-confirmation'
  ]
  
  // Check if current page should not have footer
  const shouldHideFooter = pathname ? noFooterPages.some(page => 
    pathname === page || pathname.startsWith(`${page}/`)
  ) : false
  
  // For regular pages, render with Navigation and conditionally with Footer
  // Wrap in AdminRedirectGuard to redirect admins away from user pages
  return (
    <NotificationProvider isAdmin={false}>
      <AdminRedirectGuard>
        <div className="relative flex min-h-screen flex-col overflow-x-hidden w-full">
          <Navigation />
          <main className="flex-1 w-full overflow-x-hidden pt-14 sm:pt-16">
            {children}
          </main>
          {!shouldHideFooter && <Footer />}
        </div>
      </AdminRedirectGuard>
    </NotificationProvider>
  )
}

