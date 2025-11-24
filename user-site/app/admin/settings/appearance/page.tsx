"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AppearanceRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/settings/settings/appearance')
  }, [router])
  return null
}

