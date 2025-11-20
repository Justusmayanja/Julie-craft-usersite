"use client"

import { useState, useEffect } from "react"
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
  Menu,
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
  X
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pages")
  const [loading, setLoading] = useState(false)
  
  // Pages state
  const [pages, setPages] = useState<SitePage[]>([])
  const [editingPage, setEditingPage] = useState<SitePage | null>(null)
  
  // Homepage sections state
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({})

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
      toast({
        title: "Error",
        description: "Failed to load pages",
        variant: "destructive"
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
      const formData: Record<string, any> = {}
      Object.entries(data.settings || {}).forEach(([key, setting]: [string, any]) => {
        formData[key] = setting.value
      })
      setSettingsForm(formData)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
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

      toast({
        title: "Success",
        description: `Page ${page.id ? 'updated' : 'created'} successfully`
      })
      
      setEditingPage(null)
      fetchPages()
    } catch (error) {
      console.error('Error saving page:', error)
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    try {
      setLoading(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/pages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete page')
      }

      toast({
        title: "Success",
        description: "Page deleted successfully"
      })
      
      fetchPages()
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive"
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
        settingsToSave[key] = {
          value: value,
          type: setting?.type || 'general',
          description: setting?.description
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
        throw new Error('Failed to save settings')
      }

      toast({
        title: "Success",
        description: "Settings saved successfully"
      })
      
      fetchSettings()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Site Content Management</h1>
              <p className="text-gray-600 mt-1 text-base">Manage all dynamic content on your website</p>
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pages">
                <FileText className="w-4 h-4 mr-2" />
                Pages
              </TabsTrigger>
              <TabsTrigger value="homepage">
                <Layout className="w-4 h-4 mr-2" />
                Homepage
              </TabsTrigger>
              <TabsTrigger value="footer">
                <Menu className="w-4 h-4 mr-2" />
                Footer
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
                      onCancel={() => setEditingPage(null)}
                    />
                  ) : (
                    <PagesList 
                      pages={pages} 
                      onEdit={setEditingPage}
                      onDelete={handleDeletePage}
                      loading={loading}
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

            {/* Footer Tab */}
            <TabsContent value="footer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Footer Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <FooterEditor 
                    onUpdate={fetchSettings}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
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
        </div>
      </div>
    </div>
  )
}

// Page Editor Component
function PageEditor({ page, onSave, onCancel }: { 
  page: SitePage
  onSave: (page: SitePage) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(page)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Page title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={formData.content || ''}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[200px]"
          placeholder="Page content (HTML supported)"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save Page</Button>
      </div>
    </div>
  )
}

// Pages List Component
function PagesList({ pages, onEdit, onDelete, loading }: {
  pages: SitePage[]
  onEdit: (page: SitePage) => void
  onDelete: (id: string) => void
  loading: boolean
}) {
  if (loading) {
    return <div className="text-center py-8">Loading pages...</div>
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages found</h3>
        <p className="text-gray-600">Create your first page to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {pages.map((page) => (
        <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900">{page.title}</h3>
                <p className="text-sm text-gray-600">{page.slug}</p>
              </div>
              <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                {page.status}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(page)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(page.id)}>
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Homepage Sections Editor Component
function HomepageSectionsEditor({ sections, onUpdate, loading }: {
  sections: HomepageSection[]
  onUpdate: () => void
  loading: boolean
}) {
  const { toast } = useToast()
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

      toast({
        title: "Success",
        description: `Section ${!section.is_active ? 'activated' : 'deactivated'}`
      })
      
      onUpdate()
    } catch (error) {
      console.error('Error updating section:', error)
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive"
      })
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return

    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/homepage-sections/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete section')
      }

      toast({
        title: "Success",
        description: "Section deleted successfully"
      })
      
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
              
              toast({
                title: "Success",
                description: "Section updated successfully"
              })
              
              setEditingSection(null)
              onUpdate()
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update section",
                variant: "destructive"
              })
            }
          }}
          onCancel={() => setEditingSection(null)}
        />
      )}
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

// Footer Editor Component
function FooterEditor({ onUpdate, loading }: {
  onUpdate: () => void
  loading: boolean
}) {
  const { toast } = useToast()
  const [footerContent, setFooterContent] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchFooter()
  }, [])

  const fetchFooter = async () => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/footer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setFooterContent(data.footer || [])
    } catch (error) {
      console.error('Error fetching footer:', error)
    }
  }

  const handleSaveFooter = async () => {
    try {
      setIsSaving(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/footer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sections: footerContent })
      })

      if (!response.ok) {
        throw new Error('Failed to save footer')
      }

      toast({
        title: "Success",
        description: "Footer content saved successfully"
      })
      
      fetchFooter()
    } catch (error) {
      console.error('Error saving footer:', error)
      toast({
        title: "Error",
        description: "Failed to save footer",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Manage footer content including links, contact info, and social media.
        </p>
        <Button onClick={fetchFooter} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Brand Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input placeholder="Julie Crafts" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <Input placeholder="Authentic Handmade" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
                placeholder="Company description..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input placeholder="Ntinda View Apartments, Kampala" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input placeholder="+256 700 123 456" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input placeholder="hello@juliecrafts.ug" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Media Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
              <Input placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
              <Input placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter URL</label>
              <Input placeholder="https://twitter.com/..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Links (one per line)</label>
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[150px]"
                placeholder="About Us\nProducts\nContact"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveFooter} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Footer Content'}
        </Button>
      </div>
    </div>
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
  const { toast } = useToast()
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(formData.logo_url || null)

  const groupedSettings: Record<string, Array<[string, SiteSetting]>> = {}
  
  Object.entries(settings).forEach(([key, setting]) => {
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
      toast({
        title: "Error",
        description: "Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size exceeds 2MB limit.",
        variant: "destructive"
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

      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload logo",
        variant: "destructive"
      })
    } finally {
      setLogoUploading(false)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return

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

      toast({
        title: "Success",
        description: "Logo deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      toast({
        title: "Error",
        description: "Failed to delete logo",
        variant: "destructive"
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

      {/* Other Settings */}
      {Object.entries(groupedSettings).map(([type, items]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{type} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(([key, setting]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <Input
                    value={formData[key] || ''}
                    onChange={(e) => onFormChange({ ...formData, [key]: e.target.value })}
                    placeholder={setting.description}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-end">
        <Button onClick={onSave} disabled={loading || logoUploading}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}

