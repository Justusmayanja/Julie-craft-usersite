/**
 * KPI Helper Functions
 * 
 * Utility functions for calculating KPI metrics, trends, and formatting.
 */

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number, currency: string = "UGX"): string {
  return `${currency} ${amount.toLocaleString()}`
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get date range for a period
 */
export interface DateRange {
  start: Date
  end: Date
}

export function getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth'): DateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      return {
        start: new Date(today),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        start: yesterday,
        end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'thisWeek':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        start: weekStart,
        end: new Date(now)
      }
    
    case 'lastWeek':
      const lastWeekStart = new Date(today)
      lastWeekStart.setDate(today.getDate() - today.getDay() - 7)
      const lastWeekEnd = new Date(today)
      lastWeekEnd.setDate(today.getDate() - today.getDay() - 1)
      return {
        start: lastWeekStart,
        end: new Date(lastWeekEnd.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now)
      }
    
    case 'lastMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      }
    
    default:
      return {
        start: today,
        end: now
      }
  }
}

/**
 * Generate sparkline data for last N days
 */
export function generateSparklineDays(count: number = 7): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    days.push(date)
  }
  
  return days
}

/**
 * Calculate Average Order Value (AOV)
 */
export function calculateAOV(totalRevenue: number, orderCount: number): number {
  if (orderCount === 0) return 0
  return totalRevenue / orderCount
}

/**
 * Calculate Returning Customers Percentage
 */
export function calculateReturningCustomersPercent(
  totalCustomers: number,
  returningCustomers: number
): number {
  if (totalCustomers === 0) return 0
  return (returningCustomers / totalCustomers) * 100
}

/**
 * Format date for Supabase queries (ISO string)
 */
export function formatDateForQuery(date: Date): string {
  return date.toISOString()
}

/**
 * Check if a value is positive trend
 */
export function isPositiveTrend(change: number): boolean {
  return change >= 0
}

