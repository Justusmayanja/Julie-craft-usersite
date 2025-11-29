/**
 * Normalizes image URLs for display
 * Converts relative paths to full Supabase storage URLs
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Get Supabase URL from environment (client-side)
  const supabaseUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL 
    : null
  
  if (!supabaseUrl) {
    // If no Supabase URL, return relative path as-is (might be a local file)
    return url
  }
  
  // Convert /uploads/categories/... to Supabase storage URL
  if (url.startsWith('/uploads/categories/')) {
    const storagePath = url.replace('/uploads/', '')
    return `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`
  }
  
  // If it's a relative path starting with /uploads/ (other than categories), try media bucket
  if (url.startsWith('/uploads/')) {
    const storagePath = url.replace('/uploads/', '')
    return `${supabaseUrl}/storage/v1/object/public/media/${storagePath}`
  }
  
  // If it starts with /storage/, prepend base URL
  if (url.startsWith('/storage/')) {
    return `${supabaseUrl}${url}`
  }
  
  // If it looks like a storage path without leading slash
  if (url.includes('categories/') && !url.startsWith('http') && !url.startsWith('/')) {
    return `${supabaseUrl}/storage/v1/object/public/media/${url}`
  }
  
  // Return as is if we can't normalize (might be a valid relative path)
  return url
}

