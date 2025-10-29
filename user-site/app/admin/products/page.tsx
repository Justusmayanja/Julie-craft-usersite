"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ProductModal } from "@/components/admin/product-modal"
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
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('add')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadProducts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const token = localStorage.getItem('julie-crafts-token')
      if (!token) return

      const response = await fetch(`/api/admin/products?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Admin products API response:', data)
        console.log('First product image:', data.products?.[0]?.image)
        setProducts(data.products || [])
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

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

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) return

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      })

      if (response.ok) {
        // Refresh the products list and categories
        await loadProducts(true)
        await loadCategories()
        handleCloseModal()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save product:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to save product')
      }
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Skeleton */}
          <div className="animate-pulse mb-6">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg w-1/4"></div>
          </div>
          
          {/* Loading Spinner */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-gray-600 font-medium">Loading products...</span>
            </div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 h-44 flex flex-col lg:flex-row overflow-hidden animate-pulse">
                {/* Image Skeleton */}
                <div className="w-full lg:w-1/3 h-44 lg:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                  <div className="relative">
                    <Package className="w-10 h-10 text-gray-300" />
                    <div className="absolute inset-0 animate-ping">
                      <Package className="w-10 h-10 text-gray-400 opacity-20" />
                    </div>
                  </div>
                </div>
                
                {/* Content Skeleton */}
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  {/* Title */}
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-1 flex-shrink-0"></div>
                  
                  {/* Description */}
                  <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded mb-3 w-3/4 flex-shrink-0"></div>
                  
                  {/* Price and Status */}
                  <div className="flex justify-between mb-3 flex-shrink-0">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full w-12"></div>
                  </div>
                  
                  {/* Stock and Category */}
                  <div className="flex justify-between mb-4 flex-shrink-0">
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-16"></div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto flex-shrink-0">
                    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-8"></div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header Section - Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Products</h1>
                {refreshing && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-gray-500">Refreshing...</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm sm:text-base">Manage your product catalog</p>
            </div>
            
            {/* Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadProducts(true)}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <div className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <span className="hidden xs:inline">Refresh</span>
              </Button>
              <Button 
                onClick={handleAddProduct}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden xs:inline">Add Product</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </div>
          </div>

        {/* Filters and Search - Responsive */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              
              {/* Filter Dropdowns */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                  className="flex-1 sm:flex-none sm:w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {filteredProducts.map((product) => {
            const stockInfo = getStockStatus(product)
            const StockIcon = stockInfo.icon

            return (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 h-full">
                <div className="flex flex-col xl:flex-row h-full">
                  {/* Image Section */}
                  <div className="relative w-full xl:w-1/3 h-48 xl:h-auto bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
                    {product.image ? (
                      <div className="relative w-full h-full overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.featured && (
                        <Badge className="bg-orange-500 text-white text-xs px-2 py-1 shadow-sm">
                          Featured
                        </Badge>
                      )}
                      {product.status === 'draft' && (
                        <Badge className="bg-gray-500 text-white text-xs px-2 py-1 shadow-sm">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex flex-col flex-1 p-3 sm:p-4 min-h-0">
                    {/* Title and Description */}
                    <div className="mb-3 flex-shrink-0">
                      <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1 leading-tight text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-1 leading-tight">
                        {product.description || 'No description available'}
                      </p>
                    </div>
                    
                    {/* Price and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 flex-shrink-0">
                      <span className="text-base sm:text-lg font-bold text-orange-600">
                        UGX {product.price.toLocaleString()}
                      </span>
                      <Badge 
                        variant={stockInfo.color as any} 
                        className="flex items-center text-xs px-2 py-1 bg-orange-100 text-orange-800 border-orange-200 w-fit"
                      >
                        <StockIcon className="w-3 h-3 mr-1" />
                        {stockInfo.status}
                      </Badge>
                    </div>

                    {/* Stock and Category Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm text-gray-500 mb-4 flex-shrink-0">
                      <span className="truncate">Stock: {product.stock_quantity}</span>
                      <span className="capitalize truncate">{product.category}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-auto flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-8 sm:h-7"
                        onClick={() => handleViewProduct(product)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-8 sm:h-7"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 text-xs h-8"
                        onClick={() => {
                          // TODO: Implement delete functionality
                          console.log('Delete product:', product.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first product"
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
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
    </div>
  )
}
