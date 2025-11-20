/**
 * Session Cleanup Utility
 * 
 * This module provides comprehensive session cleanup functionality
 * to protect user data when they log out.
 */

/**
 * Get all localStorage keys that belong to the current user
 */
export function getUserLocalStorageKeys(userId?: string, sessionId?: string): string[] {
  const keys: string[] = []
  
  if (typeof window === 'undefined') return keys

  // Common patterns for user-specific data
  const patterns = [
    'julie-crafts-token',
    'julie-crafts-session',
    'julie-crafts-cart',
    'julie-crafts-orders',
    'profile_image_',
    'user_preferences_',
    'user_settings_',
    'recent_orders_',
    'saved_addresses_',
    'payment_methods_',
    'wishlist_',
  ]

  // User-specific keys
  if (userId) {
    patterns.push(
      `julie-crafts-cart-user-${userId}`,
      `julie-crafts-orders-user-${userId}`,
      `profile_image_${userId}`,
      `user_preferences_${userId}`,
      `user_settings_${userId}`,
      `recent_orders_${userId}`,
      `saved_addresses_${userId}`,
      `payment_methods_${userId}`,
      `wishlist_${userId}`
    )
  }

  // Session-specific keys
  if (sessionId) {
    patterns.push(
      `julie-crafts-cart-session-${sessionId}`,
      `julie-crafts-orders-session-${sessionId}`
    )
  }

  // Scan localStorage for matching keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    // Check if key matches any pattern
    for (const pattern of patterns) {
      if (key.includes(pattern)) {
        keys.push(key)
        break
      }
    }
  }

  return keys
}

/**
 * Clear all user-specific data from localStorage
 */
export function clearUserLocalStorage(userId?: string, sessionId?: string): void {
  if (typeof window === 'undefined') return

  const keysToRemove = getUserLocalStorageKeys(userId, sessionId)
  
  // Remove all matching keys
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key)
      console.log(`Cleared localStorage key: ${key}`)
    } catch (error) {
      console.error(`Error clearing localStorage key ${key}:`, error)
    }
  })

  // Also clear any remaining julie-crafts related keys as fallback
  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('julie-crafts-')) {
      allKeys.push(key)
    }
  }
  
  allKeys.forEach(key => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error clearing localStorage key ${key}:`, error)
    }
  })
}

/**
 * Clear all sessionStorage data
 */
export function clearSessionStorage(): void {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.clear()
    console.log('Cleared sessionStorage')
  } catch (error) {
    console.error('Error clearing sessionStorage:', error)
  }
}

/**
 * Clear all cookies related to the application
 */
export function clearApplicationCookies(): void {
  if (typeof window === 'undefined') return

  const cookiesToClear = [
    'julie-crafts-token',
    'julie-crafts-session',
    'julie-crafts-cart',
    'auth-token',
    'session-id'
  ]

  cookiesToClear.forEach(cookieName => {
    // Clear cookie for current path
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`
    // Clear cookie for root path
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`
    // Clear cookie with domain (if applicable)
    const hostname = window.location.hostname
    document.cookie = `${cookieName}=; domain=${hostname}; path=/; max-age=0; SameSite=Lax`
    document.cookie = `${cookieName}=; domain=.${hostname}; path=/; max-age=0; SameSite=Lax`
  })

  console.log('Cleared application cookies')
}

/**
 * Clear IndexedDB data (if used)
 */
export async function clearIndexedDB(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    // Clear IndexedDB databases if they exist
    const databases = await indexedDB.databases()
    for (const db of databases) {
      if (db.name && db.name.includes('julie-crafts')) {
        const deleteReq = indexedDB.deleteDatabase(db.name)
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = () => resolve(undefined)
          deleteReq.onerror = () => reject(deleteReq.error)
        })
      }
    }
    console.log('Cleared IndexedDB data')
  } catch (error) {
    console.error('Error clearing IndexedDB:', error)
  }
}

/**
 * Comprehensive session cleanup - clears all user data
 */
export async function performCompleteSessionCleanup(userId?: string, sessionId?: string): Promise<void> {
  console.log('Starting complete session cleanup...', { userId, sessionId })

  // Clear localStorage
  clearUserLocalStorage(userId, sessionId)

  // Clear sessionStorage
  clearSessionStorage()

  // Clear cookies
  clearApplicationCookies()

  // Clear IndexedDB (async)
  await clearIndexedDB()

  // Clear any cached API responses (if using a cache)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys()
      const appCaches = cacheNames.filter(name => name.includes('julie-crafts'))
      await Promise.all(appCaches.map(name => caches.delete(name)))
      console.log('Cleared service worker caches')
    } catch (error) {
      console.error('Error clearing caches:', error)
    }
  }

  console.log('Session cleanup completed')
}

