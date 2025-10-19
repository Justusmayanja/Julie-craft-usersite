"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Camera, Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimpleProfilePhotoUploadProps {
  currentPhoto?: string | null
  currentName?: string
  onPhotoChange?: (file: File | null) => void
  loading?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function SimpleProfilePhotoUpload({
  currentPhoto,
  currentName = "User",
  onPhotoChange,
  loading = false,
  size = "md",
  className,
}: SimpleProfilePhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  React.useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    } else {
      setPreviewUrl(null)
    }
  }, [selectedFile])

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setIsUploading(true)
    
    try {
      if (onPhotoChange) {
        await onPhotoChange(file)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      setSelectedFile(null)
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size exceeds 10MB limit.")
        return
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        alert("Only JPG, PNG, GIF images are allowed.")
        return
      }
      handleFileSelect(file)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const displayPhoto = previewUrl || currentPhoto

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity",
          {
            "w-24 h-24": size === "sm",
            "w-32 h-32": size === "md",
            "w-40 h-40": size === "lg",
            "w-48 h-48": size === "xl",
          }
        )}
        onClick={openFileDialog}
      >
        <Avatar
          src={displayPhoto}
          alt={currentName}
          fallback={currentName}
          size={size}
          className="ring-4 ring-white shadow-lg rounded-full"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/jpeg,image/png,image/gif"
          disabled={loading || isUploading}
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          {isUploading ? "Uploading..." : selectedFile ? selectedFile.name : "Click to upload photo"}
        </p>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
      </div>

      <Button
        onClick={openFileDialog}
        variant="outline"
        size="sm"
        className="bg-white hover:bg-gray-50 border-gray-300 text-gray-900 hover:text-gray-900"
        disabled={loading || isUploading}
      >
        <Upload className="w-4 h-4 mr-2 text-gray-900" />
        {isUploading ? "Uploading..." : "Choose Photo"}
      </Button>
    </div>
  )
}
