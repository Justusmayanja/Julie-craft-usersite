"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type { User } from "@/lib/types/user"

interface RoleContextType {
  isAdmin: boolean
  isSuperAdmin: boolean
  userRole: string | null
  hasPermission: (permission: string) => boolean
  isLoading: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

// Define permissions for different roles
const ROLE_PERMISSIONS = {
  customer: [
    'view_products',
    'place_orders',
    'view_own_orders',
    'update_profile'
  ],
  admin: [
    'view_products',
    'place_orders',
    'view_own_orders',
    'update_profile',
    'view_all_orders',
    'manage_products',
    'manage_inventory',
    'view_customers',
    'view_analytics',
    'manage_categories'
  ],
  super_admin: [
    'view_products',
    'place_orders',
    'view_own_orders',
    'update_profile',
    'view_all_orders',
    'manage_products',
    'manage_inventory',
    'view_customers',
    'view_analytics',
    'manage_categories',
    'manage_users',
    'manage_settings',
    'view_system_logs',
    'manage_roles'
  ]
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const loadUserRole = async () => {
      if (!isAuthenticated || !user) {
        setUserRole(null)
        setIsLoading(false)
        return
      }

      console.log('=== ROLE CONTEXT LOADING ===')
      console.log('Role Context - User object:', user)
      console.log('Role Context - User.role:', user.role)
      console.log('Role Context - User.is_admin:', user.is_admin)

      try {
        // Get user role from the database
        const response = await fetch('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('julie-crafts-token')}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const profileData = await response.json()
          console.log('Role Context - Profile data:', profileData)
          
          // Check if user is admin based on is_admin field
          const isAdminUser = profileData.profile?.is_admin === true || profileData.is_admin === true
          console.log('Role Context - is_admin flag:', profileData.profile?.is_admin || profileData.is_admin)
          console.log('Role Context - Determined as admin:', isAdminUser)
          
          // Set role based on is_admin field
          const role = isAdminUser ? 'admin' : 'customer'
          console.log('Role Context - Set role to:', role)
          setUserRole(role)
        } else {
          console.log('Role Context - API failed, using fallback role:', user.role)
          // Fallback to user object role if API fails
          setUserRole(user.role || 'customer')
        }
      } catch (error) {
        console.error('Error loading user role:', error)
        // Fallback to user object role
        setUserRole(user.role || 'customer')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserRole()
  }, [isAuthenticated, user])

  const isAdmin = userRole === 'admin' || userRole === 'super_admin' || user?.is_admin === true
  const isSuperAdmin = userRole === 'super_admin'

  const hasPermission = (permission: string): boolean => {
    if (!userRole) return false
    
    const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS] || []
    return permissions.includes(permission)
  }

  const value: RoleContextType = {
    isAdmin,
    isSuperAdmin,
    userRole,
    hasPermission,
    isLoading: authLoading || isLoading
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}

// Helper hook for admin-only components
export function useAdminAuth() {
  const { isAdmin, isSuperAdmin, isLoading } = useRole()
  const { user, isAuthenticated } = useAuth()

  return {
    isAdmin,
    isSuperAdmin,
    isLoading,
    user,
    isAuthenticated,
    canAccess: isAuthenticated && isAdmin
  }
}
