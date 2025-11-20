"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Hero } from "@/components/hero"
import { FeaturedProducts } from "@/components/featured-products"
import { Categories } from "@/components/categories"
import { Testimonials } from "@/components/testimonials"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function ErrorMessage() {
  const searchParams = useSearchParams()
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'insufficient_privileges') {
      setShowError(true)
      setErrorMessage('You do not have sufficient privileges to access that page. Please contact an administrator if you believe this is an error.')
      
      // Clear the error from URL after displaying
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  if (!showError || !errorMessage) return null

  return (
    <div className="container mx-auto px-4 pt-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setShowError(false)}
            className="ml-4 text-destructive hover:text-destructive/80"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <ErrorMessage />
      </Suspense>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <Testimonials />
    </>
  )
}