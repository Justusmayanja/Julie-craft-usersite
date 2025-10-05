# 🗄️ Database Setup Guide

This guide will help you set up the required database tables for your Julie's Crafts user-site to work properly.

## 🚨 Current Issue

Your application is showing these errors:
```
Could not find the table 'public.user_carts' in the schema cache
```

This means the `user_carts` table is missing from your Supabase database.

## 🛠️ Quick Fix (Recommended)

### Option 1: Use the PowerShell Script (Windows)
```powershell
# Run this in your project directory
.\run-database-setup.ps1
```

### Option 2: Manual Setup (All Platforms)

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Quick Fix Script**
   - Open `QUICK_FIX_SCRIPT.sql` in this directory
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" button

4. **Verify Setup**
   - Go to "Table Editor" in left sidebar
   - You should see these new tables:
     - `users`
     - `user_carts` ✅ (this fixes your error)
     - `guest_customers`

## 🔧 Complete Setup (After Quick Fix)

For full functionality including authentication and enhanced order management:

1. **Run Full Setup Script**
   - Open `DATABASE_SETUP_SCRIPT.sql`
   - Copy all contents
   - Paste into SQL Editor
   - Click "Run" button

2. **Verify All Tables Created**
   You should now have:
   - ✅ `users` - User authentication
   - ✅ `user_carts` - Cart persistence
   - ✅ `guest_customers` - Guest order tracking
   - ✅ `products` - Product catalog
   - ✅ `categories` - Product categories
   - ✅ `orders` - Order management
   - ✅ `order_items` - Order line items
   - ✅ Enhanced order tracking tables

## 🧪 Test Your Setup

After running the scripts:

1. **Restart Development Server**
   ```bash
   npm run dev
   ```

2. **Test Cart Functionality**
   - Add items to cart
   - Refresh page - cart should persist
   - No more "user_carts table not found" errors

3. **Test Authentication**
   - Visit `/register` - create new account
   - Visit `/login` - sign in to existing account
   - Check `/profile` - view user profile

4. **Test Orders**
   - Add items to cart
   - Go through checkout process
   - Verify order is created in database

## 📋 What Each Script Does

### `QUICK_FIX_SCRIPT.sql`
- Creates `users` table for authentication
- Creates `user_carts` table (fixes current error)
- Creates `guest_customers` table for guest orders
- Sets up basic Row Level Security policies
- **Run this first to fix immediate errors**

### `DATABASE_SETUP_SCRIPT.sql`
- Creates all tables from quick fix script
- Creates product and category tables
- Creates complete order management system
- Sets up enhanced order tracking
- Configures all security policies
- **Run this for complete functionality**

### `run-database-setup.ps1`
- Interactive PowerShell script
- Automatically detects your Supabase configuration
- Provides options for quick fix or full setup
- Includes manual setup instructions
- **Windows users can use this for guided setup**

## 🔍 Troubleshooting

### If you get permission errors:
- Make sure you're using the **Service Role Key** (not the anon key)
- Check that your Supabase project is active
- Verify your environment variables are set correctly

### If tables already exist:
- The scripts use `CREATE TABLE IF NOT EXISTS` so they're safe to run
- Existing data won't be affected
- Only missing tables will be created

### If you get RLS policy errors:
- This is normal - the scripts will create the policies
- RLS (Row Level Security) is enabled for security
- Policies allow public read access and authenticated write access

## 🎯 Expected Results

After successful setup:

✅ **Cart errors fixed** - No more "user_carts table not found"  
✅ **Authentication working** - Users can register and login  
✅ **Cart persistence** - Cart saves across browser sessions  
✅ **Order processing** - Orders can be placed and tracked  
✅ **Admin integration** - Works with your craft-web admin system  

## 📞 Need Help?

If you encounter issues:

1. **Check the terminal output** for specific error messages
2. **Verify tables exist** in Supabase Table Editor
3. **Check environment variables** are set correctly
4. **Restart your development server** after database changes

The setup scripts are designed to be safe and idempotent - you can run them multiple times without issues.
