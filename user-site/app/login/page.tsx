"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { useAuth } from '@/contexts/auth-context'
import { useRole } from '@/contexts/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, Lock, Info, Sparkles, Shield } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({})
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('/julie-logo.jpeg')

  const { login, error, clearError, user } = useAuth()
  const { isAdmin, isLoading: roleLoading } = useRole()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load logo from site settings
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
        // Keep default logo on error
      }
    }
    fetchLogo()
  }, [])

  // Check for message parameter in URL
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'logged_out') {
      setInfoMessage('You have been successfully logged out. Please sign in again to continue.')
      // Clear the message from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (message === 'session_expired') {
      setInfoMessage('Your session has expired. Please sign in again to continue.')
      // Clear the message from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (message === 'password_reset_success') {
      setInfoMessage('Your password has been reset successfully! Please sign in with your new password.')
      // Clear the message from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {}
    
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
        
        console.log('Login - User data from login response:', loggedInUser)
        console.log('Login - is_admin from user:', loggedInUser.is_admin)
        console.log('Login - role from user:', loggedInUser.role)
        console.log('Login - Final admin decision:', userIsAdmin)
        
        if (userIsAdmin) {
          console.log('✅ Login - Redirecting to ADMIN dashboard (/admin)')
          router.push('/admin')
        } else {
          console.log('❌ Login - Redirecting to HOME page (/)')
          router.push('/')
        }
      } else {
        // Fallback: if user data is not available, redirect to home
        console.log('Login - No user data, redirecting to home')
        router.push('/')
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link href="/" className="inline-block">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all duration-200 group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo and Header - Improved Alignment */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center space-y-4">
            {/* Logo with proper alignment */}
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
              <div className="flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                  Welcome Back
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  Sign in to continue shopping
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
          
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
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
          
          <CardContent className="space-y-5 sm:space-y-6 px-6 sm:px-8 pb-8">
            {infoMessage && (
              <Alert className="border-blue-200 bg-blue-50/80 backdrop-blur-sm shadow-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">{infoMessage}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}

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
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }}
                    className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 ${
                      formErrors.email 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                    } rounded-lg bg-white shadow-sm focus:shadow-md`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <span className="text-red-500 font-bold">•</span>
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (formErrors.password) {
                        setFormErrors(prev => ({ ...prev, password: undefined }))
                      }
                    }}
                    className={`h-12 pl-12 pr-12 border-2 transition-all duration-200 ${
                      formErrors.password 
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
                {formErrors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <span className="text-red-500 font-bold">•</span>
                    {formErrors.password}
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
                  className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create New Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
