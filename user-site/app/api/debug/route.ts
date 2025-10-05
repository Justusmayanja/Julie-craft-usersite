import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('test') || 'all'

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL ? 'Vercel' : process.env.NETLIFY ? 'Netlify' : 'Other',
      
      // Environment Variables Check
      environmentVariables: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      
      // Supabase Configuration
      supabaseConfig: {
        isConfigured: isSupabaseConfigured,
        hasAdminClient: !!supabaseAdmin,
      },
    }

    // Test database connection if requested
    if (testType === 'db' || testType === 'all') {
      let dbTest = { success: false, error: null, tables: [] }
      
      if (supabaseAdmin) {
        try {
          // Test basic connection
          const { data, error } = await supabaseAdmin
            .from('products')
            .select('id, name')
            .limit(1)
          
          if (error) {
            dbTest.error = error.message
          } else {
            dbTest.success = true
            dbTest.tables = ['products']
          }
        } catch (error) {
          dbTest.error = error instanceof Error ? error.message : 'Unknown error'
        }
      }
      
      debugInfo.databaseTest = dbTest
    }

    // Test specific tables if requested
    if (testType === 'tables' || testType === 'all') {
      const tablesToTest = ['products', 'users', 'orders', 'order_items', 'user_carts']
      const tableTests = {}
      
      if (supabaseAdmin) {
        for (const table of tablesToTest) {
          try {
            const { data, error } = await supabaseAdmin
              .from(table)
              .select('*')
              .limit(1)
            
            tableTests[table] = {
              exists: !error || error.code !== '42P01', // Table doesn't exist
              accessible: !error,
              error: error?.message || null,
              recordCount: data?.length || 0
            }
          } catch (error) {
            tableTests[table] = {
              exists: false,
              accessible: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              recordCount: 0
            }
          }
        }
      }
      
      debugInfo.tableTests = tableTests
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Debug information retrieved successfully',
      ...debugInfo
    })

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to retrieve debug information',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
