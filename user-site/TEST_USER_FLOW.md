# 🧪 User Flow Testing Guide

## Overview
This guide helps you test the complete user authentication and cart management flow to ensure all issues are resolved.

## 🔧 Prerequisites

1. **Run the Database Migration Script**
   ```sql
   -- Execute this in your Supabase SQL Editor
   -- File: CUSTOMER_MANAGEMENT_FIX.sql
   ```

2. **Environment Variables**
   Make sure these are set in your `.env.local`:
   ```bash
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

## 🧪 Test Scenarios

### Test 1: User Registration
**Goal**: Verify that user registration creates both `users` and `profiles` records.

**Steps**:
1. Go to `/register`
2. Fill out the registration form with:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `John Doe`
   - Phone: `+1234567890`
3. Click "Create Account"

**Expected Results**:
- ✅ User is redirected to home page
- ✅ User is logged in automatically
- ✅ Database has a new record in `users` table
- ✅ Database has a new record in `profiles` table
- ✅ Profile record has the same `id` as user record
- ✅ Name is split into `first_name` and `last_name`

**Database Check**:
```sql
-- Check users table
SELECT id, email, name, phone, role, created_at FROM users WHERE email = 'test@example.com';

-- Check profiles table
SELECT id, email, first_name, last_name, phone, is_admin, created_at FROM profiles WHERE email = 'test@example.com';
```

### Test 2: User Login
**Goal**: Verify that login fetches user data from both tables.

**Steps**:
1. Logout from the previous session
2. Go to `/login`
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Sign In"

**Expected Results**:
- ✅ User is redirected to home page
- ✅ User is logged in
- ✅ User data includes profile information (first_name, last_name, etc.)

**Console Check**:
- Open browser DevTools → Console
- Look for: `"Token verification successful:"` with user data
- Verify user object contains profile fields

### Test 3: Cart Isolation
**Goal**: Verify that each user has their own cart.

**Steps**:
1. **As User 1** (test@example.com):
   - Add items to cart
   - Note the items in cart
   
2. **Register/Login as User 2** (test2@example.com):
   - Verify cart is empty
   - Add different items to cart
   
3. **Switch back to User 1**:
   - Verify original cart items are still there
   - User 2's items should not be visible

**Expected Results**:
- ✅ Each user sees only their own cart items
- ✅ Cart data is properly isolated by user_id
- ✅ Guest cart data is migrated when user logs in

**Database Check**:
```sql
-- Check user carts
SELECT user_id, session_id, cart_data, created_at FROM user_carts ORDER BY created_at DESC LIMIT 10;
```

### Test 4: Guest Cart Migration
**Goal**: Verify that guest cart items are migrated when user logs in.

**Steps**:
1. **As Guest User**:
   - Add items to cart (without logging in)
   - Note the items in cart
   
2. **Login/Register**:
   - Use the same session
   - Login or register as a user
   
3. **Verify Cart**:
   - Check that guest cart items are now in user cart

**Expected Results**:
- ✅ Guest cart items are preserved after login/registration
- ✅ Cart items are properly transferred to user account
- ✅ No duplicate items if user already had cart items

### Test 5: Profile Data Persistence
**Goal**: Verify that profile data is saved and retrieved correctly.

**Steps**:
1. **Login as registered user**
2. **Go to profile page** (if available)
3. **Update profile information**:
   - Change first name
   - Change last name
   - Add bio
   - Update preferences
4. **Logout and login again**
5. **Verify changes are persisted**

**Expected Results**:
- ✅ Profile updates are saved to database
- ✅ Changes persist after logout/login
- ✅ Both `users` and `profiles` tables are updated

**API Test**:
```bash
# Test profile update API
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "bio": "Updated bio",
    "preferences": {"email": true, "sms": false}
  }'
```

### Test 6: Session Management
**Goal**: Verify that sessions are properly managed.

**Steps**:
1. **Login as user**
2. **Check localStorage**:
   - `julie-crafts-token` should contain JWT token
   - `julie-crafts-session` should contain session data
3. **Refresh page**
4. **Verify user is still logged in**
5. **Logout**
6. **Verify session is cleared**

**Expected Results**:
- ✅ Token is stored in localStorage
- ✅ Session data is properly managed
- ✅ User remains logged in after page refresh
- ✅ Logout clears all session data

## 🔍 Debugging Tips

### Check Database Tables
```sql
-- Check all users
SELECT COUNT(*) as user_count FROM users;

-- Check all profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Check user-profile consistency
SELECT 
    u.id, u.email, u.name,
    p.first_name, p.last_name, p.email as profile_email
FROM users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'test@example.com';

-- Check cart data
SELECT user_id, session_id, 
       jsonb_array_length(cart_data) as item_count,
       created_at, updated_at
FROM user_carts 
ORDER BY updated_at DESC;
```

### Check Console Logs
Look for these log messages:
- `"User registered and authenticated:"`
- `"Token verification successful:"`
- `"Guest cart migrated successfully"`
- `"Session manager converted to registered user"`

### Check Network Requests
In DevTools → Network tab, verify:
- `POST /api/auth/register` returns 201
- `POST /api/auth/login` returns 200
- `GET /api/auth/verify` returns 200
- `POST /api/cart/migrate` returns 200 (if guest cart exists)

## 🚨 Common Issues and Solutions

### Issue: Profile not created during registration
**Solution**: Check if the trigger is properly created:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_create_user_profile';
```

### Issue: Cart not isolated between users
**Solution**: Verify session manager is working:
```javascript
// In browser console
console.log(sessionManager.getSessionInfo());
```

### Issue: Profile data not persisting
**Solution**: Check if profile update API is working:
```bash
# Test profile API
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ✅ Success Criteria

All tests pass when:
1. ✅ User registration creates both `users` and `profiles` records
2. ✅ Login fetches complete user data from both tables
3. ✅ Each user has isolated cart data
4. ✅ Guest cart items are migrated on login/registration
5. ✅ Profile data persists across sessions
6. ✅ Session management works correctly
7. ✅ No console errors during the flow
8. ✅ Database queries return expected results

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________

Test 1 - User Registration: [ ] PASS [ ] FAIL
Test 2 - User Login: [ ] PASS [ ] FAIL  
Test 3 - Cart Isolation: [ ] PASS [ ] FAIL
Test 4 - Guest Cart Migration: [ ] PASS [ ] FAIL
Test 5 - Profile Data Persistence: [ ] PASS [ ] FAIL
Test 6 - Session Management: [ ] PASS [ ] FAIL

Overall Result: [ ] ALL TESTS PASS [ ] SOME TESTS FAIL

Notes:
_________________________________
_________________________________
_________________________________
```
