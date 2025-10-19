export interface User {
  id: string
  email: string
  name: string
  phone?: string
  created_at: string
  updated_at: string
  last_login?: string
  is_guest: boolean
  role: 'customer' | 'admin' | 'super_admin'
  is_admin?: boolean
  is_verified?: boolean
}

export interface UserSession {
  session_id: string
  user_id?: string // null for guest users
  email?: string // for guest sessions
  created_at: string
  last_activity: string
  device_info?: {
    user_agent: string
    ip_address?: string
  }
  cart_data?: any
}

export interface UserPreferences {
  user_id: string
  currency: string
  language: string
  notifications: {
    email: boolean
    sms: boolean
    order_updates: boolean
    promotions: boolean
  }
  default_shipping_address?: string
  default_billing_address?: string
}

export interface UserOrderHistory {
  user_id: string
  order_id: string
  order_number: string
  order_date: string
  status: string
  total_amount: number
  item_count: number
  items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    image?: string
  }>
}

export interface GuestCheckoutData {
  email: string
  name: string
  phone?: string
  shipping_address: any
  billing_address?: any
  save_for_future?: boolean // Option to save guest info for future orders
}
