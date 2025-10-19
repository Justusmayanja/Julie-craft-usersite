# Test Admin Login and Redirect

## Steps to Test and Debug

### 1. First, run the database fix
Execute this SQL in your Supabase SQL Editor:
```sql
-- Copy and run the contents of FIX_ADMIN_ROLE_FUNCTION.sql
```

### 2. Create an admin user if you don't have one
Use this API call:
```bash
POST /api/admin/create-test-user
{
  "email": "admin@test.com",
  "password": "admin123",
  "name": "Admin User", 
  "role": "admin"
}
```

### 3. Test the login and check browser console
1. Go to `/login` page
2. Log in with admin credentials
3. Open browser console (F12)
4. Look for these logs:
   - "Login - Checking role:" - Shows roleLoading and isAdmin status
   - "Login - Debug role info:" - Shows detailed role information
   - "Login - Redirecting to admin dashboard" or "Login - Redirecting to home page"

### 4. Debug endpoint test
You can also test the debug endpoint directly:
```bash
GET /api/debug/user-role
Authorization: Bearer YOUR_TOKEN_HERE
```

### 5. Expected console output for admin user
```json
{
  "debug": "User role information",
  "auth_user": {
    "id": "uuid",
    "email": "admin@test.com"
  },
  "profile_direct": {
    "role": "admin",
    "is_admin": true
  },
  "is_admin_calculation": {
    "by_role": true,
    "by_flag": true,
    "combined": true
  }
}
```

### 6. If admin user is not being detected
Check these issues:
1. Database function not updated (run the SQL fix)
2. User doesn't have admin role in profiles table
3. Role context not loading properly
4. Token issues

### 7. Manual database check
Run this in Supabase SQL Editor:
```sql
SELECT 
    p.id,
    p.email,
    p.role,
    p.is_admin,
    p.first_name,
    p.last_name
FROM profiles p 
WHERE p.email = 'admin@test.com';
```

## Troubleshooting

If the admin is still not being redirected:
1. Check browser console for error messages
2. Verify the debug endpoint returns correct role information
3. Check if the role context is loading properly
4. Ensure the database function is updated with role fields
