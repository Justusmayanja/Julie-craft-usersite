import type { User, UserOrderHistory, GuestCheckoutData } from './types/user'

const getApiBaseUrl = () => {
  // Always use the current window location for API calls
  // This ensures we use the correct domain whether in development or production
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }

  // Fallback for server-side rendering
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
}

export interface UserOrdersResponse {
  orders: UserOrderHistory[]
  total: number
  limit: number
  offset: number
}

// Guest checkout - save guest info and create order
export async function createGuestOrder(
  guestData: GuestCheckoutData,
  orderData: any
): Promise<any> {
  const url = `${getApiBaseUrl()}/orders/guest`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      guest_info: guestData,
      order_data: orderData
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create guest order: ${response.statusText}`)
  }

  return response.json()
}

// Get user's order history
export async function getUserOrders(
  userId?: string,
  sessionId?: string,
  filters: any = {}
): Promise<UserOrdersResponse> {
  const params = new URLSearchParams()
  
  if (userId) params.append('user_id', userId)
  if (sessionId) params.append('session_id', sessionId)
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString())
    }
  })

  const url = `${getApiBaseUrl()}/orders/user${params.toString() ? `?${params.toString()}` : ''}`

  // Get JWT token from localStorage for authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user orders: ${response.statusText}`)
  }

  return response.json()
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: { firstName: string; lastName: string; phone?: string; bio?: string; location?: string; website?: string; preferences?: any }): Promise<any> {
  const url = `${getApiBaseUrl()}/users/profile`
  
  // Get JWT token from localStorage for authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(profileData)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || `Failed to update profile: ${response.statusText}`)
  }

  return response.json()
}

// Upload profile image
export async function uploadProfileImage(file: File): Promise<{ success: boolean; avatar_url?: string; message: string; error?: string }> {
  const url = `${getApiBaseUrl()}/media/upload`
  
  // Get JWT token from localStorage for authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
  
  console.log('Upload Profile Image - Token check:', {
    hasWindow: typeof window !== 'undefined',
    token: token ? `${token.substring(0, 20)}...` : null,
    localStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : []
  })
  
  if (!token) {
    console.error('No authentication token found in localStorage')
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Cannot upload image in server environment')
    }
    throw new Error('Please log in to upload a profile image')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Failed to upload image: ${response.statusText}`)
  }

  return data
}

// Remove profile image
export async function removeProfileImage(): Promise<{ success: boolean; message: string; error?: string }> {
  const url = `${getApiBaseUrl()}/media/upload`
  
  // Get JWT token from localStorage for authentication
  const token = typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null
  
  if (!token) {
    throw new Error('Please log in to remove a profile image')
  }

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Failed to remove image: ${response.statusText}`)
  }

  return data
}

// Save cart for user/session
export async function saveUserCart(cartData: any, userId?: string, sessionId?: string): Promise<void> {
  const url = `${getApiBaseUrl()}/cart/save`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cart_data: cartData,
      user_id: userId,
      session_id: sessionId
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to save cart: ${response.statusText}`)
  }
}

// Load cart for user/session
export async function loadUserCart(userId?: string, sessionId?: string): Promise<any> {
  const params = new URLSearchParams()
  if (userId) params.append('user_id', userId)
  if (sessionId) params.append('session_id', sessionId)

  const url = `${getApiBaseUrl()}/cart/load${params.toString() ? `?${params.toString()}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load cart: ${response.statusText}`)
  }

  return response.json()
}

// Get order by order number (for order tracking)
export async function getOrderByNumber(orderNumber: string): Promise<any> {
  const url = `${getApiBaseUrl()}/orders/track/${orderNumber}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.statusText}`)
  }

  return response.json()
}

// Update order status (for admin use)
export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<any> {
  const url = `${getApiBaseUrl()}/orders/${orderId}/status`
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      tracking_number: trackingNumber
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to update order status: ${response.statusText}`)
  }

  return response.json()
}
