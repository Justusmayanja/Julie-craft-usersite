import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface MediaFile {
  id: string
  filename: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string
  alt_text?: string
  caption?: string
  category: 'images' | 'documents' | 'videos' | 'other'
  uploaded_by: string
  uploaded_by_name: string
  created_at: string
  updated_at: string
}

export interface MediaFilters {
  search?: string
  category?: 'images' | 'documents' | 'videos' | 'other'
  mime_type?: string
  uploaded_by?: string
  sort_by?: 'created_at' | 'updated_at' | 'filename' | 'file_size'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface MediaListResponse {
  files: MediaFile[]
  total: number
  limit: number
  offset: number
  message?: string
}

export function useMedia() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const { user } = useAuth()

  const fetchFiles = useCallback(async (filters: MediaFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.mime_type) params.append('mime_type', filters.mime_type)
      if (filters.uploaded_by) params.append('uploaded_by', filters.uploaded_by)
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

      const response = await fetch(`/api/media?${params.toString()}`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch media files: ${response.statusText}`)
      }

      const data: MediaListResponse = await response.json()
      setFiles(data.files || [])
      setTotalPages(Math.ceil((data.total || 0) / (filters.limit || 50)))
      setTotalCount(data.total || 0)

    } catch (err) {
      console.error('Error fetching media files:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch media files')
    } finally {
      setLoading(false)
    }
  }, [user?.token])

  const uploadFile = useCallback(async (file: File, metadata?: { alt_text?: string; caption?: string; category?: string }): Promise<MediaFile | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (metadata?.alt_text) formData.append('alt_text', metadata.alt_text)
      if (metadata?.caption) formData.append('caption', metadata.caption)
      if (metadata?.category) formData.append('category', metadata.category)

      const headers: HeadersInit = {}

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()
      return data.file || null

    } catch (err) {
      console.error('Error uploading file:', err)
      throw err
    }
  }, [user?.token])

  const deleteFile = useCallback(async (id: string): Promise<boolean> => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const response = await fetch(`/api/media?id=${id}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      return true

    } catch (err) {
      console.error('Error deleting file:', err)
      throw err
    }
  }, [user?.token])

  const refreshFiles = useCallback(() => {
    fetchFiles()
  }, [fetchFiles])

  return {
    files,
    loading,
    error,
    totalPages,
    totalCount,
    fetchFiles,
    uploadFile,
    deleteFile,
    refreshFiles,
  }
}
