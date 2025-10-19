import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast
    }

    setState(prev => ({
      toasts: [...prev.toasts, newToast]
    }))

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setState(prev => ({
      toasts: prev.toasts.filter(toast => toast.id !== id)
    }))
  }, [])

  const clearAllToasts = useCallback(() => {
    setState({ toasts: [] })
  }, [])

  return {
    toasts: state.toasts,
    addToast,
    removeToast,
    clearAllToasts
  }
}
