"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to business settings by default
    router.replace('/settings/business')
  }, [router])

  return null
}