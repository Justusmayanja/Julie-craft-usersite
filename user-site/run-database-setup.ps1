# =====================================================
# DATABASE SETUP SCRIPT RUNNER
# =====================================================
# This PowerShell script helps you run the database setup
# scripts in your Supabase project.
# 
# Prerequisites:
# 1. Have your Supabase project URL and API keys ready
# 2. Have psql (PostgreSQL client) installed
# 3. Or use the Supabase Dashboard SQL Editor
# =====================================================

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "JULIE'S CRAFTS DATABASE SETUP" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up your database tables." -ForegroundColor Yellow
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
    Write-Host "You can find these values in your Supabase project dashboard:" -ForegroundColor Yellow
    Write-Host "  Project Settings > API" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase environment variables found!" -ForegroundColor Green
Write-Host ""

# Display options
Write-Host "Choose an option:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Quick Fix (Recommended)" -ForegroundColor White
Write-Host "   - Creates only the missing tables causing current errors" -ForegroundColor Gray
Write-Host "   - Fixes cart save/load errors immediately" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Full Setup" -ForegroundColor White
Write-Host "   - Creates all tables for complete functionality" -ForegroundColor Gray
Write-Host "   - Includes authentication, orders, enhanced features" -ForegroundColor Gray
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
        Write-Host "🚀 Running Quick Fix Script..." -ForegroundColor Green
        Write-Host ""
        
        # Check if psql is available
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
        if ($psqlPath) {
            Write-Host "Using psql to run the script..." -ForegroundColor Yellow
            
            # Extract database URL from Supabase URL
            $dbUrl = $supabaseUrl -replace "https://", "postgresql://postgres:" -replace "\.supabase\.co", ".supabase.co:5432/postgres"
            $dbUrl += "?sslmode=require"
            
            try {
                $env:PGPASSWORD = $supabaseKey
                psql $dbUrl -f "QUICK_FIX_SCRIPT.sql"
                Write-Host ""
                Write-Host "✅ Quick fix completed successfully!" -ForegroundColor Green
            } catch {
                Write-Host "❌ Error running psql command:" -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
                Write-Host ""
                Write-Host "Please try the Manual Setup option instead." -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ psql not found. Please use Manual Setup option." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "🚀 Running Full Setup Script..." -ForegroundColor Green
        Write-Host ""
        
        # Check if psql is available
        $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
        if ($psqlPath) {
            Write-Host "Using psql to run the script..." -ForegroundColor Yellow
            
            # Extract database URL from Supabase URL
            $dbUrl = $supabaseUrl -replace "https://", "postgresql://postgres:" -replace "\.supabase\.co", ".supabase.co:5432/postgres"
            $dbUrl += "?sslmode=require"
            
            try {
                $env:PGPASSWORD = $supabaseKey
                psql $dbUrl -f "DATABASE_SETUP_SCRIPT.sql"
                Write-Host ""
                Write-Host "✅ Full setup completed successfully!" -ForegroundColor Green
            } catch {
                Write-Host "❌ Error running psql command:" -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
                Write-Host ""
                Write-Host "Please try the Manual Setup option instead." -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ psql not found. Please use Manual Setup option." -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "📋 MANUAL SETUP INSTRUCTIONS" -ForegroundColor Cyan
        Write-Host "=====================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "1. Open your Supabase project dashboard:" -ForegroundColor Yellow
        Write-Host "   $supabaseUrl" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Go to SQL Editor (in the left sidebar)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "3. Click 'New Query'" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "4. Copy and paste one of these scripts:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "   For Quick Fix (recommended first):" -ForegroundColor White
        Write-Host "   - Open: QUICK_FIX_SCRIPT.sql" -ForegroundColor Gray
        Write-Host "   - Copy all contents and paste into SQL Editor" -ForegroundColor Gray
        Write-Host "   - Click 'Run' button" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   For Full Setup (after quick fix):" -ForegroundColor White
        Write-Host "   - Open: DATABASE_SETUP_SCRIPT.sql" -ForegroundColor Gray
        Write-Host "   - Copy all contents and paste into SQL Editor" -ForegroundColor Gray
        Write-Host "   - Click 'Run' button" -ForegroundColor Gray
        Write-Host ""
        Write-Host "5. Verify the setup by checking the Tables section" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "6. Test your application - cart save/load errors should be gone!" -ForegroundColor Yellow
        Write-Host ""
        
        # Open the quick fix script in default editor
        $quickFixPath = Join-Path $PSScriptRoot "QUICK_FIX_SCRIPT.sql"
        if (Test-Path $quickFixPath) {
            Write-Host "Opening QUICK_FIX_SCRIPT.sql for you to copy..." -ForegroundColor Green
            Start-Process $quickFixPath
        }
    }
    
    "4" {
        Write-Host ""
        Write-Host "👋 Goodbye! Run this script again when you're ready to set up the database." -ForegroundColor Yellow
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
Write-Host "1. Restart your development server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2. Test the cart functionality:" -ForegroundColor Yellow
Write-Host "   - Add items to cart" -ForegroundColor Gray
Write-Host "   - Check if cart persists on page refresh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test user authentication:" -ForegroundColor Yellow
Write-Host "   - Visit /register to create an account" -ForegroundColor Gray
Write-Host "   - Visit /login to sign in" -ForegroundColor Gray
Write-Host ""
Write-Host "4. If you encounter any issues, check:" -ForegroundColor Yellow
Write-Host "   - Browser console for errors" -ForegroundColor Gray
Write-Host "   - Terminal output for API errors" -ForegroundColor Gray
Write-Host "   - Supabase dashboard for table creation" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
