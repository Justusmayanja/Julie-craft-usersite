"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { InputField } from '@/components/auth/input-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, User, Mail, Phone, Lock, CheckCircle, Sparkles, Shield } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    full_name?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
  }>({})

  const { register, error, clearError } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    const errors: typeof formErrors = {}
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required'
    } else if (formData.full_name.trim().length < 2) {
      errors.full_name = 'Full name must be at least 2 characters long'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long'
    }
    
    // Confirm password is required
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
      const result = await register(
        formData.email,
        formData.password,
        formData.full_name,
        formData.phone || undefined
      )
      
      // Check if email verification is required
      if (result && typeof result === 'object' && 'requiresVerification' in result && result.requiresVerification) {
        // Redirect to verification page with email pre-filled
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        setIsLoading(false)
        return
      }
      
      // If no verification needed, redirect to home (user is auto-logged in)
      router.push('/')
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Join Julie's Crafts"
      subtitle="Create your account to get started"
    >
      <Card className="rounded-2xl border-0 bg-white shadow-none sm:shadow-md overflow-hidden">
        <CardHeader className="space-y-2 pb-6 pt-6 sm:pt-8 px-6 sm:px-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center text-slate-900">
              Create Account
            </CardTitle>
          </div>
          <CardDescription className="text-center text-slate-600 text-sm sm:text-base">
            Fill in your details to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
              <AlertDescription className="text-red-800 text-sm">
                {error.includes('already exists') || error.includes('already registered')
                  ? 'An account with this email already exists. Please sign in instead.'
                  : error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <InputField
              label="Full Name"
              name="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleInputChange}
              error={formErrors.full_name}
              icon={<User className="h-5 w-5" />}
              required
              disabled={isLoading}
              autoComplete="name"
            />

            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              icon={<Mail className="h-5 w-5" />}
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="+1234567890 (Optional)"
              value={formData.phone}
              onChange={handleInputChange}
              error={formErrors.phone}
              icon={<Phone className="h-5 w-5" />}
              disabled={isLoading}
              autoComplete="tel"
            />

            <InputField
              id="password"
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleInputChange}
              error={formErrors.password}
              icon={<Lock className="h-5 w-5" />}
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={formErrors.confirmPassword}
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
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Create Account
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
              <span className="px-4 bg-white text-slate-500 font-medium">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Link href="/login" className="block">
              <Button 
                variant="outline" 
                className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Sign In Instead
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
          Your information is secure and encrypted
        </p>
      </div>
    </AuthLayout>
  )
}
