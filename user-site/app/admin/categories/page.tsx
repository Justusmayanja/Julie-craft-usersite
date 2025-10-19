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
  TrendingUp
} from "lucide-react"
import { useCategories } from "@/hooks/admin/use-products"
import { useCategoryStats } from "@/hooks/admin/use-category-stats"
import { useToast } from "@/components/ui/toast"

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

  const { categories, loading, error, refetch } = useCategories()
  const { stats: categoryStats, loading: statsLoading, error: statsError, refresh: refreshStats } = useCategoryStats()
  const { addToast } = useToast()

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
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
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsCreating(false)
    setShowModal(true)
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

      addToast({
        type: 'success',
        title: 'Category Deleted',
        description: `Category "${category.name}" deleted successfully`
      })
      
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error deleting category:', error)
      addToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete category'
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

      addToast({
        type: 'success',
        title: 'Status Updated',
        description: `Category "${category.name}" is now ${!category.is_active ? 'active' : 'inactive'}`
      })
      
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error updating category status:', error)
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update category status'
      })
    }
  }

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    try {
      if (isCreating) {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create category')
        }

        addToast({
          type: 'success',
          title: 'Category Created',
          description: `Category "${categoryData.name}" created successfully`
        })
      } else if (editingCategory) {
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update category')
        }

        addToast({
          type: 'success',
          title: 'Category Updated',
          description: `Category "${categoryData.name}" updated successfully`
        })
      }

      setShowModal(false)
      setEditingCategory(null)
      setIsCreating(false)
      await refetch()
      await refreshStats()
    } catch (error) {
      console.error('Error saving category:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save category'
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
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Loading categories...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="text-red-600">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>Error loading categories: {error}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
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
                        <TableCell className="py-4">
                              <div className="font-semibold text-gray-900">{category.name}</div>
                              {category.tags && category.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {category.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {category.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{category.tags.length - 2}
                                    </Badge>
                                  )}
                          </div>
                              )}
                            </TableCell>
                            <TableCell className="py-4 text-gray-700">
                              {category.description || '-'}
                        </TableCell>
                        <TableCell className="py-4">
                              {stats ? (
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">{stats.total_products}</span>
                                    <span className="text-xs text-gray-500">products</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                                      {stats.active_products} active
                                    </Badge>
                                    {stats.low_stock_products > 0 && (
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        {stats.low_stock_products} low stock
                                      </Badge>
                                    )}
                                  </div>
                                  {stats.total_inventory_value > 0 && (
                                    <div className="text-xs text-gray-500">
                                      {stats.total_inventory_value.toLocaleString()} UGX
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge 
                                className={category.is_active 
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                                }
                              >
                                {category.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                            <TableCell className="py-4 text-gray-700">
                              {category.sort_order ?? 0}
                            </TableCell>
                            <TableCell className="py-4 text-gray-700">
                              {new Date(category.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-4">
                        <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditCategory(category)}
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                            <Edit className="w-4 h-4" />
                          </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleToggleStatus(category)}
                                  className={category.is_active 
                                    ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  }
                                >
                                  {category.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
