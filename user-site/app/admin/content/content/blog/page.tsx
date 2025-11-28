"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function BlogRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/content/blog')
  }, [router])
  return null
}
