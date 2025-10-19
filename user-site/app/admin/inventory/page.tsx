"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Search, 
  Download, 
  AlertTriangle,
  Package,
  Warehouse,
  RefreshCw,
  Edit,
  Eye,
  BarChart3,
  DollarSign,
  ArrowUpDown,
  Settings,
  X,
  Database
} from "lucide-react"
import { useRobustInventory } from "@/hooks/admin/use-robust-inventory"
import { StockAdjustmentModal } from "@/components/admin/inventory/stock-adjustment-modal"
import { InventoryHistoryModal } from "@/components/admin/inventory/inventory-history-modal"
import { StockAlertSettings } from "@/components/admin/inventory/stock-alert-settings"
import { RobustInventoryDashboard } from "@/components/admin/inventory/robust-inventory-dashboard"
import { useToast } from "@/components/ui/toast"
import { format } from "date-fns"

// Status and filter options
const statusOptions = [
  { value: "all", label: "All Items" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "discontinued", label: "Discontinued" }
]


const sortOptions = [
  { value: "product_name", label: "Product Name" },
  { value: "current_quantity", label: "Stock Level" },
  { value: "total_value", label: "Total Value" },
  { value: "last_updated", label: "Last Updated" },
  { value: "reorder_point", label: "Reorder Point" }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "in_stock": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "low_stock": return "bg-blue-100 text-blue-700 border-blue-200"
    case "critical": return "bg-red-100 text-red-700 border-red-200"
    case "out_of_stock": return "bg-gray-100 text-gray-700 border-gray-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "in_stock": return <Package className="w-4 h-4" />
    case "low_stock": return <AlertTriangle className="w-4 h-4" />
    case "critical": return <AlertTriangle className="w-4 h-4" />
    case "out_of_stock": return <Package className="w-4 h-4" />
    default: return <Package className="w-4 h-4" />
  }
}


