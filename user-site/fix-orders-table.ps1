# PowerShell script to fix missing columns in orders table
# This script runs the SQL fix for missing columns

Write-Host "Fixing missing columns in orders table..." -ForegroundColor Green

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
        
        Write-Host "`nPlease run the following SQL script in your Supabase SQL editor:" -ForegroundColor Cyan
        Write-Host "File: FIX_ORDERS_TABLE_MISSING_COLUMNS.sql" -ForegroundColor White
        Write-Host "`nOr copy and paste this SQL:" -ForegroundColor Cyan
        
        $sqlContent = Get-Content "FIX_ORDERS_TABLE_MISSING_COLUMNS.sql" -Raw
        Write-Host $sqlContent -ForegroundColor White
        
    } else {
        Write-Host "Could not find Supabase configuration in .env.local" -ForegroundColor Red
    }
} else {
    Write-Host "No .env.local file found. Please create one with your Supabase configuration." -ForegroundColor Red
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
