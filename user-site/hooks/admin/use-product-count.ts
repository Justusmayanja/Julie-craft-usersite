import { useState, useEffect } from 'react'

export function useProductCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductCount = async () => {
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
          setCount(data.totalProducts || 0)
        } else {
          setCount(0)
        }
      } catch (error) {
        console.error('Error fetching product count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchProductCount()

    // Poll every 60 seconds to keep count updated
    const interval = setInterval(fetchProductCount, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return { count, loading }
}

