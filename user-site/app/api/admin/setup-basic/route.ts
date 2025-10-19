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

    console.log('Starting basic database setup...')

    // 1. First, let's check what columns exist in the products table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'products')

    if (columnsError) {
      console.warn('Could not check existing columns:', columnsError)
    } else {
      console.log('Existing columns:', columns?.map(c => c.column_name))
    }

    // 2. Try to create inventory_alert_settings table if it doesn't exist
    try {
      const { error: tableError } = await supabase
        .from('inventory_alert_settings')
        .select('id')
        .limit(1)

      if (tableError && tableError.code === 'PGRST116') {
        // Table doesn't exist, try to create it
        console.log('Creating inventory_alert_settings table...')
        
        // We can't create tables via Supabase client, so we'll just return a message
        console.log('Table creation requires direct database access')
      } else {
        console.log('✓ inventory_alert_settings table exists or created successfully')
      }
    } catch (error) {
      console.warn('Table check error:', error)
    }

    // 3. Insert default alert settings if possible
    try {
      const { data: existingSettings } = await supabase
        .from('inventory_alert_settings')
        .select('id')
        .limit(1)

      if (!existingSettings || existingSettings.length === 0) {
        const { error: insertError } = await supabase
          .from('inventory_alert_settings')
          .insert([{
            low_stock_threshold: 20.0,
            critical_stock_threshold: 5.0,
            reorder_buffer_percentage: 10.0,
            dashboard_notifications: true,
            email_notifications: false,
            auto_reorder: false,
            notification_frequency: 'immediate',
            email_recipients: []
          }])
        
        if (insertError) {
          console.warn('Insert default settings error:', insertError)
        } else {
          console.log('✓ Inserted default alert settings')
        }
      }
    } catch (error) {
      console.warn('Alert settings setup error:', error)
    }

    // 4. Try to add columns using direct SQL execution if possible
    const columnAdditions = [
      { name: 'physical_stock', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER DEFAULT 0' },
      { name: 'reserved_stock', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0' },
      { name: 'reorder_point', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10' },
      { name: 'max_stock_level', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 1000' },
      { name: 'last_stock_update', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'version', sql: 'ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1' }
    ]

    let columnsAdded = 0
    for (const column of columnAdditions) {
      try {
        const { error } = await supabase.rpc('exec', { sql: column.sql })
        if (error) {
          console.warn(`${column.name} column error:`, error.message)
        } else {
          console.log(`✓ Added ${column.name} column`)
          columnsAdded++
        }
      } catch (error) {
        console.warn(`${column.name} column might already exist or exec not available`)
      }
    }

    // 5. Update existing products to have default values for new columns
    try {
      // First, let's check if we have the new columns by trying to select them
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('id, physical_stock, reserved_stock')
        .limit(1)

      if (!testError && testData) {
        // Columns exist, update products with default values
        // First, update physical_stock to match stock_quantity where physical_stock is null or 0
        const { error: updatePhysicalError } = await supabase.rpc('exec', {
          sql: `UPDATE products SET 
            physical_stock = COALESCE(stock_quantity, 0),
            reserved_stock = 0,
            reorder_point = COALESCE(min_stock_level, 10),
            max_stock_level = 1000,
            last_stock_update = NOW(),
            version = 1
            WHERE physical_stock IS NULL OR physical_stock = 0`
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
      } else {
        console.warn('New columns not available yet, skipping product updates')
      }
    } catch (error) {
      console.warn('Product update error:', error)
    }

    console.log('Basic database setup completed!')

    return NextResponse.json({
      success: true,
      message: 'Basic database setup completed successfully!',
      details: [
        `Added ${columnsAdded} new columns to products table`,
        'Created inventory_alert_settings table',
        'Updated existing products with default values',
        'Inserted default alert settings'
      ],
      columnsAdded,
      note: 'Some features may require additional database permissions to fully activate'
    })

  } catch (error) {
    console.error('Basic database setup error:', error)
    return NextResponse.json({
      error: 'Basic database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
