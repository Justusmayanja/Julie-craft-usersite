"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { useRobustInventory } from "@/hooks/admin/use-robust-inventory"

interface StockAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: {
    id: string
    name: string
    sku: string
    physical_stock: number
    available_stock: number
    reserved_stock: number
    min_stock_level: number
    max_stock_level: number
    reorder_point: number
  } | null
}

export function StockAdjustmentModal({ isOpen, onClose, onSuccess, product }: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [reference, setReference] = useState('')
  const [validationError, setValidationError] = useState('')

  const { loading, error } = useRobustInventory()

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen && product) {
      setQuantity('')
      setReason('')
      setNotes('')
      setReference('')
      setValidationError('')
    }
  }, [isOpen, product])

  // Auto-suggest adjustment type based on reason
  useEffect(() => {
    if (reason) {
      switch (reason) {
        case 'new_creation':
        case 'customer_return':
        case 'supplier_delivery':
        case 'inventory_correction':
          if (adjustmentType === 'decrease') {
            setAdjustmentType('increase')
          }
          break
        case 'quality_issue':
        case 'damage_loss':
        case 'theft_loss':
        case 'sold_item':
        case 'gift_donation':
          if (adjustmentType === 'increase') {
            setAdjustmentType('decrease')
          }
          break
      }
    }
  }, [reason, adjustmentType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) return

    // Clear previous errors
    setValidationError('')

    // Basic validation
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum) || quantityNum < 0) {
      setValidationError('Please enter a valid positive quantity')
      return
    }

    if (!reason) {
      setValidationError('Please select a reason for the adjustment')
      return
    }

    // Calculate new quantity based on adjustment type
    let newQuantity = product.physical_stock || 0
    if (adjustmentType === 'increase') {
      newQuantity = product.physical_stock + quantityNum
    } else if (adjustmentType === 'decrease') {
      newQuantity = product.physical_stock - quantityNum
    } else if (adjustmentType === 'set') {
      newQuantity = quantityNum
    }

    // Validate new quantity
    if (newQuantity < 0) {
      setValidationError('Cannot set stock below zero')
      return
    }

    try {
      // Map our new reason values to the API's expected values
      const reasonMapping: Record<string, string> = {
        'new_creation': 'received',
        'supplier_delivery': 'received', 
        'customer_return': 'return',
        'inventory_correction': 'correction',
        'sold_item': 'sale',
        'quality_issue': 'damaged',
        'damage_loss': 'damaged',
        'gift_donation': 'other',
        'theft_loss': 'lost'
      }

      // Use the basic inventory adjustment API
      const adjustmentData = {
        product_id: product.id,
        adjustment_type: adjustmentType,
        quantity: quantityNum,
        reason: reasonMapping[reason] || 'other',
        notes: notes || `Stock ${adjustmentType}: ${reason}`,
        reference: reference || undefined
      }

      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustmentData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust stock')
      }

      // Success - close modal and refresh data
      onSuccess()
      onClose()
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to submit adjustment')
    }
  }

  // Enhanced business logic validation
  const validateStockAdjustment = (product: any, type: string, quantity: number, reason: string) => {
    // Check for zero quantity adjustments
    if (quantity === 0 && type !== 'set') {
      return { isValid: false, error: 'Adjustment quantity cannot be zero' }
    }

    // Check for unreasonably large adjustments
    if (quantity > 10000) {
      return { isValid: false, error: 'Adjustment quantity seems unusually large. Please verify the amount.' }
    }

    // Business rules based on reason
    switch (reason) {
      case 'received':
        if (type === 'decrease' || type === 'reserve' || type === 'unreserve') {
          return { isValid: false, error: 'Stock received should be an increase, not a decrease or reservation' }
        }
        break
      case 'damaged':
      case 'lost':
        if (type === 'increase' || type === 'reserve' || type === 'unreserve') {
          return { isValid: false, error: 'Damaged/lost items should decrease stock, not increase or reserve it' }
        }
        break
      case 'sale':
        if (type === 'increase' || type === 'reserve' || type === 'unreserve') {
          return { isValid: false, error: 'Sales should decrease stock, not increase or reserve it' }
        }
        break
      case 'transfer':
        if (type === 'increase' || type === 'decrease') {
          return { isValid: false, error: 'Internal transfers should use reserve/unreserve, not direct stock changes' }
        }
        break
    }

    // Check for potential data entry errors
    if (type === 'set' && quantity === product.physical_stock) {
      return { isValid: false, error: 'New quantity is the same as current quantity. No adjustment needed.' }
    }

    // Check reservation limits
    if (type === 'reserve' && quantity > product.physical_stock) {
      return { isValid: false, error: `Cannot reserve ${quantity} units. Only ${product.physical_stock} units available.` }
    }

    return { isValid: true, error: '' }
  }

  // Enhanced quantity calculation
  const calculateNewQuantity = (current: number, type: string, quantity: number) => {
    switch (type) {
      case 'increase':
        return current + quantity
      case 'decrease':
        return Math.max(0, current - quantity)
      case 'set':
        return quantity
      default:
        return current
    }
  }

  // Calculate available quantity after reservation changes
  const calculateAvailableQuantity = (current: number, reserved: number, type: string, quantity: number) => {
    const currentReserved = reserved || 0
    switch (type) {
      case 'increase':
        return current + quantity - currentReserved
      case 'decrease':
        return Math.max(0, current - quantity - currentReserved)
      case 'set':
        return quantity - currentReserved
      default:
        return current - currentReserved
    }
  }

  const getNewQuantity = () => {
    if (!product || !quantity) return product?.physical_stock || 0
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum)) return product.physical_stock

    return calculateNewQuantity(product.physical_stock, adjustmentType, quantityNum)
  }

  const getQuantityChange = () => {
    if (!product || !quantity) return 0
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum)) return 0

    const newQty = calculateNewQuantity(product.physical_stock, adjustmentType, quantityNum)
    return newQty - product.physical_stock
  }

  const getNewReservedQuantity = () => {
    if (!product || !quantity) return product?.reserved_stock || 0
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum)) return product.reserved_stock || 0

    const currentReserved = product.reserved_stock || 0
    switch (adjustmentType) {
      default:
        return currentReserved
    }
  }

  const getNewAvailableQuantity = () => {
    if (!product || !quantity) return product?.available_stock || 0
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum)) return product.available_stock || 0

    return calculateAvailableQuantity(
      product.physical_stock, 
      product.reserved_stock || 0, 
      adjustmentType, 
      quantityNum
    )
  }

  // Enhanced validation for real-time feedback
  const getValidationWarning = () => {
    if (!product || !quantity) return null
    
    const quantityNum = parseInt(quantity)
    if (isNaN(quantityNum)) return null

    const newQty = calculateNewQuantity(product.physical_stock, adjustmentType, quantityNum)
    const newAvailable = getNewAvailableQuantity()
    
    
    // Check for low stock warning
    if (newQty > 0 && newQty <= (product.reorder_point || 0)) {
      return { type: 'warning', message: 'Stock will be below reorder point after adjustment' }
    }
    
    // Check for out of stock warning
    if (newQty === 0) {
      return { type: 'error', message: 'Stock will be completely depleted' }
    }
    
    // Maximum stock level warning removed - allowing unlimited stock levels
    
    return null
  }

  const getStatusColor = (newQty: number) => {
    if (!product) return 'text-slate-600'
    if (newQty === 0) return 'text-red-600'
    if (newQty <= (product.min_stock_level || 0)) return 'text-yellow-600'
    if (newQty <= (product.reorder_point || 0)) return 'text-orange-600'
    return 'text-green-600'
  }

  const getStatusText = (newQty: number) => {
    if (!product) return 'Unknown'
    if (newQty === 0) return 'Out of Stock'
    if (newQty <= (product.min_stock_level || 0)) return 'Low Stock'
    if (newQty <= (product.reorder_point || 0)) return 'Below Reorder Point'
    return 'In Stock'
  }

  if (!product) return null

  const newQuantity = getNewQuantity()
  const quantityChange = getQuantityChange()
  const validationWarning = getValidationWarning()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-slate-200/60">
        <DialogHeader className="pb-6 bg-white/90 backdrop-blur-sm rounded-t-xl border-b border-slate-200/60 p-6 -m-6 mb-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            Stock Adjustment
          </DialogTitle>
          <p className="text-slate-600 text-sm font-medium mt-2">Update inventory levels for {product.name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/60 shadow-lg">
          {/* Enhanced Product Info */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200/60 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                <p className="text-slate-600 text-sm font-medium">Product Information</p>
              </div>
              <Badge variant="outline" className="bg-white border-slate-300 text-slate-700 font-semibold px-3 py-1">
                {product.sku}
              </Badge>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Total Stock</div>
                <div className="text-lg font-bold text-slate-900">{product.physical_stock}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Available</div>
                <div className="text-lg font-bold text-emerald-600">{product.available_stock || product.physical_stock}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reserved</div>
                <div className="text-lg font-bold text-purple-600">{product.reserved_stock || 0}</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200/60">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reorder Point</div>
                <div className="text-lg font-bold text-slate-900">{product.reorder_point}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 font-medium">
              💡 Maximum stock level constraint removed - unlimited stock levels allowed
            </div>
          </div>

          {/* Enhanced Adjustment Type */}
          <div className="space-y-3">
            <Label htmlFor="adjustment-type" className="text-sm font-semibold text-slate-900">Adjustment Type</Label>
            <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
              <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-green-100 rounded-md">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Add to Inventory</div>
                      <div className="text-xs text-slate-500">New creations, returns, deliveries</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="decrease">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-red-100 rounded-md">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Remove from Inventory</div>
                      <div className="text-xs text-slate-500">Sales, damages, losses</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="set">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Set Exact Count</div>
                      <div className="text-xs text-slate-500">Physical count correction</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Quantity Input */}
          <div className="space-y-3">
            <Label htmlFor="quantity" className="text-sm font-semibold text-slate-900">
              {adjustmentType === 'set' ? 'New Quantity' : 'Quantity to Adjust'}
            </Label>
            <div className="relative">
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  adjustmentType === 'set' ? 'Enter new quantity' : 'Enter quantity'
                }
                className="bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm pl-4 pr-12 text-slate-900 placeholder-slate-500"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm font-medium">
                units
              </div>
            </div>
            {adjustmentType !== 'set' && (
              <p className="text-xs text-slate-500 font-medium">
                {adjustmentType === 'increase' 
                  ? `Will add to current stock of ${product.physical_stock} (unlimited capacity)`
                  : adjustmentType === 'decrease'
                  ? `Will subtract from current stock of ${product.physical_stock}`
                  : adjustmentType === 'reserve'
                  ? `Will reserve from available stock (${product.available_stock || product.physical_stock} available)`
                  : adjustmentType === 'unreserve'
                  ? `Will unreserve from reserved stock (${product.reserved_stock || 0} reserved)`
                  : `Will adjust current stock of ${product.physical_stock}`
                }
              </p>
            )}
          </div>

          {/* Enhanced Preview */}
          {quantity && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 bg-blue-100 rounded-md">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-bold text-blue-900 text-base">Adjustment Preview</h4>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-3 rounded-lg border border-blue-200/60">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Current Stock</div>
                  <div className="text-lg font-bold text-slate-900">{product.physical_stock}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200/60">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Change</div>
                  <div className={`text-lg font-bold ${quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quantityChange >= 0 ? '+' : ''}{quantityChange}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200/60">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">New Stock</div>
                  <div className={`text-lg font-bold ${getStatusColor(newQuantity)}`}>
                    {newQuantity}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200/60">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Reserved</div>
                  <div className="text-lg font-bold text-purple-600">
                    {getNewReservedQuantity()}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200/60">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Available</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {getNewAvailableQuantity()}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-white p-3 rounded-lg border border-blue-200/60">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Status</div>
                <div className={`text-sm font-bold ${getStatusColor(newQuantity)}`}>
                  {getStatusText(newQuantity)}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Validation Warning */}
          {validationWarning && (
            <Alert className={`border-2 ${
              validationWarning.type === 'error' 
                ? 'border-red-200 bg-red-50' 
                : 'border-amber-200 bg-amber-50'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${
                validationWarning.type === 'error' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <AlertDescription className={`font-medium ${
                validationWarning.type === 'error' ? 'text-red-800' : 'text-amber-800'
              }`}>
                {validationWarning.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Enhanced Reason Selection */}
          <div className="space-y-3">
            <Label htmlFor="reason" className="text-sm font-semibold text-slate-900">Reason for Adjustment</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                <SelectValue placeholder="Select a reason for this adjustment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_creation">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-green-100 rounded-md">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">New Creation</div>
                      <div className="text-xs text-slate-500">Finished crafting new handmade items</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="quality_issue">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-red-100 rounded-md">
                      <XCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Quality Issue</div>
                      <div className="text-xs text-slate-500">Items don't meet quality standards</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="damage_loss">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-orange-100 rounded-md">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Damage/Loss</div>
                      <div className="text-xs text-slate-500">Items damaged or lost</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="inventory_correction">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Count Correction</div>
                      <div className="text-xs text-slate-500">Physical count adjustment</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="customer_return">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-purple-100 rounded-md">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Customer Return</div>
                      <div className="text-xs text-slate-500">Items returned by customers</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="sold_item">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-indigo-100 rounded-md">
                      <TrendingDown className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Item Sold</div>
                      <div className="text-xs text-slate-500">Direct sale or order fulfillment</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="supplier_delivery">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-cyan-100 rounded-md">
                      <Package className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Supplier Delivery</div>
                      <div className="text-xs text-slate-500">Raw materials or supplies received</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="gift_donation">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-pink-100 rounded-md">
                      <CheckCircle className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Gift/Donation</div>
                      <div className="text-xs text-slate-500">Given as gift or donated</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Reference and Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="reference" className="text-sm font-semibold text-slate-900">Reference (Optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="PO number, invoice, etc."
                className="bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm text-slate-900 placeholder-slate-500"
              />
              <p className="text-xs text-slate-500 font-medium">Reference number for tracking purposes</p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-semibold text-slate-900">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this adjustment"
                rows={3}
                className="bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm resize-none text-slate-900 placeholder-slate-500"
              />
              <p className="text-xs text-slate-500 font-medium">Additional context or details</p>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {(validationError || error) && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">
                {validationError || error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="pt-6 border-t border-slate-200/60 bg-white/90 backdrop-blur-sm rounded-b-xl p-6 -m-6 mt-6">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500 font-medium">
                This adjustment will be logged in the inventory history
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={loading}
                  className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Adjust Stock
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
