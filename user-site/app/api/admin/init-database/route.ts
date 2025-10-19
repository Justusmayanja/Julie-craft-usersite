import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/admin/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting database initialization...')

    // 1. Add physical_stock column to products if it doesn't exist
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER DEFAULT 0` 
      })
      console.log('✓ Added physical_stock column')
    } catch (error) {
      console.warn('Physical stock column might already exist')
    }

    // 2. Add reserved_stock column to products if it doesn't exist
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0` 
      })
      console.log('✓ Added reserved_stock column')
    } catch (error) {
      console.warn('Reserved stock column might already exist')
    }

    // 3. Add reorder_point column (before computed columns)
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10` 
      })
      console.log('✓ Added reorder_point column')
    } catch (error) {
      console.warn('Reorder point column might already exist')
    }

    // 4. Add max_stock_level column (before computed columns)
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 1000` 
      })
      console.log('✓ Added max_stock_level column')
    } catch (error) {
      console.warn('Max stock level column might already exist')
    }

    // 5. Add available_stock computed column (after physical_stock and reserved_stock exist)
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS available_stock INTEGER GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED` 
      })
      console.log('✓ Added available_stock computed column')
    } catch (error) {
      console.warn('Available stock column might already exist')
    }

    // 6. Add stock_status computed column (after all dependencies exist)
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT GENERATED ALWAYS AS (
          CASE 
            WHEN (physical_stock - reserved_stock) <= 0 THEN 'out_of_stock'
            WHEN (physical_stock - reserved_stock) <= reorder_point THEN 'low_stock'
            WHEN reserved_stock > 0 THEN 'reserved'
            ELSE 'in_stock'
          END
        ) STORED` 
      })
      console.log('✓ Added stock_status computed column')
    } catch (error) {
      console.warn('Stock status column might already exist')
    }

    // 7. Add last_stock_update column
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()` 
      })
      console.log('✓ Added last_stock_update column')
    } catch (error) {
      console.warn('Last stock update column might already exist')
    }

    // 8. Add version column for optimistic locking
    try {
      await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1` 
      })
      console.log('✓ Added version column')
    } catch (error) {
      console.warn('Version column might already exist')
    }

    // 9. Update existing products with default values
    // First, update physical_stock to match stock_quantity where physical_stock is null
    const { error: updatePhysicalError } = await supabase.rpc('exec', {
      sql: `UPDATE products SET physical_stock = COALESCE(stock_quantity, 0) WHERE physical_stock IS NULL`
    })
    
    // Then update other default values
    const { error: updateError } = await supabase
      .from('products')
      .update({
        reserved_stock: 0,
        reorder_point: 10,
        max_stock_level: 1000,
        last_stock_update: new Date().toISOString(),
        version: 1
      })
      .is('physical_stock', null)

    if (updatePhysicalError) {
      console.warn('Update physical_stock error:', updatePhysicalError)
    }
    
    if (updateError) {
      console.warn('Update products error:', updateError)
    } else {
      console.log('✓ Updated existing products with default values')
    }

    // 10. Create inventory_alert_settings table
    try {
      await supabase.rpc('exec', { 
        sql: `
          CREATE TABLE IF NOT EXISTS inventory_alert_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            low_stock_threshold DECIMAL(5,2) DEFAULT 20.0,
            critical_stock_threshold DECIMAL(5,2) DEFAULT 5.0,
            reorder_buffer_percentage DECIMAL(5,2) DEFAULT 10.0,
            dashboard_notifications BOOLEAN DEFAULT TRUE,
            email_notifications BOOLEAN DEFAULT FALSE,
            auto_reorder BOOLEAN DEFAULT FALSE,
            notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
            email_recipients TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        ` 
      })
      console.log('✓ Created inventory_alert_settings table')
    } catch (error) {
      console.warn('Alert settings table might already exist')
    }

    // 11. Insert default alert settings if none exist
    const { data: existingSettings } = await supabase
      .from('inventory_alert_settings')
      .select('id')
      .limit(1)

    if (!existingSettings || existingSettings.length === 0) {
      await supabase
        .from('inventory_alert_settings')
        .insert([{}])
      console.log('✓ Inserted default alert settings')
    }

    console.log('Database initialization completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database initialization completed successfully!',
      details: [
        'Added robust inventory columns to products table',
        'Created inventory_alert_settings table',
        'Updated existing products with default values',
        'Inserted default alert settings'
      ]
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json({
      error: 'Database initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
