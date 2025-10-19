"use client"

import { usePathname } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { LoadingOverlay } from "@/components/loading-overlay"

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
  
  // For regular pages, render with Navigation and Footer
  return (
    <>
      <LoadingOverlay />
      <div className="relative flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </>
  )
}

