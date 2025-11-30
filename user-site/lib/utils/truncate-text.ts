/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Truncate text to a specified number of lines (CSS line-clamp alternative)
 */
export function truncateLines(text: string, lines: number = 2): string {
  if (!text) return ''
  const words = text.split(' ')
  const avgCharsPerLine = 50 // Approximate characters per line
  const maxChars = avgCharsPerLine * lines
  
  if (text.length <= maxChars) return text
  
  return words.reduce((acc, word) => {
    if (acc.length + word.length + 1 <= maxChars) {
      return acc + (acc ? ' ' : '') + word
    }
    return acc
  }, '') + '...'
}

