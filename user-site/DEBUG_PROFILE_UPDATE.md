# 🔍 Debug Profile Update Issues

## 🐛 Problem
Profile updates display temporarily but disappear on page reload, indicating data is not being saved to the database.

## 🔧 Fixes Applied

### 1. **Fixed Field Name Mismatch**
- **Issue**: Frontend sends `firstName`/`lastName` (camelCase) but API expects `first_name`/`last_name` (snake_case)
- **Solution**: Updated API to handle both formats

### 2. **Added Comprehensive Debugging**
- **Frontend**: Console logs showing data being sent
- **Backend**: Console logs showing received data and database operations

## 🧪 Testing Steps

### **Step 1: Test Profile Update**
1. Login to the application
2. Go to Profile page → Click "Edit Profile"
3. Change first name and/or last name
4. Click "Save Changes"
5. Check browser console for logs:
   - `Sending profile update: {firstName: "...", lastName: "...", phone: "..."}`
   - `Profile updated: {...}`

### **Step 2: Check Server Logs**
1. Check terminal/server console for API logs:
   - `Profile update request: {userId: "...", body: {...}, finalFirstName: "...", finalLastName: "..."}`
   - `Profile update successful: {...}`

### **Step 3: Verify Database Update**
1. After successful update, refresh the page
2. Check if changes persist
3. If not, check for any error logs in server console

## 🔍 Debugging Information

### **Frontend Logs** (Browser Console):
```
Sending profile update: {
  firstName: "John",
  lastName: "Doe", 
  phone: "1234567890"
}
Profile updated: {
  message: "Profile updated successfully",
  profile: {...}
}
```

### **Backend Logs** (Server Console):
```
Profile update request: {
  userId: "uuid-here",
  body: {firstName: "John", lastName: "Doe", phone: "1234567890"},
  finalFirstName: "John",
  finalLastName: "Doe",
  phone: "1234567890"
}
Profile update successful: {
  id: "uuid-here",
  first_name: "John",
  last_name: "Doe",
  email: "user@example.com",
  ...
}
```

## 🚨 Potential Issues to Check

### **1. Database Function Missing**
If you see errors about `get_user_with_profile` function:
```sql
-- Run this in Supabase SQL Editor to recreate the function
DROP FUNCTION IF EXISTS public.get_user_with_profile(UUID);

CREATE OR REPLACE FUNCTION public.get_user_with_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    preferences JSONB,
    bio TEXT,
    location TEXT,
    website TEXT,
    timezone TEXT,
    language TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.phone,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) as full_name,
        p.avatar_url,
        p.is_verified,
        p.preferences,
        p.bio,
        p.location,
        p.website,
        p.timezone,
        p.language,
        p.created_at,
        p.updated_at,
        p.last_login
    FROM public.profiles p
    WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. RLS Policies**
If you see permission errors, check RLS policies:
```sql
-- Check if profiles table has proper RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### **3. Profiles Table Structure**
Verify the profiles table has the correct columns:
```sql
-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

## 📋 Next Steps

1. **Run the test** and check both frontend and backend logs
2. **If logs show successful update** but data doesn't persist:
   - Check if `get_user_with_profile` function exists
   - Verify RLS policies on profiles table
   - Check profiles table structure

3. **If logs show errors**:
   - Share the error messages for further debugging
   - Check database connection and permissions

## ✅ Expected Behavior After Fix

1. Profile updates should persist across page refreshes
2. Console logs should show successful database operations
3. No error messages in browser or server console
4. Profile data should be consistent across all pages

The debugging logs will help identify exactly where the issue is occurring in the data flow.
