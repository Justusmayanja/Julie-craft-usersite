"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Eye,
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  X
} from "lucide-react"
import Image from "next/image"
import { useCategories } from "@/hooks/admin/use-products"
import { useCategoryStats } from "@/hooks/admin/use-category-stats"
import { useToast } from "@/components/ui/use-toast"

interface Category {
  id: string
  name: string
  description?: string
  image_url?: string
  is_active: boolean
  sort_order?: number
  tags?: string[]
  created_at: string
  updated_at: string
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const { categories, loading, error, refetch } = useCategories()
  const { stats: categoryStats, loading: statsLoading, error: statsError, refresh: refreshStats } = useCategoryStats()
  const { toast } = useToast()

  // Filter categories based on search
  const filteredCategories = (categories || []).filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Get category stats for display
  const getCategoryStats = (categoryId: string) => {
    return categoryStats?.categories.find(c => c.id === categoryId)
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setIsCreating(true)
    setShowModal(true)
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const uploadCategoryImage = async (categoryId: string): Promise<string | null> => {
    if (!selectedImage) return null

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('categoryId', categoryId)

      const response = await fetch('/api/categories/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      return data.imageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsCreating(false)
    setShowModal(true)
    setSelectedImage(null)
    setImagePreview(category.image_url || null)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete category')
      }

      toast({
        title: 'Category Deleted',
        description: `Category "${category.name}" deleted successfully`
      })
      
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete category',
        variant: 'destructive'
      })
    }
  }

  const handleToggleStatus = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !category.is_active
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update category status')
      }

      toast({
        title: 'Status Updated',
        description: `Category "${category.name}" is now ${!category.is_active ? 'active' : 'inactive'}`
      })
      
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error updating category status:', error)
      toast({
        title: 'Update Failed',
        description: 'Failed to update category status',
        variant: 'destructive'
      })
    }
  }


  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      // Upload image first if a new image was selected
      let imageUrl = editingCategory?.image_url || null
      if (selectedImage) {
        // For editing, use existing category ID; for creating, we'll need to handle this differently
        if (editingCategory?.id) {
          imageUrl = await uploadCategoryImage(editingCategory.id)
        }
      }

      const dataWithImage = { ...categoryData, image_url: imageUrl }

      if (isCreating) {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataWithImage),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create category')
        }

        toast({
          title: 'Category Created',
          description: `Category "${categoryData.name}" created successfully`
        })
      } else if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataWithImage),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update category')
        }

        toast({
          title: 'Category Updated',
          description: `Category "${categoryData.name}" updated successfully`
        })
      }

      setShowModal(false)
      setEditingCategory(null)
      setIsCreating(false)
      setSelectedImage(null)
      setImagePreview(null)
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error saving category:', error)
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Categories</h1>
              <p className="text-gray-600 mt-1 text-base">Organize your products into categories</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  refetch()
                  refreshStats()
                }}
                disabled={loading || statsLoading}
                className="bg-white hover:bg-gray-50 border-gray-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleCreateCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Categories</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsLoading ? '...' : categoryStats?.summary.total_categories || 0}
                  </p>
                  <p className="text-xs text-gray-500">All categories</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Active Categories</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsLoading ? '...' : categoryStats?.summary.active_categories || 0}
                  </p>
                  <p className="text-xs text-gray-500">Currently active</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Package className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Products</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsLoading ? '...' : categoryStats?.summary.total_products || 0}
                  </p>
                  <p className="text-xs text-gray-500">Across all categories</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Inventory Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsLoading ? '...' : `${(categoryStats?.summary.total_inventory_value || 0).toLocaleString()} UGX`}
                  </p>
                  <p className="text-xs text-gray-500">Total stock value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories Table */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-4">Categories</CardTitle>
              
              {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
            </CardHeader>
        
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700 w-16">Image</TableHead>
                      <TableHead className="font-semibold text-gray-700">Name</TableHead>
                      <TableHead className="font-semibold text-gray-700">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700">Products</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Sort Order</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="w-32 font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Loading categories...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-red-600">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>Error loading categories: {error}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
                          <p className="text-gray-600">Try adjusting your search criteria</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCategories.map((category) => {
                        const stats = getCategoryStats(category.id)
                        return (
                          <TableRow key={category.id} className="hover:bg-gray-50/50 transition-colors">
                            {/* Image Column */}
                            <TableCell className="py-4">
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200">
                                {category.image_url ? (
                                  <Image
                                    src={category.image_url}
                                    alt={category.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            {/* Name Column */}
                            <TableCell className="py-4">
                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900">{category.name}</div>
                                {category.tags && category.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {category.tags.slice(0, 2).map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                                        {tag}
                                      </Badge>
                                    ))}
                                    {category.tags.length > 2 && (
                                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                        +{category.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {/* Description Column */}
                            <TableCell className="py-4">
                              <div className="max-w-xs">
                                <p className="text-gray-700 text-sm line-clamp-2">
                                  {category.description || 'No description available'}
                                </p>
                              </div>
                            </TableCell>
                            
                            {/* Products Column */}
                            <TableCell className="py-4">
                              {stats ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900 text-lg">{stats.total_products}</span>
                                    <span className="text-xs text-gray-500">products</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1">
                                      {stats.active_products} active
                                    </Badge>
                                    {stats.low_stock_products > 0 && (
                                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 px-2 py-1">
                                        {stats.low_stock_products} low stock
                                      </Badge>
                                    )}
                                  </div>
                                  {stats.total_inventory_value > 0 && (
                                    <div className="text-xs text-gray-600 font-medium">
                                      {stats.total_inventory_value.toLocaleString()} UGX
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-400">-</span>
                                </div>
                              )}
                            </TableCell>
                            {/* Status Column */}
                            <TableCell className="py-4">
                              <Badge 
                                className={`px-3 py-1 text-xs font-medium ${
                                  category.is_active 
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center space-x-1">
                                  {category.is_active ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>{category.is_active ? 'Active' : 'Inactive'}</span>
                                </div>
                              </Badge>
                            </TableCell>
                            
                            {/* Sort Order Column */}
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-700 font-medium">{category.sort_order ?? 0}</span>
                                {category.sort_order && category.sort_order > 0 && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </TableCell>
                            
                            {/* Created Date Column */}
                            <TableCell className="py-4">
                              <div className="text-gray-700 text-sm">
                                {new Date(category.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </TableCell>
                            {/* Actions Column */}
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditCategory(category)}
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700 p-2"
                                  title="Edit category"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleToggleStatus(category)}
                                  className={`p-2 ${
                                    category.is_active 
                                      ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                                      : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                  title={category.is_active ? "Deactivate category" : "Activate category"}
                                >
                                  {category.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                      </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Modal - You can implement this similar to ProductModal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">
              {isCreating ? 'Create Category' : 'Edit Category'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                sort_order: Number(formData.get('sort_order')),
                is_active: formData.get('is_active') === 'on'
              }
              handleSaveCategory(data)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input
                    name="name"
                    defaultValue={editingCategory?.name || ''}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    name="description"
                    defaultValue={editingCategory?.description || ''}
                    className="w-full"
                  />
                </div>
                
                {/* Image Upload Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {(imagePreview || editingCategory?.image_url) && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <Image
                          src={imagePreview || editingCategory?.image_url || ''}
                          alt="Category preview"
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {imagePreview || editingCategory?.image_url ? 'Change Image' : 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      
                      {uploadingImage && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Supported formats: JPEG, PNG, WEBP. Max size: 5MB
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <Input
                    name="sort_order"
                    type="number"
                    defaultValue={editingCategory?.sort_order ?? 0}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={editingCategory?.is_active ?? true}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isCreating ? 'Create' : 'Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
