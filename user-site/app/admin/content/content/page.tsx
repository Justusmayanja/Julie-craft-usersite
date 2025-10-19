"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ContentPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to pages management by default
    router.replace('/content/pages')
  }, [router])

  return null
}
