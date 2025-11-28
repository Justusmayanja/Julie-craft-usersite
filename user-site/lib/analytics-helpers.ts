/**
 * Analytics Helper Functions
 * 
 * Utility functions for processing and aggregating analytics data
 * from Supabase queries.
 */

export interface TimeSeriesData {
  date: string
  value: number
  label?: string
}

export interface GroupedData {
  [key: string]: number
}

/**
 * Group data by day
 */
export function groupByDay<T extends { created_at: string }>(
  data: T[],
  valueExtractor: (item: T) => number
): TimeSeriesData[] {
  const grouped = new Map<string, number>()
  
  data.forEach(item => {
    const date = new Date(item.created_at)
    const dayKey = date.toISOString().split('T')[0] // YYYY-MM-DD
    
    const current = grouped.get(dayKey) || 0
    grouped.set(dayKey, current + valueExtractor(item))
  })
  
  return Array.from(grouped.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Group data by week
 */
export function groupByWeek<T extends { created_at: string }>(
  data: T[],
  valueExtractor: (item: T) => number
): TimeSeriesData[] {
  const grouped = new Map<string, number>()
  
  data.forEach(item => {
    const date = new Date(item.created_at)
    const weekStart = getWeekStart(date)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    const current = grouped.get(weekKey) || 0
    grouped.set(weekKey, current + valueExtractor(item))
  })
  
  return Array.from(grouped.entries())
    .map(([date, value]) => ({ 
      date, 
      value,
      label: formatWeekLabel(date)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Group data by month
 */
export function groupByMonth<T extends { created_at: string }>(
  data: T[],
  valueExtractor: (item: T) => number
): TimeSeriesData[] {
  const grouped = new Map<string, number>()
  
  data.forEach(item => {
    const date = new Date(item.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const current = grouped.get(monthKey) || 0
    grouped.set(monthKey, current + valueExtractor(item))
  })
  
  return Array.from(grouped.entries())
    .map(([date, value]) => ({ 
      date, 
      value,
      label: formatMonthLabel(date)
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get week start date (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Format week label
 */
function formatWeekLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const weekStart = getWeekStart(date)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  
  return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`
}

/**
 * Format month label
 */
function formatMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + '-01')
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Format short date
 */
function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Calculate trend percentage
 */
export function calculateTrend(
  current: number,
  previous: number
): { value: number; isPositive: boolean } {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 }
  }
  const change = ((current - previous) / previous) * 100
  return { value: Math.abs(change), isPositive: change >= 0 }
}

/**
 * Sum revenue from array
 */
export function sumRevenue<T>(items: T[], extractor: (item: T) => number): number {
  return items.reduce((sum, item) => sum + extractor(item), 0)
}

/**
 * Group by category and calculate revenue
 */
export function groupByCategory(
  orderItems: Array<{
    quantity: number
    price: number | string
    product_id?: string
  }>,
  productCategories: Map<string, string>
): GroupedData {
  const grouped = new Map<string, number>()
  
  orderItems.forEach(item => {
    const category = productCategories.get(item.product_id || '') || 'Uncategorized'
    const revenue = Number(item.price) * (item.quantity || 0)
    
    const current = grouped.get(category) || 0
    grouped.set(category, current + revenue)
  })
  
  return Object.fromEntries(grouped)
}

/**
 * Sort top selling products
 */
export function sortTopSelling<T extends { quantity?: number; revenue?: number }>(
  items: T[],
  sortBy: 'quantity' | 'revenue' = 'quantity',
  limit: number = 10
): T[] {
  return [...items]
    .sort((a, b) => {
      const aValue = sortBy === 'quantity' ? (a.quantity || 0) : (a.revenue || 0)
      const bValue = sortBy === 'quantity' ? (b.quantity || 0) : (b.revenue || 0)
      return bValue - aValue
    })
    .slice(0, limit)
}

/**
 * Calculate conversion rate
 */
export function calculateConversionRate(
  completedOrders: number,
  totalVisitors: number
): number {
  if (totalVisitors === 0) return 0
  return (completedOrders / totalVisitors) * 100
}

/**
 * Auto-detect time grouping based on data range
 */
export function detectTimeGrouping(
  data: Array<{ created_at: string }>
): 'day' | 'week' | 'month' {
  if (data.length === 0) return 'day'
  
  const dates = data.map(d => new Date(d.created_at))
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysDiff <= 30) return 'day'
  if (daysDiff <= 90) return 'week'
  return 'month'
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return `${currency} ${amount.toLocaleString()}`
}

/**
 * Get status color for orders
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#F59E0B',      // amber
    processing: '#3B82F6',   // blue
    shipped: '#8B5CF6',      // purple
    delivered: '#10B981',    // emerald
    cancelled: '#EF4444',    // red
    completed: '#10B981'     // emerald
  }
  return colors[status.toLowerCase()] || '#6B7280'
}

/**
 * Get inventory status
 */
export function getInventoryStatus(quantity: number, threshold: number = 5): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  color: string
} {
  if (quantity === 0) {
    return { status: 'out-of-stock', color: '#EF4444' }
  }
  if (quantity < threshold) {
    return { status: 'low-stock', color: '#F59E0B' }
  }
  return { status: 'in-stock', color: '#10B981' }
}

/**
 * Fill missing dates in time series
 */
export function fillMissingDates(
  data: TimeSeriesData[],
  startDate: Date,
  endDate: Date,
  grouping: 'day' | 'week' | 'month'
): TimeSeriesData[] {
  const filled: TimeSeriesData[] = []
  const dataMap = new Map(data.map(d => [d.date, d.value]))
  
  const current = new Date(startDate)
  while (current <= endDate) {
    let key: string
    if (grouping === 'day') {
      key = current.toISOString().split('T')[0]
      current.setDate(current.getDate() + 1)
    } else if (grouping === 'week') {
      const weekStart = getWeekStart(current)
      key = weekStart.toISOString().split('T')[0]
      current.setDate(current.getDate() + 7)
    } else {
      key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      current.setMonth(current.getMonth() + 1)
    }
    
    filled.push({
      date: key,
      value: dataMap.get(key) || 0
    })
  }
  
  return filled
}

