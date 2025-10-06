# PowerShell script to fix the complete order placement system
# This script addresses all issues preventing order placement

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  COMPLETE ORDER PLACEMENT SYSTEM FIX" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script fixes the following issues:" -ForegroundColor Green
Write-Host "1. Cart save ON CONFLICT specification error" -ForegroundColor Yellow
Write-Host "2. Order items creation UUID format error" -ForegroundColor Yellow
Write-Host "3. Missing columns in orders table" -ForegroundColor Yellow
Write-Host "4. Missing constraints in user_carts table" -ForegroundColor Yellow
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "Found .env.local file" -ForegroundColor Green
    
    # Read environment variables
    $envContent = Get-Content ".env.local"
    $supabaseUrl = ""
    $supabaseKey = ""
    
    foreach ($line in $envContent) {
        if ($line -match "NEXT_PUBLIC_SUPABASE_URL=(.+)") {
            $supabaseUrl = $matches[1]
        }
        if ($line -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)") {
            $supabaseKey = $matches[1]
        }
    }
    
    if ($supabaseUrl -and $supabaseKey) {
        Write-Host "Supabase configuration found:" -ForegroundColor Green
        Write-Host "URL: $($supabaseUrl.Substring(0, 30))..." -ForegroundColor Yellow
        Write-Host "Key: $($supabaseKey.Substring(0, 20))..." -ForegroundColor Yellow
        
        Write-Host "`n===============================================" -ForegroundColor Cyan
        Write-Host "  SQL SCRIPT TO RUN IN SUPABASE" -ForegroundColor Cyan
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host "File: COMPLETE_ORDER_FIX.sql" -ForegroundColor White
        Write-Host ""
        
        # Show the SQL content
        $sqlContent = Get-Content "COMPLETE_ORDER_FIX.sql" -Raw
        Write-Host $sqlContent -ForegroundColor White
        
        Write-Host "`n===============================================" -ForegroundColor Cyan
        Write-Host "  WHAT THIS FIXES" -ForegroundColor Cyan
        Write-Host "===============================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✓ Cart Save Issues:" -ForegroundColor Green
        Write-Host "  - Fixed ON CONFLICT specification error" -ForegroundColor Gray
        Write-Host "  - Added proper unique constraints for user_id and session_id" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✓ Order Placement Issues:" -ForegroundColor Green
        Write-Host "  - Added missing customer_phone column to orders table" -ForegroundColor Gray
        Write-Host "  - Added missing payment_method column to orders table" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✓ Order Items Issues:" -ForegroundColor Green
        Write-Host "  - Fixed UUID format error for product_id" -ForegroundColor Gray
        Write-Host "  - Ensured order_items table has proper structure" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✓ Product ID Issues:" -ForegroundColor Green
        Write-Host "  - Changed product IDs from numbers to UUIDs throughout the system" -ForegroundColor Gray
        Write-Host "  - Updated frontend types to use string IDs instead of number IDs" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host "Could not find Supabase configuration in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "No .env.local file found. Please create one with your Supabase configuration." -ForegroundColor Red
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  NEXT STEPS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "1. Copy the SQL script above" -ForegroundColor Yellow
Write-Host "2. Go to your Supabase project dashboard" -ForegroundColor Yellow
Write-Host "3. Navigate to the SQL Editor" -ForegroundColor Yellow
Write-Host "4. Paste and execute the SQL script" -ForegroundColor Yellow
Write-Host "5. Test order placement in your application" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
