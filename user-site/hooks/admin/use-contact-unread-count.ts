import { useState, useEffect } from 'react'

export function useContactUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('julie-crafts-token') 
          : null

        if (!token) {
          setUnreadCount(0)
          setLoading(false)
          return
        }

        const response = await fetch('/api/admin/contact-messages?status=new&limit=1&offset=0', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unread || 0)
        } else {
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Error fetching contact unread count:', error)
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { unreadCount, loading }
}
