import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('categoryId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 5MB limit.' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${categoryId}_${Date.now()}_${uuidv4()}.${fileExtension}`
    
    // Define upload directory and file path
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'categories')
    const filePath = join(uploadDir, uniqueFileName)

    // Create upload directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true })

    // Write file to disk
    await fs.writeFile(filePath, buffer)

    // Return the public URL
    const imageUrl = `/uploads/categories/${uniqueFileName}`

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
    })

  } catch (error) {
    console.error('Error uploading category image:', error)
    return NextResponse.json({ 
      error: 'Failed to upload image.' 
    }, { status: 500 })
  }
}
