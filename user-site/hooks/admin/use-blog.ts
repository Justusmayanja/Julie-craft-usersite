import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'published' | 'draft' | 'scheduled'
  category: string
  author_id: string
  author_name: string
  publish_date: string | null
  scheduled_date: string | null
  featured_image: string | null
  featured: boolean
  views: number
  likes: number
  comments_count: number
  meta_title?: string
  meta_description?: string
  tags?: string[]
  created_at: string
  updated_at: string
}

export interface BlogStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalViews: number
  totalLikes: number
  totalComments: number
  featuredPosts: number
  categories: Array<{ category: string; count: number }>
  recentPosts: number
  popularPosts: Array<{ id: string; title: string; views: number }>
}

export interface BlogFilters {
  search?: string
  status?: 'published' | 'draft' | 'scheduled'
  category?: string
  author_id?: string
  featured?: boolean
  sort_by?: 'created_at' | 'updated_at' | 'publish_date' | 'views' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export function useBlog() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const fetchPosts = useCallback(async (filters: BlogFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.author_id) params.append('author_id', filters.author_id)
      if (filters.featured !== undefined) params.append('featured', String(filters.featured))
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch(`/api/blog?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
      }

      const data = await response.json()
      setPosts(data.posts)
      setTotal(data.total)

    } catch (err) {
      console.error('Error fetching blog posts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts')
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchPostById = useCallback(async (id: string) => {
    try {
      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch(`/api/blog/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch blog post')
      }

      const data = await response.json()
      return data.post

    } catch (err) {
      console.error('Error fetching blog post:', err)
      throw err
    }
  }, [user])

  const createPost = useCallback(async (postData: Partial<BlogPost>) => {
    try {
      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || 'Failed to create blog post'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data.post

    } catch (err) {
      console.error('Error creating blog post:', err)
      throw err
    }
  }, [user])

  const updatePost = useCallback(async (id: string, postData: Partial<BlogPost>) => {
    try {
      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch(`/api/blog/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to update blog post')
      }

      const data = await response.json()
      return data.post

    } catch (err) {
      console.error('Error updating blog post:', err)
      throw err
    }
  }, [user])

  const deletePost = useCallback(async (id: string) => {
    try {
      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete blog post')
      }

      return true

    } catch (err) {
      console.error('Error deleting blog post:', err)
      throw err
    }
  }, [user])

  const refreshPosts = useCallback(async () => {
    await fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    if (user) {
      fetchPosts()
    }
  }, [user, fetchPosts])

  return {
    posts,
    loading,
    error,
    total,
    fetchPosts,
    fetchPostById,
    createPost,
    updatePost,
    deletePost,
    refreshPosts,
  }
}

export function useBlogStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = user?.token || (typeof window !== 'undefined' ? localStorage.getItem('julie-crafts-token') : null)
      const response = await fetch('/api/blog/stats', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch blog stats: ${response.statusText}`)
      }

      const data: BlogStats = await response.json()
      setStats(data)

    } catch (err) {
      console.error('Error fetching blog stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch blog stats')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user, fetchStats])

  return {
    stats,
    loading,
    error,
    fetchStats,
  }
}

