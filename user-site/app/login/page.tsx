"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InputField } from '@/components/auth/input-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, Mail, Lock, Shield, Info, Sparkles } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({})
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const { login, error, clearError, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for message parameter in URL
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'logged_out') {
      setInfoMessage('You have been successfully logged out. Please sign in again to continue.')
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (message === 'session_expired') {
      setInfoMessage('Your session has expired. Please sign in again to continue.')
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (message === 'password_reset_success') {
      setInfoMessage('Your password has been reset successfully! Please sign in with your new password.')
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}
    
    if (!email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      errors.password = 'Password is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    clearError()
    setFormErrors({})

    try {
      const loggedInUser = await login(email, password)
      
      // Check for redirect parameter or redirect based on user role
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect')
      
      if (redirectTo) {
        router.push(redirectTo)
      } else if (loggedInUser) {
        // Check admin status immediately from login response
        const userIsAdmin = loggedInUser.is_admin === true || loggedInUser.role === 'admin' || loggedInUser.role === 'super_admin'
        
        if (userIsAdmin) {
          router.push('/admin')
        } else {
          router.push('/')
        }
      } else {
        router.push('/')
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue shopping"
    >
      <Card className="rounded-2xl border-0 bg-white shadow-none sm:shadow-md overflow-hidden">
        <CardHeader className="space-y-2 pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
              Sign In
            </CardTitle>
          </div>
          <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
          {infoMessage && (
            <Alert className="border-blue-200 bg-blue-50/80 backdrop-blur-sm shadow-sm">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">{infoMessage}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
              <AlertDescription className="text-red-800 text-sm">
                {error.includes('Invalid') || error.includes('incorrect') 
                  ? 'Invalid email or password. Please check your credentials and try again.'
                  : error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <InputField
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (formErrors.email) {
                  setFormErrors(prev => ({ ...prev, email: undefined }))
                }
              }}
              error={formErrors.email}
              icon={<Mail className="h-5 w-5" />}
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                >
                  Forgot Password?
                </Link>
              </div>
              
              <InputField
                id="password"
                label=""
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: undefined }))
                  }
                }}
                error={formErrors.password}
                icon={<Lock className="h-5 w-5" />}
                showPasswordToggle
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">New to Julie's Crafts?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link href="/register" className="block">
              <Button 
                variant="outline" 
                className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Create New Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
