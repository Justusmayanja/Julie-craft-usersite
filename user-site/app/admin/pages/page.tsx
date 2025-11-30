"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Layout, 
  Settings, 
  Globe,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  RefreshCw,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Filter,
  CheckSquare,
  Square,
  Bold,
  Italic,
  Underline,
  List,
  Link as LinkIcon,
  Maximize2,
  XCircle,
  Info
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/admin/ui/toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SitePage {
  id: string
  title: string
  slug: string
  content?: string
  excerpt?: string
  type: string
  status: string
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  featured_image?: string
  created_at: string
  updated_at: string
}

interface HomepageSection {
  id: string
  section_type: string
  title: string
  content: any
  is_active: boolean
  sort_order: number
  display_settings?: any
}

interface SiteSetting {
  setting_key: string
  setting_value: any
  setting_type: string
  description?: string
}

export default function AdminPagesPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState("pages")
  const [loading, setLoading] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('/julie-logo.jpeg')
  
  // Pages state
  const [pages, setPages] = useState<SitePage[]>([])
  const [editingPage, setEditingPage] = useState<SitePage | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [showPreview, setShowPreview] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<string | null>(null)
  
  // Homepage sections state
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({})

  // Load logo from site settings
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const token = localStorage.getItem('julie-crafts-token')
        const response = await fetch('/api/site-content/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()
        if (data.settings?.logo_url?.value) {
          setLogoUrl(data.settings.logo_url.value)
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
        // Keep default logo on error
      }
    }
    fetchLogo()
  }, [])

  // Fetch data
  const fetchPages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/pages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setPages(data.pages || [])
    } catch (error) {
      console.error('Error fetching pages:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load pages"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/homepage-sections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setSections(data.sections || [])
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast({
        title: "Error",
        description: "Failed to load homepage sections",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setSettings(data.settings || {})
      
      // Initialize form with current settings
      // Handle JSONB values - extract the actual value
      const formData: Record<string, any> = {}
      Object.entries(data.settings || {}).forEach(([key, setting]: [string, any]) => {
        let value = setting.value
        
        // If value is a string that looks like a JSON string, try to parse it
        if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{') || value.startsWith('['))) {
          try {
            value = JSON.parse(value)
          } catch {
            // If parsing fails, use the string as-is
          }
        }
        
        formData[key] = value || ''
      })
      setSettingsForm(formData)
    } catch (error) {
      console.error('Error fetching settings:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to load settings"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pages') {
      fetchPages()
    } else if (activeTab === 'homepage') {
      fetchSections()
    } else if (activeTab === 'settings') {
      fetchSettings()
    }
  }, [activeTab])

  const handleSavePage = async (page: SitePage) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const url = page.id ? `/api/site-content/pages/${page.id}` : '/api/site-content/pages'
      const method = page.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(page)
      })

      if (!response.ok) {
        throw new Error('Failed to save page')
      }

      addToast({
        type: "success",
        title: "Success",
        description: `The page "${page.title}" has been ${page.id ? 'updated' : 'created'} successfully.`
      })
      
      setEditingPage(null)
      fetchPages()
    } catch (error) {
      console.error('Error saving page:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to save page"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePage = (id: string) => {
    setPageToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDeletePage = async () => {
    if (!pageToDelete) return

    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/pages/${pageToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete page')
      }

      addToast({
        type: "success",
        title: "Success",
        description: "The page has been deleted successfully."
      })
      
      setDeleteDialogOpen(false)
      setPageToDelete(null)
      fetchPages()
    } catch (error) {
      console.error('Error deleting page:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to delete page"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      
      const settingsToSave: Record<string, any> = {}
      Object.entries(settingsForm).forEach(([key, value]) => {
        const setting = settings[key]
        // Ensure value is properly formatted for JSONB storage
        // Empty strings should be stored as empty strings, not null
        const settingValue = value === null || value === undefined ? '' : value
        
        settingsToSave[key] = {
          value: settingValue,
          type: setting?.type || setting?.setting_type || 'general',
          description: setting?.description || null
        }
      })

      const response = await fetch('/api/site-content/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsToSave })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save settings')
      }

      addToast({
        type: "success",
        title: "Success",
        description: "Site settings have been saved successfully."
      })
      
      // Refresh settings to get updated values
      await fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    <img
                      src={logoUrl}
                      alt="Site Logo"
                      className="w-16 h-16 object-contain rounded-lg bg-white p-2 border border-gray-200 shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/julie-logo.jpeg'
                      }}
                    />
                  </div>
                  {/* Title Section */}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Site Content Management</h1>
                    <p className="text-gray-600 mt-1 text-sm">Manage all dynamic content on your website</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (activeTab === 'pages') {
                      setEditingPage({
                        id: '',
                        title: '',
                        slug: '',
                        type: 'page',
                        status: 'draft',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeTab === 'pages' ? 'Create Page' : 'Add Section'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pages">
                <FileText className="w-4 h-4 mr-2" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="homepage">
                <Layout className="w-4 h-4 mr-2" />
                Homepage
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Pages Tab */}
            <TabsContent value="pages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  {editingPage ? (
                    <PageEditor 
                      page={editingPage} 
                      onSave={handleSavePage}
                      onCancel={() => {
                        setEditingPage(null)
                        setShowPreview(false)
                      }}
                      onPreview={() => setShowPreview(true)}
                      showPreview={showPreview}
                    />
                  ) : (
                    <PagesList 
                      pages={pages} 
                      onEdit={setEditingPage}
                      onDelete={handleDeletePage}
                      loading={loading}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      typeFilter={typeFilter}
                      onTypeFilterChange={setTypeFilter}
                      selectedPages={selectedPages}
                      onSelectPage={(id) => {
                        const newSet = new Set(selectedPages)
                        if (newSet.has(id)) {
                          newSet.delete(id)
                        } else {
                          newSet.add(id)
                        }
                        setSelectedPages(newSet)
                      }}
                      onSelectAll={(select) => {
                        if (select) {
                          setSelectedPages(new Set(pages.map(p => p.id)))
                        } else {
                          setSelectedPages(new Set())
                        }
                      }}
                      onBulkAction={async (action) => {
                        if (selectedPages.size === 0) {
                          addToast({
                            type: "error",
                            title: "No Selection",
                            description: "Please select at least one page."
                          })
                          return
                        }
                        
                        try {
                          setLoading(true)
                          const token = localStorage.getItem('julie-crafts-token')
                          const pageIds = Array.from(selectedPages)
                          
                          if (action === 'delete') {
                            if (!confirm(`Are you sure you want to delete ${pageIds.length} page(s)?`)) {
                              return
                            }
                            
                            await Promise.all(
                              pageIds.map(id => 
                                fetch(`/api/site-content/pages/${id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  }
                                })
                              )
                            )
                            
                            addToast({
                              type: "success",
                              title: "Success",
                              description: `${pageIds.length} page(s) deleted successfully.`
                            })
                          } else if (action === 'publish') {
                            await Promise.all(
                              pageIds.map(id => 
                                fetch(`/api/site-content/pages/${id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ status: 'published' })
                                })
                              )
                            )
                            
                            addToast({
                              type: "success",
                              title: "Success",
                              description: `${pageIds.length} page(s) published successfully.`
                            })
                          } else if (action === 'archive') {
                            await Promise.all(
                              pageIds.map(id => 
                                fetch(`/api/site-content/pages/${id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ status: 'archived' })
                                })
                              )
                            )
                            
                            addToast({
                              type: "success",
                              title: "Success",
                              description: `${pageIds.length} page(s) archived successfully.`
                            })
                          }
                          
                          setSelectedPages(new Set())
                          fetchPages()
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to perform bulk action. Please try again.",
                            variant: "destructive"
                          })
                        } finally {
                          setLoading(false)
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Homepage Tab */}
            <TabsContent value="homepage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <HomepageSectionsEditor 
                    sections={sections}
                    onUpdate={fetchSections}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Site Settings</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Manage general site settings, contact information, and social media links
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchSettings}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <SettingsEditor 
                    settings={settings}
                    formData={settingsForm}
                    onFormChange={setSettingsForm}
                    onSave={handleSaveSettings}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Delete Page Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Page</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this page? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setDeleteDialogOpen(false)
                  setPageToDelete(null)
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeletePage}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

// Rich Text Editor Toolbar Component
function RichTextToolbar({ onFormat }: { onFormat: (format: string) => void }) {
  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFormat('bold')}
        className="h-8 w-8 p-0"
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFormat('italic')}
        className="h-8 w-8 p-0"
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFormat('underline')}
        className="h-8 w-8 p-0"
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFormat('ul')}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onFormat('link')}
        className="h-8 w-8 p-0"
        title="Insert Link"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Page Editor Component
function PageEditor({ page, onSave, onCancel, onPreview, showPreview }: { 
  page: SitePage
  onSave: (page: SitePage) => void
  onCancel: () => void
  onPreview?: () => void
  showPreview?: boolean
}) {
  const { addToast } = useToast()
  const [formData, setFormData] = useState(page)
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string | null>(page.featured_image || null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const handleFormat = (format: string) => {
    if (!contentRef.current) return
    
    const textarea = contentRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    let formattedText = ''
    
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText || 'bold text'}</strong>`
        break
      case 'italic':
        formattedText = `<em>${selectedText || 'italic text'}</em>`
        break
      case 'underline':
        formattedText = `<u>${selectedText || 'underlined text'}</u>`
        break
      case 'ul':
        formattedText = `<ul><li>${selectedText || 'List item'}</li></ul>`
        break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) {
          formattedText = `<a href="${url}">${selectedText || 'Link text'}</a>`
        } else {
          return
        }
        break
    }
    
    const newContent = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end)
    
    setFormData({ ...formData, content: newContent })
    
    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "Error",
        description: "File size exceeds 5MB limit."
      })
      return
    }

    try {
      setUploadingImage(true)
      const token = localStorage.getItem('julie-crafts-token')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'pages')

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setFeaturedImagePreview(data.url)
      setFormData({ ...formData, featured_image: data.url })

      addToast({
        type: "success",
        title: "Success",
        description: "Featured image uploaded successfully."
      })
    } catch (error) {
      console.error('Error uploading image:', error)
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image"
      })
    } finally {
      setUploadingImage(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setFeaturedImagePreview(null)
    setFormData({ ...formData, featured_image: '' })
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Page Preview</h3>
          <Button variant="outline" onClick={() => onPreview?.()}>
            <XCircle className="w-4 h-4 mr-2" />
            Close Preview
          </Button>
        </div>
        <Card className="border-2">
          <CardContent className="p-6">
            {featuredImagePreview && (
              <div className="mb-6">
                <img 
                  src={featuredImagePreview} 
                  alt={formData.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold mb-4">{formData.title || 'Page Title'}</h1>
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: formData.content || '<p>No content yet.</p>' }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Page title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="/page-slug"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="page">Page</option>
                <option value="about">About</option>
                <option value="contact">Contact</option>
                <option value="privacy">Privacy</option>
                <option value="terms">Terms</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <Textarea
              value={formData.excerpt || ''}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief description of the page"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Featured Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Featured Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredImagePreview ? (
            <div className="relative inline-block">
              <img
                src={featuredImagePreview}
                alt="Featured"
                className="w-48 h-48 object-cover rounded-lg border border-gray-200"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">No featured image</p>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                id="featured-image-upload"
                disabled={uploadingImage}
              />
              <label htmlFor="featured-image-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingImage}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </span>
                </Button>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextToolbar onFormat={handleFormat} />
          <Textarea
            ref={contentRef}
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-b-md min-h-[300px] font-mono text-sm"
            placeholder="Enter page content. HTML is supported. Use the toolbar above to format text."
          />
          <p className="text-xs text-gray-500">
            Tip: You can use HTML tags directly or use the toolbar buttons above to format your content.
          </p>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Settings</CardTitle>
          <p className="text-sm text-gray-600">Optimize your page for search engines</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
            <Input
              value={formData.meta_title || ''}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              placeholder="SEO title (recommended: 50-60 characters)"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.meta_title?.length || 0}/60 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
            <Textarea
              value={formData.meta_description || ''}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              placeholder="SEO description (recommended: 150-160 characters)"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.meta_description?.length || 0}/160 characters
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords (comma-separated)</label>
            <Input
              value={formData.meta_keywords?.join(', ') || ''}
              onChange={(e) => {
                const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                setFormData({ ...formData, meta_keywords: keywords })
              }}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button onClick={() => onSave(formData)} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Page
          </Button>
        </div>
      </div>
    </div>
  )
}

