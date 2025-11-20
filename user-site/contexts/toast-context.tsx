"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showSuccess: (title: string, description?: string, duration?: number) => void
  showError: (title: string, description?: string, duration?: number) => void
  showInfo: (title: string, description?: string, duration?: number) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, type, title, description, duration }
    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  const showSuccess = (title: string, description?: string, duration?: number) => {
    addToast('success', title, description, duration)
  }

  const showError = (title: string, description?: string, duration?: number) => {
    addToast('error', title, description, duration)
  }

  const showInfo = (title: string, description?: string, duration?: number) => {
    addToast('info', title, description, duration)
  }

  return (
    <ToastContext.Provider value={{ toasts, showSuccess, showError, showInfo, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

