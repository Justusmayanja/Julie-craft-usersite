"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductModal } from "@/components/admin/product-modal"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string | null
  images?: string[]
  featured_image?: string
  category: string
  stock_quantity: number
  featured: boolean
  inStock: boolean
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
  // Additional admin-specific fields
  sku?: string
  weight?: number
  dimensions?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
  seo_keywords?: string
}

interface Category {
  id: string
  name: string
  description?: string
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [totalProducts, setTotalProducts] = useState(0)
  const { toast } = useToast()
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('add')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Calculate offset based on current page
  const offset = (currentPage - 1) * itemsPerPage

  useEffect(() => {
    loadCategories()
  }, [])

  // Reload products when pagination or filters change
  useEffect(() => {
    // Only load products after categories are loaded (for category filter)
    if (categories.length > 0 || selectedCategory === 'all') {
      loadProducts()
    }
  }, [currentPage, itemsPerPage, searchTerm, selectedCategory, selectedStatus, categories.length])

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('julie-crafts-token')
      if (!token) return

      // Build query parameters for server-side filtering and pagination
      const params = new URLSearchParams()
      params.append('limit', itemsPerPage.toString())
      params.append('offset', offset.toString())
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory !== 'all') {
        // Need to get category_id from category name
        const category = categories.find(cat => cat.name === selectedCategory || cat.id === selectedCategory)
        if (category) params.append('category_id', category.id)
      }
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/admin/products?${params.toString()}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setTotalProducts(data.total || 0)
      } else {
        console.error('Failed to fetch products:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        console.error('Failed to fetch categories')
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  // Server-side pagination - products are already filtered and paginated by API
  // Only do client-side filtering if search/category/status filters aren't applied to API
  const filteredProducts = products.filter(product => {
    // If we're doing server-side filtering, these checks are redundant but safe
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Pagination calculations using total from API (server-side pagination)
  const totalPages = Math.ceil(totalProducts / itemsPerPage)
  const startIndex = offset
  const endIndex = Math.min(startIndex + filteredProducts.length, totalProducts)
  const paginatedProducts = filteredProducts

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedStatus])

  const getStockStatus = (product: Product) => {
    // Check product status first
    if (product.status === 'draft') {
      return { status: "Draft", color: "secondary", icon: AlertTriangle }
    } else if (product.status === 'inactive') {
      return { status: "Inactive", color: "destructive", icon: AlertTriangle }
    } else if (product.stock_quantity === 0) {
      return { status: "Out of Stock", color: "destructive", icon: AlertTriangle }
    } else if (product.stock_quantity <= 5) {
      return { status: "Low Stock", color: "secondary", icon: AlertTriangle }
    } else {
      return { status: "In Stock", color: "default", icon: CheckCircle }
    }
  }

  // Modal handlers
  const handleAddProduct = () => {
    setSelectedProduct(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in again to continue.',
          variant: 'destructive'
        })
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        return
      }

      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete product' }))
        throw new Error(errorData.error || 'Failed to delete product')
      }

      // Show success toast
      toast({
        title: 'Product Deleted',
        description: `"${productToDelete.name}" has been deleted successfully.`,
      })
      
      // Refresh the products list
      await loadProducts(true)
      
      // Close dialog
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete product'
      toast({
        title: 'Delete Failed',
        description: errorMessage,
        variant: 'destructive'
      })
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) return

      // Check if it's an update (has id) or create (no id)
      const isUpdate = productData.id && modalMode === 'edit'
      const url = isUpdate 
        ? `/api/admin/products/${productData.id}`
        : '/api/admin/products'
      const method = isUpdate ? 'PUT' : 'POST'

      // Remove id from body for POST (create), keep it in URL for PUT (update)
      const { id, ...bodyData } = productData

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(isUpdate ? bodyData : productData)
      })

      if (response.ok) {
        // Show success toast
        toast({
          title: modalMode === 'add' ? 'Product Created' : 'Product Updated',
          description: modalMode === 'add' 
            ? 'Product has been created successfully.'
            : 'Product has been updated successfully.',
        })
        
        // Refresh the products list and categories
        await loadProducts(true)
        await loadCategories()
        handleCloseModal()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save product:', errorData)
        // Better error message extraction - handle different error formats
        let errorMessage = 'Failed to save product'
        if (errorData.message) {
          errorMessage = errorData.message
          // If it's a duplicate SKU error, make it more user-friendly
          if (errorData.message.includes('duplicate key') || errorData.message.includes('sku')) {
            errorMessage = 'A product with this SKU already exists. Please try again or use a different SKU.'
          }
        } else if (errorData.details) {
          errorMessage = errorData.details
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        toast({
          title: 'Save Failed',
          description: errorMessage,
          variant: 'destructive'
        })
        // Re-throw so modal can handle it and reset SKU
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product'
      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header Skeleton */}
          <div className="animate-pulse mb-4 sm:mb-6">
            <div className="h-6 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-1/3 sm:w-1/4"></div>
          </div>
          
          {/* Loading Spinner */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-primary border-t-transparent"></div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">Loading products...</span>
            </div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 h-40 sm:h-44 flex flex-col lg:flex-row overflow-hidden animate-pulse">
                {/* Image Skeleton */}
                <div className="w-full lg:w-1/3 h-40 sm:h-44 lg:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="relative">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                    <div className="absolute inset-0 animate-ping">
                      <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 opacity-20" />
                    </div>
                  </div>
                </div>
                
                {/* Content Skeleton */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col min-h-0">
                  {/* Title */}
                  <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-1.5 sm:mb-2 flex-shrink-0"></div>
                  
                  {/* Description */}
                  <div className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-2 sm:mb-3 w-3/4 flex-shrink-0"></div>
                  
                  {/* Price and Status */}
                  <div className="flex justify-between mb-2 sm:mb-3 flex-shrink-0">
                    <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 sm:w-20"></div>
                    <div className="h-4 sm:h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full w-12 sm:w-16"></div>
                  </div>
                  
                  {/* Stock and Category */}
                  <div className="flex justify-between mb-3 sm:mb-4 flex-shrink-0">
                    <div className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-12 sm:w-16"></div>
                    <div className="h-2.5 sm:h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16 sm:w-20"></div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-auto flex-shrink-0">
                    <div className="h-7 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                    <div className="h-7 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                    <div className="h-7 sm:h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">Products</h1>
                {refreshing && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-xs sm:text-sm text-gray-500">Refreshing...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-1">Manage your product catalog</p>
            </div>
            
            {/* Action Buttons - Responsive */}
            <div className="flex flex-row items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadProducts(true)}
                disabled={refreshing}
                className="flex items-center justify-center space-x-1 sm:space-x-2 h-9 sm:h-10 px-3 sm:px-4"
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`}>
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="hidden sm:inline text-xs sm:text-sm">Refresh</span>
              </Button>
              <Button 
                onClick={handleAddProduct}
                className="h-9 sm:h-10 px-3 sm:px-4 flex-1 sm:flex-initial"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Add Product</span>
              </Button>
            </div>
          </div>

        {/* Filters and Search - Responsive */}
        <Card className="shadow-sm">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full h-9 sm:h-10 text-sm"
                />
              </div>
              
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm h-9 sm:h-10"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 sm:flex-none sm:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm h-9 sm:h-10"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {paginatedProducts.map((product) => {
            const stockInfo = getStockStatus(product)
            const StockIcon = stockInfo.icon

            return (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 h-full shadow-sm">
                <div className="flex flex-col lg:flex-row h-full">
                  {/* Image Section */}
                  <div className="relative w-full lg:w-1/3 h-40 sm:h-48 lg:h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                    {product.image ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.featured && (
                        <Badge className="bg-orange-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-sm">
                          Featured
                        </Badge>
                      )}
                      {product.status === 'draft' && (
                        <Badge className="bg-gray-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 shadow-sm">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-3 sm:p-4 lg:p-5 min-h-0">
                    {/* Title and Description */}
                    <div className="mb-2 sm:mb-3 flex-shrink-0">
                      <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 leading-tight text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-snug">
                        {product.description || 'No description available'}
                      </p>
                    </div>
                    
                    {/* Price and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2 sm:mb-3 flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-orange-600">
                        UGX {product.price.toLocaleString()}
                      </span>
                      <Badge 
                        variant={stockInfo.color as any} 
                        className="flex items-center text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-800 border-orange-200 w-fit"
                      >
                        <StockIcon className="w-3 h-3 mr-1" />
                        {stockInfo.status}
                      </Badge>
                    </div>

                    {/* Stock and Category Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 flex-shrink-0">
                      <span className="truncate">Stock: {product.stock_quantity}</span>
                      <span className="capitalize truncate">{product.category}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 mt-auto flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                        <span className="hidden xs:inline">View</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                        <span className="hidden xs:inline">Edit</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="text-center py-8 sm:py-12 px-4">
              <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first product"
                }
              </p>
              <Button onClick={handleAddProduct} className="h-9 sm:h-10 px-4 sm:px-6">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="text-sm">Add Product</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {endIndex} of {totalProducts} products
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1) // Reset to first page when changing page size
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pagination controls */}
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
      
      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        categories={categories}
        isOpen={isModalOpen}
        mode={modalMode}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        onRefresh={() => loadProducts(true)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Product</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone and will also delete all associated images.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false)
                setProductToDelete(null)
              }}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-9 sm:h-10"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
