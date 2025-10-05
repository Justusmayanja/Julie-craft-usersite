# 🔧 User Profile Fix Guide

## 🎯 Issue: User Profiles Not Being Displayed After Login

Users are being created in the database but their profile information is not being displayed consistently after login.

## 🔍 Root Cause Analysis

The issue is likely one of the following:

1. **Database Connection Issues**: Supabase not properly configured in deployment
2. **Token Verification Problems**: JWT tokens not being validated correctly
3. **Data Retrieval Issues**: User data not being fetched properly from the database
4. **Frontend State Management**: User state not being properly managed in React context

## 🛠️ Diagnostic Steps

### **1. Test Database Connection**
```bash
# Test if Supabase is configured
curl https://your-domain.com/api/health

# Should return: {"isConfigured": true}
```

### **2. Test User Creation**
```bash
# Create a test user
curl -X POST https://your-domain.com/api/debug/user \
  -H "Content-Type: application/json" \
  -d '{"action": "create_test_user", "email": "test@example.com"}'
```

### **3. Test User Retrieval**
```bash
# Check if user exists
curl https://your-domain.com/api/debug/user?email=test@example.com

# Should return user data
```

### **4. Test Authentication Flow**
```bash
# Test registration
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Test token verification
curl https://your-domain.com/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ✅ Solutions

### **Solution 1: Environment Variables (Most Common)**

**Problem**: Supabase not configured in deployment

**Fix**: Add these environment variables to your deployment platform:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### **Solution 2: Database Schema Issues**

**Problem**: Missing tables or columns

**Fix**: Run the database setup script:

```sql
-- Run this in your Supabase SQL editor
\i COMPLETE_DATABASE_FIX.sql
```

### **Solution 3: Token Issues**

**Problem**: JWT tokens not being generated or validated correctly

**Fix**: Check JWT_SECRET is set and consistent across all environments.

### **Solution 4: Frontend State Issues**

**Problem**: User state not being properly managed

**Fix**: Clear browser storage and test:

```javascript
// Clear all stored data
localStorage.clear()
sessionStorage.clear()

// Test fresh login
```

## 🔧 Manual Testing Steps

### **1. Registration Test**
1. Go to `/register`
2. Fill out the form
3. Submit registration
4. Check browser console for errors
5. Check if redirected to home page

### **2. Login Test**
1. Go to `/login`
2. Enter credentials
3. Submit login
4. Check if user appears in navigation
5. Go to `/profile` and verify data

### **3. Profile Display Test**
1. Login successfully
2. Go to `/profile`
3. Check if user data is displayed
4. Try editing profile
5. Save changes and verify

### **4. Session Persistence Test**
1. Login successfully
2. Refresh the page
3. Check if still logged in
4. Close browser and reopen
5. Check if session persists

## 🚨 Common Issues & Fixes

### **Issue 1: "Database not configured" Error**
- **Cause**: Missing environment variables
- **Fix**: Add all required Supabase environment variables

### **Issue 2: "User not found" Error**
- **Cause**: User not created in database
- **Fix**: Check registration API, verify database connection

### **Issue 3: "Invalid token" Error**
- **Cause**: JWT_SECRET mismatch or token corruption
- **Fix**: Set consistent JWT_SECRET, clear browser storage

### **Issue 4: Profile shows empty data**
- **Cause**: User data not being fetched or displayed
- **Fix**: Check auth context, verify API responses

### **Issue 5: Login works but profile doesn't load**
- **Cause**: Token verification failing
- **Fix**: Check `/api/auth/verify` endpoint

## 📋 Debugging Checklist

- [ ] Environment variables set correctly
- [ ] Database tables exist and have correct schema
- [ ] Registration creates user in database
- [ ] Login generates valid JWT token
- [ ] Token verification works
- [ ] User data retrieved correctly
- [ ] Frontend displays user data
- [ ] Profile editing works
- [ ] Session persists across page refreshes

## 🎯 Quick Fix Commands

### **Clear Browser Data**
```javascript
// Run in browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### **Test API Endpoints**
```bash
# Health check
curl https://your-domain.com/api/health

# Debug user
curl https://your-domain.com/api/debug/user?email=your-email@example.com

# Create test user
curl -X POST https://your-domain.com/api/debug/user \
  -H "Content-Type: application/json" \
  -d '{"action": "create_test_user"}'
```

### **Database Check**
```sql
-- Check if users table exists and has data
SELECT COUNT(*) FROM users;
SELECT * FROM users LIMIT 5;
```

## 🚀 Expected Results After Fix

✅ **Registration**: Creates user in database  
✅ **Login**: Generates valid JWT token  
✅ **Profile Display**: Shows user data correctly  
✅ **Profile Editing**: Allows updating user information  
✅ **Session Persistence**: Maintains login across refreshes  
✅ **Navigation**: Shows user info in header  

## 🔍 If Issues Persist

1. **Check Browser Console**: Look for JavaScript errors
2. **Check Network Tab**: Verify API calls are successful
3. **Check Database**: Verify data exists in Supabase
4. **Check Environment**: Verify all variables are set
5. **Test Locally**: Compare local vs deployment behavior

The most common cause is missing environment variables in deployment. Make sure all Supabase and JWT variables are properly configured! 🎉