export default function InventoryPage() {
  const [filters, setFilters] = useState({
    search: "",
    status: "all" as const,
    location: "",
    category_id: "",
    sort_by: "product_name" as const,
    sort_order: "asc" as const,
    page: 1,
    limit: 20,
    show_low_stock_only: false,
    show_out_of_stock_only: false,
  })

  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAlertSettings, setShowAlertSettings] = useState(false)
  const [showRobustDashboard, setShowRobustDashboard] = useState(false)
  const [isInitializingDatabase, setIsInitializingDatabase] = useState(false)
  const [isMigratingStock, setIsMigratingStock] = useState(false)

  // Use robust inventory data
  const { 
    products, 
    loading, 
    error, 
    refreshData,
    createAdjustment,
    reserveStock,
    fulfillOrder,
    cancelReservation,
    processReturn,
    validateStock
  } = useRobustInventory()

  const { addToast } = useToast()

  // Computed values
  const inventory = products || []
  const totalItems = inventory.length
  
  // Calculate stock status manually since computed column might not work
  const getStockStatus = (item: any) => {
    const availableStock = item.available_stock !== undefined 
      ? item.available_stock 
      : (item.physical_stock || item.stock_quantity || 0) - (item.reserved_stock || 0);
    
    if (availableStock <= 0) return 'out_of_stock';
    if (availableStock <= (item.reorder_point || 10)) return 'low_stock';
    if ((item.reserved_stock || 0) > 0) return 'reserved';
    return 'in_stock';
  };
  
  const lowStockCount = inventory.filter((item: any) => getStockStatus(item) === 'low_stock').length
  const outOfStockCount = inventory.filter((item: any) => getStockStatus(item) === 'out_of_stock').length
  const totalValue = inventory.reduce((sum: number, item: any) => sum + ((item.physical_stock || item.stock_quantity || 0) * (item.unit_cost || 0)), 0)
  const avgStockLevel = totalItems > 0 ? ((totalItems - lowStockCount - outOfStockCount) / totalItems) * 100 : 0

  // Handle filter changes
  const updateFilter = (key: string, value: string | number | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handleSearch = (value: string) => {
    updateFilter("search", value)
  }

  const handleStatusFilter = (value: string) => {
    updateFilter("status", value)
  }

  const handleLocationFilter = (value: string) => {
    updateFilter("location", value === "all" ? "" : value)
  }

  const handleCategoryFilter = (value: string) => {
    updateFilter("category_id", value === "all" ? "" : value)
  }

  const handleSort = (sortBy: string) => {
    const currentSort = filters.sort_by
    const newOrder = currentSort === sortBy && filters.sort_order === "asc" ? "desc" : "asc"
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy as any,
      sort_order: newOrder as any
    }))
  }

  const handleSortSelect = (value: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: value as any
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleRefresh = () => {
    refreshData()
    addToast({
      type: 'success',
      title: "Inventory Refreshed",
      description: "Latest inventory data has been loaded.",
    })
  }

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product)
    setShowAdjustmentModal(true)
  }

  const handleViewHistory = (product: any) => {
    setSelectedProduct(product)
    setShowHistoryModal(true)
  }

  const handleInitializeDatabase = async () => {
    setIsInitializingDatabase(true)
    try {
      const response = await fetch('/api/admin/setup-basic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          title: 'Database Initialized',
          description: result.message || 'Database setup completed successfully!',
          type: 'success',
        })
        // Refresh the data
        await refreshData()
      } else {
        addToast({
          title: 'Initialization Failed',
          description: result.error || 'Failed to initialize database',
          type: 'error',
        })
      }
    } catch (error) {
      addToast({
        title: 'Initialization Error',
        description: 'Failed to initialize database',
        type: 'error',
      })
    } finally {
      setIsInitializingDatabase(false)
    }
  }

  const handleMigrateStockData = async () => {
    setIsMigratingStock(true)
    try {
      const response = await fetch('/api/admin/migrate-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        addToast({
          title: 'Stock Data Migrated',
          description: result.message || 'Stock data migrated successfully! Your inventory should now show correct values.',
          type: 'success',
        })
        // Refresh the data
        await refreshData()
      } else {
        addToast({
          title: 'Migration Failed',
          description: result.error || 'Failed to migrate stock data',
          type: 'error',
        })
      }
    } catch (error) {
      addToast({
        title: 'Migration Error',
        description: 'Failed to migrate stock data',
        type: 'error',
      })
    } finally {
      setIsMigratingStock(false)
    }
  }

  const handleAdjustmentSuccess = () => {
    refreshData()
    addToast({
      type: 'success',
      title: "Stock Adjusted",
      description: "Inventory has been updated successfully.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Refined Page Header */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                      Inventory Management
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">Professional stock control & analytics</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowRobustDashboard(!showRobustDashboard)}
                  className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  {showRobustDashboard ? 'Classic View' : 'Robust Dashboard'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => addToast({
                    type: 'info',
                    title: "Sync Initiated",
                    description: "Inventory sync with products table started. This may take a moment.",
                  })}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Stock
                </Button>
              </div>
            </div>
          </div>

          {/* Robust Dashboard or Classic View */}
          {showRobustDashboard ? (
            <RobustInventoryDashboard />
          ) : (
            <>
              {/* Refined Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/8"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  {loading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Items</p>
                  <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                  <p className="text-xs text-slate-500 font-medium">Active inventory items</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/8"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  {loading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">{lowStockCount}</p>
                  <p className="text-xs text-slate-500 font-medium">Require attention</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/8"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  {loading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Total Value</p>
                  <p className="text-2xl font-bold text-slate-900">{totalValue.toLocaleString()} UGX</p>
                  <p className="text-xs text-slate-500 font-medium">Inventory worth</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/8"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  {loading && <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stock Level</p>
                  <p className="text-2xl font-bold text-slate-900">{avgStockLevel.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 font-medium">Average capacity</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Refined Inventory Table */}
          <Card className="bg-white border border-slate-200/60 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-slate-900">Stock Management</CardTitle>
                  <p className="text-slate-600 text-sm font-medium">Monitor and control your inventory levels</p>
                </div>
              
                {/* Professional Search and Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Refined Search */}
                  <div className="relative flex-shrink-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search products, SKU, or categories..."
                      value={filters.search || ""}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10 pr-3 py-2 w-full sm:w-80 bg-white border-slate-300 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-500 font-medium rounded-lg shadow-sm"
                    />
                  </div>
                
                  {/* Refined Filters */}
                  <div className="flex flex-wrap gap-2">
                    <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
                      <SelectTrigger className="w-[140px] bg-white border-slate-300 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                        <SelectValue placeholder="Stock Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filters.location || "all"} onValueChange={handleLocationFilter}>
                      <SelectTrigger className="w-[140px] bg-white border-slate-300 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="Main Warehouse">Main Warehouse</SelectItem>
                        <SelectItem value="Secondary Storage">Secondary Storage</SelectItem>
                        <SelectItem value="Retail Store">Retail Store</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.sort_by || "product_name"} onValueChange={handleSortSelect}>
                      <SelectTrigger className="w-[140px] bg-white border-slate-300 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500 font-medium rounded-lg shadow-sm">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({
                        search: "",
                        status: "all" as const,
                        location: "",
                        category_id: "",
                        sort_by: "product_name" as const,
                        sort_order: "asc" as const,
                        page: 1,
                        limit: 20,
                        show_low_stock_only: false,
                        show_out_of_stock_only: false,
                      })}
                      className="bg-white hover:bg-slate-50 border-slate-300 text-slate-900 hover:text-slate-900 font-semibold rounded-lg shadow-sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Professional Loading State */}
              {loading && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Loading Inventory</h3>
                  <p className="text-slate-600 font-medium">Fetching your latest stock data...</p>
                </div>
              )}

              {/* Professional Error State */}
              {error && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl mb-6 shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">Unable to Load Inventory</h3>
                  <p className="text-slate-600 font-medium mb-6">{error}</p>
                  <Button onClick={handleRefresh} variant="outline" size="lg" className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}

              {/* Table Content */}
              {!loading && !error && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60">
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort("product_name")}>
                          <div className="flex items-center space-x-1">
                            <span>Product / SKU</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort("current_quantity")}>
                          <div className="flex items-center space-x-1">
                            <span>On Hand</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide">Available</TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide">Reserved</TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide">Location</TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide">Reorder Point</TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort("status")}>
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort("total_value")}>
                          <div className="flex items-center space-x-1">
                            <span>Value</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </TableHead>
                        <TableHead className="font-bold text-slate-900 py-4 text-xs uppercase tracking-wide cursor-pointer hover:bg-slate-100/50 transition-colors" onClick={() => handleSort("last_updated")}>
                          <div className="flex items-center space-x-1">
                            <span>Last Updated</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </TableHead>
                        <TableHead className="w-32 font-bold text-slate-900 py-4 text-xs uppercase tracking-wide">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item: any) => (
                        <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200 border-b border-slate-100/60">
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                              <div className="text-xs text-slate-600 font-medium">{item.sku} • {item.category_name || 'Uncategorized'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-slate-900 text-base">{item.physical_stock || 0}</span>
                                {(() => {
                                  const availableStock = item.available_stock !== undefined 
                                    ? item.available_stock 
                                    : (item.physical_stock || item.stock_quantity || 0) - (item.reserved_stock || 0);
                                  return availableStock <= (item.reorder_point || 10);
                                })() && (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-medium">
                                Max: {item.max_stock_level || 1000}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="font-bold text-slate-900 text-base">
                              {item.available_stock !== undefined 
                                ? item.available_stock 
                                : (item.physical_stock || item.stock_quantity || 0) - (item.reserved_stock || 0)
                              }
                            </div>
                            <div className="text-xs text-slate-500 font-medium">Available</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="font-bold text-slate-900 text-base">{item.reserved_stock || 0}</div>
                            <div className="text-xs text-slate-500 font-medium">Reserved</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 font-semibold">Main Warehouse</div>
                            <div className="text-xs text-slate-500 font-medium">Main Warehouse</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="font-bold text-slate-900 text-base">{item.reorder_point || 10}</div>
                            <div className="text-xs text-slate-500 font-medium">Min: {item.min_stock_level || 5}</div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className={`${getStatusColor(getStockStatus(item))} font-semibold px-2 py-1 rounded-full shadow-sm`}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(getStockStatus(item))}
                                <span className="text-xs">{getStockStatus(item).split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-slate-900 text-sm">{((item.physical_stock || 0) * (item.unit_cost || 0)).toLocaleString()} UGX</div>
                              <div className="text-xs text-slate-600 font-medium">
                                {item.unit_cost?.toLocaleString() || "0"} UGX cost • {item.unit_price?.toLocaleString() || "0"} UGX retail
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-slate-700 font-semibold">
                              {item.last_stock_update ? format(new Date(item.last_stock_update), "MMM dd, yyyy") : "Never"}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={() => handleAdjustStock(item)}
                                title="Adjust Stock"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-slate-600 hover:bg-green-50 hover:text-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={() => handleViewHistory(item)}
                                title="View History"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && inventory.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Warehouse className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                  <Button variant="outline" onClick={() => setFilters({
                    search: "",
                    status: "all" as const,
                    location: "",
                    category_id: "",
                    sort_by: "product_name" as const,
                    sort_order: "asc" as const,
                    page: 1,
                    limit: 20,
                    show_low_stock_only: false,
                    show_out_of_stock_only: false,
                  })}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Refined Quick Actions */}
          <Card className="bg-white border border-slate-200/60 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/60 p-6">
              <CardTitle className="text-xl font-bold text-slate-900">Quick Actions</CardTitle>
              <p className="text-slate-600 text-sm font-medium mt-1">Streamline your inventory management workflow</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 hover:text-red-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start space-x-3 w-full">
                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-1">Reorder Low Stock</div>
                      <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                        {lowStockCount} items need attention
                      </div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start space-x-3 w-full">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      <RefreshCw className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-1">Bulk Stock Update</div>
                      <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                        Update multiple items at once
                      </div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start space-x-3 w-full">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-1">Generate Report</div>
                      <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                        Export inventory data
                      </div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => setShowAlertSettings(true)}
                  className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-50 hover:text-purple-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-1">Stock Settings</div>
                      <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                        Configure alerts & thresholds
                      </div>
                    </div>
                  </div>
                </Button>

                {/* Migrate Stock Data Button - show if stock values are zero */}
                {inventory.some((item: any) => (item.physical_stock || 0) === 0 && (item.stock_quantity || 0) > 0) && (
                  <Button 
                    onClick={handleMigrateStockData}
                    disabled={isMigratingStock}
                    variant="outline" 
                    className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                        {isMigratingStock ? (
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Package className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="text-left flex-1 overflow-hidden">
                        <div className="font-bold text-slate-900 text-sm leading-tight mb-1">
                          {isMigratingStock ? 'Migrating...' : 'Fix Stock Display'}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                          {isMigratingStock ? 'Copying stock data to new system' : 'Copy existing stock quantities to fix zero values'}
                        </div>
                      </div>
                    </div>
                  </Button>
                )}

                {/* Database Setup Button - show if robust inventory not set up or there are errors */}
                {(!showRobustDashboard || error) && (
                  <Button 
                    onClick={handleInitializeDatabase}
                    disabled={isInitializingDatabase}
                    variant="outline" 
                    className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:text-green-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                        {isInitializingDatabase ? (
                          <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Database className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="text-left flex-1 overflow-hidden">
                        <div className="font-bold text-slate-900 text-sm leading-tight mb-1">
                          {isInitializingDatabase ? 'Setting Up...' : 'Setup Database'}
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                          {isInitializingDatabase ? 'Initializing robust inventory system' : 'Enable stock adjustments & advanced features'}
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          <Card className="bg-white border border-slate-200/60 shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 font-semibold">
                  Showing {totalItems} inventory items
                </div>
                <div className="text-sm text-slate-600 font-semibold">
                  Last updated: {new Date().toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSuccess={handleAdjustmentSuccess}
        product={selectedProduct}
      />

      {/* Inventory History Modal */}
      <InventoryHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        product={selectedProduct}
      />

      {/* Stock Alert Settings Modal */}
      <StockAlertSettings
        isOpen={showAlertSettings}
        onClose={() => setShowAlertSettings(false)}
      />
    </div>
  )
}
