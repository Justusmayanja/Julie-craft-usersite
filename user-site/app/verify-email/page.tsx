"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InputField } from '@/components/auth/input-field'
import { Loader2, CheckCircle, XCircle, Mail, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react'

function VerifyEmailContent() {
  const [code, setCode] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Pre-fill email from URL if provided
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6) // Only digits, max 6
    setCode(value)
    if (codeError) {
      setCodeError(null)
    }
    if (status === 'error') {
      setStatus('idle')
      setMessage('')
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      setEmailError(null)
    }
    if (status === 'error') {
      setStatus('idle')
      setMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset errors
    setCodeError(null)
    setEmailError(null)
    setMessage('')
    
    // Validate code
    if (!code || code.length !== 6) {
      setCodeError('Please enter a valid 6-digit verification code')
      return
    }

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email: email.toLowerCase() }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Your email has been verified successfully!')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to verify email. The code may be incorrect or expired.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('An error occurred while verifying your email. Please try again.')
    }
  }

  const handleResendEmail = async () => {
    router.push('/resend-verification')
  }

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the code sent to your email"
      showBackButton={false}
    >
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
        
        <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
            {status === 'success' ? 'Email Verified!' : 'Enter Verification Code'}
          </CardTitle>
          <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
            {status === 'success' 
              ? 'Your email has been successfully verified'
              : 'Check your email for the 6-digit verification code'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
          {/* Success State */}
          {status === 'success' ? (
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
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                >
                  Continue to Sign In
                </Button>
                
                <Link href="/" className="block">
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-xl transition-all duration-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                error={emailError}
                icon={<Mail className="h-5 w-5" />}
                required
                disabled={status === 'loading'}
                autoComplete="email"
              />

              <InputField
                label="Verification Code"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                error={codeError}
                icon={<KeyRound className="h-5 w-5" />}
                required
                maxLength={6}
                disabled={status === 'loading'}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-slate-500 -mt-2">
                Enter the 6-digit code sent to your email address
              </p>

              {/* Error Message */}
              {status === 'error' && message && (
                <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={status === 'loading' || code.length !== 6 || !email}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Verify Email
                  </>
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendEmail}
                  className="text-sm text-slate-600 hover:text-primary"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Didn't receive the code? Resend
                </Button>
              </div>

              {/* Back Links */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <Link href="/register" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-xl transition-all duration-200"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Create New Account
                  </Button>
                </Link>
                
                <Link href="/" className="block">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-12 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold rounded-xl transition-all duration-200"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
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
