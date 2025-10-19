export interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  avatar_url?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  // Address information
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country: string
  // Customer metrics
  total_orders: number
  total_spent: number
  last_order_date?: string
  join_date: string
  status: 'active' | 'inactive' | 'blocked'
  // Preferences
  preferences?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

export interface CustomerWithOrders extends Customer {
  recent_orders?: {
    id: string
    order_number: string
    status: string
    total_amount: number
    order_date: string
  }[]
}

export interface CustomerFilters {
  search?: string
  status?: 'active' | 'inactive' | 'blocked'
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  country?: string
  city?: string
  state?: string
  min_orders?: number
  max_orders?: number
  min_spent?: number
  max_spent?: number
  date_from?: string
  date_to?: string
  sort_by?: 'name' | 'email' | 'total_orders' | 'total_spent' | 'last_order_date' | 'join_date' | 'created_at'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface CustomerStats {
  total_customers: number
  active_customers: number
  inactive_customers: number
  blocked_customers: number
  new_customers_this_month: number
  total_revenue: number
  average_order_value: number
  top_customers?: {
    id: string
    name: string
    email: string
    total_orders: number
    total_spent: number
  }[]
}

export interface CustomerCreateInput {
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  preferences?: Record<string, any>
  notes?: string
  status?: 'active' | 'inactive' | 'blocked'
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
  id: string
}

export interface CustomerListResponse {
  customers: Customer[]
  total: number
  page: number
  limit: number
  has_more: boolean
}
