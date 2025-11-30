"use client"

import { ReactNode, InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  error?: string
  icon?: ReactNode
  showPasswordToggle?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  required?: boolean
}

export function InputField({
  label,
  error,
  icon,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  required = false,
  className,
  id,
  ...props
}: InputFieldProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={inputId} 
        className="text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative group">
        {icon && (
          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none z-10">
            <div className={cn(
              "transition-colors",
              error 
                ? "text-red-400" 
                : "text-slate-400 group-focus-within:text-primary"
            )}>
              {icon}
            </div>
          </div>
        )}
        
        <Input
          id={inputId}
          className={cn(
            "h-12 transition-all duration-200 rounded-xl border-2 shadow-sm",
            icon && "pl-12",
            showPasswordToggle && "pr-12",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50",
            "bg-white focus:shadow-md",
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-slate-500" />
            ) : (
              <Eye className="h-4 w-4 text-slate-500" />
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-red-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1"
          role="alert"
        >
          <span className="text-red-500 font-bold">•</span>
          {error}
        </p>
      )}
    </div>
  )
}

