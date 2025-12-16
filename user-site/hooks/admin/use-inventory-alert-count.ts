import { useState, useEffect } from 'react'

export function useInventoryAlertCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInventoryAlertCount = async () => {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          // Count low stock products (stock < 10)
          setCount(data.lowStockProducts || 0)
        } else {
          setCount(0)
        }
      } catch (error) {
        console.error('Error fetching inventory alert count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchInventoryAlertCount()

    // Poll every 60 seconds to keep count updated
    const interval = setInterval(fetchInventoryAlertCount, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return { count, loading }
}

