import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

// Default alert settings
const DEFAULT_SETTINGS = {
  low_stock_threshold: 20,
  critical_stock_threshold: 5,
  email_notifications: true,
  dashboard_notifications: true,
  notification_frequency: 'immediate' as const,
  email_recipients: [] as string[],
  auto_reorder_enabled: false,
  reorder_buffer_percentage: 10,
  category_specific_thresholds: {} as Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>,
  product_specific_thresholds: {} as Record<string, {
    low_stock_threshold: number
    critical_stock_threshold: number
    enabled: boolean
  }>
}

// GET/PUT - Fetch alert settings and statistics
export async function GET(request: NextRequest) {
  return await fetchSettings(request)
}

export async function PUT(request: NextRequest) {
  return await fetchSettings(request)
}

async function fetchSettings(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      // Return default settings if database is not configured
      return NextResponse.json({
        settings: DEFAULT_SETTINGS,
        statistics: {
          total_items: 0,
          low_stock_count: 0,
          critical_stock_count: 0,
          out_of_stock_count: 0,
          low_stock_percentage: 0,
          critical_stock_percentage: 0,
          out_of_stock_percentage: 0
        },
        category_options: []
      })
    }

    // Fetch settings from site_settings table
    let settings = DEFAULT_SETTINGS
    try {
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'inventory_alert_settings')
        .single()

      if (!settingsError && settingsData?.setting_value) {
        try {
          const parsed = typeof settingsData.setting_value === 'string' 
            ? JSON.parse(settingsData.setting_value)
            : settingsData.setting_value
          settings = { ...DEFAULT_SETTINGS, ...parsed }
        } catch {
          // Use default if parsing fails
        }
      }
    } catch (error) {
      console.error('Error fetching alert settings:', error)
      // Continue with default settings
    }

    // Fetch products to calculate statistics
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, stock_quantity, max_stock, category_id, status')
      .eq('status', 'active')

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    // Calculate statistics
    const totalItems = products?.length || 0
    let lowStockCount = 0
    let criticalStockCount = 0
    let outOfStockCount = 0

    if (products && totalItems > 0) {
      products.forEach(product => {
        const maxStock = product.max_stock || 100
        const currentStock = product.stock_quantity || 0
        const stockPercentage = maxStock > 0 ? (currentStock / maxStock) * 100 : 0

        // Check category-specific thresholds
        let lowThreshold = settings.low_stock_threshold
        let criticalThreshold = settings.critical_stock_threshold

        if (product.category_id && settings.category_specific_thresholds[product.category_id]?.enabled) {
          const categorySettings = settings.category_specific_thresholds[product.category_id]
          lowThreshold = categorySettings.low_stock_threshold
          criticalThreshold = categorySettings.critical_stock_threshold
        }

        // Check product-specific thresholds
        if (settings.product_specific_thresholds[product.id]?.enabled) {
          const productSettings = settings.product_specific_thresholds[product.id]
          lowThreshold = productSettings.low_stock_threshold
          criticalThreshold = productSettings.critical_stock_threshold
        }

        if (currentStock === 0) {
          outOfStockCount++
        } else if (stockPercentage <= criticalThreshold) {
          criticalStockCount++
        } else if (stockPercentage <= lowThreshold) {
          lowStockCount++
        }
      })
    }

    const statistics = {
      total_items: totalItems,
      low_stock_count: lowStockCount,
      critical_stock_count: criticalStockCount,
      out_of_stock_count: outOfStockCount,
      low_stock_percentage: totalItems > 0 ? (lowStockCount / totalItems) * 100 : 0,
      critical_stock_percentage: totalItems > 0 ? (criticalStockCount / totalItems) * 100 : 0,
      out_of_stock_percentage: totalItems > 0 ? (outOfStockCount / totalItems) * 100 : 0
    }

    // Fetch categories for category options
    let categoryOptions: Array<{ id: string; name: string }> = []
    try {
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (!categoriesError && categories) {
        categoryOptions = categories.map(cat => ({
          id: cat.id,
          name: cat.name
        }))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }

    return NextResponse.json({
      settings,
      statistics,
      category_options: categoryOptions
    })
  } catch (error) {
    console.error('Error in fetchSettings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch alert settings',
        settings: DEFAULT_SETTINGS,
        statistics: {
          total_items: 0,
          low_stock_count: 0,
          critical_stock_count: 0,
          out_of_stock_count: 0,
          low_stock_percentage: 0,
          critical_stock_percentage: 0,
          out_of_stock_percentage: 0
        },
        category_options: []
      },
      { status: 500 }
    )
  }
}

// POST - Save alert settings
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const settings = {
      ...DEFAULT_SETTINGS,
      ...body
    }

    // Save settings to site_settings table
    const { error: upsertError } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        setting_key: 'inventory_alert_settings',
        setting_value: JSON.stringify(settings),
        setting_type: 'inventory',
        description: 'Inventory alert settings and thresholds'
      }, {
        onConflict: 'setting_key'
      })

    if (upsertError) {
      console.error('Error saving alert settings:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save alert settings' },
        { status: 500 }
      )
    }

    // Return updated settings with fresh statistics
    return await fetchSettings(request)
  } catch (error) {
    console.error('Error in POST alert-settings:', error)
    return NextResponse.json(
      { error: 'Failed to save alert settings' },
      { status: 500 }
    )
  }
}

