import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/admin/supabase/server'
import { customerService } from '@/lib/admin/services/customers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer statistics
    const stats = await customerService.getCustomerStats()

    return NextResponse.json(stats)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
