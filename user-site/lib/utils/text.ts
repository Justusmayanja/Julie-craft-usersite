/**
 * Utility functions for text manipulation
 */

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Truncates text to a specified number of words
 * @param text - The text to truncate
 * @param maxWords - Maximum number of words
 * @returns Truncated text with ellipsis if needed
 */
export function truncateWords(text: string, maxWords: number): string {
  const words = text.split(' ')
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ') + '...'
}

