'use client'

import { useToast } from '@/hooks/admin/use-toast'
import { ToastProvider } from '@/components/admin/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-semibold text-gray-900">{toast.title}</h4>
              )}
              {toast.description && (
                <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={toast.onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </ToastProvider>
  )
}