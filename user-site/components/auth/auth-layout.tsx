"use client"

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  backLabel?: string
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showBackButton = true,
  backHref = "/",
  backLabel = "Back to Home"
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {showBackButton && (
          <div className="mb-4 sm:mb-6">
            <Link href={backHref} className="inline-block">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                {backLabel}
              </Button>
            </Link>
          </div>
        )}

        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative">
                  <Logo 
                    variant="default" 
                    size="xl" 
                    dark={false}
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}

