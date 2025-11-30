/**
 * Helper functions for getting admin user emails
 */

import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Get all admin user email addresses
 * Returns emails for users with is_admin = true OR role in ('admin', 'super_admin', 'manager')
 */
export async function getAdminEmails(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('Database not configured, returning fallback admin email')
    return [process.env.ADMIN_EMAIL || 'kingsjuliet90@gmail.com']
  }

  try {
    // Get all admin users from profiles table
    // Admin users are those with is_admin = true OR role in admin roles
    const { data: adminUsers, error } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .or('is_admin.eq.true,role.in.(admin,super_admin,manager)')
      .not('email', 'is', null)

    if (error) {
      console.error('Error fetching admin emails:', error)
      // Fallback to site settings or default
      return await getFallbackAdminEmail()
    }

    // Extract emails and filter out null/undefined/empty values
    const emails = (adminUsers || [])
      .map(user => user.email)
      .filter((email): email is string => 
        email !== null && 
        email !== undefined && 
        email.trim() !== '' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      )

    // If no admin emails found, use fallback
    if (emails.length === 0) {
      console.warn('No admin users found with valid emails, using fallback')
      return await getFallbackAdminEmail()
    }

    return emails
  } catch (error) {
    console.error('Error in getAdminEmails:', error)
    return await getFallbackAdminEmail()
  }
}

/**
 * Get fallback admin email from site settings or environment variable
 */
async function getFallbackAdminEmail(): Promise<string[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return [process.env.ADMIN_EMAIL || 'kingsjuliet90@gmail.com']
  }

  try {
    // Try to get contact_email from site settings
    const { data: emailSetting } = await supabaseAdmin
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'contact_email')
      .maybeSingle()

    if (emailSetting) {
      let emailValue = emailSetting.setting_value
      // Parse JSON if it's a string
      if (typeof emailValue === 'string' && (emailValue.startsWith('"') || emailValue.startsWith('{'))) {
        try {
          emailValue = JSON.parse(emailValue)
        } catch {
          // If parsing fails, use the string as-is
        }
      }
      const adminEmail = typeof emailValue === 'string' ? emailValue : emailValue?.value || null
      
      if (adminEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        return [adminEmail]
      }
    }
  } catch (error) {
    console.error('Error fetching fallback email from settings:', error)
  }

  // Final fallback
  return [process.env.ADMIN_EMAIL || 'kingsjuliet90@gmail.com']
}

