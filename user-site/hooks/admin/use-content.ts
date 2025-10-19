import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface ContentPage {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  type: 'homepage' | 'about' | 'contact' | 'privacy' | 'terms' | 'custom'
  status: 'published' | 'draft' | 'archived'
  meta_title?: string
  meta_description?: string
  featured_image?: string
  author_id: string
  author_name: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface ContentFilters {
  search?: string
  type?: string
  status?: 'published' | 'draft' | 'archived'
  author_id?: string
  sort_by?: 'created_at' | 'updated_at' | 'published_at' | 'title'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface ContentListResponse {
  pages: ContentPage[]
  total: number
  limit: number
  offset: number
  message?: string
}

export interface ContentStats {
  totalPages: number
  publishedPages: number
  draftPages: number
  archivedPages: number
  homepagePages: number
  customPages: number
  recentPages: number
  pageTypes: Array<{ type: string; count: number }>
  recentActivity: Array<{ id: string; title: string; updated_at: string }>
}

export function useContent() {
  const [pages, setPages] = useState<ContentPage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const { user } = useAuth()

  const fetchPages = useCallback(async (filters: ContentFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.type) params.append('type', filters.type)
      if (filters.status) params.append('status', filters.status)
      if (filters.author_id) params.append('author_id', filters.author_id)
      if (filters.sort_by) params.append('sort_by', filters.sort_by)
      if (filters.sort_order) params.append('sort_order', filters.sort_order)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch(`/api/content?${params.toString()}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch content pages: ${response.statusText}`)
      }

      const data: ContentListResponse = await response.json()
      setPages(data.pages || [])
      setTotalPages(Math.ceil((data.total || 0) / (filters.limit || 50)))
      setTotalCount(data.total || 0)

    } catch (err) {
      console.error('Error fetching content pages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content pages')
    } finally {
      setLoading(false)
    }
  }, [user?.token])

  const fetchPageById = useCallback(async (id: string): Promise<ContentPage | null> => {
    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch content page: ${response.statusText}`)
      }

      const data = await response.json()
      return data.page || null

    } catch (err) {
      console.error('Error fetching content page:', err)
      return null
    }
  }, [])

  const createPage = useCallback(async (pageData: Partial<ContentPage>): Promise<ContentPage | null> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch('/api/content', {
        method: 'POST',
        headers,
        body: JSON.stringify(pageData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create content page: ${response.statusText}`)
      }

      const data = await response.json()
      return data.page || null

    } catch (err) {
      console.error('Error creating content page:', err)
      throw err
    }
  }, [user?.token])

  const updatePage = useCallback(async (id: string, pageData: Partial<ContentPage>): Promise<ContentPage | null> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(pageData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update content page: ${response.statusText}`)
      }

      const data = await response.json()
      return data.page || null

    } catch (err) {
      console.error('Error updating content page:', err)
      throw err
    }
  }, [user?.token])

  const deletePage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to delete content page: ${response.statusText}`)
      }

      return true

    } catch (err) {
      console.error('Error deleting content page:', err)
      throw err
    }
  }, [user?.token])

  const refreshPages = useCallback(() => {
    fetchPages()
  }, [fetchPages])

  return {
    pages,
    loading,
    error,
    totalPages,
    totalCount,
    fetchPages,
    fetchPageById,
    createPage,
    updatePage,
    deletePage,
    refreshPages,
  }
}

export function useContentStats() {
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch('/api/content/stats', {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch content stats: ${response.statusText}`)
      }

      const data: ContentStats = await response.json()
      setStats(data)

    } catch (err) {
      console.error('Error fetching content stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content stats')
    } finally {
      setLoading(false)
    }
  }, [user?.token])

  const refreshStats = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    fetchStats,
    refreshStats,
  }
}
