"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InputField } from '@/components/auth/input-field'
import { Loader2, ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'

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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (codeError) {
      setCodeError(null)
    }
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return 'Password is required'
    }
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewPassword(value)
    if (passwordError) {
      setPasswordError(null)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (confirmPasswordError) {
      setConfirmPasswordError(null)
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

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password')
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
    <AuthLayout
      title="Reset Password"
      subtitle={step === 'code' ? 'Enter your reset code' : 'Create a new password'}
      showBackButton={true}
      backHref="/forgot-password"
      backLabel="Back"
    >
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
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
        
        <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
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
            <form onSubmit={handleVerifyCode} className="space-y-6" noValidate>
              <InputField
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                error={codeError && codeError.includes('email') ? codeError : undefined}
                icon={<Mail className="h-5 w-5" />}
                required
                disabled={isVerifying}
                autoComplete="email"
              />

              <InputField
                label="Reset Code"
                name="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                error={codeError && !codeError.includes('email') ? codeError : undefined}
                icon={<KeyRound className="h-5 w-5" />}
                required
                maxLength={6}
                disabled={isVerifying}
                className="text-center text-2xl font-mono tracking-widest"
              />
              <p className="text-xs text-slate-500 -mt-2">
                Enter the 6-digit code sent to your email
              </p>

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
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
            <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
              <InputField
                label="New Password"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={handlePasswordChange}
                error={passwordError}
                icon={<Lock className="h-5 w-5" />}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={confirmPasswordError}
                icon={<Lock className="h-5 w-5" />}
                showPasswordToggle
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
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
    </AuthLayout>
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
