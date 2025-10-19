"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useRole } from '@/contexts/role-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, Lock, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({})

  const { login, error, clearError, user } = useAuth()
  const { isAdmin, isLoading: roleLoading } = useRole()
  const router = useRouter()

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
      await login(email, password)
      
      // Check for redirect parameter or redirect based on user role
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect')
      
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        // Wait for role to be loaded before redirecting
        let checkAttempts = 0
        const MAX_ATTEMPTS = 50 // Max 5 seconds (50 * 100ms)
        
        const checkRoleAndRedirect = async () => {
          checkAttempts++
          console.log(`=== LOGIN REDIRECT CHECK (Attempt ${checkAttempts}) ===`)
          console.log('Login - roleLoading:', roleLoading)
          console.log('Login - isAdmin:', isAdmin)
          console.log('Login - user from auth:', user)
          
          // Debug: Check user role information
          let debugIsAdmin = false
          try {
            const token = localStorage.getItem('julie-crafts-token')
            if (token) {
              const debugResponse = await fetch('/api/debug/user-role', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              if (debugResponse.ok) {
                const debugData = await debugResponse.json()
                console.log('Login - Debug role info:', debugData)
                debugIsAdmin = debugData.profile_direct?.is_admin === true
                console.log('Login - is_admin from debug:', debugIsAdmin)
              }
            }
          } catch (error) {
            console.error('Login - Debug role error:', error)
          }
          
          // Wait for role context to finish loading OR if we've tried too many times
          if (roleLoading && checkAttempts < MAX_ATTEMPTS) {
            console.log('Login - Role still loading, checking again in 100ms...')
            setTimeout(checkRoleAndRedirect, 100)
            return
          }
          
          // If role context says not loading but isAdmin is still false, 
          // but debug shows is_admin is true, wait a bit more for state to update
          if (!roleLoading && !isAdmin && debugIsAdmin && checkAttempts < 10) {
            console.log('Login - Waiting for role context to update isAdmin...')
            setTimeout(checkRoleAndRedirect, 100)
            return
          }
          
          console.log('Login - Role loaded, making redirect decision')
          console.log('Login - isAdmin from role context:', isAdmin)
          console.log('Login - user.is_admin from auth:', user?.is_admin)
          
          // Check all possible sources
          const userIsAdmin = isAdmin || user?.is_admin === true || debugIsAdmin
          console.log('Login - Final admin decision:', userIsAdmin)
          
          if (userIsAdmin) {
            console.log('✅ Login - Redirecting to ADMIN dashboard (/admin)')
            router.push('/admin')
          } else {
            console.log('❌ Login - Redirecting to HOME page (/)')
            router.push('/')
          }
        }
        
        // Start checking for role after a delay to ensure state updates
        setTimeout(checkRoleAndRedirect, 500)
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
          <p className="text-slate-600">
            Sign in to your Julie's Crafts account to continue shopping
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }}
                    className={`h-12 pl-10 pr-4 border-slate-200 focus:border-primary focus:ring-primary ${
                      formErrors.email ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
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
                    className={`h-12 pl-10 pr-12 border-slate-200 focus:border-primary focus:ring-primary ${
                      formErrors.password ? 'border-red-300 focus:border-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-slate-100"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">•</span>
                    {formErrors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">New to Julie's Crafts?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link href="/register">
                <Button variant="outline" className="w-full h-12 border-slate-200 hover:bg-slate-50 font-semibold">
                  Create New Account
                </Button>
              </Link>
            </div>

            {/* Additional Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            Secure login protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  )
}
