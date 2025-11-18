"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { LoadingOverlay } from "@/components/loading-overlay"
import { useAuth } from "@/contexts/auth-context"
import { useRole } from "@/contexts/role-context"
import { Loader2 } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/admin/ui/toast"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const { isAdmin, isLoading: roleLoading } = useRole()
  const router = useRouter()
  const pathname = usePathname()

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Redirect to login if not authenticated or not admin
  useEffect(() => {
    // Only redirect after both loading states are complete
    // Make sure we have a pathname before checking
    if (!isLoading && !roleLoading && pathname) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin')
      } else if (isAuthenticated && !isAdmin && pathname.startsWith('/admin')) {
        // Only redirect if we're absolutely sure the user is not an admin
        // Check if user object has admin flag as a fallback
        const userIsAdmin = user?.is_admin === true || user?.role === 'admin' || user?.role === 'super_admin'
        
        if (!userIsAdmin && !isAdmin) {
          console.log('Non-admin user attempting to access admin page, redirecting to home')
          router.push('/?error=insufficient_privileges')
        } else if (userIsAdmin && !isAdmin) {
          // User object says admin but role context doesn't - wait a bit for role to load
          console.log('User appears to be admin but role context not loaded yet, waiting...')
        }
      }
    }
  }, [isLoading, roleLoading, isAuthenticated, isAdmin, pathname, router, user])

  const closeSidebar = () => setSidebarOpen(false)

  // Show loading spinner while checking authentication
  if (isLoading || roleLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Don't render layout if not authenticated
  if (!user) {
    return null
  }

  return (
    <ToastProvider>
      <LoadingOverlay />
      <div className="h-screen w-screen flex min-w-0 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSidebar}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 
          fixed md:relative 
          z-50 md:z-auto 
          transition-transform duration-300 ease-in-out
          md:transition-none
          h-screen
        `}>
          <AdminSidebar onClose={closeSidebar} />
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/30 p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ToastProvider>
  )
}
