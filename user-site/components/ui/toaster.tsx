'use client'

import { useToast } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/toast'

export function Toaster() {
  const { toasts, removeToast } = useToast()

  return <ToastContainer toasts={toasts} onClose={removeToast} />
}