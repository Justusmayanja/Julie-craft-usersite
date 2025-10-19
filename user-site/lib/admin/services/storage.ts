import { createClient } from '@/lib/supabase/server'

export class StorageService {
  private async getSupabase() {
    return await createClient()
  }

  async uploadProductImage(file: File, productId: string): Promise<string> {
    try {
      const supabase = await this.getSupabase()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading product image:', error)
      throw error
    }
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get 'products/filename'

      const { error } = await supabase.storage
        .from('products')
        .remove([filePath])

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting product image:', error)
      throw error
    }
  }

  async uploadCategoryImage(file: File, categoryId: string): Promise<string> {
    try {
      const supabase = await this.getSupabase()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${categoryId}-${Date.now()}.${fileExt}`
      const filePath = `categories/${fileName}`

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading category image:', error)
      throw error
    }
  }

  async deleteCategoryImage(imageUrl: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get 'categories/filename'

      const { error } = await supabase.storage
        .from('media')
        .remove([filePath])

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting category image:', error)
      throw error
    }
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    try {
      const supabase = await this.getSupabase()
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Failed to upload avatar: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  async deleteAvatar(imageUrl: string): Promise<void> {
    try {
      const supabase = await this.getSupabase()
      
      // Extract file path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-2).join('/') // Get 'avatars/filename'

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (error) {
        throw new Error(`Failed to delete avatar: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting avatar:', error)
      throw error
    }
  }
}

export const storageService = new StorageService()
