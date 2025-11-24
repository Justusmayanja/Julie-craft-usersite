"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SecurityRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/settings/settings/security')
  }, [router])
  return null
}

