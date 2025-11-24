"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NotificationsRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/settings/settings/notifications')
  }, [router])
  return null
}

