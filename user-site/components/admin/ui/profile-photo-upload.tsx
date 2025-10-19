"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Camera, 
  Upload, 
  X, 
  Check,
  AlertCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfilePhotoUploadProps {
  currentPhoto?: string | null
  currentName?: string
  onPhotoChange?: (file: File | null, previewUrl: string | null) => void
  onSave?: (file: File | null) => Promise<void>
  loading?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function ProfilePhotoUpload({
  currentPhoto,
  currentName = "User",
  onPhotoChange,
  onSave,
  loading = false,
  size = "lg",
  className
}: ProfilePhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhoto || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedFile(file)
      onPhotoChange?.(file, url)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    onPhotoChange?.(null, null)
  }

  const handleSave = async () => {
    if (onSave && selectedFile) {
      await onSave(selectedFile)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Current Avatar Display */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar
            src={previewUrl}
            alt={currentName}
            fallback={currentName}
            size={size}
            editable
            onClick={openFileDialog}
            className="ring-4 ring-white shadow-lg"
          />
          
          {/* Upload indicator */}
          {selectedFile && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">{currentName}</h3>
          {selectedFile && (
            <p className="text-sm text-blue-600 font-medium">
              Ready to save changes
            </p>
          )}
        </div>
      </div>

      {/* Upload Options */}
      <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-6">
          <div
            className={cn(
              "text-center space-y-4 cursor-pointer",
              dragActive && "bg-blue-50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Choose Photo</span>
            </Button>
            
            {selectedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={loading}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {selectedFile && (
        <div className="flex justify-center">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                <span>Save Photo</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}
