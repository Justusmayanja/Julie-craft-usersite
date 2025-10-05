# =====================================================
# DATABASE FIX SCRIPT RUNNER
# =====================================================
# This PowerShell script helps you fix the database issues
# that are causing the order_items API errors.
# =====================================================

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "DATABASE FIX SCRIPT" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will fix the database issues causing the API errors." -ForegroundColor Yellow
Write-Host ""

# Check if Supabase environment variables are set
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Supabase environment variables not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set the following environment variables:" -ForegroundColor Yellow
    Write-Host "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url" -ForegroundColor White
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" -ForegroundColor White
    Write-Host ""
    Write-Host "Or create a .env.local file with these values." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase environment variables found!" -ForegroundColor Green
Write-Host ""

# Display options
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Quick Fix (Recommended)" -ForegroundColor White
Write-Host "   - Fixes only the order_items table missing columns" -ForegroundColor Gray
Write-Host "   - Resolves the immediate API error" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Complete Fix" -ForegroundColor White
Write-Host "   - Fixes all database issues comprehensively" -ForegroundColor Gray
Write-Host "   - Creates all missing tables and columns" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Manual Setup (Recommended for beginners)" -ForegroundColor White
Write-Host "   - Shows instructions for using Supabase Dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔧 Running Quick Fix Script..." -ForegroundColor Green
        Write-Host ""
        Write-Host "This will add the missing 'product_image' column to order_items table." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please run this SQL in your Supabase Dashboard:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://app.supabase.com" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Click 'SQL Editor' → 'New Query'" -ForegroundColor White
        Write-Host "4. Copy and paste the contents of: FIX_ORDER_ITEMS_TABLE.sql" -ForegroundColor White
        Write-Host "5. Click 'Run'" -ForegroundColor White
        Write-Host ""
        
        # Open the quick fix script
        $quickFixPath = Join-Path $PSScriptRoot "FIX_ORDER_ITEMS_TABLE.sql"
        if (Test-Path $quickFixPath) {
            Write-Host "Opening FIX_ORDER_ITEMS_TABLE.sql for you to copy..." -ForegroundColor Green
            Start-Process $quickFixPath
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🏗️ Running Complete Fix Script..." -ForegroundColor Green
        Write-Host ""
        Write-Host "This will create all missing tables and add all missing columns." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please run this SQL in your Supabase Dashboard:" -ForegroundColor Cyan
        Write-Host "1. Go to: https://app.supabase.com" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Click 'SQL Editor' → 'New Query'" -ForegroundColor White
        Write-Host "4. Copy and paste the contents of: COMPLETE_DATABASE_FIX.sql" -ForegroundColor White
        Write-Host "5. Click 'Run'" -ForegroundColor White
        Write-Host ""
        
        # Open the complete fix script
        $completeFixPath = Join-Path $PSScriptRoot "COMPLETE_DATABASE_FIX.sql"
        if (Test-Path $completeFixPath) {
            Write-Host "Opening COMPLETE_DATABASE_FIX.sql for you to copy..." -ForegroundColor Green
            Start-Process $completeFixPath
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "📋 MANUAL SETUP INSTRUCTIONS" -ForegroundColor Cyan
        Write-Host "=====================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The error you're seeing is:" -ForegroundColor Yellow
        Write-Host "❌ column order_items_1.product_image does not exist" -ForegroundColor Red
        Write-Host ""
        Write-Host "To fix this:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Open your Supabase project dashboard:" -ForegroundColor White
        Write-Host "   https://app.supabase.com" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Go to SQL Editor (in the left sidebar)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "3. Click 'New Query'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "4. Copy and paste this SQL command:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   ALTER TABLE order_items ADD COLUMN product_image VARCHAR(500);" -ForegroundColor White
        Write-Host ""
        Write-Host "5. Click 'Run' button" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "6. Verify the fix by checking the Tables section" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "7. Test your application - the profile page should now load orders!" -ForegroundColor Yellow
        Write-Host ""
    }
    
    "4" {
        Write-Host ""
        Write-Host "👋 Goodbye! Run this script again when you're ready to fix the database." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Invalid choice. Please run the script again and select 1-4." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. After running the SQL script:" -ForegroundColor Yellow
Write-Host "   - Refresh your profile page" -ForegroundColor Gray
Write-Host "   - Check if orders load properly" -ForegroundColor Gray
Write-Host ""
Write-Host "2. If you still get errors:" -ForegroundColor Yellow
Write-Host "   - Check the browser console for new error messages" -ForegroundColor Gray
Write-Host "   - Verify all columns were added successfully" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the complete functionality:" -ForegroundColor Yellow
Write-Host "   - Profile picture upload" -ForegroundColor Gray
Write-Host "   - Order history display" -ForegroundColor Gray
Write-Host "   - Navigation with user avatar" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Database fix complete!" -ForegroundColor Green
