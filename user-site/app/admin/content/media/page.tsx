"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Search, 
  Trash2,
  Image as ImageIcon,
  File,
  Video,
  Eye,
  Copy,
  Grid3x3,
  List,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { useMedia } from "@/hooks/admin/use-media"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"

const mediaTypes = ["All", "images", "videos", "documents", "other"]

const getTypeIcon = (category: string) => {
  switch (category) {
    case "images": return ImageIcon
    case "videos": return Video
    case "documents": return File
    default: return File
  }
}

const getTypeColor = (category: string) => {
  switch (category) {
    case "images": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "videos": return "bg-purple-100 text-purple-700 border-purple-200"
    case "documents": return "bg-blue-100 text-blue-700 border-blue-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function MediaLibraryPage() {
  const { files, loading, error, fetchFiles, deleteFile, uploadFile } = useMedia()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Fetch media files on component mount
  useEffect(() => {
    fetchFiles({ limit: 100 })
  }, [fetchFiles])

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.caption?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "All" || file.category === selectedType
    return matchesSearch && matchesType
  })

  const totalFiles = files.length
  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0)
  const imageCount = files.filter(f => f.category === "images").length
  const videoCount = files.filter(f => f.category === "videos").length
  const documentCount = files.filter(f => f.category === "documents").length

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Determine category based on file type
      let category = 'other'
      if (file.type.startsWith('image/')) {
        category = 'images'
      } else if (file.type.startsWith('video/')) {
        category = 'videos'
      } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
        category = 'documents'
      }

      await uploadFile(file, {
        category,
        alt_text: file.name,
        caption: ''
      })
      
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      })
      
      // Reset input
      event.target.value = ''
      fetchFiles({ limit: 100 })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      await deleteFile(id)
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
      })
      fetchFiles({ limit: 100 })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast({
      title: "URL Copied",
      description: "File URL has been copied to clipboard.",
    })
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleViewFile = (file: any) => {
    setSelectedFile(file.id)
    window.open(file.file_path, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Media Library
                </h1>
                <p className="text-slate-600 mt-1 text-sm">Manage images, videos, and documents for your website</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  multiple
                />
                <Button 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Media
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fetchFiles({ limit: 100 })}
                  disabled={loading}
                  className="bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <File className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Total Files</p>
                  <p className="text-xl font-bold text-gray-900">{totalFiles}</p>
                  <p className="text-xs text-gray-500">Media files</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Images</p>
                  <p className="text-xl font-bold text-gray-900">{imageCount}</p>
                  <p className="text-xs text-gray-500">Image files</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Video className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Videos</p>
                  <p className="text-xl font-bold text-gray-900">{videoCount}</p>
                  <p className="text-xs text-gray-500">Video files</p>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <File className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600">Storage Used</p>
                  <p className="text-xl font-bold text-gray-900">{formatFileSize(totalSize)}</p>
                  <p className="text-xs text-gray-500">Total size</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Media Library */}
          <Card className="bg-white border border-slate-200/60 shadow-lg">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-4">Media Library</CardTitle>
              
              {/* Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search media files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80 bg-white border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Type Filters */}
                  <div className="flex flex-wrap gap-2">
                    {mediaTypes.map((type) => (
                      <Button
                        key={type}
                        variant={selectedType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType(type)}
                        className={selectedType === type 
                          ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm" 
                          : "bg-white hover:bg-blue-50 hover:text-blue-700 border-gray-300 text-gray-700"
                        }
                      >
                        {type === "All" ? type : type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    ))}
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="flex border border-gray-300 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={viewMode === "grid" ? "bg-blue-50 text-blue-700" : "text-gray-600"}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className={viewMode === "list" ? "bg-blue-50 text-blue-700" : "text-gray-600"}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
        
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading media files...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button 
                      variant="outline" 
                      onClick={() => fetchFiles({ limit: 100 })}
                      className="bg-white hover:bg-gray-50 border-gray-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => {
                    const TypeIcon = getTypeIcon(file.category)
                    return (
                      <Card key={file.id} className="group hover:shadow-lg transition-all duration-200 cursor-pointer border border-slate-200/60">
                        <CardContent className="p-3">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                            {file.category === "images" && file.file_path ? (
                              <Image 
                                src={file.file_path} 
                                alt={file.alt_text || file.original_name}
                                fill
                                sizes="200px"
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <TypeIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className={getTypeColor(file.category)}>
                                {file.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-900 truncate" title={file.original_name}>
                              {file.original_name}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                            <p className="text-xs text-gray-500 truncate">{file.mime_type}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3 transition-opacity">
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleViewFile(file)}
                                title="View"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleCopyUrl(file.file_path)}
                                title="Copy URL"
                              >
                                {copiedUrl === file.file_path ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">File</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Size</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Uploaded</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const TypeIcon = getTypeIcon(file.category)
                        return (
                          <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  {file.category === "images" && file.file_path ? (
                                    <Image 
                                      src={file.file_path} 
                                      alt={file.original_name}
                                      width={40}
                                      height={40}
                                      className="object-cover rounded"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <TypeIcon className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{file.original_name}</p>
                                  <p className="text-sm text-gray-500">{file.mime_type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getTypeColor(file.category)}>
                                {file.category}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-gray-700">{formatFileSize(file.file_size)}</td>
                            <td className="py-4 px-4 text-gray-700">
                              {file.created_at ? format(new Date(file.created_at), 'MMM dd, yyyy') : 'N/A'}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => handleViewFile(file)}
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => handleCopyUrl(file.file_path)}
                                  title="Copy URL"
                                >
                                  {copiedUrl === file.file_path ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredFiles.length === 0 && !loading && (
                <div className="text-center py-12 px-4">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No media files found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria, or upload a new file</p>
                  <Button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Your First File
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

