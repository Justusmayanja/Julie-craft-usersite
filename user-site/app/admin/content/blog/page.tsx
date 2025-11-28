"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  TrendingUp,
  MessageCircle,
  Heart,
  Save,
  X,
  Loader2,
  Upload,
  Image as ImageIcon
} from "lucide-react"
import { useBlog, useBlogStats, type BlogPost } from "@/hooks/admin/use-blog"
import { useAuth } from "@/contexts/auth-context"

const statusOptions = ["All", "published", "draft", "scheduled"] as const
const categoryOptions = ["Craft Stories", "Sustainability", "Studio Life", "Tutorials", "Gift Ideas", "News"] as const

const getStatusColor = (status: string) => {
  switch (status) {
    case "published": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "draft": return "bg-blue-100 text-blue-700 border-blue-200"
    case "scheduled": return "bg-purple-100 text-purple-700 border-purple-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function BlogManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { posts, loading, error, total, fetchPosts, createPost, updatePost, deletePost, refreshPosts } = useBlog()
  const { stats, loading: statsLoading } = useBlogStats()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<"All" | "published" | "draft" | "scheduled">("All")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    status: "draft",
    category: "Craft Stories",
    featured_image: "",
    featured: false,
    publish_date: null,
    scheduled_date: null,
  })

  useEffect(() => {
    if (user) {
      fetchPosts({
        search: searchTerm || undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
      })
    }
  }, [user, searchTerm, selectedStatus, selectedCategory, fetchPosts])

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "All" || post.status === selectedStatus
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  const handleNewPost = () => {
    setSelectedPost(null)
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      status: "draft",
      category: "Craft Stories",
      featured_image: "",
      featured: false,
      publish_date: null,
      scheduled_date: null,
    })
    setFormError(null)
    setImagePreview(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      category: post.category,
      featured_image: post.featured_image || "",
      featured: post.featured,
      publish_date: post.publish_date,
      scheduled_date: post.scheduled_date,
    })
    setFormError(null)
    setImagePreview(post.featured_image || null)
    setIsDialogOpen(true)
  }

  const handleView = async (post: BlogPost) => {
    setSelectedPost(post)
    setIsViewDialogOpen(true)
  }

  const handleDelete = (post: BlogPost) => {
    setSelectedPost(post)
    setIsDeleteDialogOpen(true)
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    try {
      // Validation
      if (!formData.title?.trim()) {
        setFormError("Title is required")
        setIsSubmitting(false)
        return
      }
      if (!formData.slug?.trim()) {
        setFormError("Slug is required")
        setIsSubmitting(false)
        return
      }
      if (!formData.excerpt?.trim()) {
        setFormError("Excerpt is required")
        setIsSubmitting(false)
        return
      }
      if (!formData.content?.trim()) {
        setFormError("Content is required")
        setIsSubmitting(false)
        return
      }

      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title || ""),
        publish_date: formData.status === "published" && !formData.publish_date 
          ? new Date().toISOString() 
          : formData.publish_date,
      }

      if (selectedPost) {
        await updatePost(selectedPost.id, postData)
      } else {
        await createPost(postData)
      }

      setIsDialogOpen(false)
      await refreshPosts()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPost) return

    setIsSubmitting(true)
    try {
      await deletePost(selectedPost.id)
      setIsDeleteDialogOpen(false)
      setSelectedPost(null)
      await refreshPosts()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete post")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setFormError('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setFormError('File size must be less than 5MB.')
      return
    }

    setUploadingImage(true)
    setFormError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Get auth token
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('julie-crafts-token') 
        : null

      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/blog/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      // Update form data with the uploaded image URL
      setFormData(prev => ({ ...prev, featured_image: data.url }))
      setImagePreview(data.url)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploadingImage(false)
      // Reset input
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, featured_image: '' }))
    setImagePreview(null)
  }

  const totalPosts = stats?.totalPosts || posts.length
  const publishedPosts = stats?.publishedPosts || posts.filter(p => p.status === "published").length
  const draftPosts = stats?.draftPosts || posts.filter(p => p.status === "draft").length
  const totalViews = stats?.totalViews || posts.reduce((sum, p) => sum + (p.views || 0), 0)

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
            <Button 
              onClick={handleNewPost}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
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
                  <p className="text-xl font-bold text-gray-900">{statsLoading ? "..." : totalPosts}</p>
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
                  <p className="text-xl font-bold text-gray-900">{statsLoading ? "..." : publishedPosts}</p>
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
                  <p className="text-xl font-bold text-gray-900">{statsLoading ? "..." : draftPosts}</p>
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
                  <p className="text-xl font-bold text-gray-900">{statsLoading ? "..." : totalViews.toLocaleString()}</p>
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
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="text-center py-12 px-4">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
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
                      {filteredPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts found</h3>
                            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPosts.map((post) => (
                          <TableRow key={post.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative flex-shrink-0">
                                  {post.featured_image ? (
                                    <Image 
                                      src={post.featured_image} 
                                      alt={post.title}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Newspaper className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}
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
                                    <span className="text-gray-700">{post.views || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Heart className="w-3 h-3 text-gray-500" />
                                    <span className="text-gray-700">{post.likes || 0}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MessageCircle className="w-3 h-3 text-gray-500" />
                                    <span className="text-gray-700">{post.comments_count || 0}</span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {post.author_name?.split(' ').map(n => n[0]).join('') || 'A'}
                                </div>
                                <span className="text-sm text-gray-700 font-medium">{post.author_name || 'Admin'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="text-sm">
                                {post.publish_date ? (
                                  <div className="text-gray-700 font-medium">
                                    {new Date(post.publish_date).toLocaleDateString()}
                                  </div>
                                ) : (
                                  <div className="text-gray-500 italic">Not published</div>
                                )}
                                <div className="text-gray-500 text-xs">
                                  Modified: {new Date(post.updated_at).toLocaleDateString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleView(post)}
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEdit(post)}
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(post)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
            <DialogDescription>
              {selectedPost ? "Update the blog post details below." : "Fill in the details to create a new blog post."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slug *</label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Excerpt *</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the post"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Content *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Full post content (HTML supported)"
                rows={10}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "published" | "draft" | "scheduled") => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Featured Image</label>
              
              {/* Image Preview */}
              {(imagePreview || formData.featured_image) && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image
                    src={imagePreview || formData.featured_image || ''}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 100vw"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Upload Image from Device</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* URL Input (Alternative) */}
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Or enter image URL:</label>
                <Input
                  value={formData.featured_image}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, featured_image: e.target.value }))
                    if (e.target.value) {
                      setImagePreview(e.target.value)
                    } else {
                      setImagePreview(null)
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Feature this post
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {selectedPost ? "Update Post" : "Create Post"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPost?.title}</DialogTitle>
            <DialogDescription>
              {selectedPost?.excerpt}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              {selectedPost.featured_image && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedPost.featured_image}
                    alt={selectedPost.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Views: {selectedPost.views || 0}</span>
                  <span>Likes: {selectedPost.likes || 0}</span>
                  <span>Comments: {selectedPost.comments_count || 0}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false)
                    if (selectedPost.slug) {
                      window.open(`/blog/${selectedPost.slug}`, '_blank')
                    }
                  }}
                >
                  View on Site
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPost?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

