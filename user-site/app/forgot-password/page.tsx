"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InputField } from '@/components/auth/input-field'
import { Loader2, ArrowLeft, Mail, CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const router = useRouter()

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError(null)
    return true
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      setEmailError(null)
    }
    if (error) {
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404 && data.code === 'EMAIL_NOT_FOUND') {
          setError('No account found with this email address. Please check your email and try again, or sign up for a new account.')
        } else {
          setError(data.error || 'Failed to send reset code. Please try again.')
        }
        return
      }

      // Success - code was sent
      if (data.success) {
        setSuccess(true)
        // Redirect to reset password page with email
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        setError('Failed to send reset code. Please try again.')
      }
    } catch (err) {
      console.error('Password reset request error:', err)
      setError('An error occurred. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="We'll send you a reset code"
      showBackButton={true}
      backHref="/login"
      backLabel="Back to Login"
    >
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
        
        <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
              Reset Password
            </CardTitle>
          </div>
          <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
            Enter your email address and we'll send you a 6-digit code to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
          {success && (
            <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Reset code sent! Redirecting to reset page...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                {error}
                {error.includes('No account found') && (
                  <div className="mt-2">
                    <Link 
                      href="/register" 
                      className="text-red-700 hover:text-red-900 font-semibold underline"
                    >
                      Create a new account instead
                    </Link>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleInputChange}
                error={emailError}
                icon={<Mail className="h-5 w-5" />}
                required
                disabled={isLoading}
                autoComplete="email"
              />

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Send Reset Code
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="text-center pt-4">
            <Link 
              href="/login" 
              className="text-sm text-slate-600 hover:text-primary font-medium transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
