import type { Order, CreateOrderData, OrderFilters, OrderConfirmation } from './types/order'

const getApiBaseUrl = () => {
  // Always use the current window location for API calls
  // This ensures we use the correct domain whether in development or production
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  
  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  limit: number
  offset: number
}

export async function createOrder(orderData: CreateOrderData): Promise<OrderConfirmation> {
  const url = `${getApiBaseUrl()}/orders`
  
  // Get JWT token from localStorage for authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || `Failed to create order: ${response.statusText}`)
  }

  const order = await response.json()
  
  return {
    order_number: order.order_number,
    customer_email: order.customer_email,
    total_amount: order.total_amount,
    estimated_delivery: getEstimatedDelivery(),
    tracking_info: order.tracking_number ? `Tracking: ${order.tracking_number}` : undefined
  }
}

export async function fetchOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })

  const url = `${API_BASE_URL}/orders${params.toString() ? `?${params.toString()}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.statusText}`)
  }

  return response.json()
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const url = `${getApiBaseUrl()}/orders/${orderId}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Order not found')
    }
    throw new Error(`Failed to fetch order: ${response.statusText}`)
  }

  return response.json()
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const url = `${getApiBaseUrl()}/orders/${orderId}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update order: ${response.statusText}`)
  }

  return response.json()
}

export async function updateOrderTracking(orderId: string, trackingNumber: string): Promise<Order> {
  const url = `${getApiBaseUrl()}/orders/${orderId}`
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tracking_number: trackingNumber }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update tracking: ${response.statusText}`)
  }

  return response.json()
}

// Helper function to calculate estimated delivery
function getEstimatedDelivery(): string {
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 7) // 7 days from now
  
  return deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to generate order items from cart
export function generateOrderItemsFromCart(cartItems: any[]): Omit<any, 'id'>[] {
  return cartItems.map(item => {
    // Ensure price is a valid number
    const unitPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
    const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1
    const totalPrice = unitPrice * quantity
    
    return {
      product_id: item.id,
      product_name: item.name || 'Unknown Product',
      product_sku: `SKU-${item.id}`,
      quantity: quantity,
      price: unitPrice, // Database column is 'price', not 'unit_price'
      total_price: totalPrice,
      product_image: item.image || null
    }
  })
}

// Helper function to calculate order totals
export function calculateOrderTotals(items: any[], shippingCost: number = 0, taxRate: number = 0.18): {
  subtotal: number
  tax_amount: number
  shipping_amount: number
  total_amount: number
} {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax_amount = subtotal * taxRate
  const shipping_amount = shippingCost
  const total_amount = subtotal + tax_amount + shipping_amount

  return {
    subtotal: Math.round(subtotal),
    tax_amount: Math.round(tax_amount),
    shipping_amount: Math.round(shipping_amount),
    total_amount: Math.round(total_amount)
  }
}
