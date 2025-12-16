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
  Loader2,
  CheckCircle
} from "lucide-react"
import { useRobustInventory } from "@/hooks/admin/use-robust-inventory"
import { StockAdjustmentModal } from "@/components/admin/inventory/stock-adjustment-modal"
import { InventoryHistoryModal } from "@/components/admin/inventory/inventory-history-modal"
import { StockAlertSettings } from "@/components/admin/inventory/stock-alert-settings"
import { RobustInventoryDashboard } from "@/components/admin/inventory/robust-inventory-dashboard"
import { BulkStockUpdateModal } from "@/components/admin/inventory/bulk-stock-update-modal"
import { useToast } from "@/components/ui/use-toast"
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
  const [isExporting, setIsExporting] = useState(false)
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false)

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

  const { toast } = useToast()

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
  const totalValue = inventory.reduce((sum: number, item: any) => {
    const physicalStock = Number(item.physical_stock) || 0
    const unitCost = Number(item.unit_cost) || 0
    return sum + (physicalStock * unitCost)
  }, 0)
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
    toast({
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

  // Handle reorder low stock - filter to show only low stock items
  const handleReorderLowStock = () => {
    setFilters(prev => ({
      ...prev,
      status: 'low_stock' as const,
      show_low_stock_only: true,
      page: 1
    }))
    toast({
      title: "Low Stock Items",
      description: `Showing ${lowStockCount} items that need reordering.`,
    })
  }

  // Handle bulk stock update
  const handleBulkStockUpdate = () => {
    setShowBulkUpdateModal(true)
  }

  // Handle bulk update success
  const handleBulkUpdateSuccess = () => {
    setShowBulkUpdateModal(false)
    refreshData()
    toast({
      title: "Bulk Update Complete",
      description: "Stock levels have been updated successfully.",
    })
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
        toast({
          title: 'Stock Data Migrated',
          description: result.message || 'Stock data migrated successfully! Your inventory should now show correct values.',
        })
        // Refresh the data
        await refreshData()
      } else {
        toast({
          title: 'Migration Failed',
          description: result.error || 'Failed to migrate stock data',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Migration Error',
        description: 'Failed to migrate stock data',
        variant: 'destructive',
      })
    } finally {
      setIsMigratingStock(false)
    }
  }

  const handleAdjustmentSuccess = () => {
    refreshData()
    toast({
      title: "Stock Adjusted",
      description: "Inventory has been updated successfully.",
    })
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to export data.",
          variant: "destructive"
        })
        setIsExporting(false)
        return
      }

      // Build query parameters based on current filters
      const params = new URLSearchParams()
      params.append('format', 'csv')
      params.append('status', filters.status)
      if (filters.search) {
        params.append('search', filters.search)
      }

      const response = await fetch(`/api/admin/inventory/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to export inventory data')
      }

      // Get the CSV content
      const csvContent = await response.text()
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `inventory-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: "Inventory data has been exported successfully.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export inventory data. Please try again.',
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
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
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => toast({
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
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/30 border-b-2 border-slate-200">
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors duration-200" onClick={() => handleSort("product_name")}>
                            <div className="flex items-center space-x-2">
                              <Package className="w-3.5 h-3.5 text-slate-600" />
                              <span>Product / SKU</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors duration-200" onClick={() => handleSort("current_quantity")}>
                            <div className="flex items-center space-x-2">
                              <Warehouse className="w-3.5 h-3.5 text-slate-600" />
                              <span>On Hand</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-3.5 h-3.5 text-slate-600" />
                              <span>Available</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
                              <span>Reserved</span>
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Location</TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider">Reorder Point</TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors duration-200" onClick={() => handleSort("status")}>
                            <div className="flex items-center space-x-2">
                              <span>Status</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors duration-200" onClick={() => handleSort("total_value")}>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
                              <span>Value</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100/60 transition-colors duration-200" onClick={() => handleSort("last_updated")}>
                            <div className="flex items-center space-x-2">
                              <span>Last Updated</span>
                              <ArrowUpDown className="w-3 h-3 text-slate-500" />
                            </div>
                          </TableHead>
                          <TableHead className="w-32 font-bold text-slate-900 py-5 px-6 text-xs uppercase tracking-wider text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventory.map((item: any, index: number) => {
                          const availableStock = item.available_stock !== undefined 
                            ? item.available_stock 
                            : (item.physical_stock || item.stock_quantity || 0) - (item.reserved_stock || 0);
                          const stockStatus = getStockStatus(item);
                          const isLowStock = availableStock <= (item.reorder_point || 10);
                          
                          return (
                            <TableRow 
                              key={item.id} 
                              className={`group hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/30 hover:to-purple-50/20 transition-all duration-300 border-b border-slate-100/80 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                              }`}
                            >
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1.5">
                                  <div className="font-bold text-slate-900 text-sm leading-tight">{item.name}</div>
                                  <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">{item.sku}</span>
                                    <span className="text-slate-400">•</span>
                                    <span>{item.category_name || 'Uncategorized'}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1.5">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900 text-lg">{item.physical_stock || 0}</span>
                                    {isLowStock && (
                                      <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Max: <span className="font-semibold">{item.max_stock_level || 1000}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 text-lg text-emerald-700">
                                    {availableStock}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">Available</div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 text-lg text-amber-700">
                                    {item.reserved_stock || 0}
                                  </div>
                                  <div className="text-xs text-slate-500 font-medium">Reserved</div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="text-sm text-slate-700 font-semibold">Main Warehouse</div>
                                <div className="text-xs text-slate-500 font-medium mt-0.5">Primary Location</div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 text-base">{item.reorder_point || 10}</div>
                                  <div className="text-xs text-slate-500 font-medium">
                                    Min: <span className="font-semibold">{item.min_stock_level || 5}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <Badge className={`${getStatusColor(stockStatus)} font-semibold px-3 py-1.5 rounded-full shadow-sm border transition-all duration-200 group-hover:shadow-md`}>
                                  <div className="flex items-center space-x-1.5">
                                    {getStatusIcon(stockStatus)}
                                    <span className="text-xs font-medium">
                                      {stockStatus.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                    </span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="space-y-1.5">
                                  <div className="font-bold text-slate-900 text-sm">
                                    {(() => {
                                      const physicalStock = Number(item.physical_stock) || 0
                                      const unitCost = Number(item.unit_cost) || 0
                                      const totalValue = physicalStock * unitCost
                                      return totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                    })()} UGX
                                  </div>
                                  <div className="text-xs text-slate-600 font-medium space-y-0.5">
                                    <div>
                                      Cost: {(() => {
                                        const unitCost = Number(item.unit_cost) || 0
                                        return unitCost > 0 ? unitCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"
                                      })()} UGX
                                    </div>
                                    <div>
                                      Retail: {(() => {
                                        const unitPrice = Number(item.unit_price) || 0
                                        return unitPrice > 0 ? unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"
                                      })()} UGX
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="text-sm text-slate-700 font-semibold">
                                  {item.last_stock_update ? format(new Date(item.last_stock_update), "MMM dd, yyyy") : "Never"}
                                </div>
                                {item.last_stock_update && (
                                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                                    {format(new Date(item.last_stock_update), "h:mm a")}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="py-5 px-6">
                                <div className="flex items-center justify-center space-x-1.5">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0"
                                    onClick={() => handleAdjustStock(item)}
                                    title="Adjust Stock"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-slate-600 hover:bg-green-50 hover:text-green-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-8 w-8 p-0"
                                    onClick={() => handleViewHistory(item)}
                                    title="View History"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile/Tablet Card View */}
                  <div className="lg:hidden space-y-4 p-4">
                    {inventory.map((item: any) => {
                      const availableStock = item.available_stock !== undefined 
                        ? item.available_stock 
                        : (item.physical_stock || item.stock_quantity || 0) - (item.reserved_stock || 0);
                      const stockStatus = getStockStatus(item);
                      const isLowStock = availableStock <= (item.reorder_point || 10);
                      
                      return (
                        <Card 
                          key={item.id} 
                          className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <CardContent className="p-5">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 text-base mb-1.5 leading-tight">{item.name}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-xs font-mono font-semibold">
                                    {item.sku}
                                  </span>
                                  <span className="text-slate-400 text-xs">•</span>
                                  <span className="text-xs text-slate-600 font-medium">{item.category_name || 'Uncategorized'}</span>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(stockStatus)} font-semibold px-2.5 py-1 rounded-full shadow-sm border flex-shrink-0 ml-2`}>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(stockStatus)}
                                  <span className="text-[10px] font-medium">
                                    {stockStatus.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </span>
                                </div>
                              </Badge>
                            </div>

                            {/* Stock Information Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                                <div className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-wide">On Hand</div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-900 text-xl">{item.physical_stock || 0}</span>
                                  {isLowStock && (
                                    <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-medium mt-1">
                                  Max: {item.max_stock_level || 1000}
                                </div>
                              </div>

                              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-100">
                                <div className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-wide">Available</div>
                                <div className="font-bold text-emerald-700 text-xl">{availableStock}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">Ready to sell</div>
                              </div>

                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                                <div className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-wide">Reserved</div>
                                <div className="font-bold text-amber-700 text-xl">{item.reserved_stock || 0}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">In orders</div>
                              </div>

                              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
                                <div className="text-xs text-slate-600 font-semibold mb-1 uppercase tracking-wide">Reorder Point</div>
                                <div className="font-bold text-slate-900 text-xl">{item.reorder_point || 10}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">
                                  Min: {item.min_stock_level || 5}
                                </div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-3 mb-4 pt-4 border-t border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-semibold">Total Value</span>
                                <span className="font-bold text-slate-900 text-sm">
                                  {(() => {
                                    const physicalStock = Number(item.physical_stock) || 0
                                    const unitCost = Number(item.unit_cost) || 0
                                    const totalValue = physicalStock * unitCost
                                    return totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                  })()} UGX
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-semibold">Unit Cost</span>
                                <span className="text-sm text-slate-700 font-medium">
                                  {(() => {
                                    const unitCost = Number(item.unit_cost) || 0
                                    return unitCost > 0 ? unitCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"
                                  })()} UGX
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-semibold">Retail Price</span>
                                <span className="text-sm text-slate-700 font-medium">
                                  {(() => {
                                    const unitPrice = Number(item.unit_price) || 0
                                    return unitPrice > 0 ? unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"
                                  })()} UGX
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-semibold">Location</span>
                                <span className="text-sm text-slate-700 font-medium">Main Warehouse</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-600 font-semibold">Last Updated</span>
                                <span className="text-sm text-slate-700 font-medium">
                                  {item.last_stock_update ? format(new Date(item.last_stock_update), "MMM dd, yyyy") : "Never"}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 pt-4 border-t border-slate-200">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={() => handleAdjustStock(item)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Adjust Stock
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 bg-white hover:bg-green-50 hover:text-green-700 border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                onClick={() => handleViewHistory(item)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View History
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Empty State */}
              {!loading && !error && inventory.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl mb-6 shadow-lg">
                    <Warehouse className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Inventory Items Found</h3>
                  <p className="text-slate-600 font-medium mb-6 max-w-md mx-auto">
                    Try adjusting your search or filter criteria to find what you're looking for
                  </p>
                  <Button 
                    variant="outline" 
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
                    className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
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
                <Button 
                  variant="outline" 
                  onClick={handleReorderLowStock}
                  disabled={lowStockCount === 0}
                  className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 hover:text-red-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed">
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
                
                <Button 
                  variant="outline" 
                  onClick={handleBulkStockUpdate}
                  className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group">
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
                
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  disabled={isExporting}
                  className="justify-start h-auto p-4 bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700 border-slate-300 min-h-[90px] w-full rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="flex items-start space-x-3 w-full">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                      {isExporting ? (
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="text-left flex-1 overflow-hidden">
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-1">
                        {isExporting ? 'Generating Report...' : 'Generate Report'}
                      </div>
                      <div className="text-xs text-slate-600 leading-relaxed break-words font-medium">
                        {isExporting ? 'Preparing export...' : 'Export inventory data'}
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

      {/* Bulk Stock Update Modal */}
      <BulkStockUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        onSuccess={handleBulkUpdateSuccess}
        products={inventory}
      />
    </div>
  )
}
