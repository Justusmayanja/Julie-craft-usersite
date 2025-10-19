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
  Search, 
  Filter, 
  Download, 
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Users,
  Banknote,
  ShoppingCart,
  Calendar,
  Star
} from "lucide-react"

// Mock data - replace with real data from your database
const mockCustomers = [
  {
    id: "CUST-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "SJ",
    address: {
      street: "123 Main St",
      city: "Springfield",
      state: "IL",
      zip: "62701"
    },
    totalOrders: 5,
    totalSpent: 425.95,
    lastOrderDate: "2024-01-15",
    joinDate: "2023-06-15",
    status: "active",
    isVip: true,
    tags: ["Pottery Lover", "Repeat Customer"]
  },
  {
    id: "CUST-002",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 234-5678",
    avatar: "MC",
    address: {
      street: "456 Oak Ave",
      city: "Chicago",
      state: "IL",
      zip: "60601"
    },
    totalOrders: 3,
    totalSpent: 298.47,
    lastOrderDate: "2024-01-14",
    joinDate: "2023-08-22",
    status: "active",
    isVip: false,
    tags: ["Jewelry", "Gift Buyer"]
  },
  {
    id: "CUST-003",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 345-6789",
    avatar: "ED",
    address: {
      street: "789 Pine St",
      city: "Denver",
      state: "CO",
      zip: "80202"
    },
    totalOrders: 7,
    totalSpent: 892.33,
    lastOrderDate: "2024-01-13",
    joinDate: "2023-03-10",
    status: "active",
    isVip: true,
    tags: ["Textiles", "High Value", "Corporate"]
  },
  {
    id: "CUST-004",
    name: "Alex Smith",
    email: "alex.smith@email.com",
    phone: "+1 (555) 456-7890",
    avatar: "AS",
    address: {
      street: "321 Elm St",
      city: "Austin",
      state: "TX",
      zip: "73301"
    },
    totalOrders: 1,
    totalSpent: 92.99,
    lastOrderDate: "2024-01-12",
    joinDate: "2024-01-10",
    status: "new",
    isVip: false,
    tags: ["New Customer", "Woodwork"]
  },
]

const statusOptions = ["All", "active", "new", "inactive"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "new": return "bg-blue-100 text-blue-700 border-blue-200"
    case "inactive": return "bg-gray-100 text-gray-700 border-gray-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [customers] = useState(mockCustomers)

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || customer.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === "active").length
  const vipCustomers = customers.filter(c => c.isVip).length
  const avgOrderValue = customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0)

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">JulieCraft Customers</h1>
              <p className="text-gray-600 mt-1 text-base">Manage your customer relationships and order history</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                <Mail className="w-4 h-4 mr-2" />
                Send Newsletter
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
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Customers</p>
                  <p className="text-xl font-bold text-gray-900">{totalCustomers}</p>
                  <p className="text-xs text-gray-500">Registered customers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Active Customers</p>
                  <p className="text-xl font-bold text-gray-900">{activeCustomers}</p>
                  <p className="text-xs text-gray-500">Recently active</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">VIP Customers</p>
                  <p className="text-xl font-bold text-gray-900">{vipCustomers}</p>
                  <p className="text-xs text-gray-500">High-value customers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Banknote className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-xl font-bold text-gray-900">{avgOrderValue.toLocaleString()} UGX</p>
                  <p className="text-xs text-gray-500">Per order average</p>
                </div>
              </CardContent>
            </Card>
          </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex space-x-2">
                {statusOptions.map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className={selectedStatus === status ? "bg-amber-500 hover:bg-amber-600" : ""}
                  >
                    {status === "All" ? status : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                          {customer.avatar}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                            {customer.isVip && (
                              <Star className="w-4 h-4 text-blue-500 fill-current" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{customer.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{customer.address.city}, {customer.address.state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{customer.totalOrders}</div>
                        <div className="text-xs text-gray-500">orders</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{customer.totalSpent.toLocaleString()} UGX</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {customer.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  )
}
