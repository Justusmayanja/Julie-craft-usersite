"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsersSettingsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the actual users settings page
    router.replace('/admin/settings/settings/users')
  }, [router])

  return null
}

