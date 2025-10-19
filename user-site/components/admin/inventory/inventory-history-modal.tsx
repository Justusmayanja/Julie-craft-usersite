"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  History, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  User,
  FileText,
  Search,
  Filter
} from "lucide-react"
import { useRobustInventory } from "@/hooks/admin/use-robust-inventory"
import { format } from "date-fns"

interface InventoryHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    id: string
    name: string
    sku: string
  } | null
}

export function InventoryHistoryModal({ isOpen, onClose, product }: InventoryHistoryModalProps) {
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    adjustment_type: undefined as 'increase' | 'decrease' | 'set' | undefined,
    reason: '',
    sort_by: 'created_at' as 'created_at' | 'quantity_change' | 'product_name',
    sort_order: 'desc' as 'asc' | 'desc',
  })

  const { auditLogs, loading, error, refreshData } = useRobustInventory()

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      adjustment_type: undefined,
      reason: '',
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  }

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'set':
        return <Target className="w-4 h-4 text-blue-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
    }
  }

  const getAdjustmentColor = (type: string) => {
    switch (type) {
      case 'increase':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'decrease':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'set':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getQuantityChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Inventory History - {product.name}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="adjustment-type">Type</Label>
              <Select value={filters.adjustment_type} onValueChange={(value) => handleFilterChange('adjustment_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={filters.reason} onValueChange={(value) => handleFilterChange('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All reasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All reasons</SelectItem>
                  <SelectItem value="received">Stock Received</SelectItem>
                  <SelectItem value="damaged">Damaged Goods</SelectItem>
                  <SelectItem value="lost">Lost/Stolen</SelectItem>
                  <SelectItem value="correction">Inventory Correction</SelectItem>
                  <SelectItem value="return">Customer Return</SelectItem>
                  <SelectItem value="sale">Sale/Transfer</SelectItem>
                  <SelectItem value="transfer">Internal Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="quantity_change">Quantity Change</SelectItem>
                  <SelectItem value="product_name">Product Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="sort-order">Order</Label>
              <Select value={filters.sort_order} onValueChange={(value) => handleFilterChange('sort_order', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={refreshData} variant="outline" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Summary */}
        {auditLogs && auditLogs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{auditLogs.length}</div>
              <div className="text-sm text-blue-700">Total Entries</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {auditLogs.filter(log => log.physical_stock_change > 0).length}
              </div>
              <div className="text-sm text-green-700">Stock Increases</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter(log => log.physical_stock_change < 0).length}
              </div>
              <div className="text-sm text-red-700">Stock Decreases</div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading history: {error}</p>
            </div>
          ) : !auditLogs?.length ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No inventory history found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity Before</TableHead>
                  <TableHead>Quantity After</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs?.filter(log => product ? log.product_id === product.id : true).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(log.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(log.created_at), 'HH:mm:ss')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getAdjustmentColor(log.operation_type)}>
                        <div className="flex items-center gap-1">
                          {getAdjustmentIcon(log.operation_type)}
                          {log.operation_type}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.physical_stock_before}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.physical_stock_after}
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getQuantityChangeColor(log.physical_stock_change)}`}>
                        {log.physical_stock_change >= 0 ? '+' : ''}{log.physical_stock_change}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.operation_reason || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">System</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.order_id ? (
                        <Badge variant="secondary">Order #{log.order_id.slice(-8)}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.notes ? (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm max-w-32 truncate" title={log.notes}>
                            {log.notes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {auditLogs && auditLogs.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {auditLogs.length} audit log entries
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
