"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Package } from "lucide-react"
import { useRobustInventory } from "@/hooks/admin/use-robust-inventory"

interface BulkStockUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  products: any[]
}

export function BulkStockUpdateModal({ isOpen, onClose, onSuccess, products }: BulkStockUpdateModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [updateType, setUpdateType] = useState<'adjust' | 'set' | 'increase' | 'decrease'>('adjust')
  const [value, setValue] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { refreshData } = useRobustInventory()

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)))
    }
  }

  const handleSelectLowStock = () => {
    const lowStockProducts = products.filter(p => {
      const availableStock = p.available_stock !== undefined 
        ? p.available_stock 
        : (p.physical_stock || p.stock_quantity || 0) - (p.reserved_stock || 0)
      return availableStock <= (p.reorder_point || 10)
    })
    setSelectedProducts(new Set(lowStockProducts.map(p => p.id)))
  }

  const handleSubmit = async () => {
    if (selectedProducts.size === 0) {
      toast({
        title: "No Products Selected",
        description: "Please select at least one product to update.",
        variant: "destructive"
      })
      return
    }

    if (!value || isNaN(Number(value))) {
      toast({
        title: "Invalid Value",
        description: "Please enter a valid number.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const adjustments = Array.from(selectedProducts).map(productId => {
        const product = products.find(p => p.id === productId)
        if (!product) return null

        const currentStock = product.physical_stock || product.stock_quantity || 0
        let newStock = 0

        switch (updateType) {
          case 'set':
            newStock = Number(value)
            break
          case 'increase':
            newStock = currentStock + Number(value)
            break
          case 'decrease':
            newStock = Math.max(0, currentStock - Number(value))
            break
          case 'adjust':
          default:
            newStock = currentStock + Number(value)
            break
        }

        return {
          product_id: productId,
          adjustment_type: updateType === 'decrease' ? 'out' : 'in',
          quantity: Math.abs(newStock - currentStock),
          reason: reason || 'Bulk stock update',
          notes: `Bulk update: ${updateType} by ${value}`
        }
      }).filter(Boolean)

      // Process adjustments
      const results: any[] = []
      const errors: any[] = []

      for (const adjustment of adjustments) {
        if (!adjustment) continue
        try {
          const response = await fetch('/api/inventory/adjustments/apply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adjustment),
          })

          const result = await response.json()

          if (!response.ok) {
            errors.push({
              product_id: adjustment.product_id,
              error: result.error || 'Failed to adjust stock'
            })
          } else {
            results.push(result)
          }
        } catch (err) {
          errors.push({
            product_id: adjustment.product_id,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      if (errors.length > 0) {
        toast({
          title: "Partial Success",
          description: `Updated ${results.length} products. ${errors.length} failed.`,
          variant: "destructive"
        })
      } else {
        toast({
          title: "Bulk Update Complete",
          description: `Successfully updated ${results.length} products.`,
        })
      }

      await refreshData()
      onSuccess()
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'Failed to update stock',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setSelectedProducts(new Set())
    setUpdateType('adjust')
    setValue('')
    setReason('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Bulk Stock Update</DialogTitle>
          <DialogDescription>
            Update stock levels for multiple products at once. Select products and choose your update method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Products ({selectedProducts.size} selected)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedProducts.size === products.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectLowStock}
                >
                  Select Low Stock
                </Button>
              </div>
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {products.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No products available</div>
              ) : (
                <div className="divide-y">
                  {products.map((product) => {
                    const availableStock = product.available_stock !== undefined 
                      ? product.available_stock 
                      : (product.physical_stock || product.stock_quantity || 0) - (product.reserved_stock || 0)
                    const isSelected = selectedProducts.has(product.id)
                    
                    return (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleToggleProduct(product.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{product.name}</div>
                          <div className="text-xs text-slate-500">
                            SKU: {product.sku} • Stock: {product.physical_stock || 0} • Available: {availableStock}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Update Type */}
          <div className="space-y-2">
            <Label htmlFor="update-type" className="text-sm font-semibold">Update Type</Label>
            <Select value={updateType} onValueChange={(value: any) => setUpdateType(value)}>
              <SelectTrigger id="update-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjust">Adjust (Add/Subtract)</SelectItem>
                <SelectItem value="set">Set to Value</SelectItem>
                <SelectItem value="increase">Increase by Amount</SelectItem>
                <SelectItem value="decrease">Decrease by Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <div className="space-y-2">
            <Label htmlFor="value" className="text-sm font-semibold">
              {updateType === 'set' ? 'New Stock Level' : 'Amount'}
            </Label>
            <Input
              id="value"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={updateType === 'set' ? 'Enter new stock level' : 'Enter amount'}
              min="0"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-semibold">Reason (Optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Stock received, Inventory count, etc."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || selectedProducts.size === 0}>
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Update {selectedProducts.size} Product{selectedProducts.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

