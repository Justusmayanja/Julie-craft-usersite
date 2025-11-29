import { useState, useEffect } from 'react'

export function useMediaCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMediaCount = async () => {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        if (!token) {
          setLoading(false)
          return
        }

        // Fetch with limit=1 to get just the total count
        const response = await fetch('/api/media?limit=1&offset=0', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setCount(data.total || 0)
        } else {
          setCount(0)
        }
      } catch (error) {
        console.error('Error fetching media count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchMediaCount()

    // Listen for custom event when media is added/deleted
    const handleMediaChange = () => {
      fetchMediaCount()
    }
    window.addEventListener('mediaLibraryChanged', handleMediaChange)

    // Poll every 60 seconds to keep count updated
    const interval = setInterval(fetchMediaCount, 60000)

    return () => {
      window.removeEventListener('mediaLibraryChanged', handleMediaChange)
      clearInterval(interval)
    }
  }, [])

  return { count, loading }
}

