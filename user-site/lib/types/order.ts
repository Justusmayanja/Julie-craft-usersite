export interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  product_image?: string
}

export interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name: string
  customer_phone?: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_method?: string
  subtotal: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  shipping_address: Address
  billing_address?: Address
  order_date: string
  shipped_date?: string
  delivered_date?: string
  notes?: string
  tracking_number?: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface Address {
  name: string
  email: string
  phone?: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  zip_code: string
  country: string
}

export interface CreateOrderData {
  customer_email: string
  customer_name: string
  customer_phone?: string
  shipping_address: Address
  billing_address?: Address
  items: Omit<OrderItem, 'id'>[]
  subtotal: number
  tax_amount?: number
  shipping_amount?: number
  discount_amount?: number
  total_amount: number
  currency?: string
  notes?: string
}

export interface OrderFilters {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  customer_email?: string
  date_from?: string
  date_to?: string
  sort_by?: 'order_date' | 'total_amount' | 'status'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface OrderStats {
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
  average_order_value: number
}

// Frontend order interface (simplified for cart/checkout)
export interface CartOrder {
  customer_name: string
  customer_email: string
  customer_phone?: string
  shipping_address: Address
  billing_address?: Address
  notes?: string
}

// Order confirmation interface
export interface OrderConfirmation {
  order_number: string
  customer_email: string
  total_amount: number
  estimated_delivery?: string
  tracking_info?: string
}
