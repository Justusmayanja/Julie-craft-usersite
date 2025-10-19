"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { createOrder, generateOrderItemsFromCart, calculateOrderTotals } from "@/lib/api-orders"
import { sessionManager } from "@/lib/session-manager"
import { saveUserCart, loadUserCart } from "@/lib/api-user"
import type { CartOrder, OrderConfirmation } from "@/lib/types/order"

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  quantity: number
  inStock: boolean
  reservationId?: string
  availableQuantity?: number
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isPlacingOrder: boolean
  lastOrder?: OrderConfirmation
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SET_PLACING_ORDER"; payload: boolean }
  | { type: "SET_LAST_ORDER"; payload: OrderConfirmation }
  | { type: "UPDATE_STOCK_INFO"; payload: { id: string; availableQuantity: number; inStock: boolean } }
  | { type: "SET_RESERVATION"; payload: { id: string; reservationId: string } }
  | { type: "CLEAR_RESERVATIONS" }

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  isPlacingOrder: false,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.id === action.payload.id)

      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }]
      }

      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount, isPlacingOrder: state.isPlacingOrder }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount, isPlacingOrder: state.isPlacingOrder }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) =>
          item.id === action.payload.id ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item,
        )
        .filter((item) => item.quantity > 0)

      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount, isPlacingOrder: state.isPlacingOrder }
    }

    case "CLEAR_CART":
      return initialState

    case "LOAD_CART": {
      const total = action.payload.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = action.payload.reduce((sum, item) => sum + item.quantity, 0)

      return { items: action.payload, total, itemCount, isPlacingOrder: state.isPlacingOrder, lastOrder: state.lastOrder }
    }

    case "SET_PLACING_ORDER":
      return { ...state, isPlacingOrder: action.payload }

    case "SET_LAST_ORDER":
      return { ...state, lastOrder: action.payload }

    case "UPDATE_STOCK_INFO": {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id 
          ? { 
              ...item, 
              availableQuantity: action.payload.availableQuantity,
              inStock: action.payload.inStock 
            } 
          : item
      )
      return { ...state, items: newItems }
    }

    case "SET_RESERVATION": {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id 
          ? { ...item, reservationId: action.payload.reservationId }
          : item
      )
      return { ...state, items: newItems }
    }

    case "CLEAR_RESERVATIONS": {
      const newItems = state.items.map((item) => ({
        ...item,
        reservationId: undefined
      }))
      return { ...state, items: newItems }
    }

    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, "quantity">) => Promise<boolean>
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => Promise<boolean>
  clearCart: () => void
  placeOrder: (orderData: CartOrder) => Promise<OrderConfirmation>
  reloadCart: () => Promise<boolean>
  checkStockAvailability: () => Promise<boolean>
  reserveItems: () => Promise<boolean>
  releaseReservations: () => Promise<void>
  hasOutOfStockItems: () => boolean
  removeOutOfStockItems: () => void
  dispatch: React.Dispatch<CartAction>
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from session manager and API
  useEffect(() => {
    const loadCart = async () => {
      try {
        const sessionInfo = sessionManager.getSessionInfo()
        
        // Try to load from API first (prioritize database over localStorage)
        if (sessionInfo.user_id || sessionInfo.session_id) {
          try {
            const apiCart = await loadUserCart(sessionInfo.user_id || undefined, sessionInfo.session_id || undefined)
            if (apiCart.cart_data && Array.isArray(apiCart.cart_data)) {
              console.log("Loaded cart from API:", apiCart.cart_data.length, "items")
              dispatch({ type: "LOAD_CART", payload: apiCart.cart_data })
              return // Successfully loaded from API, no need to check localStorage
            }
          } catch (error) {
            console.log("Failed to load cart from API:", error)
          }
        }

        // Fallback to localStorage if API fails or returns empty cart
        const cartKey = sessionManager.getCartKey()
        const savedCart = localStorage.getItem(cartKey)
        
        if (savedCart) {
          try {
            const cartItems = JSON.parse(savedCart)
            if (Array.isArray(cartItems)) {
              console.log("Loaded cart from localStorage:", cartItems.length, "items")
              dispatch({ type: "LOAD_CART", payload: cartItems })
            }
          } catch (parseError) {
            console.error("Failed to parse cart from localStorage:", parseError)
            // Clear invalid localStorage data
            localStorage.removeItem(cartKey)
          }
        }
      } catch (error) {
        console.error("Failed to load cart:", error)
      }
    }

    loadCart()
  }, [])

  // Expose a function to reload cart (to be called from auth context)
  const reloadCart = async () => {
    try {
      const sessionInfo = sessionManager.getSessionInfo()
      if (sessionInfo.user_id || sessionInfo.session_id) {
        const apiCart = await loadUserCart(sessionInfo.user_id || undefined, sessionInfo.session_id || undefined)
        if (apiCart.cart_data && Array.isArray(apiCart.cart_data)) {
          console.log("Reloaded cart after auth change:", apiCart.cart_data.length, "items")
          dispatch({ type: "LOAD_CART", payload: apiCart.cart_data })
          return true
        }
      }
      return false
    } catch (error) {
      console.log("Failed to reload cart after auth change:", error)
      return false
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent) => {
      console.log("Auth state changed, reloading cart:", event.detail)
      // Add a small delay to ensure session manager is updated
      setTimeout(() => {
        reloadCart()
      }, 100)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('authStateChanged', handleAuthChange as EventListener)
      
      return () => {
        window.removeEventListener('authStateChanged', handleAuthChange as EventListener)
      }
    }
  }, [])

  // Cleanup reservations when component unmounts
  useEffect(() => {
    return () => {
      // Release any active reservations when the component unmounts
      if (state.items.some(item => item.reservationId)) {
        releaseReservations()
      }
    }
  }, [])

  // Release reservations when cart is cleared
  useEffect(() => {
    if (state.items.length === 0 && state.itemCount === 0) {
      // Cart was cleared, release any reservations
      const reservationIds = state.items
        .filter(item => item.reservationId)
        .map(item => item.reservationId!)

      if (reservationIds.length > 0) {
        releaseReservations()
      }
    }
  }, [state.items.length, state.itemCount])

  // Save cart to both localStorage and API whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        // Save to localStorage
        const cartKey = sessionManager.getCartKey()
        localStorage.setItem(cartKey, JSON.stringify(state.items))

        // Save to API
        const sessionInfo = sessionManager.getSessionInfo()
        if (sessionInfo.session_id) {
          try {
            await saveUserCart(state.items, sessionInfo.user_id, sessionInfo.session_id)
          } catch (error) {
            console.log("Failed to save cart to API:", error)
          }
        }
      } catch (error) {
        console.error("Failed to save cart:", error)
      }
    }

    // Only save if cart has items or if we're clearing it
    if (state.items.length > 0 || state.itemCount === 0) {
      saveCart()
    }
  }, [state.items])

  const addItem = async (item: Omit<CartItem, "quantity">): Promise<boolean> => {
    // First check if we can add this item
    const stockCheck = await checkStockAvailability()
    if (!stockCheck) {
      // Check specifically for this item
      try {
        const response = await fetch('/api/inventory/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ product_id: item.id, quantity: 1 }]
          })
        })
        const result = await response.json()
        const itemAvailability = result.availability.find((a: any) => a.product_id === item.id)
        
        if (!itemAvailability?.available) {
          console.warn(`Cannot add item ${item.name}: ${itemAvailability?.reason}`)
          return false
        }
      } catch (error) {
        console.error('Error checking item availability:', error)
        return false
      }
    }

    dispatch({ type: "ADD_ITEM", payload: item })
    return true
  }

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }

  const updateQuantity = async (id: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      dispatch({ type: "REMOVE_ITEM", payload: id })
      return true
    }

    // Check stock availability for the new quantity
    try {
      const response = await fetch('/api/inventory/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: id, quantity }]
        })
      })
      const result = await response.json()
      const itemAvailability = result.availability.find((a: any) => a.product_id === id)
      
      if (!itemAvailability?.available) {
        console.warn(`Cannot update quantity for item ${id}: ${itemAvailability?.reason}`)
        return false
      }
    } catch (error) {
      console.error('Error checking quantity availability:', error)
      return false
    }

    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
    return true
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  // Helper function to check if cart has out-of-stock items
  const hasOutOfStockItems = (): boolean => {
    return state.items.some(item => !item.inStock || (item.availableQuantity && item.availableQuantity < item.quantity))
  }

  // Helper function to remove out-of-stock items from cart
  const removeOutOfStockItems = () => {
    const availableItems = state.items.filter(item => item.inStock && (!item.availableQuantity || item.availableQuantity >= item.quantity))
    dispatch({ type: "LOAD_CART", payload: availableItems })
  }

  // Helper function to check stock availability
  const checkStockAvailability = async (): Promise<boolean> => {
    if (state.items.length === 0) return true

    try {
      const response = await fetch('/api/inventory/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          }))
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update stock info for each item
        if (result.availability && Array.isArray(result.availability)) {
          result.availability.forEach((availability: any) => {
            dispatch({
              type: "UPDATE_STOCK_INFO",
              payload: {
                id: availability.product_id,
                availableQuantity: availability.available_quantity,
                inStock: availability.available
              }
            })
          })
        }
        return true
      } else {
        // Update stock info and show which items are unavailable
        if (result.availability && Array.isArray(result.availability)) {
          result.availability.forEach((availability: any) => {
            dispatch({
              type: "UPDATE_STOCK_INFO",
              payload: {
                id: availability.product_id,
                availableQuantity: availability.available_quantity,
                inStock: availability.available
              }
            })
          })
        }
        return false
      }
    } catch (error) {
      console.error('Error checking stock availability:', error)
      return false
    }
  }

  // Helper function to reserve items
  const reserveItems = async (): Promise<boolean> => {
    if (state.items.length === 0) return true

    try {
      const sessionInfo = sessionManager.getSessionInfo()
      const response = await fetch('/api/inventory/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: state.items.map(item => ({
            product_id: item.id,
            quantity: item.quantity
          })),
          session_id: sessionInfo.session_id,
          user_id: sessionInfo.user_id,
          reservation_type: 'cart'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Update reservation IDs for each item
        result.reservations.forEach((reservation: any) => {
          dispatch({
            type: "SET_RESERVATION",
            payload: {
              id: reservation.product_id,
              reservationId: reservation.reservation_id
            }
          })
        })
        return true
      } else {
        console.error('Reservation failed:', result.errors)
        return false
      }
    } catch (error) {
      console.error('Error reserving items:', error)
      return false
    }
  }

  // Helper function to release reservations
  const releaseReservations = async (): Promise<void> => {
    const reservationIds = state.items
      .filter(item => item.reservationId)
      .map(item => item.reservationId!)

    if (reservationIds.length === 0) return

    try {
      const sessionInfo = sessionManager.getSessionInfo()
      await fetch('/api/inventory/reserve', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_ids: reservationIds,
          session_id: sessionInfo.session_id,
          user_id: sessionInfo.user_id
        })
      })

      // Clear reservation IDs from state
      dispatch({ type: "CLEAR_RESERVATIONS" })
    } catch (error) {
      console.error('Error releasing reservations:', error)
    }
  }

  const placeOrder = async (orderData: CartOrder): Promise<OrderConfirmation> => {
    try {
      dispatch({ type: "SET_PLACING_ORDER", payload: true })

      // Validate cart is not empty
      if (state.items.length === 0) {
        throw new Error('Your cart is empty. Please add items before placing an order.')
      }

      // Check stock availability before placing order
      console.log('Checking stock availability before order placement...')
      const stockAvailable = await checkStockAvailability()
      if (!stockAvailable) {
        // Automatically remove out-of-stock items from cart
        const outOfStockItems = state.items.filter(item => !item.inStock || (item.availableQuantity && item.availableQuantity < item.quantity))
        if (outOfStockItems.length > 0) {
          const itemNames = outOfStockItems.map(item => item.name).join(', ')
          
          // Remove out-of-stock items from cart
          const availableItems = state.items.filter(item => item.inStock && (!item.availableQuantity || item.availableQuantity >= item.quantity))
          dispatch({ type: "LOAD_CART", payload: availableItems })
          
          throw new Error(`The following items are no longer available and have been removed from your cart: ${itemNames}. Please review your cart and try again.`)
        }
        
        throw new Error('Some items are no longer available. Please review your cart and remove unavailable items.')
      }

      // Double-check that all items are still in stock
      const outOfStockItems = state.items.filter(item => !item.inStock || (item.availableQuantity && item.availableQuantity < item.quantity))
      if (outOfStockItems.length > 0) {
        const itemNames = outOfStockItems.map(item => item.name).join(', ')
        
        // Remove out-of-stock items from cart
        const availableItems = state.items.filter(item => item.inStock && (!item.availableQuantity || item.availableQuantity >= item.quantity))
        dispatch({ type: "LOAD_CART", payload: availableItems })
        
        throw new Error(`The following items are no longer available and have been removed from your cart: ${itemNames}. Please review your cart and try again.`)
      }

      // Reserve items before creating order
      console.log('Reserving items for order...')
      const reservationSuccess = await reserveItems()
      if (!reservationSuccess) {
        throw new Error('Unable to reserve items. Some items may have become unavailable. Please try again.')
      }

      // Generate order items from cart
      const orderItems = generateOrderItemsFromCart(state.items)
      
      // Calculate totals
      const totals = calculateOrderTotals(state.items, 10000) // 10,000 UGX shipping

      // Create order data
      const createOrderData = {
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        shipping_address: orderData.shipping_address,
        billing_address: orderData.billing_address || orderData.shipping_address,
        items: orderItems,
        ...totals,
        currency: 'UGX',
        notes: orderData.notes,
        payment_method: orderData.payment_method
      }

      console.log('Submitting order to API...')
      // Submit order
      const orderConfirmation = await createOrder(createOrderData)
      
      // Update state
      dispatch({ type: "SET_LAST_ORDER", payload: orderConfirmation })
      dispatch({ type: "CLEAR_CART" })
      
      console.log('Order placed successfully:', orderConfirmation.order_number)
      return orderConfirmation
    } catch (error) {
      console.error('Order placement failed:', error)
      // Release reservations if order fails
      await releaseReservations()
      throw error
    } finally {
      dispatch({ type: "SET_PLACING_ORDER", payload: false })
    }
  }

  return (
    <CartContext.Provider value={{ 
      state, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      placeOrder,
      reloadCart,
      checkStockAvailability,
      reserveItems,
      releaseReservations,
      hasOutOfStockItems,
      removeOutOfStockItems,
      dispatch 
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
