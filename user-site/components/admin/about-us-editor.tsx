"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Loader2
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AboutPageContent {
  id?: string
  hero_badge_text?: string
  hero_title_line1?: string
  hero_title_line2?: string
  hero_description?: string
  hero_cta_primary_text?: string
  hero_cta_primary_link?: string
  hero_cta_secondary_text?: string
  hero_cta_secondary_link?: string
  founder_name?: string
  founder_title?: string
  founder_image_url?: string
  founder_story_paragraph1?: string
  founder_story_paragraph2?: string
  founder_story_paragraph3?: string
  founder_cta_text?: string
  founder_cta_link?: string
  values_title?: string
  values_subtitle?: string
  values_content?: Array<{
    icon?: string
    title?: string
    description?: string
    color?: string
    bgColor?: string
  }>
  achievements_title?: string
  achievements_subtitle?: string
  achievements_content?: Array<{
    number?: string
    label?: string
    icon?: string
  }>
  process_title?: string
  process_subtitle?: string
  process_content?: Array<{
    step?: string
    title?: string
    description?: string
    icon?: string
  }>
  awards_title?: string
  awards_subtitle?: string
  awards_content?: Array<{
    icon?: string
    title?: string
    subtitle?: string
    description?: string
  }>
  cta_title?: string
  cta_description?: string
  cta_primary_text?: string
  cta_primary_link?: string
  cta_secondary_text?: string
  cta_secondary_link?: string
}

