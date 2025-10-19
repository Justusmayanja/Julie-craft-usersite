"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  Eye, 
  Upload, 
  Edit3,
  Layout,
  Image as ImageIcon,
  Type,
  Star,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  MessageCircle,
  Mail,
  TrendingUp
} from "lucide-react"

// Mock data for homepage sections
const mockHomepageSections = [
  {
    id: "HERO-001",
    type: "hero",
    title: "Hero Section",
    content: {
      headline: "Handcrafted with Love",
      subheadline: "Discover unique artisanal pieces that tell a story",
      ctaText: "Shop Now",
      backgroundImage: "/hero-bg.jpg"
    },
    isActive: true,
    order: 1
  },
  {
    id: "FEAT-001", 
    type: "featured_products",
    title: "Featured Products",
    content: {
      sectionTitle: "Featured Crafts",
      description: "Handpicked pieces from our latest collection",
      productCount: 4,
      layout: "grid"
    },
    isActive: true,
    order: 2
  },
  {
    id: "ABOUT-001",
    type: "about_preview",
    title: "About Preview",
    content: {
      headline: "Meet the Artist",
      description: "Julie's passion for handmade crafts began over 15 years ago...",
      image: "/julie-portrait.jpg",
      ctaText: "Learn More"
    },
    isActive: true,
    order: 3
  },
  {
    id: "TEST-001",
    type: "testimonials",
    title: "Customer Testimonials",
    content: {
      sectionTitle: "What Our Customers Say",
      testimonialCount: 3,
      layout: "carousel"
    },
    isActive: false,
    order: 4
  },
]

const sectionTypes = [
  { type: "hero", label: "Hero Section", icon: Layout },
  { type: "featured_products", label: "Featured Products", icon: Star },
  { type: "about_preview", label: "About Preview", icon: Type },
  { type: "testimonials", label: "Testimonials", icon: MessageCircle },
  { type: "newsletter", label: "Newsletter Signup", icon: Mail },
  { type: "gallery", label: "Image Gallery", icon: ImageIcon },
]

export default function HomepageEditorPage() {
  const [sections, setSections] = useState(mockHomepageSections)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const activeSections = sections.filter(s => s.isActive).length
  const totalSections = sections.length

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setSections(prev => {
      const newSections = [...prev]
      const index = newSections.findIndex(s => s.id === id)
      if (direction === 'up' && index > 0) {
        [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]]
      } else if (direction === 'down' && index < newSections.length - 1) {
        [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]
      }
      return newSections
    })
  }

  const toggleSection = (id: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === id ? { ...section, isActive: !section.isActive } : section
      )
    )
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Homepage Editor</h1>
              <p className="text-gray-600 mt-1 text-base">Customize your website homepage layout and content</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white hover:bg-gray-50 border-gray-300">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
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
                    <Layout className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Sections</p>
                  <p className="text-xl font-bold text-gray-900">{totalSections}</p>
                  <p className="text-xs text-gray-500">Homepage sections</p>
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
                  <p className="text-xs font-medium text-gray-600">Active Sections</p>
                  <p className="text-xl font-bold text-gray-900">{activeSections}</p>
                  <p className="text-xs text-gray-500">Currently visible</p>
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
                  <p className="text-xs font-medium text-gray-600">Last Updated</p>
                  <p className="text-xl font-bold text-gray-900">Today</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
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
                  <p className="text-xs font-medium text-gray-600">Page Views</p>
                  <p className="text-xl font-bold text-gray-900">2,840</p>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Homepage Sections */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Homepage Sections</CardTitle>
                <Button variant="outline" className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
        
            <CardContent className="p-6">
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <Card key={section.id} className={`border-2 transition-all duration-200 ${section.isActive ? 'border-blue-200 bg-blue-50/20' : 'border-gray-200 bg-gray-50/20'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col space-y-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'up')}
                              disabled={index === 0}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveSection(section.id, 'down')}
                              disabled={index === sections.length - 1}
                              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-1"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Layout className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{section.title}</h3>
                              <p className="text-sm text-gray-600 capitalize">{section.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={section.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}>
                            {section.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSection(section.id)}
                            className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                          >
                            {section.isActive ? "Hide" : "Show"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSection(section.id)}
                            className="bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {section.type === "hero" && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Headline</label>
                              <Input defaultValue={section.content.headline} />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">CTA Button Text</label>
                              <Input defaultValue={section.content.ctaText} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">Subheadline</label>
                              <Input defaultValue={section.content.subheadline} />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add New Section */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Add New Section</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionTypes.map((sectionType) => {
                  const Icon = sectionType.icon
                  return (
                    <Button
                      key={sectionType.type}
                      variant="outline"
                      className="justify-start h-auto p-4 bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{sectionType.label}</div>
                          <div className="text-sm text-gray-600">Add {sectionType.label.toLowerCase()}</div>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
