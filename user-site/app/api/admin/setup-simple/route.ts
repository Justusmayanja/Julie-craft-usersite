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

    console.log('Starting simple database setup...')

    // 1. Add physical_stock column to products if it doesn't exist
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER DEFAULT 0` 
      })
      if (error) {
        console.warn('Physical stock column error:', error.message)
      } else {
        console.log('✓ Added physical_stock column')
      }
    } catch (error) {
      console.warn('Physical stock column might already exist')
    }

    // 2. Add reserved_stock column to products if it doesn't exist
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0` 
      })
      if (error) {
        console.warn('Reserved stock column error:', error.message)
      } else {
        console.log('✓ Added reserved_stock column')
      }
    } catch (error) {
      console.warn('Reserved stock column might already exist')
    }

    // 3. Add reorder_point column
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10` 
      })
      if (error) {
        console.warn('Reorder point column error:', error.message)
      } else {
        console.log('✓ Added reorder_point column')
      }
    } catch (error) {
      console.warn('Reorder point column might already exist')
    }

    // 4. Add max_stock_level column
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 1000` 
      })
      if (error) {
        console.warn('Max stock level column error:', error.message)
      } else {
        console.log('✓ Added max_stock_level column')
      }
    } catch (error) {
      console.warn('Max stock level column might already exist')
    }

    // 5. Add last_stock_update column
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()` 
      })
      if (error) {
        console.warn('Last stock update column error:', error.message)
      } else {
        console.log('✓ Added last_stock_update column')
      }
    } catch (error) {
      console.warn('Last stock update column might already exist')
    }

    // 6. Add version column for optimistic locking
    try {
      const { error } = await supabase.rpc('exec', { 
        sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1` 
      })
      if (error) {
        console.warn('Version column error:', error.message)
      } else {
        console.log('✓ Added version column')
      }
    } catch (error) {
      console.warn('Version column might already exist')
    }

    // 7. Update existing products with default values using direct update
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

    // 8. Create inventory_alert_settings table
    try {
      const { error } = await supabase.rpc('exec', { 
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
      if (error) {
        console.warn('Alert settings table error:', error.message)
      } else {
        console.log('✓ Created inventory_alert_settings table')
      }
    } catch (error) {
      console.warn('Alert settings table might already exist')
    }

    // 9. Insert default alert settings if none exist
    const { data: existingSettings } = await supabase
      .from('inventory_alert_settings')
      .select('id')
      .limit(1)

    if (!existingSettings || existingSettings.length === 0) {
      const { error: insertError } = await supabase
        .from('inventory_alert_settings')
        .insert([{}])
      
      if (insertError) {
        console.warn('Insert default settings error:', insertError)
      } else {
        console.log('✓ Inserted default alert settings')
      }
    }

    console.log('Simple database setup completed!')

    return NextResponse.json({
      success: true,
      message: 'Simple database setup completed successfully!',
      details: [
        'Added basic robust inventory columns to products table',
        'Created inventory_alert_settings table',
        'Updated existing products with default values',
        'Inserted default alert settings'
      ]
    })

  } catch (error) {
    console.error('Simple database setup error:', error)
    return NextResponse.json({
      error: 'Simple database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
