"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types/user"

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('julie-crafts-token')
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            dispatch({
              type: "AUTH_SUCCESS",
              payload: { user: data.user, token }
            })
          } else {
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
        dispatch({ type: "AUTH_LOGOUT" })
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('julie-crafts-token', data.token)
        
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.user, token: data.token }
        })
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: data.error || 'Login failed' })
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: 'Network error. Please try again.' })
    }
  }

  const register = async (email: string, password: string, name: string, phone?: string) => {
    dispatch({ type: "AUTH_START" })

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, phone }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('julie-crafts-token', data.token)
        
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: data.user, token: data.token }
        })
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: data.error || 'Registration failed' })
      }
    } catch (error) {
      dispatch({ type: "AUTH_FAILURE", payload: 'Network error. Please try again.' })
    }
  }

  const logout = () => {
    localStorage.removeItem('julie-crafts-token')
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        updateUser,
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
