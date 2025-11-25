"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle, User, Mail, Phone, Lock, Shield, Sparkles } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('/julie-logo.jpeg')
  const [formErrors, setFormErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
  }>({})

  const { register, error, clearError } = useAuth()
  const router = useRouter()

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
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long'
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long'
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
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }
    
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim()
      const result = await register(
        formData.email,
        formData.password,
        fullName,
        formData.phone || undefined
      )
      
      // Check if email verification is required
      if (result && typeof result === 'object' && 'requiresVerification' in result && result.requiresVerification) {
        // Redirect to verification page with email pre-filled
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        setIsLoading(false)
        return
      }
      
      // If no verification needed, redirect to home
      router.push('/')
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
                  Join Julie's Crafts
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 leading-relaxed">
                  Create your account to get started
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-500 to-primary"></div>
          
          <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
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
          
          <CardContent className="space-y-5 sm:space-y-6 px-6 sm:px-8 pb-8">
            {error && !showVerificationMessage && (
              <Alert variant="destructive" className="border-red-200 bg-red-50/80 backdrop-blur-sm shadow-sm">
                <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {(
              <>
              <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 ${
                        formErrors.firstName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 ${
                        formErrors.lastName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                      } rounded-lg bg-white shadow-sm focus:shadow-md`}
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <span className="text-red-500 font-bold">•</span>
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
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

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  Phone Number <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`h-12 pl-12 pr-4 border-2 transition-all duration-200 ${
                      formErrors.phone 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20 hover:border-primary/50'
                    } rounded-lg bg-white shadow-sm focus:shadow-md`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <span className="text-red-500 font-bold">•</span>
                    {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-12 pl-12 pr-12 border-2 transition-all duration-200 ${
                      formErrors.confirmPassword 
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
                {formErrors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <span className="text-red-500 font-bold">•</span>
                    {formErrors.confirmPassword}
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
                      className="w-full h-12 border-2 border-slate-200 hover:bg-slate-50 hover:border-primary/50 font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sign In Instead
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            Your information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}
