"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types/user"
import { sessionManager } from "@/lib/session-manager"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" }

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, phone?: string) => Promise<void>
  logout: () => void
  clearError: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to migrate guest cart to user cart
async function migrateGuestCart(token: string) {
  try {
    const sessionInfo = sessionManager.getSessionInfo()
    if (sessionInfo.session_id) {
      // Get guest cart data from localStorage
      const guestCartKey = `julie-crafts-cart-session-${sessionInfo.session_id}`
      const guestCartData = localStorage.getItem(guestCartKey)
      
      if (guestCartData) {
        const cartItems = JSON.parse(guestCartData)
        if (cartItems && cartItems.length > 0) {
          // Migrate cart to user account
          const response = await fetch('/api/cart/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              session_id: sessionInfo.session_id,
              guest_cart_data: cartItems
            })
          })
          
          if (response.ok) {
            // Clear guest cart from localStorage
            localStorage.removeItem(guestCartKey)
            console.log('Guest cart migrated successfully')
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to migrate guest cart:', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('julie-crafts-token')
      if (token) {
        try {
          console.log('Verifying existing token...')
          const response = await fetch('/api/auth/supabase-verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            console.log('Token verification successful:', data.user)
            
            // Update session manager to convert guest to registered user
            sessionManager.convertToRegisteredUser(data.user)
            
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: data.user, token }
            })
          } else {
            console.log('Token verification failed, removing token')
            // Token is invalid, remove it
            localStorage.removeItem('julie-crafts-token')
            dispatch({ type: "AUTH_LOGOUT" })
          }
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('julie-crafts-token')
          dispatch({ type: "AUTH_LOGOUT" })
        }
      } else {
        console.log('No token found, user not authenticated')
        dispatch({ type: "AUTH_LOGOUT" })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" })

    try {
      console.log('Attempting login for:', email)
      const response = await fetch('/api/auth/supabase-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('Login response:', { ok: response.ok, data })

      if (response.ok) {
        // Store session data in localStorage
        if (data.session?.access_token) {
          localStorage.setItem('julie-crafts-token', data.session.access_token)
        }
        console.log('Token stored, user authenticated:', data.user)
        
        // Update session manager to convert guest to registered user
        sessionManager.convertToRegisteredUser(data.user)
        
        // Migrate guest cart to user cart if needed
        await migrateGuestCart(data.session?.access_token || data.token)
        
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.user, token: data.session?.access_token || data.token }
        })
      } else {
        console.log('Login failed:', data.error)
        dispatch({ type: "AUTH_FAILURE", payload: data.error || 'Login failed' })
      }
    } catch (error) {
      console.error('Login network error:', error)
      dispatch({ type: "AUTH_FAILURE", payload: 'Network error. Please try again.' })
    }
  }

  const register = async (email: string, password: string, name: string, phone?: string) => {
    dispatch({ type: "AUTH_START" })

    try {
      console.log('Attempting registration for:', email)
      const response = await fetch('/api/auth/supabase-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: name, phone }),
      })

      const data = await response.json()
      console.log('Registration response:', { ok: response.ok, data })

      if (response.ok) {
        // Store session data in localStorage
        if (data.session?.access_token) {
          localStorage.setItem('julie-crafts-token', data.session.access_token)
        }
        console.log('User registered and authenticated:', data.user)
        
        // Update session manager to convert guest to registered user
        sessionManager.convertToRegisteredUser(data.user)
        
        // Migrate guest cart to user cart if needed
        await migrateGuestCart(data.session?.access_token || data.token)
        
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.user, token: data.session?.access_token || data.token }
        })
      } else {
        console.log('Registration failed:', data.error)
        dispatch({ type: "AUTH_FAILURE", payload: data.error || 'Registration failed' })
      }
    } catch (error) {
      console.error('Registration network error:', error)
      dispatch({ type: "AUTH_FAILURE", payload: 'Network error. Please try again.' })
    }
  }

  const logout = () => {
    localStorage.removeItem('julie-crafts-token')
    sessionManager.clearSession()
    dispatch({ type: "AUTH_LOGOUT" })
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData }
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: updatedUser, token: state.token! }
      })
    }
  }

  const refreshUser = async () => {
    if (!state.token) return

    try {
      const response = await fetch('/api/auth/supabase-verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid && data.user) {
          dispatch({
            type: "AUTH_SUCCESS",
            payload: { user: data.user, token: state.token! }
          })
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
