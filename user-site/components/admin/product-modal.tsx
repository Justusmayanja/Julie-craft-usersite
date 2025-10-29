"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Textarea
} from "@/components/ui/textarea"
import { 
  Label
} from "@/components/ui/label"
import {
  X,
  Save,
  Eye,
  Edit,
  Package,
  Hash,
  Tag,
  Image as ImageIcon,
  AlertTriangle,
  Upload,
  Trash2,
  Banknote
} from "lucide-react"
import { Product, Category } from "@/lib/types/product"
import { useToast } from "@/components/admin/ui/toast"

interface ProductModalProps {
  product: Product | null
  categories: Category[]
  isOpen: boolean
  mode: 'view' | 'edit' | 'add'
  onClose: () => void
  onSave?: (productData: Partial<Product>) => Promise<void>
  onRefresh?: () => Promise<void>
}

export function ProductModal({ 
  product, 
  categories, 
  isOpen, 
  mode, 
  onClose, 
  onSave,
  onRefresh 
}: ProductModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({})
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (product && mode !== 'add') {
      setFormData({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        price: product.price,
        cost_price: product.cost_price || 0,
        sku: product.sku || `SKU-${Date.now()}`,
        stock_quantity: product.stock_quantity,
        status: product.status,
        featured: product.featured,
        images: product.images || [],
        weight: product.weight || 0,
        tags: product.tags || [],
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
      })
    } else if (mode === 'add') {
      setFormData({
        name: '',
        description: '',
        category_id: undefined,
        price: 0,
        cost_price: 0,
        sku: `SKU-${Date.now()}`,
        stock_quantity: 0,
        status: 'active',
        featured: false,
        images: [],
        weight: 0,
        tags: [],
        seo_title: '',
        seo_description: '',
      })
    }
  }, [product, mode])

  const handleSave = async () => {
    if (!onSave) return

    // Validate required fields
    if (!formData.name?.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Product name is required'
      })
      return
    }

    if (!formData.description?.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Product description is required'
      })
      return
    }

    // Category is now optional - no validation required

    try {
      setLoading(true)
      console.log('Saving product data:', formData)
      await onSave(formData)
      addToast({
        type: 'success',
        title: mode === 'add' ? 'Product Added' : 'Product Updated',
        description: `Product "${formData.name}" ${mode === 'add' ? 'added' : 'updated'} successfully`
      })
      onClose()
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Error saving product:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save product'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

      const handleImageUpload = async (file: File) => {
        if (!file) return

        try {
          setUploadingImage(true)
          
          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
          if (!allowedTypes.includes(file.type)) {
            addToast({
              type: 'error',
              title: 'Invalid File Type',
              description: 'Only JPEG, PNG, and WebP images are allowed'
            })
            return
          }

          // Validate file size (max 2MB for faster uploads)
          const maxSize = 2 * 1024 * 1024 // 2MB
          if (file.size > maxSize) {
            addToast({
              type: 'error',
              title: 'File Too Large',
              description: 'Maximum file size is 2MB for faster uploads'
            })
            return
          }

          // Compress image before upload
          const compressedFile = await compressImage(file)
          
          const uploadFormData = new FormData()
          uploadFormData.append('file', compressedFile)
          uploadFormData.append('productId', product?.id || 'new')

          const response = await fetch('/api/products/upload', {
            method: 'POST',
            body: uploadFormData,
          })

          if (!response.ok) {
            throw new Error('Failed to upload image')
          }

          const data = await response.json()
          
          // Add the new image to the existing images array
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), data.imageUrl]
          }))

          console.log('Image uploaded successfully')
          alert('Image uploaded successfully')
        } catch (error) {
          console.error('Error uploading image:', error)
          alert('Failed to upload image')
        } finally {
          setUploadingImage(false)
        }
      }

      const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          img.onload = () => {
            // Calculate new dimensions (max 800px width/height)
            const maxSize = 800
            let { width, height } = img
            
            if (width > height) {
              if (width > maxSize) {
                height = (height * maxSize) / width
                width = maxSize
              }
            } else {
              if (height > maxSize) {
                width = (width * maxSize) / height
                height = maxSize
              }
            }
            
            canvas.width = width
            canvas.height = height
            
            // Draw and compress
            ctx?.drawImage(img, 0, 0, width, height)
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            }, 'image/jpeg', 0.8) // 80% quality
          }
          
          img.src = URL.createObjectURL(file)
        })
      }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }))
  }

  const isReadOnly = mode === 'view'
  const title = mode === 'add' ? 'Add Product' : mode === 'edit' ? 'Edit Product' : 'View Product'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            {mode === 'view' ? <Eye className="w-5 h-5" /> : mode === 'edit' ? <Edit className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'view' 
              ? 'View product details and information' 
              : mode === 'edit' 
              ? 'Edit product information and settings'
              : 'Add a new product to your inventory'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  disabled={isReadOnly}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-gray-700 font-medium">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ''}
                      placeholder="Auto-generated"
                      disabled={true}
                      className="bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">SKU will be automatically generated when saved</p>
                  </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-medium">Description *</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter product description"
                rows={3}
                disabled={isReadOnly}
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700 font-medium">Category</Label>
              <Select
                value={formData.category_id || ''}
                onValueChange={(value) => handleInputChange('category_id', value || undefined)}
                disabled={isReadOnly}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select category"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {categories.length === 0 ? (
                    <SelectItem value="no-categories" disabled className="text-gray-500">
                      No categories available
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-gray-900 hover:bg-gray-100">
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-500">
                      No categories available. You can still save the product without a category.
                    </p>
                  )}
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-700 font-medium">Price *</Label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price || 0}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        disabled={isReadOnly}
                      />
                    </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_price" className="text-gray-700 font-medium">Cost Price</Label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price || 0}
                    onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="text-gray-700 font-medium">Stock Quantity *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity || 0}
                    onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Status & Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700 font-medium">Status</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => handleInputChange('status', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="active" className="text-gray-900 hover:bg-gray-100">Active</SelectItem>
                    <SelectItem value="inactive" className="text-gray-900 hover:bg-gray-100">Inactive</SelectItem>
                    <SelectItem value="draft" className="text-gray-900 hover:bg-gray-100">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Featured Product</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured || false}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    disabled={isReadOnly}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="featured" className="text-sm text-gray-700">Mark as featured</Label>
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          {mode !== 'view' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">SEO Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="text-gray-700 font-medium">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title || ''}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="Enter SEO title"
                  maxLength={60}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-gray-700 font-medium">SEO Description</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description || ''}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="Enter SEO description"
                  rows={2}
                  maxLength={160}
                  className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Image Upload */}
          {mode !== 'view' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadingImage ? 'Uploading...' : 'Click to upload product images'}
                  </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WebP up to 2MB (auto-compressed)
                      </p>
                </label>
              </div>

              {/* Current Images */}
              {formData.images && formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* View Images */}
          {mode === 'view' && product?.images && product.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 -mx-6 -mb-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {mode !== 'view' && (
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'add' ? 'Add Product' : 'Save Changes'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
