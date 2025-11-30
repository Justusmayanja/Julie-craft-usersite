/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = 'UGX'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (salePrice >= originalPrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Format price without currency symbol (for display)
 */
export function formatPriceNumber(price: number): string {
  return price.toLocaleString('en-US')
}

