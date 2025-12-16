"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ArrowUp, 
  ArrowDown,
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface CarouselSlide {
  id?: string
  image_url: string
  title: string
  subtitle?: string
  description?: string
  cta_text?: string
  cta_link?: string
  is_active: boolean
  sort_order: number
}

interface CarouselEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

export function CarouselEditor({ open, onOpenChange, onSave }: CarouselEditorProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [slides, setSlides] = useState<CarouselSlide[]>([])
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (open) {
      fetchSlides()
    }
  }, [open])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-content/carousel')
      const data = await response.json()
      if (data.slides) {
        setSlides(data.slides)
      }
    } catch (error) {
      console.error('Error fetching carousel slides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSlide = async (slide: CarouselSlide) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('julie-crafts-token')
      
      if (slide.id) {
        // Update existing
        const response = await fetch(`/api/site-content/carousel/${slide.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(slide)
        })

        if (!response.ok) {
          throw new Error('Failed to update slide')
        }
      } else {
        // Create new
        const response = await fetch('/api/site-content/carousel', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(slide)
        })

        if (!response.ok) {
          throw new Error('Failed to create slide')
        }
      }

      setEditingSlide(null)
      fetchSlides()
      if (onSave) {
        onSave()
      }
    } catch (error) {
      console.error('Error saving slide:', error)
      alert('Failed to save slide. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSlide = async () => {
    if (!slideToDelete) return

    try {
      setSaving(true)
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/carousel/${slideToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete slide')
      }

      setDeleteDialogOpen(false)
      setSlideToDelete(null)
      fetchSlides()
      if (onSave) {
        onSave()
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      alert('Failed to delete slide. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    const updatedSlides = [...slides]
    const [movedSlide] = updatedSlides.splice(index, 1)
    updatedSlides.splice(newIndex, 0, movedSlide)

    // Update sort orders
    const slidesToUpdate = updatedSlides.map((slide, idx) => ({
      ...slide,
      sort_order: idx
    }))

    try {
      setSaving(true)
      const token = localStorage.getItem('julie-crafts-token')
      
      await Promise.all(
        slidesToUpdate.map(slide => 
          fetch(`/api/site-content/carousel/${slide.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sort_order: slide.sort_order })
          })
        )
      )

      fetchSlides()
    } catch (error) {
      console.error('Error moving slide:', error)
      alert('Failed to reorder slides. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (slide: CarouselSlide) => {
    try {
      const token = localStorage.getItem('julie-crafts-token')
      const response = await fetch(`/api/site-content/carousel/${slide.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !slide.is_active })
      })

      if (!response.ok) {
        throw new Error('Failed to update slide')
      }

      fetchSlides()
    } catch (error) {
      console.error('Error toggling slide:', error)
      alert('Failed to update slide. Please try again.')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadingImage(true)
      
      const token = localStorage.getItem('julie-crafts-token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('folder', 'carousel')

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

      // Update the editing slide with the uploaded image URL
      if (editingSlide) {
        setEditingSlide({
          ...editingSlide,
          image_url: data.file.file_path
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
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
            <DialogTitle>Loading Carousel</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {/* Main Carousel Editor Dialog */}
      <Dialog open={open && !editingSlide} onOpenChange={(isOpen) => {
        if (!isOpen && !editingSlide) {
          onOpenChange(false)
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Hero Carousel</DialogTitle>
            <DialogDescription>
              Add, edit, and reorder carousel slides for the homepage hero section
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">
                  {slides.length} {slides.length === 1 ? 'slide' : 'slides'} total
                </p>
              </div>
              <Button
                onClick={() => setEditingSlide({
                  image_url: '',
                  title: '',
                  subtitle: '',
                  description: '',
                  cta_text: '',
                  cta_link: '',
                  is_active: true,
                  sort_order: slides.length
                })}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Slide
              </Button>
            </div>

            <div className="space-y-4">
              {slides.map((slide, index) => (
                <Card key={slide.id} className={!slide.is_active ? 'opacity-60' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Preview Image */}
                      <div className="w-32 h-20 sm:w-40 sm:h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        {slide.image_url ? (
                          <img
                            src={slide.image_url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Slide Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{slide.title}</h3>
                              {!slide.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            {slide.subtitle && (
                              <p className="text-sm text-slate-600 mb-1">{slide.subtitle}</p>
                            )}
                            {slide.description && (
                              <p className="text-sm text-slate-500 line-clamp-2">{slide.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              {slide.cta_text && (
                                <span>CTA: {slide.cta_text}</span>
                              )}
                              <span>Order: {slide.sort_order + 1}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slide.is_active}
                            onCheckedChange={() => handleToggleActive(slide)}
                          />
                          <span className="text-xs text-slate-600">
                            {slide.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveSlide(index, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingSlide(slide)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSlideToDelete(slide.id!)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {slides.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No carousel slides yet</h3>
                    <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                      Create your first carousel slide to display on the homepage hero section.
                    </p>
                    <Button
                      onClick={() => setEditingSlide({
                        image_url: '',
                        title: '',
                        subtitle: '',
                        description: '',
                        cta_text: '',
                        cta_link: '',
                        is_active: true,
                        sort_order: 0
                      })}
                      className="bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Your First Slide
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Slide Dialog - Separate from main dialog */}
      {editingSlide && (
        <Dialog open={!!editingSlide} onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingSlide(null)
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide.id ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
              <DialogDescription>
                {editingSlide.id ? 'Update the carousel slide details below.' : 'Fill in the details to create a new carousel slide. Image URL and Title are required.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Image *</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingSlide.image_url}
                    onChange={(e) => setEditingSlide({ ...editingSlide, image_url: e.target.value })}
                    placeholder="/path/to/image.jpg or https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="carousel-image-upload"
                      disabled={uploadingImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('carousel-image-upload')?.click()}
                      disabled={uploadingImage}
                      className="whitespace-nowrap"
                    >
                      {uploadingImage ? (
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
                {editingSlide.image_url && (
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-slate-100 border">
                    <img
                      src={editingSlide.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={editingSlide.title}
                  onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                  placeholder="Slide Title"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={editingSlide.subtitle || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                  placeholder="Optional subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingSlide.description || ''}
                  onChange={(e) => setEditingSlide({ ...editingSlide, description: e.target.value })}
                  placeholder="Slide description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input
                    value={editingSlide.cta_text || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, cta_text: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA Link</Label>
                  <Input
                    value={editingSlide.cta_link || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, cta_link: e.target.value })}
                    placeholder="/products"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingSlide.is_active}
                  onCheckedChange={(checked) => setEditingSlide({ ...editingSlide, is_active: checked })}
                />
                <Label>Active (visible on homepage)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditingSlide(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSaveSlide(editingSlide)} 
                  disabled={saving || !editingSlide.image_url || !editingSlide.title}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingSlide.id ? 'Update Slide' : 'Create Slide'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Carousel Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this carousel slide? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false)
              setSlideToDelete(null)
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlide}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

