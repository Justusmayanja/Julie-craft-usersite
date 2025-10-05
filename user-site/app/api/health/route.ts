import { NextResponse } from 'next/server'
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Check Supabase configuration
    const supabaseConfig = {
      isConfigured: isSupabaseConfigured,
      hasAdminClient: !!supabaseAdmin,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Test database connection
    let dbConnection = { success: false, error: null, tables: [] }
    if (supabaseAdmin) {
      try {
        // Try to query products table
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('id, name')
          .limit(1)
        
        if (error) {
          dbConnection.error = error.message
        } else {
          dbConnection.success = true
          dbConnection.tables = ['products']
        }
      } catch (error) {
        dbConnection.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      environmentVariables: envCheck,
      supabaseConfig,
      databaseConnection: dbConnection,
      message: isSupabaseConfigured 
        ? 'Supabase is configured and ready' 
        : 'Supabase is not configured - check environment variables'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
