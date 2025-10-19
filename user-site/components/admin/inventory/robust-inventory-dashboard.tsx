"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/toast"
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Minus,
  RotateCcw,
  AlertCircle,
  BarChart3,
  History,
  Settings
} from "lucide-react"
import { useRobustInventory } from '@/hooks/admin/use-robust-inventory'

interface RobustInventoryDashboardProps {
  className?: string
}

export function RobustInventoryDashboard({ className }: RobustInventoryDashboardProps) {
  const {
    products,
    reservations,
    auditLogs,
    adjustments,
    reorderAlerts,
    loading,
    error,
    reserveStock,
    fulfillOrder,
    cancelReservation,
    processReturn,
    createAdjustment,
    approveAdjustment,
    updateAlertStatus,
    validateStock,
    fetchProducts,
    fetchAuditLogs,
    fetchAdjustments,
    fetchReorderAlerts,
    refreshData,
    clearError
  } = useRobustInventory()

  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)

  // Filter products based on search and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.stock_status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const statistics = {
    totalProducts: products.length,
    inStock: products.filter(p => p.stock_status === 'in_stock').length,
    lowStock: products.filter(p => p.stock_status === 'low_stock').length,
    outOfStock: products.filter(p => p.stock_status === 'out_of_stock').length,
    totalPhysicalStock: products.reduce((sum, p) => sum + p.physical_stock, 0),
    totalReservedStock: products.reduce((sum, p) => sum + p.reserved_stock, 0),
    totalAvailableStock: products.reduce((sum, p) => sum + p.available_stock, 0),
    activeAlerts: reorderAlerts.filter(a => a.alert_status === 'active').length,
    pendingAdjustments: adjustments.filter(a => a.approval_status === 'pending').length
  }

  // Handle stock adjustment
  const handleStockAdjustment = async (adjustmentData: any) => {
    try {
      await createAdjustment(adjustmentData)
      addToast({
        type: 'success',
        title: 'Adjustment Created',
        description: 'Inventory adjustment has been created and is pending approval.'
      })
      setShowAdjustmentModal(false)
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create adjustment'
      })
    }
  }

  // Handle alert status update
  const handleAlertUpdate = async (alertId: string, status: string, notes?: string) => {
    try {
      await updateAlertStatus(alertId, status as any, notes)
      addToast({
        type: 'success',
        title: 'Alert Updated',
        description: `Alert has been ${status} successfully.`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update alert'
      })
    }
  }

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200'
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200'
      case 'discontinued': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get stock level indicator
  const getStockLevelIndicator = (product: any) => {
    const percentage = (product.available_stock / product.max_stock_level) * 100
    
    if (percentage <= 0) return { color: 'bg-red-500', label: 'Out of Stock' }
    if (percentage <= 20) return { color: 'bg-yellow-500', label: 'Critical' }
    if (percentage <= 50) return { color: 'bg-orange-500', label: 'Low' }
    return { color: 'bg-green-500', label: 'Good' }
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading inventory data...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Robust Inventory Management</h2>
          <p className="text-gray-600">Comprehensive stock tracking with atomic operations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.inStock} in stock, {statistics.lowStock} low, {statistics.outOfStock} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Physical Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPhysicalStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total units in warehouse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalAvailableStock.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalReservedStock.toLocaleString()} reserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.pendingAdjustments} pending adjustments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="alerts">Reorder Alerts</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Product Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Physical</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockLevel = getStockLevelIndicator(product)
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>{product.physical_stock}</TableCell>
                          <TableCell>{product.reserved_stock}</TableCell>
                          <TableCell className="font-medium">{product.available_stock}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeColor(product.stock_status)}>
                              {product.stock_status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{product.reorder_point}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${stockLevel.color}`} />
                              <span className="text-sm">{stockLevel.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Product Details: {product.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Stock Information</h4>
                                      <div className="space-y-2 text-sm">
                                        <div>Physical Stock: {product.physical_stock}</div>
                                        <div>Reserved Stock: {product.reserved_stock}</div>
                                        <div>Available Stock: {product.available_stock}</div>
                                        <div>Max Stock Level: {product.max_stock_level}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Reorder Settings</h4>
                                      <div className="space-y-2 text-sm">
                                        <div>Reorder Point: {product.reorder_point}</div>
                                        <div>Reorder Quantity: {product.reorder_quantity}</div>
                                        <div>Status: {product.stock_status}</div>
                                        <div>Version: {product.inventory_version}</div>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setShowAdjustmentModal(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reorder Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Reorder Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Suggested Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Triggered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reorderAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.products.name}</TableCell>
                        <TableCell>
                          <Badge className={alert.alert_type === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{alert.current_stock}</TableCell>
                        <TableCell>{alert.reorder_point}</TableCell>
                        <TableCell>{alert.suggested_reorder_quantity}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(alert.alert_status)}>
                            {alert.alert_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(alert.triggered_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {alert.alert_status === 'active' && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAlertUpdate(alert.id, 'acknowledged')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAlertUpdate(alert.id, 'resolved')}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adjustments Tab */}
        <TabsContent value="adjustments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Inventory Adjustments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Before</TableHead>
                      <TableHead>After</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adjustment) => (
                      <TableRow key={adjustment.id}>
                        <TableCell className="font-medium">{adjustment.products.name}</TableCell>
                        <TableCell>{adjustment.adjustment_type.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <span className={adjustment.quantity_adjusted > 0 ? 'text-green-600' : 'text-red-600'}>
                            {adjustment.quantity_adjusted > 0 ? '+' : ''}{adjustment.quantity_adjusted}
                          </span>
                        </TableCell>
                        <TableCell>{adjustment.previous_physical_stock}</TableCell>
                        <TableCell>{adjustment.new_physical_stock}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(adjustment.approval_status)}>
                            {adjustment.approval_status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(adjustment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {adjustment.approval_status === 'pending' && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveAdjustment(adjustment.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => approveAdjustment(adjustment.id, 'rejected')}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Audit Log</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Physical Change</TableHead>
                      <TableHead>Reserved Change</TableHead>
                      <TableHead>Available Change</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.product_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.operation_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.operation_reason}</TableCell>
                        <TableCell>
                          <span className={log.physical_stock_change > 0 ? 'text-green-600' : log.physical_stock_change < 0 ? 'text-red-600' : ''}>
                            {log.physical_stock_change > 0 ? '+' : ''}{log.physical_stock_change}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={log.reserved_stock_change > 0 ? 'text-green-600' : log.reserved_stock_change < 0 ? 'text-red-600' : ''}>
                            {log.reserved_stock_change > 0 ? '+' : ''}{log.reserved_stock_change}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={log.available_stock_change > 0 ? 'text-green-600' : log.available_stock_change < 0 ? 'text-red-600' : ''}>
                            {log.available_stock_change > 0 ? '+' : ''}{log.available_stock_change}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.order_id ? log.order_id.slice(0, 8) + '...' : '-'}
                        </TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
