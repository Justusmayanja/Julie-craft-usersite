import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/admin/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    console.log('Starting stock data migration...')

    // 1. Ensure robust inventory columns exist
    const columnQueries = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER DEFAULT 0',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 1000',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1'
    ]

    for (const query of columnQueries) {
      const { error } = await supabase.rpc('exec', { sql: query })
      if (error) {
        console.warn(`Column setup warning: ${error.message}`)
      }
    }

    // 2. Migrate existing stock data
    const { error: migrateError } = await supabase.rpc('exec', {
      sql: `UPDATE products SET 
        physical_stock = COALESCE(stock_quantity, 0),
        reserved_stock = 0,
        reorder_point = COALESCE(min_stock_level, 10),
        max_stock_level = 1000,
        last_stock_update = NOW(),
        version = 1
        WHERE physical_stock IS NULL OR physical_stock = 0`
    })

    if (migrateError) {
      throw new Error(`Migration failed: ${migrateError.message}`)
    }

    // 3. Get summary of migrated data
    const { data: summary, error: summaryError } = await supabase.rpc('exec', {
      sql: `SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN physical_stock > 0 THEN 1 END) as products_with_stock,
        SUM(physical_stock) as total_physical_stock,
        SUM(reserved_stock) as total_reserved_stock
        FROM products`
    })

    console.log('Stock migration completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Stock data migrated successfully',
      summary: summary?.[0] || {}
    })

  } catch (error) {
    console.error('Stock migration error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to migrate stock data'
    }, { status: 500 })
  }
}
