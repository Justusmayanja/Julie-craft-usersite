import { useState, useEffect } from 'react'

export function useBlogCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlogCount = async () => {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/blog/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setCount(data.totalPosts || 0)
        } else {
          setCount(0)
        }
      } catch (error) {
        console.error('Error fetching blog count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchBlogCount()

    // Poll every 60 seconds to keep count updated
    const interval = setInterval(fetchBlogCount, 60000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  return { count, loading }
}

