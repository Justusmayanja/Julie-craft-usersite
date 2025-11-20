"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { useNotifications } from "@/contexts/notification-context"
import { NotificationDropdown } from "./notification-dropdown"
import { cn } from "@/lib/utils"

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { unreadCount, loading } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 rounded-full hover:bg-gray-100 transition-colors",
          className
        )}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] sm:text-xs font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-4 top-16 sm:absolute sm:right-0 sm:top-auto sm:mt-2 z-50">
            <NotificationDropdown
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  )
}

