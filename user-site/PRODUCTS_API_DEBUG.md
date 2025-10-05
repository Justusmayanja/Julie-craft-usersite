# 🔍 Products API Debug Guide

## 🎯 Issue: Products Not Fetching from Database

**Error**: 403 Forbidden on OPTIONS request to `/api/products`

## ✅ Root Cause Fixed

The main issue was **hardcoded API URLs** in the client-side API functions. They were pointing to `https://your-domain.com/api` instead of using the actual deployment domain.

### **🔧 Fixed Files:**
- ✅ `lib/api.ts` - Fixed `getApiBaseUrl()` function
- ✅ `lib/api-user.ts` - Fixed `getApiBaseUrl()` function  
- ✅ `lib/api-orders.ts` - Fixed `getApiBaseUrl()` function

## 🛠️ Additional Debugging Steps

### **1. Check Environment Variables**

Verify these environment variables are set in your Vercel deployment:

```bash
# Go to Vercel Dashboard → Your Project → Settings → Environment Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### **2. Test API Endpoints Directly**

Test your API endpoints directly in the browser:

```bash
# Health Check
https://julie-craft-usersite-1l5s.vercel.app/api/health

# Debug Info
https://julie-craft-usersite-1l5s.vercel.app/api/debug

# Products API
https://julie-craft-usersite-1l5s.vercel.app/api/products?featured=true&limit=8
```

### **3. Check Browser Console**

1. Open your deployed site
2. Open Developer Tools (F12)
3. Go to Console tab
4. Look for any error messages
5. Go to Network tab and check if API calls are successful

### **4. Verify Database Connection**

Test if Supabase is properly configured:

```bash
# Test database connection
curl https://julie-craft-usersite-1l5s.vercel.app/api/debug?test=db

# Check environment variables
curl https://julie-craft-usersite-1l5s.vercel.app/api/health
```

### **5. Check Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Check if the `products` table exists
3. Verify it has data
4. Check if RLS (Row Level Security) policies are set correctly

## 🚨 Common Issues & Solutions

### **Issue 1: 403 Forbidden Error**
- **Cause**: CORS or API endpoint configuration
- **Solution**: ✅ Fixed hardcoded URLs (already done)

### **Issue 2: "Database not configured" Error**
- **Cause**: Missing environment variables
- **Solution**: Add all required Supabase environment variables to Vercel

### **Issue 3: Empty Products Array**
- **Cause**: No data in database or incorrect table structure
- **Solution**: Run the database setup script in Supabase

### **Issue 4: Network Errors**
- **Cause**: API endpoints not deployed or misconfigured
- **Solution**: Verify all API routes are built correctly

## 📋 Step-by-Step Debug Process

### **Step 1: Verify Deployment**
```bash
# Check if your site is accessible
https://julie-craft-usersite-1l5s.vercel.app
```

### **Step 2: Test Health Endpoint**
```bash
# Should return: {"isConfigured": true}
curl https://julie-craft-usersite-1l5s.vercel.app/api/health
```

### **Step 3: Test Products API**
```bash
# Should return products array
curl https://julie-craft-usersite-1l5s.vercel.app/api/products
```

### **Step 4: Check Browser Network Tab**
1. Open your deployed site
2. Open DevTools → Network tab
3. Refresh the page
4. Look for `/api/products` request
5. Check if it returns 200 status with data

### **Step 5: Check Console for Errors**
1. Open DevTools → Console tab
2. Look for any JavaScript errors
3. Check if products are being fetched correctly

## 🔧 Manual Database Check

Run this SQL in your Supabase SQL editor:

```sql
-- Check if products table exists and has data
SELECT COUNT(*) FROM products;
SELECT * FROM products LIMIT 5;

-- Check table structure
\d products;
```

## 🎯 Expected Results After Fix

✅ **Health Check**: Returns `{"isConfigured": true}`  
✅ **Products API**: Returns actual products from database  
✅ **Frontend**: Products page shows database products  
✅ **No CORS Errors**: All API calls work correctly  

## 🚀 Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Database tables created and populated
- [ ] API endpoints accessible
- [ ] No CORS errors in browser
- [ ] Products loading on frontend

## 🔍 If Issues Persist

### **1. Check Vercel Function Logs**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Functions tab
4. Check logs for any errors

### **2. Test Locally**
```bash
# Test locally to isolate deployment issues
npm run dev
# Visit http://localhost:3000/api/products
```

### **3. Rebuild and Redeploy**
```bash
# Force a fresh deployment
vercel --prod --force
```

The main issue (hardcoded API URLs) has been fixed. After redeploying, your products should load correctly! 🎉
