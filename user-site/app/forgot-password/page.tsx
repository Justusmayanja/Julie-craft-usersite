"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/login" className="inline-block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all duration-200 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Button>
          </Link>
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-2.5 border-2 border-primary/20 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Image
                    src="/julie-logo.jpeg"
                    alt="Julie Crafts Logo"
                    fill
                    sizes="80px"
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Forgot Password?
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  We'll send you a reset code
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Forgot Password Form */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
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
          
          <CardContent className="space-y-5 sm:space-y-6 px-6 sm:px-8 pb-8">
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) {
                          setEmailError(null)
                        }
                      }}
                      className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 ${
                        emailError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </div>
  )
}

