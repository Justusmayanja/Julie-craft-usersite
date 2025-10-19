import { useState, useEffect, useCallback } from 'react'

interface AlertSettings {
  low_stock_threshold: number
  critical_stock_threshold: number
  email_notifications: boolean
  dashboard_notifications: boolean
  notification_frequency: 'immediate' | 'daily' | 'weekly'
  email_recipients: string[]
  auto_reorder_enabled: boolean
  reorder_buffer_percentage: number
  category_specific_thresholds: Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>
  product_specific_thresholds: Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>
}

interface AlertStatistics {
  total_items: number
  low_stock_count: number
  critical_stock_count: number
  out_of_stock_count: number
  low_stock_percentage: number
  critical_stock_percentage: number
  out_of_stock_percentage: number
}

interface CategoryOption {
  id: string
  name: string
  low_stock_threshold?: number
  critical_stock_threshold?: number
  enabled?: boolean
}

interface UseAlertSettingsReturn {
  settings: AlertSettings | null
  statistics: AlertStatistics | null
  categories: CategoryOption[]
  loading: boolean
  error: string | null
  saveSettings: (newSettings: AlertSettings) => Promise<void>
  refresh: () => Promise<void>
}

export function useAlertSettings(): UseAlertSettingsReturn {
  const [settings, setSettings] = useState<AlertSettings | null>(null)
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/inventory/alert-settings', {
        method: 'PUT', // Use PUT to get statistics
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch alert settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      setStatistics(data.statistics)
      setCategories(data.category_options || [])
    } catch (err) {
      console.error('Error fetching alert settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch alert settings')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (newSettings: AlertSettings) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/inventory/alert-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings)
      })

      if (!response.ok) {
        throw new Error('Failed to save alert settings')
      }

      const savedSettings = await response.json()
      setSettings(savedSettings)
      
      // Refresh statistics after saving
      await fetchSettings()
    } catch (err) {
      console.error('Error saving alert settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save alert settings')
      throw err // Re-throw so the UI can handle it
    } finally {
      setLoading(false)
    }
  }, [fetchSettings])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    statistics,
    categories,
    loading,
    error,
    saveSettings,
    refresh: fetchSettings,
  }
}
