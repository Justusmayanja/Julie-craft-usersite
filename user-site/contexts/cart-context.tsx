"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { createOrder, generateOrderItemsFromCart, calculateOrderTotals } from "@/lib/api-orders"
import { sessionManager } from "@/lib/session-manager"
import { saveUserCart, loadUserCart } from "@/lib/api-user"
import type { CartOrder, OrderConfirmation } from "@/lib/types/order"

export interface CartItem {
  id: number
  name: string
  price: number
  image: string
  category: string
  quantity: number
  inStock: boolean
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
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SET_PLACING_ORDER"; payload: boolean }
  | { type: "SET_LAST_ORDER"; payload: OrderConfirmation }

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

      return { items: newItems, total, itemCount }
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload)
      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount }
    }

    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) =>
          item.id === action.payload.id ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item,
        )
        .filter((item) => item.quantity > 0)

      const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

      return { items: newItems, total, itemCount }
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

    default:
      return state
  }
}

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  placeOrder: (orderData: CartOrder) => Promise<OrderConfirmation>
  dispatch: React.Dispatch<CartAction>
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from session manager and API
  useEffect(() => {
    const loadCart = async () => {
      try {
        // First try to load from localStorage as fallback
        const cartKey = sessionManager.getCartKey()
        const savedCart = localStorage.getItem(cartKey)
        
        if (savedCart) {
          const cartItems = JSON.parse(savedCart)
          dispatch({ type: "LOAD_CART", payload: cartItems })
        }

        // Then try to load from API (this will override localStorage if available)
        const sessionInfo = sessionManager.getSessionInfo()
        if (sessionInfo.session_id) {
          try {
            const apiCart = await loadUserCart(sessionInfo.user_id, sessionInfo.session_id)
            if (apiCart.cart_data) {
              dispatch({ type: "LOAD_CART", payload: apiCart.cart_data })
            }
          } catch (error) {
            console.log("Failed to load cart from API, using localStorage:", error)
          }
        }
      } catch (error) {
        console.error("Failed to load cart:", error)
      }
    }

    loadCart()
  }, [])

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

  const addItem = (item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: item })
  }

  const removeItem = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: id })
  }

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const placeOrder = async (orderData: CartOrder): Promise<OrderConfirmation> => {
    try {
      dispatch({ type: "SET_PLACING_ORDER", payload: true })

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
        notes: orderData.notes
      }

      // Submit order
      const orderConfirmation = await createOrder(createOrderData)
      
      // Update state
      dispatch({ type: "SET_LAST_ORDER", payload: orderConfirmation })
      dispatch({ type: "CLEAR_CART" })
      
      return orderConfirmation
    } catch (error) {
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
