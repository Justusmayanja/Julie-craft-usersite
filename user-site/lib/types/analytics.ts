/**
 * Analytics Type Definitions
 * 
 * TypeScript types for analytics data structures
 */

export interface Order {
  id: string
  order_number?: string
  total_amount: number | string
  status: string
  payment_status?: string
  created_at: string
  updated_at?: string
  user_id?: string
  customer_email?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number | string
  unit_price?: number | string
  total_price?: number | string
  created_at: string
}

export interface Product {
  id: string
  name: string
  category_name?: string  // Direct category name field
  category_id?: string    // Foreign key to categories table
  stock_quantity?: number
  price?: number | string
  created_at?: string
}

export interface Category {
  id: string
  name: string
  slug?: string
}

export interface SalesDataPoint {
  date: string
  sales: number
  orders: number
  label?: string
}

export interface OrdersByStatus {
  status: string
  count: number
  revenue: number
  color: string
}

export interface RevenueByCategory {
  category: string
  revenue: number
  percentage: number
  color: string
}

export interface TopProduct {
  id: string
  name: string
  quantity: number
  revenue: number
  image?: string
}

export interface InventoryLevel {
  id: string
  name: string
  quantity: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  color: string
}

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  period: 'day' | 'week' | 'month'
}