// Pages List Component
function PagesList({ 
  pages, 
  onEdit, 
  onDelete, 
  loading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  selectedPages,
  onSelectPage,
  onSelectAll,
  onBulkAction
}: {
  pages: SitePage[]
  onEdit: (page: SitePage) => void
  onDelete: (id: string) => void
  loading: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  statusFilter: string
  onStatusFilterChange: (filter: string) => void
  typeFilter: string
  onTypeFilterChange: (filter: string) => void
  selectedPages: Set<string>
  onSelectPage: (id: string) => void
  onSelectAll: (select: boolean) => void
  onBulkAction: (action: 'delete' | 'publish' | 'archive') => Promise<void>
}) {
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // MUST be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    setShowBulkActions(selectedPages.size > 0)
  }, [selectedPages.size])

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Loading pages...</p>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
        <p className="text-gray-600 mb-6">Create your first page to get started</p>
        <Button onClick={() => onEdit({
          id: '',
          title: '',
          slug: '',
          type: 'page',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Page
        </Button>
      </div>
    )
  }

  // Filter pages based on search and filters
  const filteredPages = pages.filter(page => {
    const matchesSearch = !searchTerm || 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (page.content && page.content.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter
    const matchesType = typeFilter === 'all' || page.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Types</option>
            <option value="page">Page</option>
            <option value="about">About</option>
            <option value="contact">Contact</option>
            <option value="privacy">Privacy</option>
            <option value="terms">Terms</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {selectedPages.size} page(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectAll(false)}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('publish')}
                  className="text-xs"
                >
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('archive')}
                  className="text-xs"
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('delete')}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pages List */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first page to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAll(selectedPages.size !== filteredPages.length)}
              className="h-8"
            >
              {selectedPages.size === filteredPages.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </Button>
            <span className="text-sm text-gray-600">
              Select all ({filteredPages.length} pages)
            </span>
          </div>

          {filteredPages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow duration-200 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Checkbox */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectPage(page.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      {selectedPages.has(page.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>

                    {/* Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      {page.featured_image ? (
                        <img 
                          src={page.featured_image} 
                          alt={page.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    
                    {/* Page Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900 text-base truncate">{page.title || 'Untitled Page'}</h3>
                        <Badge 
                          variant={page.status === 'published' ? 'default' : 'secondary'}
                          className="text-xs flex-shrink-0"
                        >
                          {page.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {page.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="truncate">{page.slug || '/'}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Updated {new Date(page.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(page)}
                      className="hover:bg-blue-50 hover:text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {page.status === 'published' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                        className="hover:bg-green-50 hover:text-green-600"
                        title="View Page"
                      >
                        <a href={page.slug} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(page.id)}
                      className="hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Homepage Sections Editor Component
function HomepageSectionsEditor({ sections, onUpdate, loading }: {
  sections: HomepageSection[]
  onUpdate: () => void
  loading: boolean
}) {
  const { addToast } = useToast()
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)

  const handleToggleSection = async (section: HomepageSection) => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/homepage-sections/${section.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !section.is_active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update section')
      }

      addToast({
        type: "success",
        title: "Success",
        description: `The section "${section.title}" has been ${!section.is_active ? 'activated' : 'deactivated'} successfully.`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating section:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to update section"
      })
    }
  }

  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)

  const handleDeleteSection = (id: string) => {
    setSectionToDelete(id)
    setDeleteSectionDialogOpen(true)
  }

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return

    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/homepage-sections/${sectionToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete section')
      }

      addToast({
        type: "success",
        title: "Success",
        description: "The section has been deleted successfully."
      })
      
      setDeleteSectionDialogOpen(false)
      setSectionToDelete(null)
      onUpdate()
    } catch (error) {
      console.error('Error deleting section:', error)
      toast({
        title: "Error",
        description: "Failed to delete section",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading sections...</div>
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <Layout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections found</h3>
        <p className="text-gray-600">Create your first homepage section</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Manage homepage sections like hero, featured products, testimonials, etc. Drag to reorder.
      </p>
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Layout className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-600">Type: {section.section_type} • Order: {section.sort_order}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={section.is_active ? 'default' : 'secondary'}>
                {section.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleToggleSection(section)}
              >
                {section.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingSection(section)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDeleteSection(section.id)}
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {editingSection && (
        <SectionEditor 
          section={editingSection}
          onSave={async (updated) => {
            try {
              const token = localStorage.getItem('julie-crafts-token')
              const response = await fetch(`/api/site-content/homepage-sections/${updated.id}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(updated)
              })

              if (!response.ok) throw new Error('Failed to update')
              
              addToast({
                type: "success",
                title: "Success",
                description: `The section "${updated.title}" has been updated successfully.`
              })
              
              setEditingSection(null)
              onUpdate()
            } catch (error) {
              addToast({
                type: "error",
                title: "Error",
                description: "Failed to update section"
              })
            }
          }}
          onCancel={() => setEditingSection(null)}
        />
      )}

      {/* Delete Section Confirmation Dialog */}
      <AlertDialog open={deleteSectionDialogOpen} onOpenChange={setDeleteSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this homepage section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteSectionDialogOpen(false)
              setSectionToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSection}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Section Editor Component
function SectionEditor({ section, onSave, onCancel }: {
  section: HomepageSection
  onSave: (section: HomepageSection) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(section)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Edit Section: {section.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content (JSON)</label>
          <textarea
            value={JSON.stringify(formData.content, null, 2)}
            onChange={(e) => {
              try {
                setFormData({ ...formData, content: JSON.parse(e.target.value) })
              } catch {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[200px] font-mono text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
          <Input
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>Save Section</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Settings Editor Component
function SettingsEditor({ settings, formData, onFormChange, onSave, loading }: {
  settings: Record<string, SiteSetting>
  formData: Record<string, any>
  onFormChange: (data: Record<string, any>) => void
  onSave: () => void
  loading: boolean
}) {
  const { addToast } = useToast()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(formData.logo_url || null)

  const groupedSettings: Record<string, Array<[string, SiteSetting]>> = {}
  
  // Filter out business settings - they're managed in /admin/settings/business
  Object.entries(settings).forEach(([key, setting]) => {
    // Skip business settings - they're now in business_settings table
    if (setting.setting_type === 'business') {
      return
    }
    
    const type = setting.setting_type || 'general'
    if (!groupedSettings[type]) {
      groupedSettings[type] = []
    }
    groupedSettings[type].push([key, setting])
  })

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: "error",
        title: "Error",
        description: "Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed."
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast({
        type: "error",
        title: "Error",
        description: "File size exceeds 2MB limit."
      })
      return
    }

    try {
      setLogoUploading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/site-content/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }

      // Update form data with new logo URL
      onFormChange({ ...formData, logo_url: data.logo_url })
      setLogoPreview(data.logo_url)

      addToast({
        type: "success",
        title: "Success",
        description: "Logo has been uploaded successfully."
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      addToast({
        type: "error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload logo"
      })
    } finally {
      setLogoUploading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const [deleteLogoDialogOpen, setDeleteLogoDialogOpen] = useState(false)

  const handleDeleteLogo = () => {
    setDeleteLogoDialogOpen(true)
  }

  const confirmDeleteLogo = async () => {
    try {
      setLogoUploading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete logo')
      }

      onFormChange({ ...formData, logo_url: '' })
      setLogoPreview(null)
      setDeleteLogoDialogOpen(false)

      addToast({
        type: "success",
        title: "Success",
        description: "Logo has been deleted successfully."
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      addToast({
        type: "error",
        title: "Error",
        description: "Failed to delete logo"
      })
    } finally {
      setLogoUploading(false)
    }
  }

  // Update logo preview when formData changes
  useEffect(() => {
    if (formData.logo_url) {
      setLogoPreview(formData.logo_url)
    }
  }, [formData.logo_url])

  return (
    <div className="space-y-6">
      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Site Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Logo Preview */}
            <div className="flex-shrink-0">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Site Logo"
                    className="w-32 h-32 object-contain border border-gray-200 rounded-lg bg-white p-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/julie-logo.jpeg'
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0"
                    onClick={handleDeleteLogo}
                    disabled={logoUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Logo
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Recommended: Square image, max 2MB. Supported formats: JPEG, PNG, WEBP, SVG
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={logoUploading}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={logoUploading}
                      className="cursor-pointer"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {logoUploading ? 'Uploading...' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </Button>
                  </label>
                  {logoPreview && (
                    <Button
                      variant="outline"
                      onClick={handleDeleteLogo}
                      disabled={logoUploading}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {logoPreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <Input
                    value={formData.logo_url || ''}
                    onChange={(e) => {
                      onFormChange({ ...formData, logo_url: e.target.value })
                      setLogoPreview(e.target.value)
                    }}
                    placeholder="Logo URL"
                    readOnly
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Message about Business Settings */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Business Information</p>
              <p className="text-xs text-blue-700 mt-1">
                Business settings (name, email, phone, address, etc.) are now managed separately. 
                <a href="/admin/settings/business" className="underline font-medium ml-1">
                  Go to Business Info →
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Settings */}
      {Object.entries(groupedSettings).map(([type, items]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{type} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(([key, setting]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                const isEmail = key.includes('email')
                const isUrl = key.includes('url') || key.includes('link')
                const isPhone = key.includes('phone') || key.includes('tel')
                const isAddress = key.includes('address')
                const isTextarea = key.includes('description') || key.includes('tagline') || key.includes('content')
                
                return (
                  <div key={key} className={isTextarea ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                      {setting.description && (
                        <span className="text-xs text-gray-500 font-normal ml-2">
                          ({setting.description})
                        </span>
                      )}
                    </label>
                    {isTextarea ? (
                      <Textarea
                        value={formData[key] || ''}
                        onChange={(e) => onFormChange({ ...formData, [key]: e.target.value })}
                        placeholder={setting.description || `Enter ${label.toLowerCase()}`}
                        rows={3}
                        className="resize-none"
                      />
                    ) : (
                      <Input
                        type={isEmail ? 'email' : isPhone ? 'tel' : 'text'}
                        value={formData[key] || ''}
                        onChange={(e) => onFormChange({ ...formData, [key]: e.target.value })}
                        placeholder={setting.description || `Enter ${label.toLowerCase()}`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {Object.keys(groupedSettings).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No settings found. Default settings will be created when you save.</p>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={loading || logoUploading}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Delete Logo Confirmation Dialog */}
      <AlertDialog open={deleteLogoDialogOpen} onOpenChange={setDeleteLogoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Logo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the site logo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteLogoDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteLogo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

