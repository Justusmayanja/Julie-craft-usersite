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

    console.log('Starting robust inventory database setup...')

    // 1. Add robust inventory columns to existing products table
    const addColumnsQueries = [
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS physical_stock INTEGER DEFAULT 0`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS available_stock INTEGER GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 1000`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_status TEXT GENERATED ALWAYS AS (
        CASE 
          WHEN available_stock <= 0 THEN 'out_of_stock'
          WHEN available_stock <= reorder_point THEN 'low_stock'
          WHEN reserved_stock > 0 THEN 'reserved'
          ELSE 'in_stock'
        END
      ) STORED`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE products ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`
    ]

    for (const query of addColumnsQueries) {
      try {
        await supabase.rpc('exec', { sql: query })
      } catch (error) {
        console.warn('Column might already exist:', error)
      }
    }

    // 2. Create inventory_audit_log table
    const auditLogTable = `
      CREATE TABLE IF NOT EXISTS inventory_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        operation_type TEXT NOT NULL CHECK (operation_type IN ('stock_adjustment', 'order_reservation', 'order_fulfillment', 'order_cancellation', 'return_processing', 'damage_writeoff', 'theft_loss', 'counting_error')),
        physical_stock_before INTEGER NOT NULL,
        physical_stock_after INTEGER NOT NULL,
        physical_stock_change INTEGER GENERATED ALWAYS AS (physical_stock_after - physical_stock_before) STORED,
        reserved_stock_before INTEGER NOT NULL DEFAULT 0,
        reserved_stock_after INTEGER NOT NULL DEFAULT 0,
        reserved_stock_change INTEGER GENERATED ALWAYS AS (reserved_stock_after - reserved_stock_before) STORED,
        operation_reason TEXT,
        order_id UUID,
        user_id UUID,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // 3. Create inventory_adjustments table
    const adjustmentsTable = `
      CREATE TABLE IF NOT EXISTS inventory_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('physical_count', 'damage_writeoff', 'theft_loss', 'counting_error', 'manual_correction', 'supplier_return', 'quality_control_reject')),
        reason_code TEXT NOT NULL,
        quantity_adjusted INTEGER NOT NULL,
        previous_physical_stock INTEGER NOT NULL,
        new_physical_stock INTEGER NOT NULL,
        approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
        description TEXT NOT NULL,
        supporting_documents TEXT[],
        requested_by UUID,
        approved_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        approved_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        witness_user_id UUID
      )
    `

    // 4. Create stock_reservations table
    const reservationsTable = `
      CREATE TABLE IF NOT EXISTS stock_reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        order_id UUID NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        user_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled', 'expired'))
      )
    `

    // 5. Create reorder_alerts table
    const reorderAlertsTable = `
      CREATE TABLE IF NOT EXISTS reorder_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder_point_reached')),
        current_stock INTEGER NOT NULL,
        reorder_point INTEGER NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      )
    `

    // 6. Create inventory_alert_settings table
    const alertSettingsTable = `
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

    // Execute table creation queries
    const tableQueries = [auditLogTable, adjustmentsTable, reservationsTable, reorderAlertsTable, alertSettingsTable]
    
    for (const query of tableQueries) {
      try {
        await supabase.rpc('exec', { sql: query })
      } catch (error) {
        console.warn('Table might already exist:', error)
      }
    }

    // 7. Insert default alert settings if none exist
    const { data: existingSettings } = await supabase
      .from('inventory_alert_settings')
      .select('id')
      .limit(1)

    if (!existingSettings || existingSettings.length === 0) {
      await supabase
        .from('inventory_alert_settings')
        .insert([{}])
    }

    // 8. Update existing products with default values
    // First, update physical_stock to match stock_quantity where physical_stock is null
    await supabase.rpc('exec', {
      sql: `UPDATE products SET physical_stock = COALESCE(stock_quantity, 0) WHERE physical_stock IS NULL`
    })
    
    // Then update other default values
    await supabase
      .from('products')
      .update({
        reserved_stock: 0,
        reorder_point: 10,
        max_stock_level: 1000,
        last_stock_update: new Date().toISOString(),
        version: 1
      })
      .is('physical_stock', null)

    // 9. Create indexes for performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_inventory_audit_log_product_id ON inventory_audit_log(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_audit_log_created_at ON inventory_audit_log(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_approval_status ON inventory_adjustments(approval_status)',
      'CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_id ON stock_reservations(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON stock_reservations(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_reorder_alerts_product_id ON reorder_alerts(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status)'
    ]

    for (const query of indexQueries) {
      try {
        await supabase.rpc('exec', { sql: query })
      } catch (error) {
        console.warn('Index might already exist:', error)
      }
    }

    // 10. Enable RLS and create policies
    const rlsQueries = [
      'ALTER TABLE inventory_audit_log ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE reorder_alerts ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE inventory_alert_settings ENABLE ROW LEVEL SECURITY'
    ]

    for (const query of rlsQueries) {
      try {
        await supabase.rpc('exec', { sql: query })
      } catch (error) {
        console.warn('RLS might already be enabled:', error)
      }
    }

    console.log('Database setup completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Robust inventory database setup completed successfully!'
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
