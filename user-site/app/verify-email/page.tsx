"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Mail, ArrowLeft, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const [logoUrl, setLogoUrl] = useState<string>('/julie-logo.jpeg')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/site-content/settings')
        const data = await response.json()
        if (data.settings?.logo_url?.value) {
          setLogoUrl(data.settings.logo_url.value)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    fetchLogo()
  }, [])

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('No verification token provided. Please check your email for the verification link.')
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Your email has been verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to verify email. The link may have expired or is invalid.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An error occurred while verifying your email. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleResendEmail = async () => {
    // This would require the user's email, which we don't have on this page
    // We could redirect to a resend page or show a form
    router.push('/resend-verification')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-2.5 border-2 border-primary/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  {logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== '' ? (
                    <Image
                      src={logoUrl}
                      alt="Julie Crafts Logo"
                      fill
                      sizes="80px"
                      className="object-contain rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== '/julie-logo.jpeg') {
                          target.src = '/julie-logo.jpeg'
                        } else {
                          target.style.display = 'none'
                        }
                      }}
                    />
                  ) : (
                    <Image
                      src="/julie-logo.jpeg"
                      alt="Julie Crafts Logo"
                      fill
                      sizes="80px"
                      className="object-contain rounded-lg"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Email Verification
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  Verifying your email address
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
          
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
              {status === 'loading' && 'Verifying...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
              {status === 'loading' && 'Please wait while we verify your email address'}
              {status === 'success' && 'Your email has been successfully verified'}
              {status === 'error' && 'We couldn\'t verify your email address'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-slate-600 text-center">Verifying your email address...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
                    <CheckCircle className="h-16 w-16 text-green-500 relative" />
                  </div>
                </div>
                
                <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">
                    {message}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                  >
                    Continue to Sign In
                  </Button>
                  
                  <Link href="/" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-lg transition-all duration-200"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
                    <XCircle className="h-16 w-16 text-red-500 relative" />
                  </div>
                </div>
                
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {message}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full h-12 border-2 border-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-lg transition-all duration-200"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>
                  
                  <Link href="/register" className="block">
                    <Button
                      variant="outline"
                      className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-lg transition-all duration-200"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Create New Account
                    </Button>
                  </Link>
                  
                  <Link href="/" className="block">
                    <Button
                      variant="ghost"
                      className="w-full h-12 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold rounded-lg transition-all duration-200"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-slate-600 text-center">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

