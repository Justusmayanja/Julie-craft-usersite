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
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Edit3,
  Trash2,
  FileText,
  Globe,
  Calendar,
  User,
  ExternalLink
} from "lucide-react"

// Mock data for website pages
const mockPages = [
  {
    id: "PAGE-001",
    title: "Home",
    slug: "/",
    status: "published",
    type: "page",
    author: "Julie Anderson",
    lastModified: "2023-09-18",
    views: 2840,
    isPublic: true
  },
  {
    id: "PAGE-002", 
    title: "About Us",
    slug: "/about",
    status: "published",
    type: "page",
    author: "Julie Anderson",
    lastModified: "2023-09-15",
    views: 1250,
    isPublic: true
  },
  {
    id: "PAGE-003",
    title: "Our Story",
    slug: "/story",
    status: "draft",
    type: "page",
    author: "Julie Anderson",
    lastModified: "2023-09-14",
    views: 0,
    isPublic: false
  },
  {
    id: "PAGE-004",
    title: "Contact",
    slug: "/contact",
    status: "published",
    type: "page",
    author: "Julie Anderson",
    lastModified: "2023-09-12",
    views: 890,
    isPublic: true
  },
  {
    id: "PAGE-005",
    title: "Privacy Policy",
    slug: "/privacy",
    status: "published",
    type: "legal",
    author: "Julie Anderson",
    lastModified: "2023-08-20",
    views: 340,
    isPublic: true
  },
]

const statusOptions = ["All", "published", "draft", "archived"]
const typeOptions = ["All", "page", "legal", "landing"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "published": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "draft": return "bg-blue-100 text-blue-700 border-blue-200"
    case "archived": return "bg-gray-100 text-gray-700 border-gray-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function PagesManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedType, setSelectedType] = useState("All")
  const [pages] = useState(mockPages)

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || page.status === selectedStatus
    const matchesType = selectedType === "All" || page.type === selectedType
    return matchesSearch && matchesStatus && matchesType
  })

  const totalPages = pages.length
  const publishedPages = pages.filter(p => p.status === "published").length
  const draftPages = pages.filter(p => p.status === "draft").length
  const totalViews = pages.reduce((sum, p) => sum + p.views, 0)

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Website Pages</h1>
              <p className="text-gray-600 mt-1 text-base">Manage your website content and pages</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Page
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Pages</p>
                  <p className="text-xl font-bold text-gray-900">{totalPages}</p>
                  <p className="text-xs text-gray-500">Website pages</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Globe className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Published</p>
                  <p className="text-xl font-bold text-gray-900">{publishedPages}</p>
                  <p className="text-xs text-gray-500">Live pages</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Edit3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Drafts</p>
                  <p className="text-xl font-bold text-gray-900">{draftPages}</p>
                  <p className="text-xs text-gray-500">Work in progress</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <Eye className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Views</p>
                  <p className="text-xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Page visits</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pages Table */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-4">Page Management</CardTitle>
              
              {/* Search and Filters Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search pages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className={selectedStatus === status 
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                        : "bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300 text-gray-700"
                      }
                    >
                      {status === "All" ? status : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
        
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">Page</TableHead>
                      <TableHead className="font-semibold text-gray-700">URL</TableHead>
                      <TableHead className="font-semibold text-gray-700">Type</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Author</TableHead>
                      <TableHead className="font-semibold text-gray-700">Views</TableHead>
                      <TableHead className="font-semibold text-gray-700">Modified</TableHead>
                      <TableHead className="w-24 font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPages.map((page) => (
                      <TableRow key={page.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{page.title}</div>
                              <div className="text-sm text-gray-600">{page.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                              {page.slug}
                            </code>
                            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-600">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="bg-white text-gray-700 border-gray-300 capitalize">
                            {page.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getStatusColor(page.status)}>
                            {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {page.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{page.author}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-700">{page.lastModified}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-blue-50 hover:text-blue-700">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredPages.length === 0 && (
                <div className="text-center py-12 px-4">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Create New Page</div>
                      <div className="text-sm text-gray-600">Add a new page to your website</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-emerald-50 hover:text-emerald-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Globe className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Preview Website</div>
                      <div className="text-sm text-gray-600">View your live website</div>
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Edit3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">Bulk Edit</div>
                      <div className="text-sm text-gray-600">Edit multiple pages at once</div>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
