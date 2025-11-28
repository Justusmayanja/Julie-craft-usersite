"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react'

function ResetPasswordContent() {
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [step, setStep] = useState<'code' | 'password'>('code')
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
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
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return null
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCodeError(null)

    if (!code || code.length !== 6) {
      setCodeError('Please enter a valid 6-digit code')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCodeError('Please enter a valid email address')
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/password-reset/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setCodeError(data.error || 'Invalid or expired reset code')
        return
      }

      if (data.verified && data.tokenId) {
        setTokenId(data.tokenId)
        setStep('password')
      } else {
        setCodeError('Code verification failed')
      }
    } catch (err) {
      console.error('Code verification error:', err)
      setCodeError('An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)

    // Validate password
    const passwordValidation = validatePassword(newPassword)
    if (passwordValidation) {
      setPasswordError(passwordValidation)
      return
    }

    // Validate password match
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password-reset/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          email, 
          newPassword,
          tokenId: tokenId || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to reset password. Please try again.')
        return
      }

      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=password_reset_success')
      }, 2000)
    } catch (err) {
      console.error('Password reset error:', err)
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
          <Link href="/forgot-password" className="inline-block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all duration-200 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
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
                  Reset Password
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  {step === 'code' ? 'Enter your reset code' : 'Create a new password'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Form */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
          
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
                {step === 'code' ? 'Verify Code' : 'New Password'}
              </CardTitle>
            </div>
            <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
              {step === 'code' 
                ? 'Enter the 6-digit code sent to your email'
                : 'Enter your new password below'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5 sm:space-y-6 px-6 sm:px-8 pb-8">
            {success && (
              <Alert className="border-green-200 bg-green-50/80 backdrop-blur-sm shadow-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  Password reset successfully! Redirecting to login...
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {step === 'code' ? (
              <form onSubmit={handleVerifyCode} className="space-y-5">
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-12 pr-4 border-2 border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50 rounded-lg bg-white shadow-sm focus:shadow-md transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-semibold text-slate-700">
                    Reset Code
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={code}
                      onChange={handleCodeChange}
                      maxLength={6}
                      className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 text-center text-2xl font-mono tracking-widest ${
                        codeError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                  </div>
                  {codeError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {codeError}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isVerifying || code.length !== 6}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Verify Code
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordError) setPasswordError(null)
                      }}
                      className={`h-12 pl-12 pr-12 border-2 transition-all duration-200 ${
                        passwordError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 hover:bg-slate-100 rounded-lg transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (confirmPasswordError) setConfirmPasswordError(null)
                      }}
                      className={`h-12 pl-12 pr-12 border-2 transition-all duration-200 ${
                        confirmPasswordError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-10 w-10 hover:bg-slate-100 rounded-lg transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                  {confirmPasswordError && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

