'use client'

import { useToast } from '@/components/ui/toast'
import { ToastContainer } from '@/components/ui/toast'

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return <ToastContainer toasts={toasts} onClose={removeToast} />
}