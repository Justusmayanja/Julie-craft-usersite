import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Contact form submissions are temporarily unavailable'
      }, { status: 503 })
    }

    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        message: 'Name, email, and message are required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      }, { status: 400 })
    }

    // Store contact message in database
    // First, check if contact_messages table exists, if not, we'll create a simple storage
    // For now, we'll use a generic approach that works with or without a dedicated table
    
    let contactMessageId: string | null = null
    
    try {
      // Try to insert into contact_messages table if it exists
      const { data: contactMessage, error: insertError } = await supabaseAdmin
        .from('contact_messages')
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          subject: subject?.trim() || 'General Inquiry',
          message: message.trim(),
          status: 'new',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (!insertError && contactMessage) {
        contactMessageId = contactMessage.id
      } else if (insertError && insertError.code === '42P01') {
        // Table doesn't exist, we'll just create the notification
        console.log('[Contact] contact_messages table not found, creating notification only')
      } else {
        console.error('[Contact] Error storing contact message:', insertError)
      }
    } catch (error) {
      console.error('[Contact] Error attempting to store contact message:', error)
      // Continue to create notification even if storage fails
    }

    // Create admin notification
    try {
      await createNotification({
        recipient_type: 'admin',
        notification_type: 'order_placed', // Using existing type, could add 'contact_form' later
        title: `New Contact Form Submission${subject ? `: ${subject}` : ''}`,
        message: `From: ${name} (${email})${phone ? ` | Phone: ${phone}` : ''}\n\n${message}`,
        metadata: {
          contact_name: name,
          contact_email: email,
          contact_phone: phone || null,
          contact_subject: subject || 'General Inquiry',
          contact_message: message,
          contact_message_id: contactMessageId
        }
      })
    } catch (error) {
      console.error('[Contact] Error creating admin notification:', error)
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      contact_id: contactMessageId
    }, { status: 200 })

  } catch (error) {
    console.error('[Contact] API error:', error)
    return NextResponse.json({
      error: 'Failed to send message',
      message: 'An error occurred while sending your message. Please try again later.'
    }, { status: 500 })
  }
}
