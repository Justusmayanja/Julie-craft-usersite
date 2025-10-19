"use client"

import { useState } from "react"
import Image from "next/image"
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
  Trash2,
  Newspaper,
  Calendar,
  User,
  MessageCircle,
  Heart,
  Share,
  TrendingUp
} from "lucide-react"

// Mock data for blog posts
const mockBlogPosts = [
  {
    id: "BLOG-001",
    title: "The Art of Handmade Ceramics: A Journey Through Clay",
    slug: "/blog/art-of-handmade-ceramics",
    excerpt: "Discover the ancient techniques and modern innovations that make our ceramic pieces truly special...",
    status: "published",
    category: "Craft Stories",
    author: "Julie Anderson",
    publishDate: "2023-09-15",
    lastModified: "2023-09-15",
    views: 1240,
    likes: 89,
    comments: 12,
    featured: true,
    image: "/blog/ceramics-blog.jpg"
  },
  {
    id: "BLOG-002",
    title: "Sustainable Crafting: Our Commitment to the Environment",
    slug: "/blog/sustainable-crafting",
    excerpt: "Learn about our eco-friendly practices and commitment to sustainable artisanal creation...",
    status: "published", 
    category: "Sustainability",
    author: "Julie Anderson",
    publishDate: "2023-09-10",
    lastModified: "2023-09-11",
    views: 890,
    likes: 67,
    comments: 8,
    featured: false,
    image: "/blog/sustainability-blog.jpg"
  },
  {
    id: "BLOG-003",
    title: "Behind the Scenes: A Day in the JulieCraft Studio",
    slug: "/blog/behind-the-scenes-studio",
    excerpt: "Take a peek into our creative process and see how each piece comes to life...",
    status: "draft",
    category: "Studio Life",
    author: "Julie Anderson",
    publishDate: null,
    lastModified: "2023-09-12",
    views: 0,
    likes: 0,
    comments: 0,
    featured: false,
    image: "/blog/studio-blog.jpg"
  },
]

const statusOptions = ["All", "published", "draft", "scheduled"]
const categoryOptions = ["All", "Craft Stories", "Sustainability", "Studio Life", "Tutorials"]

const getStatusColor = (status: string) => {
  switch (status) {
    case "published": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "draft": return "bg-blue-100 text-blue-700 border-blue-200"
    case "scheduled": return "bg-purple-100 text-purple-700 border-purple-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function BlogManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [posts] = useState(mockBlogPosts)

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || post.status === selectedStatus
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalPosts = posts.length
  const publishedPosts = posts.filter(p => p.status === "published").length
  const draftPosts = posts.filter(p => p.status === "draft").length
  const totalViews = posts.reduce((sum, p) => sum + p.views, 0)

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Blog & News</h1>
              <p className="text-gray-600 mt-1 text-base">Create and manage blog posts and news articles</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Newspaper className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Posts</p>
                  <p className="text-xl font-bold text-gray-900">{totalPosts}</p>
                  <p className="text-xs text-gray-500">Blog articles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Published</p>
                  <p className="text-xl font-bold text-gray-900">{publishedPosts}</p>
                  <p className="text-xs text-gray-500">Live articles</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Edit className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Drafts</p>
                  <p className="text-xl font-bold text-gray-900">{draftPosts}</p>
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
                  <p className="text-xs text-gray-500">Article views</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Blog Posts Table */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-4">Blog Posts</CardTitle>
              
              {/* Search and Filters Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search posts..."
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
                      <TableHead className="font-semibold text-gray-700">Post</TableHead>
                      <TableHead className="font-semibold text-gray-700">Category</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Engagement</TableHead>
                      <TableHead className="font-semibold text-gray-700">Author</TableHead>
                      <TableHead className="font-semibold text-gray-700">Date</TableHead>
                      <TableHead className="w-24 font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative">
                              <Image 
                                src={post.image} 
                                alt={post.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{post.title}</div>
                              <div className="text-sm text-gray-600 truncate">{post.excerpt}</div>
                              {post.featured && (
                                <Badge className="mt-1 text-xs bg-blue-100 text-blue-700 border-blue-200">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                            {post.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={getStatusColor(post.status)}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-700">{post.views}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-700">{post.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3 text-gray-500" />
                                <span className="text-gray-700">{post.comments}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {post.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{post.author}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm">
                            {post.publishDate ? (
                              <div className="text-gray-700 font-medium">{post.publishDate}</div>
                            ) : (
                              <div className="text-gray-500 italic">Not published</div>
                            )}
                            <div className="text-gray-500 text-xs">Modified: {post.lastModified}</div>
                          </div>
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

              {filteredPosts.length === 0 && (
                <div className="text-center py-12 px-4">
                  <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts found</h3>
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