interface AboutUsEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function AboutUsEditor({ open, onOpenChange, onSave }: AboutUsEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState<AboutPageContent>({})
  const [uploadingFounderImage, setUploadingFounderImage] = useState(false)

  useEffect(() => {
    if (open) {
      fetchContent()
    }
  }, [open])

  const fetchContent = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-content/about')
      const data = await response.json()
      if (data.content) {
        setContent(data.content)
      } else {
        // Initialize with empty structure
        setContent({
          values_content: [],
          achievements_content: [],
          process_content: [],
          awards_content: []
        })
      }
    } catch (error) {
      console.error('Error fetching about page content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch('/api/site-content/about', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      if (onSave) {
        onSave()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving about page content:', error)
      alert('Failed to save content. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addArrayItem = (field: keyof AboutPageContent, item: any) => {
    const current = content[field] as any[] || []
    setContent({ ...content, [field]: [...current, item] })
  }

  const updateArrayItem = (field: keyof AboutPageContent, index: number, item: any) => {
    const current = content[field] as any[] || []
    const updated = [...current]
    updated[index] = { ...updated[index], ...item }
    setContent({ ...content, [field]: updated })
  }

  const removeArrayItem = (field: keyof AboutPageContent, index: number) => {
    const current = content[field] as any[] || []
    const updated = current.filter((_, i) => i !== index)
    setContent({ ...content, [field]: updated })
  }

  const handleFounderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB.')
      return
    }

    try {
      setUploadingFounderImage(true)
      
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'about-us')

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to upload image')
      }

      const data = await response.json()
      
      if (!data.file?.file_path) {
        throw new Error('No image URL returned from server')
      }

      // Update the founder image URL
      setContent({
        ...content,
        founder_image_url: data.file.file_path
      })
    } catch (error) {
      console.error('Error uploading founder image:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
    } finally {
      setUploadingFounderImage(false)
      // Reset input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading About Us Content</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit About Us Page</DialogTitle>
          <DialogDescription>
            Manage all content for the About Us page
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="founder">Founder</TabsTrigger>
            <TabsTrigger value="values">Values</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="awards">Awards</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge Text</Label>
                  <Input
                    value={content.hero_badge_text || ''}
                    onChange={(e) => setContent({ ...content, hero_badge_text: e.target.value })}
                    placeholder="Our Story"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title Line 1</Label>
                  <Input
                    value={content.hero_title_line1 || ''}
                    onChange={(e) => setContent({ ...content, hero_title_line1: e.target.value })}
                    placeholder="Celebrating Uganda's Rich"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title Line 2</Label>
                  <Input
                    value={content.hero_title_line2 || ''}
                    onChange={(e) => setContent({ ...content, hero_title_line2: e.target.value })}
                    placeholder="Craft Heritage"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={content.hero_description || ''}
                    onChange={(e) => setContent({ ...content, hero_description: e.target.value })}
                    placeholder="Page description..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary CTA Text</Label>
                    <Input
                      value={content.hero_cta_primary_text || ''}
                      onChange={(e) => setContent({ ...content, hero_cta_primary_text: e.target.value })}
                      placeholder="Explore Our Crafts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary CTA Link</Label>
                    <Input
                      value={content.hero_cta_primary_link || ''}
                      onChange={(e) => setContent({ ...content, hero_cta_primary_link: e.target.value })}
                      placeholder="/products"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Secondary CTA Text</Label>
                    <Input
                      value={content.hero_cta_secondary_text || ''}
                      onChange={(e) => setContent({ ...content, hero_cta_secondary_text: e.target.value })}
                      placeholder="Get in Touch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary CTA Link</Label>
                    <Input
                      value={content.hero_cta_secondary_link || ''}
                      onChange={(e) => setContent({ ...content, hero_cta_secondary_link: e.target.value })}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Founder Section */}
          <TabsContent value="founder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Founder Story</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Founder Name</Label>
                    <Input
                      value={content.founder_name || ''}
                      onChange={(e) => setContent({ ...content, founder_name: e.target.value })}
                      placeholder="Juliet Nnyonyozi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Founder Title</Label>
                    <Input
                      value={content.founder_title || ''}
                      onChange={(e) => setContent({ ...content, founder_title: e.target.value })}
                      placeholder="Founder & CEO, Julie Crafts"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Founder Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={content.founder_image_url || ''}
                      onChange={(e) => setContent({ ...content, founder_image_url: e.target.value })}
                      placeholder="/young-african-woman-weaving-traditional-mat.jpg or https://example.com/image.jpg"
                      className="flex-1"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFounderImageUpload}
                        className="hidden"
                        id="founder-image-upload"
                        disabled={uploadingFounderImage}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('founder-image-upload')?.click()}
                        disabled={uploadingFounderImage}
                        className="whitespace-nowrap"
                      >
                        {uploadingFounderImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter an image URL or click "Upload" to select an image from your device
                  </p>
                  {content.founder_image_url && (
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-slate-100 border">
                      <img
                        src={content.founder_image_url}
                        alt="Founder preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 1</Label>
                  <Textarea
                    value={content.founder_story_paragraph1 || ''}
                    onChange={(e) => setContent({ ...content, founder_story_paragraph1: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 2</Label>
                  <Textarea
                    value={content.founder_story_paragraph2 || ''}
                    onChange={(e) => setContent({ ...content, founder_story_paragraph2: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Story Paragraph 3</Label>
                  <Textarea
                    value={content.founder_story_paragraph3 || ''}
                    onChange={(e) => setContent({ ...content, founder_story_paragraph3: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CTA Text</Label>
                    <Input
                      value={content.founder_cta_text || ''}
                      onChange={(e) => setContent({ ...content, founder_cta_text: e.target.value })}
                      placeholder="Connect With Us"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Link</Label>
                    <Input
                      value={content.founder_cta_link || ''}
                      onChange={(e) => setContent({ ...content, founder_cta_link: e.target.value })}
                      placeholder="/contact"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Values Section */}
          <TabsContent value="values" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Core Values</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={content.values_title || ''}
                    onChange={(e) => setContent({ ...content, values_title: e.target.value })}
                    placeholder="Our Core Values"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Subtitle</Label>
                  <Textarea
                    value={content.values_subtitle || ''}
                    onChange={(e) => setContent({ ...content, values_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Values</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addArrayItem('values_content', { title: '', description: '', icon: '', color: 'from-red-500 to-pink-500', bgColor: 'bg-red-50' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Value
                    </Button>
                  </div>
                  {(content.values_content || []).map((value, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge>Value {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('values_content', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icon Name</Label>
                            <Input
                              value={value.icon || ''}
                              onChange={(e) => updateArrayItem('values_content', index, { icon: e.target.value })}
                              placeholder="Heart"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={value.title || ''}
                              onChange={(e) => updateArrayItem('values_content', index, { title: e.target.value })}
                              placeholder="Authentic Craftsmanship"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={value.description || ''}
                            onChange={(e) => updateArrayItem('values_content', index, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Color Gradient</Label>
                            <Input
                              value={value.color || ''}
                              onChange={(e) => updateArrayItem('values_content', index, { color: e.target.value })}
                              placeholder="from-red-500 to-pink-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Background Color</Label>
                            <Input
                              value={value.bgColor || ''}
                              onChange={(e) => updateArrayItem('values_content', index, { bgColor: e.target.value })}
                              placeholder="bg-red-50"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Section */}
          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={content.achievements_title || ''}
                    onChange={(e) => setContent({ ...content, achievements_title: e.target.value })}
                    placeholder="Making a Difference"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Subtitle</Label>
                  <Textarea
                    value={content.achievements_subtitle || ''}
                    onChange={(e) => setContent({ ...content, achievements_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Achievement Items</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addArrayItem('achievements_content', { number: '', label: '', icon: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Achievement
                    </Button>
                  </div>
                  {(content.achievements_content || []).map((achievement, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge>Achievement {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('achievements_content', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Number</Label>
                            <Input
                              value={achievement.number || ''}
                              onChange={(e) => updateArrayItem('achievements_content', index, { number: e.target.value })}
                              placeholder="500+"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                              value={achievement.label || ''}
                              onChange={(e) => updateArrayItem('achievements_content', index, { label: e.target.value })}
                              placeholder="Artisans Supported"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Name</Label>
                            <Input
                              value={achievement.icon || ''}
                              onChange={(e) => updateArrayItem('achievements_content', index, { icon: e.target.value })}
                              placeholder="Users"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Process Section */}
          <TabsContent value="process" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Process Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={content.process_title || ''}
                    onChange={(e) => setContent({ ...content, process_title: e.target.value })}
                    placeholder="How We Work"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Subtitle</Label>
                  <Textarea
                    value={content.process_subtitle || ''}
                    onChange={(e) => setContent({ ...content, process_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Process Steps</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addArrayItem('process_content', { step: '', title: '', description: '', icon: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </div>
                  {(content.process_content || []).map((step, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge>Step {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('process_content', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Step Number</Label>
                            <Input
                              value={step.step || ''}
                              onChange={(e) => updateArrayItem('process_content', index, { step: e.target.value })}
                              placeholder="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Icon Name</Label>
                            <Input
                              value={step.icon || ''}
                              onChange={(e) => updateArrayItem('process_content', index, { icon: e.target.value })}
                              placeholder="Handshake"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={step.title || ''}
                            onChange={(e) => updateArrayItem('process_content', index, { title: e.target.value })}
                            placeholder="Artisan Partnership"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={step.description || ''}
                            onChange={(e) => updateArrayItem('process_content', index, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Awards Section */}
          <TabsContent value="awards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Awards & Recognition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Section Title</Label>
                  <Input
                    value={content.awards_title || ''}
                    onChange={(e) => setContent({ ...content, awards_title: e.target.value })}
                    placeholder="Awards & Recognition"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Section Subtitle</Label>
                  <Textarea
                    value={content.awards_subtitle || ''}
                    onChange={(e) => setContent({ ...content, awards_subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Awards</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addArrayItem('awards_content', { icon: '', title: '', subtitle: '', description: '' })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Award
                    </Button>
                  </div>
                  {(content.awards_content || []).map((award, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <Badge>Award {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeArrayItem('awards_content', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Icon Name</Label>
                            <Input
                              value={award.icon || ''}
                              onChange={(e) => updateArrayItem('awards_content', index, { icon: e.target.value })}
                              placeholder="Award"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={award.title || ''}
                              onChange={(e) => updateArrayItem('awards_content', index, { title: e.target.value })}
                              placeholder="Uganda Export Award"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Subtitle</Label>
                          <Input
                            value={award.subtitle || ''}
                            onChange={(e) => updateArrayItem('awards_content', index, { subtitle: e.target.value })}
                            placeholder="Best Cultural Export Business 2023"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={award.description || ''}
                            onChange={(e) => updateArrayItem('awards_content', index, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

